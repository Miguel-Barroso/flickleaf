import { tokenize } from './core.js';

export function pastedArticle(source, title = '') {
  const blocks = [];
  let paragraph = [];
  const flush = () => {
    if (paragraph.length) blocks.push({ text: paragraph.join(' '), heading: false });
    paragraph = [];
  };
  for (const line of source.replace(/\r\n?/g, '\n').split('\n')) {
    const heading = line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/u);
    if (heading) { flush(); blocks.push({ text: heading[2], heading: true, level: heading[1].length }); }
    else if (!line.trim()) flush();
    else paragraph.push(line.trim());
  }
  flush();
  const tokens = tokenize(blocks);
  if (!tokens.length) throw new Error('Paste some text with words to begin.');
  return { title: title.trim() || 'Your pasted text', blocks, tokens };
}
