import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Playback, tokenize } from '../src/core.js';
import { extract, cleanNavigation, collectBlocks } from '../src/extract.js';
import { JSDOM } from 'jsdom';

const plain = () => Array.from({ length: 100 }, (_, index) => ({ text: String(index), weight: 1 }));
const run = (engine, ms, step = 10) => { for (let i = 0; i < ms; i += step) engine.tick(step); };
test('reading caps apply to both wheel directions and hands-off playback', () => {
  const engine = new Playback(plain()); engine.seek(50);
  engine.impulse(1); assert.equal(engine.readingVelocity, 300);
  engine.impulse(240); assert.equal(engine.readingVelocity, 900);
  engine.pause(); engine.impulse(-240); assert.equal(engine.readingVelocity, -900);
  engine.setLimits(400, 600); assert.equal(engine.readingVelocity, -600);
  engine.pause(); engine.setSpeed(1200); engine.play(); assert.equal(engine.readingVelocity, 600);
  engine.setLimits(300, 450); assert.equal(engine.readingVelocity, 450);
  engine.setSpeed(10); assert.equal(engine.readingVelocity, 300);
  engine.pause(); assert.equal(engine.readingVelocity, 0);
});
test('freewheel holds the minimum pace then stops, without crawling below it', () => {
  const engine = new Playback(Array.from({length: 1000}, () => ({text:'word',weight:1})));
  engine.setScrollMode('freewheel'); engine.impulse(100);
  let hitFloor = false;
  for (let i = 0; i < 3000; i++) {
    engine.tick(10);
    if (engine.mode === 'paused') break;
    assert.ok(engine.readingVelocity >= 300 && engine.readingVelocity <= 900);
    if (engine.readingVelocity === 300) hitFloor = true;
  }
  assert.ok(hitFloor); assert.equal(engine.mode, 'paused');
});
test('invalid speed limits cannot corrupt playback', () => {
  const engine = new Playback(plain()); engine.setLimits(NaN, 800);
  assert.equal(engine.minSpeed, 300); assert.equal(engine.maxSpeed, 900);
  engine.setLimits(-20, 9000); assert.equal(engine.minSpeed, 50); assert.equal(engine.maxSpeed, 1500);
  engine.setLimits(800, 400); assert.equal(engine.minSpeed, 800); assert.equal(engine.maxSpeed, 800);
});
test('freewheel carries one flick much farther and eventually stops', () => {
  const direct = new Playback(plain()); const freewheel = new Playback(plain());
  freewheel.setScrollMode('freewheel'); freewheel.setLimits(50, 900); direct.setLimits(50, 900);
  direct.impulse(100); freewheel.impulse(100);
  run(direct, 5000); run(freewheel, 5000);
  assert.equal(direct.mode, 'paused'); assert.equal(freewheel.mode, 'scrub');
  assert.ok(freewheel.index > direct.index * 5);
  assert.ok(freewheel.velocity > 200 && freewheel.velocity < 600);
  run(freewheel, 25000); assert.equal(freewheel.mode, 'paused');
  assert.ok(freewheel.index < 99, 'friction stops playback before the article boundary');
});

test('freewheel accelerates with repeated input, brakes, reverses, and respects limits', () => {
  const engine = new Playback(plain()); engine.seek(50); engine.setScrollMode('freewheel');
  engine.impulse(100); run(engine, 100); const first = engine.velocity;
  engine.impulse(100); assert.ok(engine.velocity > first);
  const fast = engine.velocity; engine.impulse(-50); assert.ok(engine.velocity > 0 && engine.velocity < fast);
  engine.impulse(-200); assert.ok(engine.velocity < 0);
  const index = engine.index; run(engine, 500); assert.ok(engine.index < index);
  for (let i = 0; i < 10; i++) engine.impulse(-240);
  assert.equal(engine.velocity, -900);
  engine.toggle(); const stopped = engine.index; run(engine, 5000);
  assert.equal(engine.index, stopped); assert.equal(engine.velocity, 0);
});

test('switching scroll modes clears momentum and leaves the original feel intact', () => {
  const engine = new Playback(plain()); engine.setScrollMode('freewheel'); engine.impulse(200);
  engine.setScrollMode('direct'); run(engine, 1000); assert.equal(engine.index, 0);
  engine.impulse(100); assert.equal(engine.velocity, 400);
  run(engine, 2500); assert.equal(engine.mode, 'paused');
  engine.setScrollMode('unknown'); assert.equal(engine.scrollMode, 'direct');
});
test('constant playback is independent of frame rate', () => {
  for (const step of [5, 10, 20, 40]) { const engine = new Playback(plain()); engine.play(); run(engine, 2000, step); assert.equal(engine.index, 10); }
});
test('pause and seek clear momentum; speed stays bounded', () => {
  const engine = new Playback(plain()); engine.impulse(200); engine.seek(30); run(engine, 1000); assert.equal(engine.index, 30);
  engine.setSpeed(9999); assert.equal(engine.speed, 900); engine.setSpeed(-10); assert.equal(engine.speed, 300);
});
test('scroll advances then settles and reverse scroll rewinds', () => {
  const engine = new Playback(plain()); engine.seek(50); engine.impulse(200); run(engine, 2500); assert.ok(engine.index > 50); assert.equal(engine.mode, 'paused');
  const before = engine.index; engine.impulse(-200); run(engine, 2500); assert.ok(engine.index < before); assert.equal(engine.mode, 'paused');
});
test('boundaries stop playback and replay starts over', () => {
  const engine = new Playback(plain()); engine.seek(99); engine.impulse(100); run(engine, 1000); assert.equal(engine.index, 99); assert.equal(engine.mode, 'paused'); engine.play(); assert.equal(engine.index, 0);
  engine.pause(); engine.impulse(-100); run(engine, 1000); assert.equal(engine.index, 0);
});
test('a stalled frame cannot skip seconds of text', () => {
  const engine = new Playback(plain()); engine.play(); engine.tick(10000); assert.equal(engine.index, 0);
});
test('punctuation and paragraph boundaries receive more time', () => {
  const tokens = tokenize([{ text: 'Hello, world. This is quiet.' }]);
  assert.equal(tokens[0].text, 'Hello,'); assert.ok(tokens[0].weight > tokens[2].weight); assert.ok(tokens.at(-1).weight > tokens[1].weight);
});
test('Unicode segmentation supports Japanese and invalid language fallback', () => {
  assert.ok(tokenize([{ text: '日本語を読みます。' }], 'ja').length > 1);
  assert.equal(tokenize([{ text: 'hello world' }], 'invalid_locale').length, 2);
});
test('empty input is inert', () => { const engine = new Playback([]); engine.play(); engine.impulse(300); engine.tick(50); assert.equal(engine.mode, 'paused'); });
test('article extraction preserves source DOM and excludes navigation', () => {
  const paragraph = 'Reading invites us to notice the world around us. Each sentence offers a chance to pause, think, and explore a new idea. '.repeat(8);
  const dom = new JSDOM(`<html lang="en"><title>A quiet moment</title><nav>UNWANTED NAVIGATION</nav><article><h1>A quiet moment</h1><p>${paragraph}</p><h2>Next chapter</h2><p>${paragraph}</p></article></html>`, { url: 'https://example.com/article' });
  const before = dom.window.document.documentElement.outerHTML; const result = extract(dom.window.document);
  assert.ok(result.tokens.length > 100); assert.ok(!result.tokens.some(t => t.text === 'UNWANTED')); assert.equal(dom.window.document.documentElement.outerHTML, before);
});
test('selected text takes priority over article extraction', () => {
  const dom = new JSDOM('<p>Selected passage only.</p>'); const range = dom.window.document.createRange(); range.selectNodeContents(dom.window.document.querySelector('p')); dom.window.getSelection().addRange(range);
  assert.equal(extract(dom.window.document).title, 'Selected text');
});

test('headings stay intact with a section boundary and proportional reading time', () => {
  const tokens = tokenize([{ text: 'Some prose.' }, { text: 'A new section to explore', heading: true, level: 2 }, { text: 'Next sentence.' }]);
  assert.equal(tokens[2].text, 'A new section to explore');
  assert.equal(tokens[2].wordCount, 5);
  assert.equal(tokens[2].weight, 7);
  assert.equal(tokens[1].weight, 4);
  assert.equal(tokens[3].text, 'Next');
  const engine = new Playback(tokens); engine.seek(2); engine.play();
  run(engine, 1200); assert.equal(engine.index, 2);
  run(engine, 220); assert.equal(engine.index, 3);
  engine.seek(3); engine.impulse(-240); run(engine, 150); assert.equal(engine.index, 2);
  engine.seek(3); assert.equal(engine.tokens[engine.index].text, 'Next');
});

test('navigation cleanup removes contents and forms but keeps linked prose and useful lists', () => {
  const dom = new JSDOM(`<nav>Home Work About</nav><main>
    <div><strong>On this page</strong><ul><li><a href="#first">First section</a></li><li><a href="#second">Second section</a></li></ul></div>
    <h2 id="first">First section</h2><p>Read <a href="#second">the second section</a> for details.</p>
    <ul><li><a href="https://example.org">A useful reference</a></li><li>A plain item</li></ul>
    <section id="second"><h2>Second section</h2><p>More prose.</p></section>
    <p><a class="site-cta" href="#second">Jump to contact</a></p>
    <div><p>Keep this paragraph.</p><a class="site-cta" href="#second">Standalone action</a></div>
    <p>Also keep <a class="site-cta" href="#second">this inline link</a> in its sentence.</p>
    <form><label>Full name<input></label><button>Send</button></form><p hidden>Hidden noise</p>
    </main>`, { url: 'https://example.com/' });
  const doc = dom.window.document; cleanNavigation(doc, doc.URL);
  const text = doc.body.textContent;
  assert.ok(!/Home Work|On this page|Full name|Hidden noise|Jump to contact|Standalone action/.test(text));
  assert.ok(text.includes('Also keep this inline link in its sentence.'));
  assert.equal(doc.querySelectorAll('ul').length, 1);
  assert.ok(text.includes('Read the second section for details.'));
  assert.ok(text.includes('A useful reference'));
});

test('nested card and list content is preserved in order without duplication', () => {
  const dom = new JSDOM('<main><ul><li>Introduction <strong>with emphasis</strong><h3>Card heading</h3><p>Description.</p>Afterwards<ul><li>Nested item</li></ul>Closing words</li></ul></main>');
  const blocks = collectBlocks(dom.window.document.querySelector('main'));
  assert.deepEqual(blocks.map(b => b.text.trim()), ['Introduction with emphasis', 'Card heading', 'Description.', 'Afterwards', 'Nested item', 'Closing words']);
  assert.equal(blocks[1].level, 3);
});
