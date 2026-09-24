import { extension } from './extension-api.js';
import { extract } from './extract.js';
import { openReader } from './reader.js';
const openPaste = () => extension.runtime.sendMessage({ type: 'open-paste' });
const key = '__rsvpReaderSession';
if (globalThis[key]?.close) globalThis[key].close();
else {
  try {
    const article = extract(document);
    const identity = `${location.href}\n${article.title}\n${article.tokens.length}\n${article.tokens.slice(0, 10).map(t => t.text).join(' ')}`;
    const saved = globalThis.__rsvpReaderPosition;
    if (saved?.identity === identity) article.position = saved.index;
    globalThis[key] = openReader(article, index => {
      globalThis.__rsvpReaderPosition = { identity, index };
      globalThis[key] = null;
    }, openPaste);
  }
  catch (error) { globalThis[key] = openReader({ error: error.message }, () => { globalThis[key] = null; }, openPaste); }
}
