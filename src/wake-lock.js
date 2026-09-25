// One request per autoplay transition. Never retry a denial every animation frame.
export class AutoplayWakeLock {
  constructor(api = globalThis.navigator?.wakeLock) {
    this.api = api; this.wanted = false; this.generation = 0;
    this.lock = null; this.status = 'idle'; this.disposed = false;
  }
  release(lock) { if (lock) Promise.resolve(lock.release()).catch(() => {}); }
  setActive(active) {
    active = Boolean(active) && !this.disposed;
    if (active === this.wanted) return;
    this.wanted = active;
    const generation = ++this.generation;
    this.release(this.lock); this.lock = null;
    this.status = active ? 'pending' : 'idle';
    if (!active) return;
    if (!this.api?.request) { this.status = 'unavailable'; return; }
    Promise.resolve().then(() => {
      if (generation !== this.generation || !this.wanted) return null;
      return this.api.request('screen');
    }).then(lock => {
      if (!lock) return;
      if (generation !== this.generation || !this.wanted) { this.release(lock); return; }
      if (lock.released) { this.status = 'unavailable'; return; }
      this.lock = lock; this.status = 'active';
      lock.addEventListener('release', () => {
        if (this.lock !== lock) return;
        this.lock = null; this.status = this.wanted ? 'unavailable' : 'idle';
      }, { once: true });
    }).catch(() => {
      if (generation === this.generation) this.status = 'unavailable';
    });
  }
  dispose() { this.disposed = true; this.setActive(false); }
}
