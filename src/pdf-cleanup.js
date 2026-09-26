// Conservative suggestions only: callers must preview and explicitly apply them.
export function pdfLines(content, viewport) {
  const lines = []; let text = '', positions = [];
  const flush = () => {
    if (text.trim()) lines.push({ text: text.trim(), y: positions.length ? positions.reduce((a, b) => a + b, 0) / positions.length : null });
    text = ''; positions = [];
  };
  for (const item of content.items) {
    if (typeof item.str !== 'string') continue;
    text += item.str + ' ';
    if (item.str.trim() && item.transform?.length === 6 && viewport.height > 0) {
      const [, y] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
      if (Number.isFinite(y)) positions.push(y / viewport.height);
    }
    if (item.hasEOL) flush();
  }
  flush(); return lines;
}

export function formatPDFPages(pages) {
  return pages.filter(page => page.lines.some(line => /[\p{L}\p{N}]/u.test(line.text)))
    .map(page => `# Page ${page.number}\n\n${page.lines.map(line => line.text).join('\n')}`).join('\n\n');
}
const key = text => text.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
const pageNumber = text => /^(?:page\s+)?\d{1,4}(?:\s*(?:of|\/)\s*\d{1,4})?$/i.test(text.trim());
function margin(line, index, lines) {
  if (line.y === null || !Number.isFinite(line.y)) return null;
  if (index < 2 && line.y <= .12) return 'top';
  if (index >= lines.length - 2 && line.y >= .88) return 'bottom';
  return null;
}

export function cleanupPDFPages(pages, { headers = true, numbers = true, hyphens = false } = {}) {
  const repetitions = new Map();
  const readablePages = pages.filter(page => page.lines.some(line => /[\p{L}\p{N}]/u.test(line.text)));
  for (const page of readablePages) {
    const seen = new Set();
    page.lines.forEach((line, index) => {
      const edge = margin(line, index, page.lines);
      if (edge && line.text.length <= 160 && !pageNumber(line.text)) seen.add(`${edge}:${key(line.text)}`);
    });
    for (const value of seen) repetitions.set(value, (repetitions.get(value) || 0) + 1);
  }
  const threshold = Math.max(3, Math.ceil(readablePages.length * .6));
  const changes = { headers: 0, numbers: 0, hyphens: 0, examples: [] };
  const example = value => { if (changes.examples.length < 8 && !changes.examples.includes(value)) changes.examples.push(value); };
  const cleaned = pages.map(page => {
    const removed = [];
    let lines = page.lines.filter((line, index) => {
      const edge = margin(line, index, page.lines);
      if (!edge) return true;
      if (numbers && pageNumber(line.text)) { removed.push({ type: 'numbers', text: line.text }); return false; }
      if (headers && (repetitions.get(`${edge}:${key(line.text)}`) || 0) >= threshold) {
        removed.push({ type: 'headers', text: line.text }); return false;
      }
      return true;
    });
    // Never erase a page entirely just because its only text looks like a margin.
    if (!lines.some(line => /[\p{L}\p{N}]/u.test(line.text))) {
      lines = page.lines;
      return { ...page, lines };
    }
    for (const item of removed) { changes[item.type]++; example(item.text); }
    if (hyphens) {
      const joined = [];
      for (const line of lines) {
        const previous = joined.at(-1);
        // No cross-page joins, no blank-line/paragraph joins, no numbers or capitals.
        if (previous && /\p{Ll}{2,}[-\u00ad]$/u.test(previous.text) && /^\p{Ll}/u.test(line.text)
          && previous.y !== null && line.y !== null && line.y > previous.y && line.y - previous.y < .045) {
          previous.text = previous.text.slice(0, -1) + line.text;
          previous.y = line.y; changes.hyphens++;
        } else joined.push({ ...line });
      }
      lines = joined;
    }
    return { ...page, lines };
  });
  const text = formatPDFPages(cleaned);
  return { text, changes, changed: text !== formatPDFPages(pages) };
}
