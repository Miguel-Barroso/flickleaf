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
  async function swipe(reverse = false) {
    const box = await page.locator('.stage').boundingBox();
    const x = box.x + box.width / 2;
    const low = box.y + box.height * .8, high = box.y + box.height * .2;
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
      await page.locator('.stage').evaluate((stage, { x, start }) => {
        const point = { identifier: 7, target: stage, clientX: x, clientY: start };
        stage.dispatchEvent(Object.assign(new Event('touchstart', { bubbles: true, cancelable: true }), { touches: [point], changedTouches: [point] }));
      }, { x, start });
      for (let step = 1; step <= 12; step++) {
        const canceled = await page.locator('.stage').evaluate((stage, { x, y }) => {
          const point = { identifier: 7, target: stage, clientX: x, clientY: y };
          const event = Object.assign(new Event('touchmove', { bubbles: true, cancelable: true }), { touches: [point], changedTouches: [point] });
          stage.dispatchEvent(event); return event.defaultPrevented;
        }, { x, y: start + (end - start) * step / 12 });
        assert.ok(canceled, 'reading swipes cancel native panning');
        await page.waitForTimeout(20);
      }
      await page.locator('.stage').evaluate(stage => {
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
  assert.ok(Number(await page.locator('.progress').inputValue()) < forward, 'reverse swipe rewinds');
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
