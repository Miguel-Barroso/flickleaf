import { openReader } from '../src/reader.js';
import { pastedArticle } from '../src/pasted-text.js';
import mobileCSS from './reader-mobile.css';
const form = document.querySelector('#paste-form');
const source = document.querySelector('#source');
const title = document.querySelector('#title');
const error = document.querySelector('#error');
let session;
const sample = `# A pace of your own

There is no prize for reaching the end of a sentence first. Some words ask us to move quickly. Others give us a reason to linger.

Flickleaf leaves that choice with you. Press Play and let the words arrive, or move through them with a swipe. You can always slow down, stop, or go back.

## Leave room for the thought

A pause is part of reading. It gives a new idea somewhere to settle. When a passage feels dense, try a gentler pace and open Context to see the words around it.

## Find your place

The little marks above the progress bar show where sections begin. Choose a heading to return to it. The text will wait for you.

Close the reader whenever you want to return to the full passage. Your rhythm belongs to you.`;
document.querySelector('#sample').addEventListener('click', () => {
  if (source.value.trim() && !confirm('Replace the text in this tab with the sample?')) return;
  source.value = sample; title.value = 'A pace of your own'; error.textContent = ''; source.focus();
});
form.addEventListener('submit', event => {
  event.preventDefault();
  if (session) return;
  error.textContent = '';
  try {
    const article = pastedArticle(source.value, title.value);
    // Close the software keyboard before opening the full-screen reader.
    document.activeElement?.blur();
    session = openReader(article, () => { session = null; form.querySelector('[type="submit"]').focus({ preventScroll: true }); });
    const root = document.querySelector('[data-rsvp-reader]').shadowRoot;
    const style = document.createElement('style'); style.textContent = mobileCSS; root.append(style);
    const settings = document.createElement('details'); settings.className = 'reader-settings chrome';
    const summary = document.createElement('summary'); summary.textContent = 'Pace & scroll settings'; settings.append(summary);
    root.querySelector('.hint').before(settings);
    settings.append(root.querySelector('.scroll-feel'), root.querySelector('.speed-limits'));
    // Keep the existing keyboard focus loop aware of native disclosure controls.
    settings.addEventListener('keydown', event => {
      if (event.target === summary && ['Enter', ' '].includes(event.key)) event.stopPropagation();
    });
    if (matchMedia('(pointer: coarse)').matches) {
      root.querySelector('.hint').textContent = 'Swipe up to move forward · Swipe down to go back · Tap Play for a steady pace';
      root.querySelector('.stage').setAttribute('aria-label', 'Reading area. Swipe up to move forward or down to go back.');
    }
  } catch (reason) { error.textContent = reason.message; source.focus(); }
});
source.addEventListener('input', () => { error.textContent = ''; });
