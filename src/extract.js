import { Readability } from '@mozilla/readability';
import { tokenize } from './core.js';

// Work only on a clone: navigation and forms on the original page stay intact.
export function cleanNavigation(root, pageURL) {
  root.querySelectorAll('nav,[role="navigation"],[role="banner"],[role="contentinfo"],form,[role="form"],button,[role="button"],input,select,textarea,[hidden],[aria-hidden="true"],script,style,template').forEach(el => el.remove());
  for (const link of root.querySelectorAll('a[href]')) {
    const looksLikeButton = /(^|[\s_-])(cta|button|btn)(?=$|[\s_-])/i.test(link.className);
    const parent = link.parentElement;
    const standalone = parent?.textContent.trim() === link.textContent.trim() ||
      (parent?.matches('div,section,article,main') && [...parent.childNodes].every(node =>
        node === link || (node.nodeType === 3 ? !node.textContent.trim() : node.nodeType !== 1 ||
          node.matches('p,div,section,article,ul,ol,figure,hr,h1,h2,h3,h4,h5,h6'))));
    if (looksLikeButton && standalone) link.remove();
  }
  const doc = root.ownerDocument || root;
  for (const list of root.querySelectorAll('ul,ol')) {
    const links = [...list.querySelectorAll('a[href]')];
    if (links.length < 2) continue;
    const headingLinks = links.filter(link => {
      try {
        const url = new URL(link.getAttribute('href'), pageURL);
        const page = new URL(pageURL);
        if (url.origin !== page.origin || url.pathname !== page.pathname || url.search !== page.search || !url.hash) return false;
        const target = doc.getElementById(decodeURIComponent(url.hash.slice(1)));
        return target && (target.matches('h1,h2,h3,h4,h5,h6') || target.querySelector('h1,h2,h3,h4,h5,h6'));
      } catch { return false; }
    });
    const linkLength = links.reduce((sum, el) => sum + el.textContent.trim().length, 0);
    const textLength = list.textContent.replace(/\s+/gu, ' ').trim().length;
    // Only strong in-page contents matches; keep ordinary lists and linked prose.
    if (headingLinks.length < 2 || headingLinks.length / links.length < 0.8 || linkLength / Math.max(1, textLength) < 0.75) continue;
    const parent = list.parentElement;
    const label = list.previousElementSibling;
    if (label && /^(on this page|table of contents|contents)\s*:?$/iu.test(label.textContent.trim())) label.remove();
    list.remove();
    if (parent && !parent.textContent.trim()) parent.remove();
  }
}

// Preserve direct text around nested blocks. Selecting only leaf elements drops
// card labels, list introductions, and prose beside nested lists.
export function collectBlocks(root) {
  const blocks = [];
  const blockTags = /^(DIV|SECTION|ARTICLE|MAIN|HEADER|FOOTER|ASIDE|P|LI|UL|OL|BLOCKQUOTE|PRE|FIGURE|FIGCAPTION|DL|DT|DD|TABLE|THEAD|TBODY|TR|TD|TH|H[1-6])$/;
  function visit(container) {
    let pending = '';
    const flush = () => { if (pending.trim()) blocks.push({ text: pending, heading: false }); pending = ''; };
    function walk(node) {
      if (node.nodeType === 3) { pending += node.textContent; return; }
      if (node.nodeType !== 1) return;
      if (/^H[1-6]$/.test(node.tagName)) {
        flush(); blocks.push({ text: node.textContent, heading: true, level: Number(node.tagName[1]) });
      } else if (node.tagName === 'BR') pending += '\n';
      else if (blockTags.test(node.tagName)) { flush(); visit(node); }
      else for (const child of node.childNodes) walk(child);
    }
    for (const child of container.childNodes) walk(child);
    flush();
  }
  visit(root);
  return blocks.filter(block => block.text.trim());
}

export function extract(doc) {
  const selection = doc.defaultView?.getSelection()?.toString().trim();
  let title = doc.title || 'Untitled article';
  let blocks;
  if (selection) {
    title = 'Selected text';
    blocks = selection.split(/\n\s*\n/u).map(text => ({ text }));
  } else {
    const clone = doc.cloneNode(true);
    cleanNavigation(clone, doc.URL);
    // Keep the parsed DOM detached. Only textContent ever reaches the reader UI.
    const article = new Readability(clone, { serializer: element => element }).parse();
    if (!article) throw new Error('No readable article found. Select some text on the page and try again.');
    title = article.title || title;
    cleanNavigation(article.content, doc.URL);
    blocks = collectBlocks(article.content);
  }
  blocks = blocks.filter(block => block.text.trim());
  const tokens = tokenize(blocks, doc.documentElement.lang);
  if (!tokens.length) throw new Error('No readable words found. Select a paragraph and try again.');
  return { title, blocks, tokens };
}
