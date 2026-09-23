import { Playback } from './core.js';
import css from './reader.css';

export function openReader(article, onClose = () => {}) {
  const previousFocus = document.activeElement;
  const host = document.createElement('div');
  host.dataset.rsvpReader = '';
  const root = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style'); style.textContent = css; root.append(style);
  const dialog = document.createElement('dialog');
  dialog.setAttribute('aria-label', 'Flickleaf');
  // This template is static. Article strings are assigned only via textContent.
  dialog.innerHTML = `<div class="frame">
    <header class="chrome"><div class="brand"><span class="mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M8 23C4 12 13 5 27 5c0 14-6 23-17 19" fill="currentColor"/><path d="M5 28 20 13" stroke="var(--paper)" stroke-width="2" stroke-linecap="round"/><path d="m5 28 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span> Flickleaf</div><div class="header-actions"><button class="quiet" id="theme" aria-label="Switch to dark theme">◐</button><button id="close">Close <span aria-hidden="true">↗</span></button></div></header>
    <section class="article chrome"><span class="eyebrow">Find your reading rhythm.</span><h1></h1><p id="meta"></p></section>
    <main class="stage" aria-label="Reading area. Scroll or drag to control the pace."><div class="focus-line" aria-hidden="true"></div><span class="heading-label eyebrow" hidden>Section</span><div class="word" aria-live="off"></div><div class="focus-line lower" aria-hidden="true"></div><div class="context" hidden></div></main>
    <div class="bottom"><div class="status"><span class="state"><i class="dot"></i><span id="state">Ready when you are</span></span><span id="count"></span></div><input class="progress" aria-label="Reading position" type="range" min="0" value="0" step="1"><div class="controls chrome"><button class="step" id="back" aria-label="Previous word" title="Previous word (←)">←</button><button class="play" id="play">Play</button><button class="step" id="forward" aria-label="Next word" title="Next word (→)">→</button><div class="speed"><button id="slower" aria-label="Decrease speed">−</button><label><input id="speed" aria-label="Playback speed in words per minute" type="number" min="300" max="900" step="25" value="300"><span>WPM</span></label><button id="faster" aria-label="Increase speed">+</button></div><button class="quiet" id="context" aria-pressed="false">Context</button></div><div class="scroll-feel chrome"><div class="mode-switch" role="group" aria-label="Scroll mode"><button id="direct" aria-pressed="true">Direct</button><button id="freewheel" aria-pressed="false">Freewheel</button></div><span id="scroll-help">Short glide, close control.</span></div><div class="speed-limits chrome" role="group" aria-label="Reading speed limits"><label>Min <input id="min-speed" aria-label="Minimum reading speed" type="number" min="50" max="1500" step="25" value="300"></label><span aria-hidden="true">—</span><label>Max <input id="max-speed" aria-label="Maximum reading speed" type="number" min="50" max="1500" step="25" value="900"></label><span>WPM</span></div><p class="hint chrome"><kbd>Scroll</kbd> to set the pace · <kbd>Space / Enter</kbd> for hands-off · <kbd>PgUp / PgDn</kbd> for pace · <kbd>← →</kbd> to step · <kbd>Esc</kbd> to leave</p></div>
    <footer class="chrome"><span>FLICK. READ. FIND YOUR PACE.</span><span>One word. Right here.</span></footer>
  </div>`;
  root.append(dialog); document.documentElement.append(host);
  const $ = selector => root.querySelector(selector);
  const text = (selector, value) => { const node = $(selector); if (node.textContent !== value) node.textContent = value; };
  const abort = new AbortController();
  const listen = (target, event, fn, options = {}) => target.addEventListener(event, fn, { ...options, signal: abort.signal });
  let frame, closed = false, engine, last = performance.now(), awake = performance.now(), context = false;
  const close = () => {
    if (closed) return; closed = true;
    cancelAnimationFrame(frame); abort.abort(); dialog.close(); host.remove();
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    onClose(engine?.index);
  };
  listen($('#close'), 'click', close);
  listen(dialog, 'cancel', event => { event.preventDefault(); close(); });
  listen($('#theme'), 'click', () => {
    const dark = dialog.classList.toggle('dark');
    $('#theme').setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
  });
  dialog.showModal();
  if (article.error) {
    $('.article').remove(); $('.bottom').remove();
    $('.stage').className = 'error';
    $('.error').replaceChildren();
    const title = document.createElement('h1'); title.textContent = 'A different way in.';
    const message = document.createElement('p'); message.textContent = article.error;
    $('.error').append(title, message);
    $('#close').focus(); return { close };
  }
  engine = new Playback(article.tokens);
  if (article.position) engine.seek(article.position);
  $('h1').textContent = article.title;
  let totalWords = 0;
  const wordEnds = article.tokens.map(token => (totalWords += token.wordCount || 1));
  $('#meta').textContent = `${totalWords.toLocaleString()} words · Take it at your own pace`;
  const progress = $('.progress'); progress.max = String(article.tokens.length - 1);
  let rendered = -1;
  const render = () => {
    if (rendered !== engine.index) {
      rendered = engine.index;
      const token = article.tokens[engine.index];
      $('.word').textContent = token.text;
      $('.stage').classList.toggle('heading-card', Boolean(token.heading));
      $('.heading-label').hidden = !token.heading;
      $('.heading-label').textContent = token.level > 2 ? 'Subsection' : 'Section';
      $('.word').setAttribute('role', token.heading ? 'heading' : 'generic');
      if (token.heading) $('.word').setAttribute('aria-level', String(token.level));
      else $('.word').removeAttribute('aria-level');
      progress.value = String(engine.index);
      const startWord = (wordEnds[engine.index - 1] || 0) + 1;
      $('#count').textContent = `${token.heading && token.wordCount > 1 ? `${startWord}–${wordEnds[engine.index]}` : startWord} / ${totalWords} words`;
      progress.setAttribute('aria-valuetext', token.heading ? `Heading: ${token.text}` : `Word ${startWord} of ${totalWords}`);
      $('.context').replaceChildren();
      article.tokens.slice(Math.max(0, engine.index - 6), engine.index + 7).forEach((token, offset) => {
        const el = document.createElement(Math.max(0, engine.index - 6) + offset === engine.index ? 'mark' : 'span');
        el.textContent = token.text + ' '; $('.context').append(el);
      });
    }
    text('#play', engine.mode === 'paused' ? (engine.index === article.tokens.length - 1 ? 'Replay' : 'Play') : 'Pause');
    text('#state', engine.mode === 'paused' ? (engine.index === article.tokens.length - 1 ? 'End of article' : 'Paused · your pace, your place') : engine.mode === 'play' ? `Reading · ${engine.speed} WPM` : `${engine.velocity < 0 ? 'Rewinding' : engine.scrollMode === 'freewheel' ? 'Coasting' : 'Following your scroll'} · ${Math.round(Math.abs(engine.readingVelocity))} WPM`);
    dialog.classList.toggle('reading', !article.tokens[engine.index].heading && engine.mode !== 'paused' && performance.now() - awake > 1600 && !context);
  };
  const toggle = () => { context = false; showContext(); engine.toggle(); render(); };
  const seek = index => { engine.seek(index); awake = performance.now(); render(); };
  const speed = value => { if (Number.isFinite(value)) engine.setSpeed(value); $('#speed').value = String(engine.speed); render(); };
  const showContext = () => { $('.context').hidden = !context; $('#context').setAttribute('aria-pressed', String(context)); };
  for (const mode of ['direct', 'freewheel']) listen($('#' + mode), 'click', () => {
    engine.setScrollMode(mode);
    $('#direct').setAttribute('aria-pressed', String(mode === 'direct'));
    $('#freewheel').setAttribute('aria-pressed', String(mode === 'freewheel'));
    text('#scroll-help', mode === 'direct' ? 'Short glide, close control.' : 'Flick to coast. Reverse to brake. Space to stop.');
    awake = performance.now(); render();
  });
  listen($('#play'), 'click', toggle);
  listen($('#back'), 'click', () => seek(engine.index - 1));
  listen($('#forward'), 'click', () => seek(engine.index + 1));
  listen(progress, 'input', () => seek(Number(progress.value)));
  listen($('#speed'), 'change', event => speed(Number(event.target.value)));
  for (const bound of ['min', 'max']) listen($('#' + bound + '-speed'), 'change', event => {
    const value = event.target.valueAsNumber;
    if (bound === 'min') engine.setLimits(value, Math.max(value, engine.maxSpeed));
    else engine.setLimits(Math.min(value, engine.minSpeed), value);
    $('#min-speed').value = String(engine.minSpeed);
    $('#max-speed').value = String(engine.maxSpeed);
    $('#speed').min = String(engine.minSpeed); $('#speed').max = String(engine.maxSpeed);
    $('#speed').value = String(engine.speed);
    awake = performance.now(); render();
  });
  listen($('#slower'), 'click', () => speed(engine.speed - 25));
  listen($('#faster'), 'click', () => speed(engine.speed + 25));
  listen($('#context'), 'click', () => { engine.pause(); context = !context; showContext(); render(); });
  listen(dialog, 'pointermove', () => { awake = performance.now(); });
  listen(dialog, 'wheel', event => {
    if (event.ctrlKey || event.target.closest('input')) return;
    event.preventDefault();
    context = false; showContext();
    engine.impulse(event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1));
  }, { passive: false });
  listen(dialog, 'keydown', event => {
    if (event.key === 'Escape') return;
    if (event.key === 'Tab') {
      const items = [...root.querySelectorAll('button,input')];
      const first = items[0], end = items.at(-1);
      if (event.shiftKey && root.activeElement === first) { event.preventDefault(); end.focus(); }
      else if (!event.shiftKey && root.activeElement === end) { event.preventDefault(); first.focus(); }
      return;
    }
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    if (event.target.closest('input,textarea,[contenteditable]')) return;
    if (event.code === 'Space' || event.key === 'Enter') {
      // Prevent native button activation as well as page scrolling. A held key
      // must not repeatedly switch playback on and off.
      event.preventDefault(); event.stopPropagation();
      if (!event.repeat) toggle();
    }
    else if (event.key === 'PageUp' || event.key === '+' || event.key === '=') { event.preventDefault(); speed(engine.speed + 25); }
    else if (event.key === 'PageDown' || event.key === '-' || event.key === '−') { event.preventDefault(); speed(engine.speed - 25); }
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); seek(engine.index - 1); }
    else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); seek(engine.index + 1); }
    else if (event.key === 'Shift' && !event.repeat) { engine.pause(); context = true; showContext(); render(); }
  });
  listen(dialog, 'keyup', event => { if (event.code === 'Space' && !event.target.closest('input,textarea,[contenteditable]')) event.preventDefault(); if (event.key === 'Shift') { context = false; showContext(); } });
  let pointer = null, y = 0;
  listen($('.stage'), 'pointerdown', event => {
    if (pointer !== null || event.button !== 0) return;
    pointer = event.pointerId; y = event.clientY; $('.stage').setPointerCapture(pointer);
    engine.pause(); $('#play').blur(); dialog.focus();
  });
  listen($('.stage'), 'pointermove', event => {
    if (event.pointerId !== pointer) return;
    engine.impulse((y - event.clientY) * 2); y = event.clientY;
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) listen($('.stage'), event, e => { if (e.pointerId === pointer) pointer = null; });
  listen(document, 'visibilitychange', () => { if (document.hidden) { engine.pause(); render(); } last = performance.now(); });
  listen(window, 'blur', () => { engine.pause(); context = false; showContext(); render(); });
  const tick = now => { engine.tick(now - last); last = now; render(); frame = requestAnimationFrame(tick); };
  render(); frame = requestAnimationFrame(tick); dialog.tabIndex = -1; dialog.focus();
  return { close, engine };
}
