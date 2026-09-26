import { checkParagraphView } from './paragraph-browser.mjs';
import { checkPreferences } from './preferences-browser.mjs';
import { webkit } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { checkPDFCleanup, checkPDFInput } from './pdf-browser.mjs';
import { checkHeadingFocus } from './heading-focus.mjs';
const manifest = JSON.parse(await readFile('dist-safari/manifest.json'));
assert.deepEqual(manifest.permissions, ['activeTab', 'scripting', 'storage']);
assert.equal(manifest.background.service_worker, 'safari-background.js');
assert.equal(manifest.action.default_popup, 'safari-popup.html');
assert.equal(manifest.browser_specific_settings, undefined);
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    res.setHeader('Content-Type', /\.m?js$/.test(path) ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : path.endsWith('.svg') ? 'image/svg+xml' : 'text/html');
    res.end(await readFile(new URL(`../dist-safari${path}`, import.meta.url)));
  } catch { res.statusCode = 404; res.end(); }
}).listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const browser = await webkit.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const base = `http://127.0.0.1:${server.address().port}`;
  await page.addInitScript(() => {
    window.calls = []; window.close = () => window.calls.push('close');
    window.browser = {
      runtime: { getURL: path => new URL(path, location.href).href },
      tabs: { query: async () => [{ id: 7 }], create: async options => { window.calls.push(options); } },
      scripting: { executeScript: async options => { if (window.rejectInjection) throw Error('denied'); window.calls.push(options); } }
    };
  });
  await page.goto(`${base}/safari-popup.html`);
  await page.getByRole('button', { name: 'Read this page' }).click();
  assert.deepEqual(await page.evaluate(() => calls), [{ target: { tabId: 7 }, files: ['content.js'] }, 'close']);
  await page.evaluate(() => { calls = []; rejectInjection = true; });
  await page.getByRole('button', { name: 'Read this page' }).click();
  assert.match(await page.locator('#error').textContent(), /Allow Flickleaf access/);
  assert.equal(await page.getByRole('button', { name: 'Paste text / Open PDF' }).isEnabled(), true);
  await page.getByRole('button', { name: 'Paste text / Open PDF' }).click();
  assert.deepEqual(await page.evaluate(() => calls), [{ url: `${base}/paste.html` }, 'close']);
  await page.goto(`${base}/paste.html`);
  await checkHeadingFocus(page);
  await checkPDFInput(page);
  await checkPDFCleanup(page);
  await checkPreferences(page);
  await checkParagraphView(page);
  console.log('Safari WebKit: popup success/denial, paste action, heading focus, and local PDF worker passed (extension APIs mocked).');
} finally { await browser.close(); server.close(); }
