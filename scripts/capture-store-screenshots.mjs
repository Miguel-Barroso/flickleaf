// Capture AMO/Chrome listing screenshots from the live shared web reader,
// unretouched, at 1440x900 then scaled to 1280x800 (16:10). The PDF shot uses
// a generated non-sensitive three-page sample with repeated headers and page numbers.
// Run after a web release: node scripts/capture-store-screenshots.mjs [url]
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const url = process.argv[2] || 'https://miguelbarroso.com/flickleaf/';
const out = 'artifacts/store-screenshots';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/Applications/Chromium.app/Contents/MacOS/Chromium', headless: true });
const shots = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const shot = async name => { await page.waitForTimeout(500); await page.screenshot({ path: `${out}/${name}.png` }); shots.push(name); };
  const next = async n => { for (let i = 0; i < n; i++) await page.getByRole('button', { name: 'Next word', exact: true }).click(); };
  await page.goto(url);
  await page.getByRole('button', { name: 'Try a sample' }).click();
  await page.getByRole('button', { name: 'Start reading' }).click();
  await page.locator('.word').waitFor();
  await next(26); // "linger." in the sample's first paragraph
  await shot('1-words');
  await page.getByRole('button', { name: 'Paragraphs', exact: true }).click();
  await page.locator('.paragraph-content .current-word').waitFor();
  await shot('2-paragraphs');
  await page.getByRole('button', { name: 'Words', exact: true }).click();
  await page.getByRole('button', { name: 'Hold at sections' }).click();
  await page.locator('#sections').selectOption({ label: 'Leave room for the thought' });
  await shot('3-hold-at-sections');
  await page.getByRole('button', { name: 'Hold at sections' }).click();
  await page.getByRole('button', { name: 'Stepped', exact: true }).click();
  await page.locator('#sections').selectOption({ label: 'Find your place' });
  await next(9);
  await page.locator('#theme').click();
  await shot('4-dark-stepped');
  await page.getByRole('button', { name: 'Clear saved preferences' }).click();

  const pdfPage = await browser.newPage();
  const header = `<header>Field Notes · The Garden in Spring</header>`, footer = n => `<footer>${n}</footer>`;
  await pdfPage.setContent(`<style>body{font:13pt Georgia;margin:0}section{height:10.9in;display:flex;flex-direction:column;padding:.4in 1in;box-sizing:border-box;break-after:page}header,footer{font-size:9pt;color:#666}header{margin-bottom:.4in}footer{margin-top:auto}h1{font-size:20pt}</style>
    <section>${header}<h1>Notes from the garden</h1><p>The first warm week arrives without ceremony. Overnight the beds turn from brown to a faint green, and the birds begin their arguments before sunrise.</p><p>Peas go in first, along the old fence, where the soil drains well and the morning light lingers. Beans can wait until the nights stop biting.</p><p>A garden rewards patience more than effort. Most of the work is watching: noticing which corner stays damp, where the slugs gather, and what the bees prefer.</p>${footer(1)}</section>
    <section>${header}<h1>What the season teaches</h1><p>By May the tomatoes need stakes and the lettuce needs shade. Each plant keeps its own schedule, and none of them can be hurried.</p><p>Write down what worked.</p>${footer(2)}</section>
    <section>${header}<h1>Keeping notes</h1><p>A small notebook by the door is enough. Record the first frost, the first harvest, and anything that surprised you.</p><p>Next spring will arrive just as quietly, and the notes will be waiting.</p>${footer(3)}</section>`);
  const pdf = `${out}/sample-garden-notes.pdf`;
  await pdfPage.pdf({ path: pdf, width: '8.5in', height: '11in' });
  await page.getByRole('button', { name: 'Close' }).click();
  await page.locator('#source').fill(''); await page.locator('#title').fill('');
  await page.locator('#pdf-file').setInputFiles(pdf);
  await page.getByRole('button', { name: 'Preview cleanup' }).waitFor();
  await page.getByRole('button', { name: 'Preview cleanup' }).click();
  await page.locator("#pdf-removed-details").evaluate(d => { d.open = true; });
  await page.locator(".pdf-cleanup").evaluate(p => window.scrollTo(0, p.getBoundingClientRect().top + scrollY - 120));
  await shot('5-local-pdf-cleanup');
} finally { await browser.close(); }
for (const name of shots) execFileSync('sips', ['-z', '800', '1280', `${out}/${name}.png`], { stdio: 'ignore' });
console.log(`Captured ${shots.length} 1280x800 screenshots in ${out} from ${url}`);
