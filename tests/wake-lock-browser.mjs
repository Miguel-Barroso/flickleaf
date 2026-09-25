import assert from 'node:assert/strict';
export async function checkAutoplayWakeLock(page) {
  await page.evaluate(() => {
    window.wakeTest = { requests: 0, releases: 0 };
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: async () => {
      window.wakeTest.requests++;
      const lock = new EventTarget(); lock.released = false;
      lock.release = async () => { lock.released = true; window.wakeTest.releases++; lock.dispatchEvent(new Event('release')); };
      return lock;
    } } });
  });
  await page.locator('#source').fill('These words keep the autoplay running for this check. '.repeat(40));
  await page.getByRole('button', { name: 'Start reading' }).click();
  assert.equal(await page.evaluate(() => wakeTest.requests), 0);
  await page.locator('#play').click();
  await page.waitForFunction(() => wakeTest.requests === 1);
  await page.locator('#play').click();
  await page.waitForFunction(() => wakeTest.releases === 1);
  await page.locator('#play').click();
  await page.waitForFunction(() => wakeTest.requests === 2);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.waitForFunction(() => wakeTest.releases === 2);
  await page.locator('#play').click();
  await page.waitForFunction(() => wakeTest.requests === 3);
  await page.locator('#close').click();
  await page.waitForFunction(() => wakeTest.releases === 3);
  assert.equal(await page.evaluate(() => wakeTest.requests), 3);
  await page.evaluate(() => { delete navigator.wakeLock; delete window.wakeTest; });
}
