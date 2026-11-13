import assert from 'node:assert/strict';

// Play quiets the controls at once. A Glide or Freewheel scroll during hands-off
// reading glides, then reading carries on at the chosen pace, which the speed
// field keeps showing; Stepped stops.
export async function checkPlaybackGlide(page) {
  await page.locator('#source').fill('Words keep coming at a steady pace. '.repeat(120));
  await page.getByRole('button', { name: 'Start reading' }).click();
  await page.waitForFunction(() => !document.querySelector('[data-rsvp-reader]').shadowRoot.querySelector('#preferences-status').textContent.includes('Loading'));
  await page.locator('#clear-preferences').click();
  const wheel = deltaY => page.locator('.stage').dispatchEvent('wheel', { deltaY, deltaMode: 0 });
  const waitForState = prefix => page.waitForFunction(prefix => document.querySelector('[data-rsvp-reader]').shadowRoot.querySelector('#state').textContent.startsWith(prefix), prefix, { timeout: 5000 });
  // Reading already shows the chosen pace before the scroll, so record every
  // state and wait for the glide and the hand-back in order.
  const watchStates = () => page.evaluate(() => {
    const state = document.querySelector('[data-rsvp-reader]').shadowRoot.querySelector('#state');
    window.flickleafStates = [];
    window.flickleafStateWatch ??= new MutationObserver(() => window.flickleafStates.push(state.textContent));
    window.flickleafStateWatch.observe(state, { childList: true, characterData: true, subtree: true });
  });
  const waitForStates = (...prefixes) => page.waitForFunction(prefixes => {
    let at = 0;
    for (const prefix of prefixes) {
      at = window.flickleafStates.findIndex((text, index) => index >= at && text.startsWith(prefix)) + 1;
      if (!at) return false;
    }
    return true;
  }, prefixes, { timeout: 5000 }).catch(async error => {
    throw new Error(`expected ${prefixes.join(' → ')}, saw ${JSON.stringify(await page.evaluate(() => window.flickleafStates))}`, { cause: error });
  });
  const minimum = await page.locator('#min-speed').inputValue();
  assert.equal(minimum, '300');
  await page.locator('#speed').fill('600'); await page.locator('#speed').press('Tab');
  // Start mid-text so the rewind cannot reach the first word, where reading stops.
  await page.locator('.progress').evaluate(el => { el.value = '400'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.locator('#play').click();
  assert.equal(await page.locator('dialog.reading').count(), 1, 'Play quiets the controls at once');
  await watchStates(); await wheel(100);
  await waitForStates('Following your scroll', 'Reading · 600 WPM');
  assert.equal(await page.locator('#speed').inputValue(), '600', 'the speed field keeps the chosen pace');
  assert.equal(await page.locator('#play').textContent(), 'Pause');
  const before = Number(await page.locator('.progress').inputValue());
  await watchStates(); await wheel(-100);
  await waitForStates('Rewinding', 'Reading · 600 WPM');
  assert.ok(Number(await page.locator('.progress').inputValue()) < before, 'a rewind also hands back to reading');
  assert.equal(await page.locator('#speed').inputValue(), '600');
  await page.locator('#play').click();
  assert.match(await page.locator('#state').textContent(), /^Paused/);
  await page.locator('#stepped').click(); await page.locator('#play').click();
  await wheel(100); await waitForState('Stepping'); await waitForState('Paused');
  await page.locator('#clear-preferences').click();
  await page.locator('#close').click();
}
