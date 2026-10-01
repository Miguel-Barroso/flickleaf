export const POSITION_KEY = 'flickleaf.position.v1';
// Version the token representation so future tokenization changes cannot mis-seek.
export async function textFingerprint(tokens, crypto = globalThis.crypto) {
  const bytes = new TextEncoder().encode(JSON.stringify(tokens.map(t => [t.text, Boolean(t.heading), t.level || 0])));
  // Web Crypto is missing on insecure (http:) pages, including extension content
  // scripts there. The fallback yields the same digest, so bookmarks still match.
  const digest = crypto?.subtle ? new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)) : sha256(bytes);
  return Array.from(digest, b => b.toString(16).padStart(2, '0')).join('');
}
// SHA-256 round constants: fractional cube roots of the first 64 primes (FIPS 180-4).
const K = Uint32Array.from({ length: 64 }, (_, i) => {
  let n = 2, found = -1;
  for (;; n++) if (![...Array(n).keys()].slice(2).some(d => n % d === 0) && ++found === i) break;
  return (Math.cbrt(n) % 1) * 2 ** 32;
});
export function sha256(bytes) {
  const length = bytes.length, blocks = Math.ceil((length + 9) / 64), data = new Uint8Array(blocks * 64);
  data.set(bytes); data[length] = 0x80;
  const view = new DataView(data.buffer);
  view.setUint32(data.length - 8, Math.floor(length / 2 ** 29)); view.setUint32(data.length - 4, length * 8);
  const hash = Uint32Array.of(0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19);
  const w = new Uint32Array(64), rotate = (x, n) => (x >>> n) | (x << (32 - n));
  for (let offset = 0; offset < data.length; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4);
    for (let i = 16; i < 64; i++) {
      const a = w[i - 15], b = w[i - 2];
      w[i] = w[i - 16] + (rotate(a, 7) ^ rotate(a, 18) ^ (a >>> 3)) + w[i - 7] + (rotate(b, 17) ^ rotate(b, 19) ^ (b >>> 10));
    }
    let [a, b, c, d, e, f, g, h] = hash;
    for (let i = 0; i < 64; i++) {
      const t1 = h + (rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i];
      const t2 = (rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22)) + ((a & b) ^ (a & c) ^ (b & c));
      [h, g, f, e, d, c, b, a] = [g, f, e, (d + t1) | 0, c, b, a, (t1 + t2) | 0];
    }
    [a, b, c, d, e, f, g, h].forEach((value, i) => { hash[i] += value; });
  }
  const out = new Uint8Array(32), result = new DataView(out.buffer);
  hash.forEach((value, i) => result.setUint32(i * 4, value));
  return out;
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
