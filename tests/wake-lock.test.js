import test from 'node:test';
import assert from 'node:assert/strict';
import { AutoplayWakeLock } from '../src/wake-lock.js';
const settle = () => new Promise(resolve => setImmediate(resolve));
function sentinel() {
  const lock = new EventTarget(); lock.released = false; lock.calls = 0;
  lock.release = async () => { lock.calls++; lock.released = true; lock.dispatchEvent(new Event('release')); };
  return lock;
}
test('autoplay holds one screen lock and releases it when stopped', async () => {
  const lock = sentinel(); let calls = 0;
  const controller = new AutoplayWakeLock({ request: async type => { assert.equal(type, 'screen'); calls++; return lock; } });
  controller.setActive(true); await settle();
  for (let i = 0; i < 100; i++) controller.setActive(true);
  assert.equal(calls, 1); assert.equal(controller.status, 'active');
  controller.setActive(false); await settle();
  assert.equal(lock.calls, 1); assert.equal(controller.status, 'idle');
});
test('a delayed lock is released after closing, including rapid restart races', async () => {
  const pending = []; const controller = new AutoplayWakeLock({ request: () => new Promise(resolve => pending.push(resolve)) });
  controller.setActive(true); await settle(); controller.setActive(false); controller.setActive(true); await settle();
  const old = sentinel(), current = sentinel(); pending[1](current); await settle(); pending[0](old); await settle();
  assert.equal(old.calls, 1); assert.equal(current.calls, 0); assert.equal(controller.lock, current);
  controller.dispose(); await settle(); assert.equal(current.calls, 1);
  controller.setActive(true); await settle(); assert.equal(pending.length, 2);
});
test('denial or browser revocation never causes a retry loop; next autoplay retries', async () => {
  let calls = 0; const lock = sentinel();
  const controller = new AutoplayWakeLock({ request: async () => { if (++calls === 1) throw Error('denied'); return lock; } });
  controller.setActive(true); await settle(); controller.setActive(true); await settle();
  assert.equal(calls, 1); assert.equal(controller.status, 'unavailable');
  controller.setActive(false); controller.setActive(true); await settle();
  await lock.release(); controller.setActive(true); await settle();
  assert.equal(calls, 2); assert.equal(controller.status, 'unavailable');
  controller.dispose();
});
test('missing API and stop before request are harmless', async () => {
  const unavailable = new AutoplayWakeLock({}); unavailable.setActive(true); assert.equal(unavailable.status, 'unavailable');
  let calls = 0; const controller = new AutoplayWakeLock({ request: async () => { calls++; return sentinel(); } });
  controller.setActive(true); controller.dispose(); await settle(); assert.equal(calls, 0);
});
