// Capture Chrome Web Store and AMO listing screenshots from the packaged Chrome
// build reading Dario Amodei's "The Adolescence of Technology" live from its own
// site, unretouched, at 1440x900 then scaled to 1280x800 (16:10), plus the
// 440x280 Chrome promo tile. The essay is never copied into the repository; the
// PDF shot prints the live page locally. Only for capture, a temporary copy of
// dist-chrome adds host access so the reader can be injected without a toolbar
// click. Run after npm run build:chrome: node scripts/capture-store-screenshots.mjs
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const essay = 'https://www.darioamodei.com/essay/the-adolescence-of-technology';
const out = 'artifacts/store-screenshots', ext = resolve('artifacts/.capture-extension');
await rm(out, { recursive: true, force: true }); await mkdir(out, { recursive: true });
await rm(ext, { recursive: true, force: true }); await cp('dist-chrome', ext, { recursive: true });
const manifest = JSON.parse(await readFile(`${ext}/manifest.json`, 'utf8'));
await writeFile(`${ext}/manifest.json`, JSON.stringify({ ...manifest, host_permissions: ['<all_urls>'] }));
const context = await chromium.launchPersistentContext('', { channel: 'chromium', headless: true, viewport: { width: 1440, height: 900 },
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`] });
const shots = [];
try {
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  const id = new URL(worker.url()).host;
  const page = await context.newPage();
  const shot = async name => { await page.waitForTimeout(500); await page.screenshot({ path: `${out}/${name}.png` }); shots.push(name); };
  const next = async n => { for (let i = 0; i < n; i++) await page.getByRole('button', { name: 'Next word', exact: true }).click(); };
  const section = async pattern => page.locator('#sections').selectOption(
    await page.locator('#sections option').evaluateAll((options, source) => options.find(o => new RegExp(source).test(o.textContent)).value, pattern.source));
  await page.goto(essay, { waitUntil: 'networkidle' });
  await worker.evaluate(() => chrome.tabs.query({ url: '*://*.darioamodei.com/*' })
    .then(([tab]) => chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] })));
  await page.locator('.word').waitFor();
  await section(/sorry, Dave/);
  await next(5); // "geniuses" in "A country of geniuses in a datacenter"
  await shot('1-words');
  await page.getByRole('button', { name: 'Paragraphs', exact: true }).click();
  await page.locator('.paragraph-content .current-word').waitFor();
  await shot('2-paragraphs');
  await page.getByRole('button', { name: 'Words', exact: true }).click();
  await page.getByRole('button', { name: 'Hold at sections' }).click();
  await section(/Player piano/);
  await shot('3-hold-at-sections');
  await page.getByRole('button', { name: 'Hold at sections' }).click();
  await page.getByRole('button', { name: 'Stepped', exact: true }).click();
  await section(/Humanity/);
  await next(38); // "beautiful" in the closing section
  await page.locator("#theme").click();
  await shot('4-dark-stepped');
  await page.getByRole('button', { name: 'Clear saved preferences' }).click();

  // Chrome's print header and footer repeat the title and page numbers on every page, as real PDFs do.
  const print = await context.newPage();
  await print.goto(essay, { waitUntil: 'networkidle' });
  const pdf = `${out}/the-adolescence-of-technology.pdf`;
  await print.pdf({ path: pdf, format: 'Letter', displayHeaderFooter: true, margin: { top: '0.8in', bottom: '0.8in' },
    headerTemplate: '<div style="font:9px Georgia;width:100%;text-align:center;color:#666">The Adolescence of Technology · Dario Amodei</div>',
    footerTemplate: '<div style="font:9px Georgia;width:100%;text-align:center;color:#666"><span class="pageNumber"></span></div>' });
  await print.close();
  await page.goto(`chrome-extension://${id}/paste.html`);
  await page.locator('#pdf-file').setInputFiles(pdf);
  await page.getByRole('button', { name: 'Preview cleanup' }).waitFor({ timeout: 120000 });
  await page.getByRole('button', { name: 'Preview cleanup' }).click();
  await page.locator('#pdf-removed-details').evaluate(d => { d.open = true; });
  await page.locator('.pdf-cleanup').evaluate(p => window.scrollTo(0, p.getBoundingClientRect().top + scrollY - 120));
  await shot('5-local-pdf-cleanup');

  const tile = await context.newPage({ viewport: { width: 440, height: 280 } });
  const icon = await readFile('public/icon.svg', 'utf8');
  await tile.setViewportSize({ width: 440, height: 280 });
  await tile.setContent(`<body style="margin:0;width:440px;height:280px;display:flex;flex-direction:column;justify-content:center;padding:0 40px;box-sizing:border-box;background:#f6f3ec;color:#263b33;font-family:Georgia,serif">
    <div style="display:flex;align-items:center;gap:12px"><div style="width:44px;height:44px">${icon.replace('<svg', '<svg width="44" height="44"')}</div><span style="font:600 26px system-ui">Flickleaf</span></div>
    <p style="font-size:30px;line-height:1.15;margin:22px 0 10px">A little space<br>for every word.</p>
    <p style="font:13px system-ui;color:#5c6b62;margin:0">Read one word at a time, at your own pace.</p></body>`);
  await tile.screenshot({ path: `${out}/promo-tile-440x280.png` });
  // Optional marquee tile, used only if Chrome features the listing: the shared tagline beside a real reader capture.
  const reader = (await readFile(`${out}/1-words.png`)).toString("base64");
  await tile.setViewportSize({ width: 1400, height: 560 });
  await tile.setContent(`<body style="margin:0;width:1400px;height:560px;display:flex;align-items:center;gap:60px;padding:0 80px;box-sizing:border-box;background:#f6f3ec;color:#263b33;font-family:Georgia,serif;overflow:hidden">
    <div style="flex:0 0 470px"><div style="display:flex;align-items:center;gap:16px"><div style="width:60px;height:60px">${icon.replace("<svg", "<svg width=\"60\" height=\"60\"")}</div><span style="font:600 36px system-ui">Flickleaf</span></div>
    <p style="font-size:54px;line-height:1.1;margin:30px 0 16px">A little space<br>for every word.</p><p style="font:20px system-ui;color:#5c6b62;margin:0">Read one word at a time, at your own pace.</p></div>
    <img src="data:image/png;base64,${reader}" style="width:720px;border-radius:14px;box-shadow:0 20px 50px rgba(38,59,51,.18)"></body>`);
  await tile.screenshot({ path: `${out}/marquee-1400x560.png` });
} finally { await context.close(); await rm(ext, { recursive: true, force: true }); }
for (const name of shots) execFileSync('sips', ['-z', '800', '1280', `${out}/${name}.png`], { stdio: 'ignore' });
console.log(`Captured ${shots.length} 1280x800 screenshots, the promo tile, and the marquee in ${out} from the Chrome build`);
