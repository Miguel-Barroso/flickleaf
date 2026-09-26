import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenize } from '../src/core.js';
import { passageWindow } from '../src/paragraph-view.js';
test('source ranges retain punctuation, spaces, Unicode and heading positions', () => {
  for (const text of ['Hello — world. A (quiet) place.', '“Read this,” she said. Well-being matters.', '日本語の文章。次の文です。', '<script>alert(1)</script> is text.']) {
    const tokens = tokenize([{ text }]);
    let cursor = 0, reconstructed = '';
    for (const token of tokens) {
      assert.ok(token.start >= cursor); assert.ok(token.end > token.start);
      reconstructed += text.slice(cursor, token.start) + text.slice(token.start, token.end); cursor = token.end;
    }
    reconstructed += text.slice(cursor); assert.equal(reconstructed, text);
  }
  const heading=tokenize([{text:'A complete title',heading:true}])[0];
  assert.equal(heading.start,0);assert.equal(heading.end,16);
});
test('paragraph windows stay bounded and include the exact current token', () => {
  for (const blocks of [[{text:'word '.repeat(2000)}],Array.from({length:200},(_,i)=>({text:`Paragraph ${i} has several words.`}))]) {
    const tokens=tokenize(blocks);
    for(let index=0;index<tokens.length;index+=17){const {start,end}=passageWindow(tokens,index);assert.ok(start<=index && end>index);assert.ok(end-start<=600);assert.ok(start>=0 && end<=tokens.length);}
  }
});
