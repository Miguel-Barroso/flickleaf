// File bytes go directly to PDF.js in a local worker, never to a network endpoint.
export function setupPDFInput({ form, source, title, error }) {
  const input = document.querySelector('#pdf-file');
  const open = document.querySelector('#open-pdf');
  const cancel = document.querySelector('#cancel-pdf');
  const status = document.querySelector('#pdf-status');
  const assets = new URL('pdfjs/', document.currentScript.src);
  let run = 0, task = null, busy = false;
  const controls = [...form.querySelectorAll('button,input,textarea')].filter(el => el !== cancel);
  let disabled = [];
  function setBusy(value) {
    busy = value; cancel.hidden = !value;
    form.setAttribute('aria-busy', String(value));
    if (value) { disabled = controls.map(el => el.disabled); controls.forEach(el => { el.disabled = true; }); }
    else controls.forEach((el, i) => { el.disabled = disabled[i] ?? false; });
  }
  function stop() {
    run++; task?.destroy().catch(() => {}); task = null;
    if (busy) { setBusy(false); status.textContent = 'PDF opening canceled. Your text is unchanged.'; open.focus(); }
  }
  cancel.addEventListener('click', stop);
  window.addEventListener('pagehide', stop);
  open.addEventListener('click', () => { input.value = ''; input.click(); });
  input.addEventListener('change', async () => {
    const file = input.files?.[0]; input.value = '';
    if (!file) return;
    error.textContent = ''; status.textContent = '';
    if (file.size > 25 * 1024 * 1024) { error.textContent = 'Choose a PDF smaller than 25 MB.'; return; }
    if (!file.size) { error.textContent = 'This file is empty. Choose a PDF with text.'; return; }
    if (source.value.trim() && !confirm('Replace the text in this tab with text from this PDF?')) return;
    const current = ++run;
    let loading, nativeWorker, pdfWorker;
    setBusy(true); status.textContent = 'Opening PDF on your device…';
    try {
      const pdfjs = await import(new URL('pdf.mjs', assets).href);
      if (current !== run) return;
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdf.worker.mjs', assets).href;
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (current !== run) return;
      nativeWorker = new Worker(new URL('pdf.worker.mjs', assets), { type: 'module' });
      pdfWorker = new pdfjs.PDFWorker({ port: nativeWorker });
      loading = pdfjs.getDocument({ worker: pdfWorker, data: bytes, cMapUrl: new URL('cmaps/', assets).href, cMapPacked: true,
        standardFontDataUrl: new URL('standard_fonts/', assets).href, useWorkerFetch: true,
        useWasm: false, isEvalSupported: false, stopAtErrors: true });
      task = loading;
      const pdf = await loading.promise;
      if (current !== run) return;
      if (pdf.numPages > 300) throw new Error('Choose a PDF with 300 pages or fewer. Split longer documents first.');
      const pages = []; let empty = 0;
      for (let number = 1; number <= pdf.numPages; number++) {
        if (current !== run) return;
        status.textContent = `Reading page ${number} of ${pdf.numPages} locally…`;
        const page = await pdf.getPage(number);
        const content = await page.getTextContent();
        const lines = []; let line = '';
        for (const item of content.items) {
          if (typeof item.str !== 'string') continue;
          line += item.str + ' ';
          if (item.hasEOL) { lines.push(line.trim()); line = ''; }
        }
        if (line.trim()) lines.push(line.trim());
        const text = lines.join('\n').trim();
        if (/[\p{L}\p{N}]/u.test(text)) pages.push(`# Page ${number}\n\n${text}`);
        else empty++;
        page.cleanup();
      }
      if (current !== run) return;
      if (!pages.length) throw new Error('No readable text was found. Scanned or image-only PDFs need OCR first; Flickleaf does not run OCR.');
      source.value = pages.join('\n\n'); title.value = file.name.replace(/\.pdf$/i, '').slice(0, 200);
      status.textContent = `${pdf.numPages} pages opened locally. Review the text, then start reading.${empty ? ` ${empty} pages had no readable text and were skipped; they may need OCR.` : ''}`;
    } catch (reason) {
      if (current !== run) return;
      status.textContent = '';
      error.textContent = reason.name === 'PasswordException' ? 'This PDF needs a password. Open an unlocked copy instead.'
        : reason.name === 'InvalidPDFException' ? 'This file could not be read as a PDF. Try another copy.'
        : /Choose a PDF|No readable text/.test(reason.message) ? reason.message
        : 'Could not open this PDF. Try another copy or paste its text instead.';
    } finally {
      await loading?.destroy().catch(() => {});
      pdfWorker?.destroy(); nativeWorker?.terminate();
      if (current === run) { task = null; setBusy(false); }
    }
  });
  return { get busy() { return busy; } };
}
