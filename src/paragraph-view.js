// Keep long documents bounded while retaining exact positions in shared tokens.
export function passageWindow(tokens, index) {
  let start = Math.max(0, index - 200), end = Math.min(tokens.length, start + 600);
  if (end === tokens.length) start = Math.max(0, end - 600);
  // Prefer complete paragraphs when the window edge is outside the current one.
  while (start < index && tokens[start].paragraph !== tokens[index].paragraph && start > 0 && tokens[start - 1].paragraph === tokens[start].paragraph) start++;
  while (end > index + 1 && end < tokens.length && tokens[end - 1].paragraph !== tokens[index].paragraph && tokens[end - 1].paragraph === tokens[end].paragraph) end--;
  return { start, end };
}

export function setupParagraphView(article, pane, seek, signal) {
  const content = pane.querySelector('.paragraph-content');
  const previous = pane.querySelector('#earlier-passage'), next = pane.querySelector('#later-passage');
  let bounds = { start: -1, end: -1 }, last = -1, active = null;
  const spans = new Map();
  previous.addEventListener('click', () => seek(Math.max(0, bounds.start - 1)), { signal });
  next.addEventListener('click', () => seek(Math.min(article.tokens.length - 1, bounds.end)), { signal });
  content.addEventListener('click', event => {
    const target = event.target.closest('[data-token]');
    if (target && !pane.ownerDocument.getSelection()?.toString()) { seek(Number(target.dataset.token)); pane.focus({ preventScroll: true }); }
  }, { signal });
  function render(index, center = false) {
    if (index < bounds.start || index >= bounds.end) {
      bounds = passageWindow(article.tokens, index); spans.clear(); content.replaceChildren();
      let block = null, paragraph = -1, text = '', cursor = 0;
      const finish = () => { if (block && cursor < text.length) block.append(document.createTextNode(text.slice(cursor))); };
      for (let i = bounds.start; i < bounds.end; i++) {
        const token = article.tokens[i];
        if (token.paragraph !== paragraph) {
          finish(); paragraph = token.paragraph;
          text = article.blocks?.[paragraph]?.text.replace(/\s+/gu, ' ').trim() || '';
          block = document.createElement(token.heading ? `h${Math.min(6, Math.max(2, token.level || 2))}` : 'p');
          content.append(block);
          cursor = i === bounds.start && i > 0 && article.tokens[i - 1].paragraph === paragraph ? token.start || 0 : 0;
          if (cursor) block.append(document.createTextNode('… '));
        }
        const span = document.createElement('span'); span.dataset.token = String(i);
        if (text && Number.isInteger(token.start) && Number.isInteger(token.end)) {
          block.append(document.createTextNode(text.slice(cursor, token.start)));
          span.textContent = text.slice(token.start, token.end); cursor = token.end;
        } else { span.textContent = token.text; block.append(document.createTextNode(i > bounds.start ? ' ' : '')); }
        block.append(span); spans.set(i, span);
        if (i === bounds.end - 1 && i < article.tokens.length - 1 && article.tokens[i + 1].paragraph === paragraph) {
          block.append(document.createTextNode(' …')); text = ''; cursor = 0;
        }
      }
      finish(); previous.disabled = bounds.start === 0; next.disabled = bounds.end === article.tokens.length;
      center = true;
    }
    if (last !== index || center) {
      active?.classList.remove('current-word'); active?.removeAttribute('aria-current');
      active = spans.get(index); active?.classList.add('current-word'); active?.setAttribute('aria-current', 'location'); last = index;
      if (active) {
        const rect = active.getBoundingClientRect(), box = pane.getBoundingClientRect();
        if (center || rect.top < box.top + 40 || rect.bottom > box.bottom - 40) pane.scrollTop += rect.top - box.top - pane.clientHeight / 2;
      }
    }
  }
  return { render };
}
