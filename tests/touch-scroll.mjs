import assert from 'node:assert/strict';

export async function checkTouchScroll(page, nativeTouch = false) {
  await page.locator('#source').fill('A quiet passage stays in the reading area while the page waits. '.repeat(30));
  await page.evaluate(() => {
    document.body.style.minHeight = '2400px';
    document.body.style.setProperty('overflow', 'visible', 'important');
    document.documentElement.style.setProperty('scroll-behavior', 'smooth', 'important');
    window.scrollTo({ top: 400, behavior: 'instant' });
  });
  const snapshot = () => ({
    x: scrollX, y: scrollY,
    styles: [document.documentElement, document.body].map(el => [...el.style].sort().map(key => [key, el.style.getPropertyValue(key), el.style.getPropertyPriority(key)]))
  });
  const before = await page.evaluate(snapshot);
  // Open without scrolling the trigger into view, to exercise scroll restoration.
  await page.getByRole('button', { name: 'Start reading' }).evaluate(el => el.click());
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).position), 'fixed');
  assert.equal(await page.evaluate(() => document.body.style.top), `${-before.y}px`);
  const locked = await page.evaluate(() => ({ x: scrollX, y: scrollY, top: document.body.getBoundingClientRect().top }));
  const cdp = nativeTouch ? await page.context().newCDPSession(page) : null;
  async function swipe(reverse = false, surface = '.stage') {
    const box = await page.locator(surface).boundingBox();
    const x = box.x + box.width / 2;
    // A short real swipe; the title area on small phones is only a line tall.
    const low = box.y + box.height * .8, high = low - Math.max(box.height * .6, 80);
    const start = reverse ? high : low, end = reverse ? low : high;
    if (cdp) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: start }] });
      for (let step = 1; step <= 12; step++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: start + (end - start) * step / 12 }] });
        await page.waitForTimeout(20);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      // WebKit's automation API has no native swipe. Check cancellable touch
      // events explicitly here; Chromium separately exercises real browser panning.
      await page.locator(surface).evaluate((stage, { x, start }) => {
        const point = { identifier: 7, target: stage, clientX: x, clientY: start };
        stage.dispatchEvent(Object.assign(new Event('touchstart', { bubbles: true, cancelable: true }), { touches: [point], changedTouches: [point] }));
      }, { x, start });
      for (let step = 1; step <= 12; step++) {
        const canceled = await page.locator(surface).evaluate((stage, { x, y }) => {
          const point = { identifier: 7, target: stage, clientX: x, clientY: y };
          const event = Object.assign(new Event('touchmove', { bubbles: true, cancelable: true }), { touches: [point], changedTouches: [point] });
          stage.dispatchEvent(event); return event.defaultPrevented;
        }, { x, y: start + (end - start) * step / 12 });
        assert.ok(canceled, 'reading swipes cancel native panning');
        await page.waitForTimeout(20);
      }
      await page.locator(surface).evaluate(stage => {
        const point = { identifier: 7, target: stage };
        stage.dispatchEvent(Object.assign(new Event('touchend', { bubbles: true }), { touches: [], changedTouches: [point] }));
      });
    }
    await page.waitForTimeout(500);
  }
  const initial = Number(await page.locator('.progress').inputValue());
  const overlayScroll = await page.locator('dialog').evaluate(el => el.scrollTop);
  await swipe();
  const forward = Number(await page.locator('.progress').inputValue());
  assert.ok(forward > initial, 'swipe advances words');
  assert.equal(await page.locator('dialog').evaluate(el => el.scrollTop), overlayScroll, 'reading swipe does not pan the overlay');
  await swipe(true);
  const rewound = Number(await page.locator('.progress').inputValue());
  assert.ok(rewound < forward, 'reverse swipe rewinds');
  // The word band is short on phones; the title area above it reads as well.
  await page.waitForTimeout(1500); // Let the reverse glide settle: a fresh swipe, not a reversal.
  await swipe(false, '.article');
  assert.ok(Number(await page.locator('.progress').inputValue()) > rewound, 'a swipe on the title area advances words');
  assert.equal(await page.locator('dialog').evaluate(el => el.scrollTop), overlayScroll, 'title-area swipes do not pan the overlay');
  // While reading, the dimmed controls under the thumb read as well, and a tap
  // on a dimmed control still works as that control.
  const quiet = () => page.waitForFunction(() => document.querySelector('[data-rsvp-reader]').shadowRoot.querySelector('dialog').classList.contains('reading'), null, { timeout: 4000 });
  const settled = () => page.waitForFunction(() => document.querySelector('[data-rsvp-reader]').shadowRoot.querySelector('#play').textContent === 'Play', null, { timeout: 4000 });
  await settled(); await page.locator('#play').click(); await quiet();
  const reading = Number(await page.locator('.progress').inputValue());
  await swipe(false, '.controls');
  assert.ok(Number(await page.locator('.progress').inputValue()) > reading, 'a swipe over dimmed controls reads');
  assert.equal(await page.locator('dialog').evaluate(el => el.scrollTop), overlayScroll, 'and does not pan the overlay');
  await settled(); await page.locator('#play').click(); await quiet();
  await page.locator('#play').tap();
  assert.equal(await page.locator('#play').textContent(), 'Play', 'a tap on dimmed Pause pauses');
  assert.deepEqual(await page.evaluate(() => ({ x: scrollX, y: scrollY, top: document.body.getBoundingClientRect().top })), locked, 'background remains fixed');
  await page.locator('#max-speed').scrollIntoViewIfNeeded();
  assert.ok(await page.locator('#max-speed').isVisible(), 'settings remain reachable');
  await page.locator('#close').click();
  assert.deepEqual(await page.evaluate(snapshot), before, 'close restores scroll position and preexisting inline styles');
  // A second session must not retain a stale lock or listener.
  await page.getByRole('button', { name: 'Start reading' }).evaluate(el => el.click());
  await page.keyboard.press('Escape');
  assert.deepEqual(await page.evaluate(snapshot), before, 'Escape also releases the lock');
  await cdp?.detach();
}
