import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreferencesStore, normalizePreferences, DEFAULT_PREFERENCES, PREFERENCES_KEY } from '../src/preferences.js';

test('preferences whitelist and normalize damaged input without storing document data', () => {
  assert.deepEqual(normalizePreferences(null), DEFAULT_PREFERENCES);
  assert.deepEqual(normalizePreferences({ minSpeed: 600, maxSpeed: 100, speed: Infinity, scrollMode: 'bogus', theme: 'dark', text: 'private', position: 17 }),
    { minSpeed: 600, maxSpeed: 600, speed: 600, scrollMode: 'direct', theme: 'dark' });
});
test('web storage persists settings and clears only its own key', async () => {
  const values = new Map([['unrelated', 'keep']]);
  const scope = { localStorage: { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) } };
  const store = createPreferencesStore(scope);
  await store.save({ ...DEFAULT_PREFERENCES, speed: 550, text: 'secret' });
  assert.equal((await createPreferencesStore(scope).load()).value.speed, 550);
  assert.ok(!values.get(PREFERENCES_KEY).includes('secret'));
  await store.clear();
  assert.equal(values.size, 1);
  assert.equal(values.get('unrelated'), 'keep');
});
test('extension storage never accesses a visited website storage; writes serialize before clear', async () => {
  const calls = []; let data;
  const store = createPreferencesStore({ browser: { runtime: { id: 'flickleaf' }, storage: { local: {
    get: async () => ({ [PREFERENCES_KEY]: data }),
    set: async value => { await new Promise(resolve => setTimeout(resolve, 5)); calls.push('set'); data = value[PREFERENCES_KEY]; },
    remove: async key => { assert.equal(key, PREFERENCES_KEY); calls.push('remove'); data = undefined; },
  } } }, get localStorage() { throw new Error('Must not use page storage'); } });
  const saved = store.save({ speed: 700 });
  const cleared = store.clear();
  assert.equal((await saved).ok, true); assert.equal((await cleared).ok, true);
  assert.deepEqual(calls, ['set', 'remove']);
  assert.deepEqual((await store.load()).value, DEFAULT_PREFERENCES);
});
test('denied storage and malformed JSON fail gracefully and can recover', async () => {
  let value = '{bad';
  const store = createPreferencesStore({ localStorage: { getItem: () => value, setItem: () => { throw new Error('quota'); }, removeItem: () => { value = null; } } });
  assert.equal((await store.load()).ok, false);
  assert.equal((await store.save(DEFAULT_PREFERENCES)).ok, false);
  assert.equal((await store.clear()).ok, true);
  assert.equal((await store.load()).ok, true);
  assert.equal((await createPreferencesStore({ chrome: { runtime: { id: 'no-permission' } } }).save(DEFAULT_PREFERENCES)).ok, false);
});
test('private extension sessions do not write or erase saved preferences', async () => {
  const store = createPreferencesStore({ browser: { runtime: { id: 'private' }, extension: { inIncognitoContext: true }, storage: { local: {
    get: async () => ({ [PREFERENCES_KEY]: { speed: 400 } }), set: () => assert.fail('private write'), remove: () => assert.fail('private erase'),
  } } } });
  assert.equal((await store.load()).value.speed, 400);
  assert.equal((await store.save(DEFAULT_PREFERENCES)).ok, false);
  assert.equal((await store.clear()).ok, false);
});
