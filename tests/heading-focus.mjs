import assert from 'node:assert/strict';

export async function checkHeadingFocus(page) {
  await page.locator('#source').fill('Quiet words stay in the center. '.repeat(7) + '\n\n# A heading stays in the middle\n\n' + 'More quiet words follow the heading. '.repeat(7));
  await page.getByRole('button', { name: 'Start reading' }).click();
  await page.locator('#speed').fill('900'); await page.locator('#speed').press('Tab');
  await page.locator('#play').click();
  await page.waitForFunction(() => document.querySelector('[data-rsvp-reader]').shadowRoot.querySelector('dialog').classList.contains('reading'));
  const body = await page.locator('.word').boundingBox();
  await page.waitForFunction(() => document.querySelector('[data-rsvp-reader]').shadowRoot.querySelector('.stage').classList.contains('heading-card'));
  assert.equal(await page.locator('dialog.reading').count(), 1, 'headings preserve the quiet reading state');
  assert.ok(await page.locator('header.chrome').evaluate(el => Number(getComputedStyle(el).opacity) < .4), 'heading does not reveal the background');
  const heading = await page.locator('.word').boundingBox();
  assert.ok(Math.abs((body.y + body.height / 2) - (heading.y + heading.height / 2)) < 2, `title stays on the same vertical reading center (${body.y + body.height / 2} → ${heading.y + heading.height / 2})`);
  await page.waitForFunction(() => !document.querySelector('[data-rsvp-reader]').shadowRoot.querySelector('.stage').classList.contains('heading-card'));
  assert.equal(await page.locator('dialog.reading').count(), 1, 'returning to prose preserves the quiet state');
  await page.locator('#close').click();
}
