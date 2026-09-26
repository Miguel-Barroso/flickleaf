import { cleanupPDFPages, formatPDFPages } from './pdf-cleanup.js';
import css from './pdf-cleanup.css';

export function setupPDFCleanup({ source, status }) {
  const style = document.createElement('style'); style.textContent = css; document.head.append(style);
  const panel = document.createElement('section'); panel.className = 'pdf-cleanup'; panel.hidden = true;
  panel.setAttribute('aria-label', 'PDF cleanup');
  panel.innerHTML = `<h2>Smooth out the reading flow</h2><p>Preview suggested changes before applying them. Everything stays on your device.</p>
    <div class="pdf-cleanup-options"><label><input id="pdf-clean-headers" type="checkbox" checked> Remove repeated headers and footers</label>
    <label><input id="pdf-clean-numbers" type="checkbox" checked> Remove page numbers in the margins</label>
    <label><input id="pdf-clean-hyphens" type="checkbox"> Join words split by a line-end hyphen</label></div>
    <p class="pdf-cleanup-note">Hyphen joining can change real compound words. Check the preview carefully. Columns and tables are not rearranged.</p>
    <div class="pdf-cleanup-actions"><button type="button" id="pdf-preview">Preview cleanup</button><button type="button" id="pdf-undo" hidden>Undo cleanup</button></div>
    <div id="pdf-preview-panel" hidden><p id="pdf-clean-summary" role="status"></p><details id="pdf-removed-details" hidden><summary>Examples of lines suggested for removal</summary><ul id="pdf-removed"></ul></details>
    <label for="pdf-clean-text">Preview only — your text below is unchanged</label><textarea id="pdf-clean-text" readonly rows="8" spellcheck="false"></textarea>
    <div class="pdf-cleanup-actions"><button type="button" id="pdf-apply">Apply cleanup</button><button type="button" id="pdf-keep">Keep current text</button></div></div>`;
  status.after(panel);
  const $ = selector => panel.querySelector(selector);
  let pages = null, original = '', expected = '', proposal = null;
  const hidePreview = () => { proposal = null; $('#pdf-preview-panel').hidden = true; };
  const invalidate = () => { pages = null; original = ''; expected = ''; hidePreview(); panel.hidden = true; };
  const isCurrent = () => {
    if (pages && source.value === expected) return true;
    invalidate(); status.textContent = 'Your edited text is kept. Reopen the PDF to make new cleanup suggestions.'; return false;
  };
  source.addEventListener('input', invalidate);
  for (const input of panel.querySelectorAll('input')) input.addEventListener('change', hidePreview);
  $('#pdf-preview').addEventListener('click', () => {
    if (!isCurrent()) return;
    proposal = cleanupPDFPages(pages, { headers: $('#pdf-clean-headers').checked, numbers: $('#pdf-clean-numbers').checked, hyphens: $('#pdf-clean-hyphens').checked });
    const { headers, numbers, hyphens, examples } = proposal.changes;
    $('#pdf-clean-summary').textContent = proposal.changed
      ? `${headers} repeated margin lines · ${numbers} page numbers · ${hyphens} hyphen joins. Review the proposed text below.`
      : 'No cleanup suggestions for these options. Your text is unchanged.';
    $('#pdf-removed').replaceChildren(...examples.map(value => { const li = document.createElement('li'); li.textContent = value; return li; }));
    $('#pdf-removed-details').hidden = !examples.length;
    $('#pdf-clean-text').value = proposal.text;
    $('#pdf-apply').disabled = proposal.text === expected;
    $('#pdf-preview-panel').hidden = false;
  });
  $('#pdf-apply').addEventListener('click', () => {
    if (!isCurrent() || !proposal) return;
    source.value = expected = proposal.text;
    hidePreview(); $('#pdf-undo').hidden = expected === original;
    status.textContent = 'Cleanup applied locally. You can undo it until you edit the text or open another PDF.';
    $('#pdf-preview').focus();
  });
  $('#pdf-keep').addEventListener('click', () => { hidePreview(); $('#pdf-preview').focus(); });
  $('#pdf-undo').addEventListener('click', () => {
    if (!isCurrent()) return;
    source.value = expected = original; hidePreview(); $('#pdf-undo').hidden = true;
    status.textContent = 'Original PDF text restored. Nothing was uploaded.'; $('#pdf-preview').focus();
  });
  return { setPages(value) {
    pages = value; original = expected = formatPDFPages(pages); hidePreview();
    $('#pdf-clean-headers').checked = true; $('#pdf-clean-numbers').checked = true; $('#pdf-clean-hyphens').checked = false;
    $('#pdf-undo').hidden = true; panel.hidden = false;
  } };
}
