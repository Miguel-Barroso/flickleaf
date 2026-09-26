import { checkPreferences } from './preferences-browser.mjs';
import { checkPDFCleanup, checkPDFInput, checkPDFCancel } from './pdf-browser.mjs';
import { checkAutoplayWakeLock } from './wake-lock-browser.mjs';
import { checkTouchScroll } from './touch-scroll.mjs';
import { checkHeadingFocus } from './heading-focus.mjs';
import { chromium, webkit } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const server = createServer(async (req, res) => {
  let path = new URL(req.url, 'http://localhost').pathname;
  if (path.endsWith('/')) path += 'index.html';
  try {
    res.setHeader('Content-Type', (path.endsWith('.js') || path.endsWith('.mjs')) ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : path.endsWith('.svg') ? 'image/svg+xml' : 'text/html');
    res.end(await readFile(new URL(`../dist-web${path}`, import.meta.url)));
  } catch { res.statusCode = 404; res.end(); }
}).listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
await mkdir('.test-results', { recursive: true });
try {
  for (const [name, type, options] of [
    ['desktop', chromium, { viewport: { width: 1440, height: 1000 } }],
    ['android', chromium, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
    ['iphone', webkit, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
    ['small-phone', webkit, { viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true }],
  ]) {
    const browser = await type.launch({ headless: true });
    try {
      const page = await browser.newPage(options);
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${server.address().port}/flickleaf/`);
      assert.equal(await page.locator('body').evaluate(el => el.scrollWidth > innerWidth), false);
      await page.screenshot({ path: `.test-results/web-${name}.png`, fullPage: true });
      await page.getByRole('button', { name: 'Start reading' }).click();
      assert.match(await page.locator('#error').textContent(), /Paste some text/);
      await page.getByRole('button', { name: 'Try a sample' }).click();
      const corpus = await page.locator('#source').inputValue();
      await page.getByRole('button', { name: 'Start reading' }).click();
      assert.equal(await page.locator('.word').textContent(), 'A pace of your own');
      assert.equal(await page.locator('#sections option').count(), 3);
      assert.equal(await page.locator('dialog').evaluate(el => el.scrollWidth > el.clientWidth), false);
      for (const control of ['#direct', '#freewheel', '#min-speed', '#max-speed']) assert.ok(await page.locator(control).isVisible());
      const playBox = await page.locator('#play').boundingBox();
      assert.ok(playBox.y + playBox.height <= options.viewport.height, 'Play fits the initial viewport');
      await page.locator('#play').click();
      await page.waitForTimeout(1600);
      await page.locator('#play').click();
      assert.notEqual(await page.locator('.word').textContent(), 'A pace of your own');
      await page.locator('#max-speed').fill('600'); await page.locator('#max-speed').press('Tab');
      assert.equal(await page.locator('#speed').getAttribute('max'), '600');
      await page.getByLabel('Jump to section').selectOption({ label: 'Find your place' });
      assert.equal(await page.locator('.word').textContent(), 'Find your place');
      await page.locator('dialog').evaluate(el => { el.scrollTop = 0; });
      await page.screenshot({ path: `.test-results/web-reader-${name}.png` });
      await page.locator('#close').click();
      assert.equal(await page.locator('#source').inputValue(), corpus);
      await checkHeadingFocus(page);
  await checkAutoplayWakeLock(page);
  await checkPDFInput(page);
  await checkPDFCleanup(page);
  await checkPreferences(page);
      if (name === 'desktop') await checkPDFCancel(page);
      if (options.hasTouch) await checkTouchScroll(page, type === chromium);
      await page.getByRole('link', { name: 'About', exact: true }).click();
      assert.ok(await page.getByRole('heading', { name: 'Reading, at your pace.' }).isVisible());
      assert.equal(await page.getByRole('link', { name: 'View on GitHub' }).getAttribute('href'), 'https://github.com/Miguel-Barroso/flickleaf');
      assert.equal(await page.locator('body').evaluate(el => el.scrollWidth > innerWidth), false);
      await page.screenshot({ path: `.test-results/web-about-${name}.png`, fullPage: true });
      assert.deepEqual(errors, []);
      console.log(`${name}: paste, sample, playback, settings, sections, draft retention, About and layout passed`);
    } finally { await browser.close(); }
  }
} finally { server.close(); }
