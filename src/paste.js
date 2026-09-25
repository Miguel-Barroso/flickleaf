import { setupPDFInput } from './pdf-input.js';
import { openReader } from './reader.js';
import { pastedArticle } from './pasted-text.js';

const form = document.querySelector('form');
const source = document.querySelector('#source');
const title = document.querySelector('#title');
const error = document.querySelector('#error');
const pdfInput = setupPDFInput({ form, source, title, error });
let session;
form.addEventListener('submit', event => {
  event.preventDefault();
  if (session || pdfInput.busy) return;
  error.textContent = '';
  try {
    session = openReader(pastedArticle(source.value, title.value), () => { session = null; });
  } catch (reason) { error.textContent = reason.message; source.focus(); }
});
source.addEventListener('input', () => { error.textContent = ''; });
