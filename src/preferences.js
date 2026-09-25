export const PREFERENCES_KEY = 'flickleaf.preferences.v1';
export const DEFAULT_PREFERENCES = Object.freeze({ speed: 300, minSpeed: 300, maxSpeed: 900, scrollMode: 'direct', theme: 'light' });

// Whitelist settings: never serialize articles, filenames, or reading positions.
export function normalizePreferences(value) {
  const source = value && typeof value === 'object' ? value : {};
  const number = (key, fallback) => Number.isFinite(source[key]) ? Math.max(50, Math.min(1500, Math.round(source[key]))) : fallback;
  const minSpeed = number('minSpeed', 300);
  const maxSpeed = Math.max(minSpeed, number('maxSpeed', 900));
  return { speed: Math.max(minSpeed, Math.min(maxSpeed, number('speed', 300))), minSpeed, maxSpeed,
    scrollMode: source.scrollMode === 'freewheel' ? 'freewheel' : 'direct', theme: source.theme === 'dark' ? 'dark' : 'light' };
}

export function createPreferencesStore(scope = globalThis) {
  // Content scripts must use extension storage, never a visited site's storage.
  const extension = scope.browser?.runtime?.id ? scope.browser : scope.chrome?.runtime?.id ? scope.chrome : null;
  const temporary = Boolean(extension?.extension?.inIncognitoContext);
  let queue = Promise.resolve();
  const run = task => {
    const result = queue.then(task).then(value => ({ ok: true, value }), () => ({ ok: false }));
    queue = result;
    return result;
  };
  return {
    temporary,
    load: () => run(async () => {
      const value = extension ? (await extension.storage.local.get(PREFERENCES_KEY))[PREFERENCES_KEY]
        : JSON.parse(scope.localStorage.getItem(PREFERENCES_KEY) || 'null');
      return normalizePreferences(value);
    }),
    save: value => run(async () => {
      if (temporary) throw new Error("Private session preferences are temporary");
      const clean = normalizePreferences(value);
      if (extension) await extension.storage.local.set({ [PREFERENCES_KEY]: clean });
      else scope.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(clean));
    }),
    clear: () => run(async () => {
      if (temporary) throw new Error("Private session preferences are temporary");
      if (extension) await extension.storage.local.remove(PREFERENCES_KEY);
      else scope.localStorage.removeItem(PREFERENCES_KEY);
    }),
  };
}
