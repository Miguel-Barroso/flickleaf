import assert from 'node:assert/strict';

export async function checkSectionHold(page, screenshot = '') {
  const source = 'Quiet words stay in the center. '.repeat(7) + '\n\n# A heading stays in the middle\n\n' + 'More quiet words follow the heading. '.repeat(7);
  const open = async (text = source) => {
    await page.locator('#source').fill(text);
    await page.getByRole('button', { name: 'Start reading' }).click();
    await page.waitForFunction(() => !document.querySelector('[data-rsvp-reader]').shadowRoot.querySelector('#preferences-status').textContent.includes('Loading'));
  };
  const waitForHold = () => page.waitForFunction(() => document.querySelector('[data-rsvp-reader]').shadowRoot.querySelector('#state').textContent.startsWith('Holding at section'));
  const seek = index => page.locator('.progress').evaluate((el, value) => { el.value = String(value); el.dispatchEvent(new Event('input', { bubbles: true })); }, index);
  const wheel = deltaY => page.locator('.stage').dispatchEvent('wheel', { deltaY, deltaMode: 0 });
  await page.evaluate(() => {
    window.sectionWake = { requests: 0, releases: 0 };
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: async () => {
      window.sectionWake.requests++;
      const lock = new EventTarget(); lock.released = false;
      lock.release = async () => { lock.released = true; window.sectionWake.releases++; lock.dispatchEvent(new Event('release')); };
      return lock;
    } } });
  });
  await open();
  await page.locator('#clear-preferences').click();
  const hold = page.getByRole('button', { name: 'Hold at sections', exact: true });
  assert.equal(await hold.getAttribute('aria-pressed'), 'false');
  await hold.focus(); await page.keyboard.press('Enter');
  assert.equal(await hold.getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#play').textContent(), 'Play', 'Enter activates the preference, not playback');
  await page.keyboard.press('Space');
  assert.equal(await hold.getAttribute('aria-pressed'), 'false');
  await page.keyboard.press('Space');
  assert.equal(await hold.getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#play').textContent(), 'Play', 'Space activates the preference, not playback');
  await page.locator('#speed').fill('900'); await page.locator('#speed').press('Tab');
  await page.locator('#play').click();
  await page.waitForFunction(() => document.querySelector('[data-rsvp-reader]').shadowRoot.querySelector('dialog').classList.contains('reading'));
  const body = await page.locator('.word').boundingBox();
  await waitForHold();
  await page.waitForFunction(() => sectionWake.requests === 1 && sectionWake.releases === 1);
  const index = Number(await page.locator('.progress').inputValue());
  await page.waitForTimeout(1500); // Beyond the old timed heading pause at 900 WPM.
  assert.equal(Number(await page.locator('.progress').inputValue()), index);
  assert.equal(await page.locator('#play').textContent(), 'Play');
  assert.equal(await page.locator('dialog.reading').count(), 1, 'holding keeps the quiet reading state');
  assert.ok(await page.locator('header.chrome').evaluate(el => Number(getComputedStyle(el).opacity) < .4));
  const heading = await page.locator('.word').boundingBox();
  assert.ok(Math.abs(body.y + body.height / 2 - heading.y - heading.height / 2) < 2, 'holding preserves the reading focal point');
  const label = await page.locator('.heading-label').boundingBox();
  const viewSwitch = await page.locator('.view-switch').boundingBox();
  assert.ok(label.y >= viewSwitch.y + viewSwitch.height, 'section label does not overlap the view switch');
  assert.equal(await page.locator('dialog').evaluate(el => el.scrollWidth > el.clientWidth), false);
  if (screenshot) await page.screenshot({ path: screenshot });
  await page.keyboard.press('Space');
  assert.equal(Number(await page.locator('.progress').inputValue()), index + 1, 'Space immediately leaves the held heading');
  await page.waitForFunction(() => sectionWake.requests === 2);
  await page.keyboard.press('Space');

  for (const mode of ['direct', 'freewheel', 'stepped']) {
    await page.locator('#' + mode).click();
    await seek(index - 1); await wheel(240); await waitForHold();
    assert.equal(Number(await page.locator('.progress').inputValue()), index, `${mode} stops at the heading`);
    await wheel(100);
    await page.waitForFunction(value => Number(document.querySelector('[data-rsvp-reader]').shadowRoot.querySelector('.progress').value) > value, index);
  }

  await seek(index - 1); await wheel(100); await waitForHold();
  await page.keyboard.press('ArrowRight');
  assert.equal(Number(await page.locator('.progress').inputValue()), index + 1);
  assert.match(await page.locator('#state').textContent(), /Paused/);

  await page.locator('#direct').click();
  await seek(index - 1); await wheel(240); await waitForHold();
  await page.locator('.stage').evaluate(stage => {
    const dispatch = (type, y) => {
      const point = { identifier: 7, target: stage, clientX: 150, clientY: y };
      stage.dispatchEvent(Object.assign(new Event(type, { bubbles: true, cancelable: true }), { touches: type === 'touchend' ? [] : [point], changedTouches: [point] }));
    };
    dispatch('touchstart', 300); dispatch('touchmove', 280); dispatch('touchend', 280);
  });
  await page.waitForFunction(value => Number(document.querySelector('[data-rsvp-reader]').shadowRoot.querySelector('.progress').value) > value, index);

  await seek(index - 1); await wheel(240); await waitForHold();
  await hold.click();
  assert.match(await page.locator('#state').textContent(), /Paused/);
  assert.equal(Number(await page.locator('.progress').inputValue()), index, 'turning off holds does not start playback');
  await hold.click();
  await page.locator('#close').click();
  await page.reload(); await open();
  assert.equal(await hold.getAttribute('aria-pressed'), 'true', 'preference survives reload');
  await page.locator('#clear-preferences').click();
  assert.equal(await hold.getAttribute('aria-pressed'), 'false', 'reset restores timed headings');
  await page.locator('#close').click();
  await page.reload(); await open('A passage without headings. '.repeat(20));
  assert.equal(await hold.isVisible(), false, 'hold control is absent without headings');
  await page.locator('#close').click();
}

// Section ticks on the timeline are magnetic, more so for touch than mouse.
export async function checkTouchTimeline(page) {
  await page.locator('#source').fill('Opening words come first. '.repeat(20) + '\n\n# Middle\n\n' + 'Middle words follow. '.repeat(20) + '\n\n# End\n\n' + 'Closing words. '.repeat(20));
  await page.getByRole('button', { name: 'Start reading' }).click();
  const scrub = (pointerType, value) => page.locator('.progress').evaluate((el, { pointerType, value }) => {
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType }));
    el.value = String(value); el.dispatchEvent(new Event('input', { bubbles: true }));
    return Number(el.value);
  }, { pointerType, value });
  const [middle, end] = await page.locator('.progress').evaluate(el => [...el.closest('.timeline').querySelectorAll('.section-ticks span')].map(tick => Math.round(parseFloat(tick.style.left) / 100 * Number(el.max))));
  const perToken = await page.locator('.progress').evaluate(el => (el.getBoundingClientRect().width - 16) / Number(el.max));
  const near = px => Math.max(1, Math.floor(px / perToken)); // tokens within px pixels
  assert.equal(await scrub('touch', middle - near(20)), middle, 'a touch near a tick lands on that section');
  assert.equal(await page.locator('.section-preview').textContent(), 'Middle');
  assert.equal(await scrub('touch', end + near(20)), end);
  const between = Math.round((middle + end) / 2);
  assert.ok((end - between) * perToken > 28, 'test text leaves room between ticks');
  assert.equal(await scrub('touch', between), between, 'a touch away from ticks keeps word precision');
  assert.equal(await scrub('mouse', middle - near(6)), middle, 'a mouse snaps only very close to a tick');
  assert.equal(await scrub('mouse', middle - near(20)), middle - near(20), 'otherwise mouse keeps word precision');
  await page.locator('#close').click();
}
