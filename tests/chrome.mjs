import { checkAutoplayWakeLock } from './wake-lock-browser.mjs';
import { chromium } from 'playwright';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { checkHeadingFocus } from './heading-focus.mjs';
const extensionPath = resolve('dist-chrome');
const context = await chromium.launchPersistentContext('', {
  channel: 'chromium', headless: true,
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
});
try {
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  const id = new URL(worker.url()).host;
  const manifest = await worker.evaluate(() => chrome.runtime.getManifest());
  assert.equal(manifest.background.service_worker, 'background.js');
  assert.ok(manifest.permissions.includes('contextMenus'));
  assert.equal(manifest.browser_specific_settings, undefined);
  const page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`chrome-extension://${id}/paste.html`);
  await checkHeadingFocus(page);
  await checkAutoplayWakeLock(page);
  const newPage = context.waitForEvent('page');
  const response = await page.evaluate(() => chrome.runtime.sendMessage({ type: 'open-paste' }));
  assert.equal(response.ok, true);
  const paste = await newPage; await paste.waitForLoadState();
  assert.equal(paste.url(), `chrome-extension://${id}/paste.html`);
  assert.ok(await paste.locator('#source').isVisible());
  assert.equal(await worker.evaluate(() => new Promise(resolve => chrome.contextMenus.update('paste-text', { title: 'Paste text into Flickleaf' }, () => resolve(chrome.runtime.lastError?.message || 'ok')))), 'ok');
  for (const icon of Object.values(manifest.icons)) {
    assert.ok(await page.evaluate(async path => (await fetch(chrome.runtime.getURL(path))).ok, icon));
  }
  assert.deepEqual(errors, []);
  console.log('Chrome extension loaded: service worker, context menu, paste messaging, icons, playback and heading focus passed.');
} finally { await context.close(); }
