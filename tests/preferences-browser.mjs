import assert from 'node:assert/strict';

export async function checkPreferences(page) {
  const open = async () => {
    await page.locator('#source').fill('Private preference test text. '.repeat(100));
    await page.getByRole('button', { name: 'Start reading' }).click();
    await page.waitForFunction(() => !document.querySelector('[data-rsvp-reader]').shadowRoot.querySelector('#preferences-status').textContent.includes('Loading'));
  };
  await open();
  await page.locator('#clear-preferences').click();
  await page.locator('#min-speed').fill('400'); await page.locator('#min-speed').press('Tab');
  await page.locator('#max-speed').fill('800'); await page.locator('#max-speed').press('Tab');
  await page.locator('#speed').fill('650'); await page.locator('#speed').press('Tab');
  await page.locator('#freewheel').click();
  await page.locator('#theme').focus(); await page.keyboard.press('Enter');
  assert.equal(await page.locator('dialog.dark').count(), 1);
  assert.equal(await page.locator('#play').textContent(), 'Play', 'theme keyboard activation does not start playback');
  await page.locator('#close').click();
  await page.reload();
  await open();
  assert.equal(await page.locator('#min-speed').inputValue(), '400');
  assert.equal(await page.locator('#max-speed').inputValue(), '800');
  assert.equal(await page.locator('#speed').inputValue(), '650');
  assert.equal(await page.locator('#freewheel').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('dialog.dark').count(), 1);
  await page.locator('#play').click();
  await page.locator('#clear-preferences').focus(); await page.keyboard.press('Space');
  assert.equal(await page.locator('#play').textContent(), 'Play', 'reset pauses playback');
  assert.equal(await page.locator('#speed').inputValue(), '300');
  assert.equal(await page.locator('#max-speed').inputValue(), '900');
  assert.equal(await page.locator('dialog.dark').count(), 0);
  await page.locator('#close').click();
  await page.reload();
  await open();
  assert.equal(await page.locator('#speed').inputValue(), '300');
  assert.equal(await page.locator('#direct').getAttribute('aria-pressed'), 'true');
  await page.locator('#close').click();
}
