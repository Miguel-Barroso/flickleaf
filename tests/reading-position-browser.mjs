import assert from 'node:assert/strict';
export async function checkReadingPosition(page) {
  await page.locator('#source').fill('A saved reading place should stay private and return to the exact word you chose.');
  const open=()=>page.getByRole('button',{name:'Start reading',exact:true}).click();
  await open(); await page.locator('#save-place').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.querySelector('[data-rsvp-reader]')?.shadowRoot.querySelector('#save-place')?.disabled===false);
  await page.locator('.progress').fill('6');await page.locator('#save-place').click();
  await page.getByText('Place saved. Reopen the same text to resume.',{exact:false}).waitFor();
  await page.locator('#close').click();await open();
  await page.locator('#resume-place').waitFor({state:'visible'});
  assert.equal(await page.locator('.progress').inputValue(),'0');
  await page.locator('#resume-place').click();assert.equal(await page.locator('.progress').inputValue(),'6');
  assert.equal(await page.locator('#play').textContent(),'Play');
  await page.locator('#close').click();
  await page.locator('#source').fill('Different text must never resume from a bookmark for another document.');await open();
  await page.waitForFunction(()=>document.querySelector('[data-rsvp-reader]')?.shadowRoot.querySelector('#save-place')?.disabled===false);
  assert.equal(await page.locator('#resume-place').isVisible(),false);
  await page.locator('#clear-place').click();await page.getByText('Saved place deleted.',{exact:true}).waitFor();
  await page.locator('#close').click();
}
