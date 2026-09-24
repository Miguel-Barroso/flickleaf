// A modal makes the page inert, but does not reliably stop iOS page scrolling.
// Keep the host outside the fixed body so the top-layer reader stays independent.
export function lockPageScroll(doc = document) {
  const win = doc.defaultView;
  const x = win.scrollX, y = win.scrollY;
  const saved = [];
  const originalAttributes = new Map();
  const set = (element, property, value) => {
    if (!element) return;
    if (!originalAttributes.has(element)) originalAttributes.set(element, element.hasAttribute('style'));
    saved.push([element, property, element.style.getPropertyValue(property), element.style.getPropertyPriority(property)]);
    element.style.setProperty(property, value, 'important');
  };
  set(doc.documentElement, 'scroll-behavior', 'auto');
  set(doc.documentElement, 'overflow', 'hidden');
  set(doc.documentElement, 'overscroll-behavior', 'none');
  set(doc.body, 'position', 'fixed');
  set(doc.body, 'top', `${-y}px`);
  set(doc.body, 'left', `${-x}px`);
  set(doc.body, 'width', '100%');
  set(doc.body, 'overflow', 'hidden');
  let unlocked = false;
  return () => {
    if (unlocked) return;
    unlocked = true;
    // Restore scroll-behavior last so a site's smooth scrolling cannot animate
    // the return to the original reading position.
    for (const [element, property, value, priority] of saved.slice(1).reverse()) {
      if (value) element.style.setProperty(property, value, priority);
      else element.style.removeProperty(property);
    }
    win.scrollTo(x, y);
    const [element, property, value, priority] = saved[0];
    if (value) element.style.setProperty(property, value, priority);
    else element.style.removeProperty(property);
    for (const [element, hadStyle] of originalAttributes) {
      if (!hadStyle && !element.style.length) element.removeAttribute('style');
    }
  };
}
