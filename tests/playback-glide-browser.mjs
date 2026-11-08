import assert from 'node:assert/strict';

// Play quiets the controls at once. A Glide or Freewheel scroll during hands-off
// reading glides, then reading carries on at the minimum pace; Stepped stops.
export async function checkPlaybackGlide(page) {
  await page.locator('#source').fill('Words keep coming at a steady pace. '.repeat(120));
  await page.getByRole('button', { name: 'Start reading' }).click();
  await page.waitForFunction(() => !document.querySelector('[data-rsvp-reader]').shadowRoot.querySelector('#preferences-status').textContent.includes('Loading'));
  await page.locator('#clear-preferences').click();
  const wheel = deltaY => page.locator('.stage').dispatchEvent('wheel', { deltaY, deltaMode: 0 });
  const waitForState = prefix => page.waitForFunction(prefix => document.querySelector('[data-rsvp-reader]').shadowRoot.querySelector('#state').textContent.startsWith(prefix), prefix, { timeout: 5000 });
  const minimum = await page.locator('#min-speed').inputValue();
  await page.locator('#speed').fill('600'); await page.locator('#speed').press('Tab');
  await page.locator('#play').click();
  assert.equal(await page.locator('dialog.reading').count(), 1, 'Play quiets the controls at once');
  await wheel(100); await waitForState('Following your scroll');
  await waitForState(`Reading · ${minimum} WPM`);
  assert.equal(await page.locator('#speed').inputValue(), minimum, 'the speed field shows the minimum pace');
  assert.equal(await page.locator('#play').textContent(), 'Pause');
  const before = Number(await page.locator('.progress').inputValue());
  await wheel(-100); await waitForState('Rewinding');
  await waitForState(`Reading · ${minimum} WPM`);
  assert.ok(Number(await page.locator('.progress').inputValue()) < before, 'a rewind also hands back to reading');
  await page.locator('#play').click();
  assert.match(await page.locator('#state').textContent(), /^Paused/);
  await page.locator('#stepped').click(); await page.locator('#play').click();
  await wheel(100); await waitForState('Stepping'); await waitForState('Paused');
  await page.locator('#clear-preferences').click();
  await page.locator('#close').click();
}
