// Recapture docs/images from the live shared web reader using its built-in
// sample, unretouched. Run after a web release: node scripts/capture-quick-start.mjs [url]
import { chromium } from 'playwright';
const url = process.argv[2] || 'https://miguelbarroso.com/flickleaf/';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/Applications/Chromium.app/Contents/MacOS/Chromium', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
  await page.goto(url);
  await page.getByRole('button', { name: 'Try a sample' }).click();
  await page.getByRole('button', { name: 'Start reading' }).click();
  await page.locator('.word').waitFor();
  for (let i = 0; i < 12; i++) await page.getByRole('button', { name: 'Next word', exact: true }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'docs/images/words.png' });
  await page.getByRole('button', { name: 'Paragraphs', exact: true }).click();
  await page.locator('.paragraph-content .current-word').waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'docs/images/paragraphs.png' });
  console.log(`Captured words.png and paragraphs.png from ${url}`);
} finally { await browser.close(); }
