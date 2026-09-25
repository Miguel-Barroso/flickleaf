import assert from 'node:assert/strict';
export function pdfFixture(pages = ['Private manuscript first page.', 'The second page stays local.']) {
  const font = 3 + pages.length * 2;
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', `<< /Type /Pages /Kids [${pages.map((_, i) => `${3 + i * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`];
  for (const [i, text] of pages.entries()) {
    const escaped = text.replace(/[()\\]/g, value => '\\' + value);
    const stream = text ? `BT /F1 16 Tf 50 740 Td (${escaped}) Tj ET` : '';
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${4 + i * 2} 0 R >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  }
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  for (const [i, object] of objects.entries()) { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${object}\nendobj\n`; }
  const start = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` + offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return Buffer.from(pdf);
}
export async function checkPDFInput(page, { hostingSecurity = false } = {}) {
  const workers = []; const recordWorker = worker => workers.push(worker.url()); page.on('worker', recordWorker);
  const requests = []; const record = request => requests.push({ url: request.url(), method: request.method(), body: request.postData() });
  page.on('request', record);
  const accept = dialog => dialog.accept(); page.on('dialog', accept);
  try {
    await page.locator('#pdf-file').setInputFiles({ name: 'private-manuscript.pdf', mimeType: 'application/pdf', buffer: pdfFixture() });
    await page.waitForFunction(() => /opened locally/.test(document.querySelector('#pdf-status').textContent) || document.querySelector('#error').textContent);
    assert.equal(await page.locator('#error').textContent(), '');
    const draft = await page.locator('#source').inputValue();
    assert.ok(draft.includes('Private manuscript first page.'));
    assert.ok(draft.includes('# Page 2'));
    assert.equal(await page.locator('#title').inputValue(), 'private-manuscript');
    await page.getByRole('button', { name: 'Start reading' }).click();
    assert.equal(await page.locator('.word').textContent(), 'Page 1');
    await page.getByLabel('Jump to section').selectOption({ label: 'Page 2' });
    assert.equal(await page.locator('.word').textContent(), 'Page 2');
    await page.locator('#close').click();
    assert.equal(await page.locator('#source').inputValue(), draft);
    await page.locator('#pdf-file').setInputFiles({ name: 'bad.pdf', mimeType: 'application/pdf', buffer: Buffer.from('not a PDF') });
    await page.waitForFunction(() => document.querySelector('#error').textContent.length > 0);
    assert.equal(await page.locator('#source').inputValue(), draft, 'invalid PDF preserves the draft');
    await page.locator('#pdf-file').setInputFiles({ name: 'scan.pdf', mimeType: 'application/pdf', buffer: pdfFixture(['']) });
    await page.waitForFunction(() => /OCR/.test(document.querySelector('#error').textContent));
    assert.equal(await page.locator('#source').inputValue(), draft, 'image-only PDF preserves the draft');
    await page.locator('#pdf-file').setInputFiles({ name: 'long.pdf', mimeType: 'application/pdf', buffer: pdfFixture(Array(301).fill('Text')) });
    await page.waitForFunction(() => /300 pages/.test(document.querySelector('#error').textContent));
    assert.equal(await page.locator('#source').inputValue(), draft, 'oversized page count preserves the draft');
    assert.ok(workers.some(url => url.includes('pdf.worker.mjs')), 'PDF extraction uses a local background worker');
    assert.ok(requests.length > 0, 'local parser assets were loaded');
    for (const request of requests) {
      const recorded = JSON.stringify(request);
      for (const value of ['private-manuscript', 'Private manuscript first page.', 'The second page stays local.']) {
        for (const representation of [value, encodeURIComponent(value), Buffer.from(value).toString('base64')]) assert.ok(!recorded.includes(representation), 'document data is absent from requests');
      }
      const url = new URL(request.url);
      if (hostingSecurity && url.origin === new URL(page.url()).origin && url.pathname.startsWith('/cdn-cgi/challenge-platform/')) continue;
      assert.equal(request.method, 'GET', 'PDF opening does not upload data');
      assert.equal(request.body, null);
      assert.ok(request.url.startsWith(new URL('pdfjs/', page.url()).href), `only local PDF assets requested: ${request.url}`);
      assert.ok(!request.url.includes('private-manuscript'));
    }
  } finally { page.off('request', record); page.off('dialog', accept); page.off('worker', recordWorker); }
}

export async function checkPDFCancel(page) {
  const other = await page.context().browser().newPage();
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  try {
    await other.route('**/pdfjs/pdf.mjs', async route => { await gate; await route.continue(); });
    await other.goto(page.url());
    await other.locator('#source').fill('Keep my existing text.');
    other.on('dialog', dialog => dialog.accept());
    await other.locator('#pdf-file').setInputFiles({ name: 'cancel.pdf', mimeType: 'application/pdf', buffer: pdfFixture() });
    await other.locator('#cancel-pdf').click();
    assert.equal(await other.locator('#source').inputValue(), 'Keep my existing text.');
    assert.equal(await other.locator('#open-pdf').isEnabled(), true);
    const loaded = other.waitForResponse(response => response.url().endsWith('/pdfjs/pdf.mjs'));
    release(); await loaded; await other.waitForTimeout(300);
    assert.match(await other.locator('#pdf-status').textContent(), /canceled/);
    assert.equal(await other.locator('#source').inputValue(), 'Keep my existing text.');
    assert.equal(other.workers().length, 0, 'canceled import never starts parsing');
  } finally { release(); await other.close(); }
}
