import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanupPDFPages, formatPDFPages, pdfLines } from '../src/pdf-cleanup.js';
const line = (text, y) => ({ text, y });
const pages = Array.from({ length: 4 }, (_, i) => ({ number: i + 1, lines: [line('Field notes', .06), line(`Body passage ${i + 1}.`, .3), line('under-', .4), line('standing matters.', .42), line(`Page ${i + 1} of 4`, .95)] }));

test('cleanup removes repeated margins and page numbers while preserving page navigation and original', () => {
  const original = structuredClone(pages);
  const result = cleanupPDFPages(pages);
  assert.equal(result.changes.headers, 4); assert.equal(result.changes.numbers, 4);
  assert.equal(result.changes.hyphens, 0); assert.ok(result.text.includes('under-\nstanding'));
  assert.ok(result.text.includes('# Page 4')); assert.ok(!result.text.includes('Field notes'));
  assert.deepEqual(pages, original);
});
test('hyphen joining is opt-in, stays within nearby lines and never crosses pages', () => {
  const result = cleanupPDFPages(pages, { hyphens: true });
  assert.equal(result.changes.hyphens, 4); assert.ok(result.text.includes('understanding matters.'));
  const separate = [{number:1,lines:[line('under-',.4)]},{number:2,lines:[line('standing',.41)]}];
  assert.equal(cleanupPDFPages(separate,{hyphens:true}).changes.hyphens,0);
  for (const [left,right,y] of [['well-','Known',.42],['chapter-','2',.42],['long-','distance',.6]]) {
    assert.equal(cleanupPDFPages([{number:1,lines:[line(left,.4),line(right,y)]}],{hyphens:true}).changes.hyphens,0);
  }
});
test('cleanup protects body numbers, nonrepeating headings, short documents, and text-only margin pages', () => {
  const repeatedBody = pages.map(page => ({...page,lines:[line('Field notes',.4),line('2026',.5)]}));
  assert.equal(cleanupPDFPages(repeatedBody).changed,false);
  assert.equal(cleanupPDFPages(pages.slice(0,2),{numbers:false}).changes.headers,0);
  const unique = pages.map(page => ({...page,lines:[line(`Chapter ${page.number}`, .06),line('Body.',.4)]}));
  assert.equal(cleanupPDFPages(unique).changed,false);
  const onlyMargins = pages.map(page => ({...page,lines:[line('Only text',.06),line('42',.95)]}));
  const safe = cleanupPDFPages(onlyMargins);
  assert.equal(safe.changed,false); assert.equal(safe.changes.headers,0);assert.equal(safe.changes.numbers,0);
});
test('missing positions and disabling cleanup preserve extraction', () => {
  assert.equal(cleanupPDFPages(pages,{headers:false,numbers:false,hyphens:false}).text,formatPDFPages(pages));
  const unknown = pages.map(page => ({...page,lines:page.lines.map(item=>({...item,y:null}))}));
  assert.equal(cleanupPDFPages(unknown,{hyphens:true}).changed,false);
});
test('PDF extraction uses viewport coordinates and retains EOL boundaries', () => {
  const content={items:[{str:'Hello',transform:[1,0,0,1,10,740]},{str:'world',transform:[1,0,0,1,50,740],hasEOL:true},{str:'Body',transform:[1,0,0,1,10,400],hasEOL:true}]};
  const lines=pdfLines(content,{height:800,convertToViewportPoint:(x,y)=>[x,800-y]});
  assert.deepEqual(lines,[line('Hello world',.075),line('Body',.5)]);
});
