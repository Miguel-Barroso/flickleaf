import test from 'node:test';
import assert from 'node:assert/strict';
import { pastedArticle } from '../src/pasted-text.js';
test('pasted text preserves paragraphs, joins wrapped lines and recognizes explicit headings', () => {
  const article = pastedArticle('  # A heading\r\n\r\nOne wrapped\r\nparagraph.\r\n\r\n## Another\r\nMore words.', ' Notes ');
  assert.equal(article.title, 'Notes');
  assert.equal(article.blocks.length, 4);
  assert.equal(article.blocks[1].text, 'One wrapped paragraph.');
  assert.equal(article.tokens.filter(token => token.heading).length, 2);
  assert.equal(article.tokens[0].text, 'A heading');
});
test('empty and punctuation-only corpora show a useful error', () => {
  for (const source of ['', '  \n ', '...']) assert.throws(() => pastedArticle(source), /Paste some text/);
});
