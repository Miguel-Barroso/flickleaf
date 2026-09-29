export const POSITION_KEY = 'flickleaf.position.v1';
// Version the token representation so future tokenization changes cannot mis-seek.
export async function textFingerprint(tokens, crypto = globalThis.crypto) {
  const bytes = new TextEncoder().encode(JSON.stringify(tokens.map(t => [t.text, Boolean(t.heading), t.level || 0])));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}
export function normalizePosition(value) {
  if (!value || value.version !== 1 || !/^[a-f0-9]{64}$/.test(value.fingerprint) || !Number.isSafeInteger(value.index) || value.index < 0) return null;
  return { version: 1, fingerprint: value.fingerprint, index: value.index };
}
export function createPositionStore(scope = globalThis) {
  const extension = scope.browser?.runtime?.id ? scope.browser : scope.chrome?.runtime?.id ? scope.chrome : null;
  const temporary = Boolean(extension?.extension?.inIncognitoContext);
  let queue = Promise.resolve();
  const run = task => {
    const result = queue.then(async () => {
      if (temporary) throw new Error('Private session');
      return { ok: true, value: await task() };
    }).catch(() => ({ ok: false }));
    queue = result; return result;
  };
  return {
    temporary,
    load: () => run(async () => normalizePosition(extension ? (await extension.storage.local.get(POSITION_KEY))[POSITION_KEY] : JSON.parse(scope.localStorage.getItem(POSITION_KEY) || 'null'))),
    save: value => run(async () => {
      const clean = normalizePosition(value); if (!clean) throw new Error('Invalid position');
      if (extension) await extension.storage.local.set({ [POSITION_KEY]: clean });
      else scope.localStorage.setItem(POSITION_KEY, JSON.stringify(clean));
    }),
    clear: () => run(async () => {
      if (extension) await extension.storage.local.remove(POSITION_KEY);
      else scope.localStorage.removeItem(POSITION_KEY);
    }),
  };
}
export function setupReadingPosition(tokens, root, getIndex, seek, signal) {
  const store = createPositionStore();
  const save = root.querySelector('#save-place'), resume = root.querySelector('#resume-place'), clear = root.querySelector('#clear-place'), status = root.querySelector('#place-status');
  let fingerprint, saved = null, busy = false, generation = 0;
  const update = message => {
    if (signal.aborted) return;
    status.textContent = message;
    save.disabled = busy || !fingerprint || store.temporary;
    clear.disabled = busy || store.temporary;
    resume.hidden = !saved || saved.fingerprint !== fingerprint || saved.index >= tokens.length;
    resume.disabled = busy;
  };
  const act = async (operation, message, next) => {
    generation++; busy = true; update('Saving change…');
    const result = await operation();
    busy = false; if (result.ok) saved = next;
    update(result.ok ? message : 'Could not update the saved place. Storage may be unavailable.');
  };
  save.addEventListener('click', () => {
    if (busy || !fingerprint) return;
    const next = { version: 1, fingerprint, index: getIndex() };
    act(() => store.save(next), 'Place saved. Reopen the same text to resume. This replaces your previous saved place.', next);
  }, { signal });
  clear.addEventListener('click', () => { if (!busy) act(() => store.clear(), 'Saved place deleted.', null); }, { signal });
  resume.addEventListener('click', () => { if (!busy && saved?.fingerprint === fingerprint) { seek(saved.index); update('Resumed your saved place. Reading is paused.'); } }, { signal });
  if (store.temporary) { update('Private session: saved places are unavailable.'); return; }
  update('One saved place per browser. Nothing saved until you choose Save place.');
  Promise.all([textFingerprint(tokens), store.load()]).then(([key, result]) => {
    if (signal.aborted) return;
    fingerprint = key; if (!generation) saved = result.ok ? result.value : null;
    update(saved?.fingerprint === key ? 'A saved place is available for this text.' : 'Save a fingerprint and position only—not text, title, or URL. Replaces the previous bookmark.');
  }).catch(() => update('Saved places are unavailable in this browser.'));
}
