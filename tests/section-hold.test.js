import test from 'node:test';
import assert from 'node:assert/strict';
import { Playback } from '../src/core.js';

const make = (headings = [2, 7]) => new Playback(Array.from({ length: 12 }, (_, index) => ({
  text: `Token ${index}`, weight: headings.includes(index) ? 5 : 1, heading: headings.includes(index),
})));
const run = (engine, ms) => { for (let time = 0; time < ms; time += 10) engine.tick(10); };
const held = engine => {
  assert.equal(engine.holding, true);
  assert.equal(engine.mode, 'paused');
  assert.equal(engine.velocity, 0);
  assert.equal(engine.elapsed, 0);
};

test('section holds are opt-in; default playback keeps timed headings', () => {
  const engine = make();
  assert.equal(engine.holdAtSections, false);
  engine.play(); run(engine, 500);
  assert.equal(engine.index, 2); assert.equal(engine.holding, false);
  run(engine, 1000); assert.ok(engine.index > 2);
});

test('autoplay holds indefinitely and Play leaves immediately, then holds at the next section', () => {
  const engine = make(); engine.setHoldAtSections(true);
  engine.play(); run(engine, 60000);
  assert.equal(engine.index, 2); held(engine);
  engine.toggle(); assert.equal(engine.index, 3); assert.equal(engine.mode, 'play');
  run(engine, 60000); assert.equal(engine.index, 7); held(engine);
});

for (const mode of ['direct', 'freewheel']) {
  test(`${mode} loses momentum at a heading and a fresh scroll leaves it immediately`, () => {
    const engine = make(); engine.setScrollMode(mode); engine.setHoldAtSections(true);
    engine.impulse(240); run(engine, 60000);
    assert.equal(engine.index, 2); held(engine);
    for (const invalid of [0, NaN, Infinity]) engine.impulse(invalid);
    held(engine);
    engine.impulse(40);
    assert.equal(engine.index, 3); assert.equal(engine.holding, false); assert.equal(engine.mode, 'scrub');
  });
  test(`${mode} can scroll backwards out of a hold and does not hold on reverse arrivals`, () => {
    const engine = make(); engine.setScrollMode(mode); engine.setHoldAtSections(true);
    engine.play(); run(engine, 500); held(engine);
    engine.impulse(-40); assert.equal(engine.index, 1); assert.equal(engine.holding, false);
    engine.seek(3); engine.impulse(-240); run(engine, 100);
    assert.equal(engine.index, 2); assert.equal(engine.holding, false);
  });
}

test('large stepped input stops at the first heading and discards overshoot', () => {
  const engine = make([1, 2]); engine.setScrollMode('stepped'); engine.setHoldAtSections(true);
  engine.impulse(240); assert.equal(engine.index, 1); held(engine);
  run(engine, 60000); assert.equal(engine.index, 1);
  engine.impulse(240); assert.equal(engine.index, 2); held(engine);
  engine.impulse(100); assert.equal(engine.index, 3); assert.equal(engine.holding, false);
  run(engine, 5000); assert.equal(engine.index, 3);
});

test('fine stepped input accumulates while holding without releasing early', () => {
  const engine = make(); engine.setScrollMode('stepped'); engine.setHoldAtSections(true);
  engine.impulse(240); held(engine);
  for (let i = 0; i < 8; i++) { engine.impulse(10); run(engine, 100); held(engine); }
  engine.impulse(10); assert.equal(engine.index, 3); assert.equal(engine.holding, false);
  engine.seek(1); engine.impulse(100); held(engine);
  engine.impulse(30); engine.impulse(-30); engine.impulse(-30); held(engine);
  engine.impulse(-30); assert.equal(engine.index, 1); assert.equal(engine.holding, false);
});

test('Play stops at adjacent headings, handles a final heading, and replays normally', () => {
  const engine = make([1, 2, 11]); engine.setHoldAtSections(true);
  engine.play(); run(engine, 500); assert.equal(engine.index, 1); held(engine);
  engine.play(); assert.equal(engine.index, 2); held(engine);
  engine.play(); assert.equal(engine.index, 3);
  run(engine, 60000); assert.equal(engine.index, 11); held(engine);
  engine.play(); assert.equal(engine.index, 0); assert.equal(engine.mode, 'play');
});

test('explicit pause, seeking, mode changes, and disabling cancel a hold without starting playback', () => {
  for (const action of [engine => engine.pause(), engine => engine.seek(2), engine => engine.setScrollMode('stepped'), engine => engine.setHoldAtSections(false)]) {
    const engine = make(); engine.setHoldAtSections(true); engine.play(); run(engine, 500); held(engine);
    action(engine); assert.equal(engine.holding, false); assert.equal(engine.mode, 'paused');
    run(engine, 5000); assert.equal(engine.index, 2);
  }
});

test('changing pace preserves a hold and returning to a section can hold again', () => {
  const engine = make(); engine.setHoldAtSections(true); engine.play(); run(engine, 500); held(engine);
  engine.setSpeed(700); engine.setLimits(400, 800); held(engine);
  engine.seek(1); engine.play(); run(engine, 500); assert.equal(engine.index, 2); held(engine);
});

test('empty articles and articles without headings behave normally with holds enabled', () => {
  const empty = new Playback([]); empty.setHoldAtSections(true); empty.play(); empty.impulse(40); run(empty, 1000);
  assert.equal(empty.index, 0); assert.equal(empty.holding, false);
  const engine = make([]); engine.setHoldAtSections(true); engine.play(); run(engine, 60000);
  assert.equal(engine.index, 11); assert.equal(engine.mode, 'paused'); assert.equal(engine.holding, false);
});
