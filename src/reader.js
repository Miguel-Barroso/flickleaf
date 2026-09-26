import { setupParagraphView } from './paragraph-view.js';
import { createPreferencesStore, DEFAULT_PREFERENCES } from './preferences.js';
import { AutoplayWakeLock } from './wake-lock.js';
import { Playback } from './core.js';
import { lockPageScroll } from './scroll-lock.js';
import css from './reader.css';

export function openReader(article, onClose = () => {}, onPaste = null) {
  const previousFocus = document.activeElement;
  let unlockScroll = () => {};
  const wakeLock = new AutoplayWakeLock();
  const preferences = createPreferencesStore();
  let preferencesChanged = false;
  let savePreferences = () => {};
  const host = document.createElement('div');
  host.dataset.rsvpReader = '';
  const root = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style'); style.textContent = css; root.append(style);
  const dialog = document.createElement('dialog');
  dialog.setAttribute('aria-label', 'Flickleaf');
  // This template is static. Article strings are assigned only via textContent.
  dialog.innerHTML = `<div class="frame">
    <header class="chrome"><div class="brand"><span class="mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M8 23C4 12 13 5 27 5c0 14-6 23-17 19" fill="currentColor"/><path d="M5 28 20 13" stroke="var(--paper)" stroke-width="2" stroke-linecap="round"/><path d="m5 28 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span> Flickleaf</div><div class="header-actions"><button id="paste" hidden>Paste text</button><button class="quiet" id="theme" aria-label="Switch to dark theme">◐</button><button id="close">Close <span aria-hidden="true">↗</span></button></div></header>
    <section class="article chrome"><span class="eyebrow">Find your reading rhythm.</span><h1></h1><p id="meta"></p></section>
    <div class="view-switch chrome mode-switch" role="group" aria-label="Reading view"><button id="word-view" aria-pressed="true">Words</button><button id="paragraph-view" aria-pressed="false">Paragraphs</button></div>
    <main class="stage" aria-label="Reading area. Scroll or drag to control the pace."><div class="focus-line" aria-hidden="true"></div><div class="word-frame"><span class="heading-label eyebrow" hidden>Section</span><div class="word" aria-live="off"></div><div class="context" hidden></div></div><div class="focus-line lower" aria-hidden="true"></div></main>
    <section class="paragraph-pane" hidden tabindex="0" aria-label="Paragraph reading view" aria-describedby="paragraph-help"><p id="paragraph-help">Your current word is highlighted. Select a word to move your place; use ← and → to step. Play returns to Words.</p><button id="earlier-passage">Earlier passage</button><div class="paragraph-content"></div><button id="later-passage">Later passage</button></section>
    <div class="bottom"><div class="status"><span class="state"><i class="dot"></i><span id="state">Ready when you are</span></span><span id="count"></span></div><div class="timeline"><div class="section-preview" hidden></div><div class="section-ticks" aria-hidden="true"></div><input class="progress" aria-label="Reading position" type="range" min="0" value="0" step="1"></div><div class="section-nav chrome" hidden><label for="sections">Section</label><select id="sections" aria-label="Jump to section"></select></div><div class="controls chrome"><button class="step" id="back" aria-label="Previous word" title="Previous word (←)">←</button><button class="play" id="play">Play</button><button class="step" id="forward" aria-label="Next word" title="Next word (→)">→</button><div class="speed"><button id="slower" aria-label="Decrease speed">−</button><label><input id="speed" aria-label="Playback speed in words per minute" type="number" min="300" max="900" step="25" value="300"><span>WPM</span></label><button id="faster" aria-label="Increase speed">+</button></div><button class="quiet" id="context" aria-pressed="false">Context</button></div><div class="scroll-feel chrome"><div class="mode-switch" role="group" aria-label="Scroll mode"><button id="direct" aria-pressed="true">Direct</button><button id="freewheel" aria-pressed="false">Freewheel</button></div><span id="scroll-help">Short glide, close control.</span></div><div class="speed-limits chrome" role="group" aria-label="Reading speed limits"><label>Min <input id="min-speed" aria-label="Minimum reading speed" type="number" min="50" max="1500" step="25" value="300"></label><span aria-hidden="true">—</span><label>Max <input id="max-speed" aria-label="Maximum reading speed" type="number" min="50" max="1500" step="25" value="900"></label><span>WPM</span></div><div class="preferences chrome"><span id="preferences-status" role="status">Loading preferences…</span><button class="quiet" id="clear-preferences">Clear saved preferences</button></div><p class="hint chrome"><kbd>Scroll</kbd> to set the pace · <kbd>Space / Enter</kbd> for hands-off · <kbd>PgUp / PgDn</kbd> for pace · <kbd>← →</kbd> to step · <kbd>Esc</kbd> to leave</p></div>
    <footer class="chrome"><span>FLICK. READ. FIND YOUR PACE.</span><span>One word. Right here.</span></footer>
  </div>`;
  root.append(dialog); document.documentElement.append(host);
  const $ = selector => root.querySelector(selector);
  const text = (selector, value) => { const node = $(selector); if (node.textContent !== value) node.textContent = value; };
  const abort = new AbortController();
  const listen = (target, event, fn, options = {}) => target.addEventListener(event, fn, { ...options, signal: abort.signal });
  let view = 'words', paragraphView;
  let frame, closed = false, engine, last = performance.now(), awake = performance.now(), context = false;
  const close = () => {
    if (closed) return; closed = true;
    wakeLock.dispose(); cancelAnimationFrame(frame); abort.abort(); dialog.close(); host.remove(); unlockScroll();
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    onClose(engine?.index);
  };
  listen($('#close'), 'click', close);
  if (onPaste) {
    $('#paste').hidden = false;
    listen($('#paste'), 'click', () => { engine?.pause(); onPaste(); });
  }
  listen(dialog, 'cancel', event => { event.preventDefault(); close(); });
  listen($('#theme'), 'click', () => {
    const dark = dialog.classList.toggle('dark');
    $('#theme').setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
    savePreferences();
  });
  unlockScroll = lockPageScroll();
  try { dialog.showModal(); }
  catch (error) { unlockScroll(); host.remove(); throw error; }
  if (article.error) {
    $('.article').remove(); $('.bottom').remove(); $('.view-switch').remove(); $('.paragraph-pane').remove();
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
  const headings = article.tokens.flatMap((token, index) => token.heading ? [{ ...token, index }] : []);
  const sectionAt = index => headings.findLast(heading => heading.index <= index);
  const sections = $('#sections');
  if (headings.length) {
    $('.section-nav').hidden = false;
    if (headings[0].index > 0) {
      const beginning = document.createElement('option'); beginning.value = '0'; beginning.textContent = 'Beginning'; sections.append(beginning);
    }
    for (const heading of headings) {
      const option = document.createElement('option'); option.value = String(heading.index);
      option.textContent = `${heading.level > 2 ? '↳ ' : ''}${heading.text}`; sections.append(option);
      const tick = document.createElement('span'); tick.className = heading.level > 2 ? 'minor' : 'major';
      tick.style.left = `${heading.index / Math.max(1, article.tokens.length - 1) * 100}%`;
      $('.section-ticks').append(tick);
    }
  }
  let rendered = -1;
  const render = () => {
    wakeLock.setActive(engine.mode === 'play' && !document.hidden);
    $('#play').title = wakeLock.status === 'active' ? 'Autoplay · keeping screen awake' : wakeLock.status === 'unavailable' ? 'Screen sleep prevention is unavailable in this browser or page' : 'Toggle autoplay';
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
      progress.style.setProperty('--progress', `${engine.index / Math.max(1, article.tokens.length - 1) * 100}%`);
      const section = sectionAt(engine.index);
      sections.value = String(section?.index ?? 0);
      sections.title = section?.text || 'Beginning';
      const startWord = (wordEnds[engine.index - 1] || 0) + 1;
      $('#count').textContent = `${token.heading && token.wordCount > 1 ? `${startWord}–${wordEnds[engine.index]}` : startWord} / ${totalWords} words`;
      progress.setAttribute('aria-valuetext', token.heading ? `Heading: ${token.text}` : `Word ${startWord} of ${totalWords}`);
      $('.context').replaceChildren();
      article.tokens.slice(Math.max(0, engine.index - 6), engine.index + 7).forEach((token, offset) => {
        const el = document.createElement(Math.max(0, engine.index - 6) + offset === engine.index ? 'mark' : 'span');
        el.textContent = token.text + ' '; $('.context').append(el);
      });
    }
    if (view === 'paragraphs') paragraphView.render(engine.index);
    text('#play', view === 'paragraphs' ? 'Play words' : engine.mode === 'paused' ? (engine.index === article.tokens.length - 1 ? 'Replay' : 'Play') : 'Pause');
    text('#state', engine.mode === 'paused' ? (engine.index === article.tokens.length - 1 ? 'End of article' : 'Paused · your pace, your place') : engine.mode === 'play' ? `Reading · ${engine.speed} WPM` : `${engine.velocity < 0 ? 'Rewinding' : engine.scrollMode === 'freewheel' ? 'Coasting' : 'Following your scroll'} · ${Math.round(Math.abs(engine.readingVelocity))} WPM`);
    dialog.classList.toggle('reading', engine.mode !== 'paused' && performance.now() - awake > 1600 && !context);
  };
  const setView = mode => {
    engine.pause(); context = false; showContext(); view = mode;
    $('.stage').hidden = mode === 'paragraphs'; $('.paragraph-pane').hidden = mode !== 'paragraphs';
    $('#context').hidden = mode === 'paragraphs'; dialog.classList.toggle('paragraph-mode', mode === 'paragraphs');
    $('#word-view').setAttribute('aria-pressed', String(mode === 'words')); $('#paragraph-view').setAttribute('aria-pressed', String(mode === 'paragraphs'));
    awake = performance.now(); render();
    if (mode === 'paragraphs') { paragraphView.render(engine.index, true); $('.paragraph-pane').focus({ preventScroll: true }); }
  };
  const toggle = () => { if (view === 'paragraphs') setView('words'); context = false; showContext(); engine.toggle(); render(); };
  const seek = index => { engine.seek(index); awake = performance.now(); render(); };
  const speed = value => { if (Number.isFinite(value)) engine.setSpeed(value); $('#speed').value = String(engine.speed); savePreferences(); render(); };
  const showContext = () => { $('.context').hidden = !context; $('#context').setAttribute('aria-pressed', String(context)); };
  for (const mode of ['direct', 'freewheel']) listen($('#' + mode), 'click', () => {
    engine.setScrollMode(mode);
    $('#direct').setAttribute('aria-pressed', String(mode === 'direct'));
    $('#freewheel').setAttribute('aria-pressed', String(mode === 'freewheel'));
    text('#scroll-help', mode === 'direct' ? 'Short glide, close control.' : 'Flick to coast. Reverse to brake. Space to stop.');
    savePreferences(); awake = performance.now(); render();
  });
  listen($('#play'), 'click', toggle);
  listen($('#back'), 'click', () => seek(engine.index - 1));
  listen($('#forward'), 'click', () => seek(engine.index + 1));
  listen(progress, 'input', () => seek(Number(progress.value)));
  listen(sections, 'focus', () => { engine.pause(); awake = performance.now(); render(); });
  listen(sections, 'change', () => { seek(Number(sections.value)); sections.blur(); progress.focus(); });
  listen(progress, 'pointermove', event => {
    if (!headings.length || event.pointerType !== 'mouse') return;
    const rect = progress.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (event.clientX - rect.left - 8) / Math.max(1, rect.width - 16)));
    const section = sectionAt(Math.round(fraction * (article.tokens.length - 1)));
    text('.section-preview', section?.text || 'Beginning');
    $('.section-preview').hidden = false;
  });
  listen(progress, 'pointerleave', () => { $('.section-preview').hidden = true; });

  listen($('#speed'), 'change', event => speed(Number(event.target.value)));
  for (const bound of ['min', 'max']) listen($('#' + bound + '-speed'), 'change', event => {
    const value = event.target.valueAsNumber;
    if (bound === 'min') engine.setLimits(value, Math.max(value, engine.maxSpeed));
    else engine.setLimits(Math.min(value, engine.minSpeed), value);
    $('#min-speed').value = String(engine.minSpeed);
    $('#max-speed').value = String(engine.maxSpeed);
    $('#speed').min = String(engine.minSpeed); $('#speed').max = String(engine.maxSpeed);
    $('#speed').value = String(engine.speed);
    savePreferences(); awake = performance.now(); render();
  });
  listen($('#slower'), 'click', () => speed(engine.speed - 25));
  listen($('#faster'), 'click', () => speed(engine.speed + 25));
  listen($('#context'), 'click', () => { engine.pause(); context = !context; showContext(); render(); });
  let mouseSample = null;
  listen(dialog, 'pointermove', event => {
    if (event.pointerType !== 'mouse' || event.buttons) return;
    const now = performance.now();
    // Ignore wheel-hand jitter. Reveal only for a purposeful displacement,
    // not the accumulated distance of many tiny back-and-forth movements.
    if (!mouseSample || now - mouseSample.at > 300) {
      mouseSample = { x: event.clientX, y: event.clientY, at: now };
      return;
    }
    if (Math.hypot(event.clientX - mouseSample.x, event.clientY - mouseSample.y) >= 24) {
      awake = now;
      mouseSample = { x: event.clientX, y: event.clientY, at: now };
    }
  });
  listen(dialog, 'pointerdown', event => {
    if (event.target.closest('button,input,select')) awake = performance.now();
  });
  listen(dialog, 'wheel', event => {
    if (view === 'paragraphs' || event.ctrlKey || event.target.closest('input,select')) return;
    event.preventDefault();
    context = false; showContext();
    engine.impulse(event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1));
  }, { passive: false });
  listen(dialog, 'keydown', event => {
    if (event.key === 'Escape') return;
    if (event.key === 'Tab') {
      const items = [...root.querySelectorAll('button,input,select,summary')].filter(el => !el.closest('[hidden]') && el.getClientRects().length);
      const first = items[0], end = items.at(-1);
      if (event.shiftKey && root.activeElement === first) { event.preventDefault(); end.focus(); }
      else if (!event.shiftKey && root.activeElement === end) { event.preventDefault(); first.focus(); }
      return;
    }
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    if (event.target.closest('#paste,#clear-preferences,#theme,#word-view,#paragraph-view,#earlier-passage,#later-passage') && (event.code === 'Space' || event.key === 'Enter')) return;
    if (event.target.closest('input,select,textarea,[contenteditable]')) return;
    if (view === 'paragraphs' && event.target.closest('.paragraph-pane') && ['ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(event.key)) return;
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
  listen(dialog, 'keyup', event => { if (event.code === 'Space' && !event.target.closest('#paste,#clear-preferences,#theme,#word-view,#paragraph-view,#earlier-passage,#later-passage,summary,input,select,textarea,[contenteditable]')) event.preventDefault(); if (event.key === 'Shift') { context = false; showContext(); } });
  let pointer = null, y = 0;
  listen($('.stage'), 'pointerdown', event => {
    if (event.pointerType === 'touch' || pointer !== null || event.button !== 0) return;
    pointer = event.pointerId; y = event.clientY; $('.stage').setPointerCapture(pointer);
    engine.pause(); context = false; showContext(); $('#play').blur(); dialog.focus({ preventScroll: true });
  });
  listen($('.stage'), 'pointermove', event => {
    if (event.pointerId !== pointer) return;
    engine.impulse((y - event.clientY) * 2); y = event.clientY;
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) listen($('.stage'), event, e => { if (e.pointerId === pointer) pointer = null; });
  // Use a non-passive touch listener so WebKit cannot turn a reading swipe
  // into native page panning. Touch is handled only here, not twice via pointers.
  let touch = null, touchY = 0;
  listen($('.stage'), 'touchstart', event => {
    if (event.touches.length !== 1) { touch = null; engine.pause(); return; }
    touch = event.touches[0].identifier; touchY = event.touches[0].clientY;
    engine.pause(); context = false; showContext();
    $('#play').blur(); dialog.focus({ preventScroll: true });
  }, { passive: true });
  listen($('.stage'), 'touchmove', event => {
    if (touch === null || event.touches.length !== 1) return;
    const current = [...event.touches].find(item => item.identifier === touch);
    if (!current) return;
    if (event.cancelable) event.preventDefault();
    engine.impulse((touchY - current.clientY) * 2); touchY = current.clientY;
  }, { passive: false });
  listen($('.stage'), 'touchend', event => {
    if ([...event.changedTouches].some(item => item.identifier === touch)) touch = null;
  });
  listen($('.stage'), 'touchcancel', () => { touch = null; engine.pause(); });
  listen(document, 'visibilitychange', () => { if (document.hidden) { engine.pause(); render(); } last = performance.now(); });
  listen(window, 'blur', () => { engine.pause(); context = false; showContext(); render(); });
  const applyPreferences = values => {
    engine.setLimits(values.minSpeed, values.maxSpeed);
    engine.setSpeed(values.speed);
    engine.setScrollMode(values.scrollMode);
    $('#min-speed').value = String(engine.minSpeed);
    $('#max-speed').value = String(engine.maxSpeed);
    $('#speed').min = String(engine.minSpeed); $('#speed').max = String(engine.maxSpeed);
    $('#speed').value = String(engine.speed);
    for (const mode of ['direct', 'freewheel']) $('#' + mode).setAttribute('aria-pressed', String(mode === engine.scrollMode));
    text('#scroll-help', engine.scrollMode === 'direct' ? 'Short glide, close control.' : 'Flick to coast. Reverse to brake. Space to stop.');
    dialog.classList.toggle('dark', values.theme === 'dark');
    $('#theme').setAttribute('aria-label', `Switch to ${values.theme === 'dark' ? 'light' : 'dark'} theme`);
    render();
  };
  savePreferences = () => {
    preferencesChanged = true;
    preferences.save({ speed: engine.speed, minSpeed: engine.minSpeed, maxSpeed: engine.maxSpeed,
      scrollMode: engine.scrollMode, theme: dialog.classList.contains('dark') ? 'dark' : 'light' }).then(result => {
      if (!closed) text('#preferences-status', preferences.temporary ? 'Private session: preference changes are temporary.' : result.ok ? 'Preferences saved on this device.' : 'Preferences are temporary; storage is unavailable.');
    });
  };
  listen($('#clear-preferences'), 'click', () => {
    preferencesChanged = true;
    engine.pause();
    applyPreferences(DEFAULT_PREFERENCES);
    preferences.clear().then(result => {
      if (!closed) text('#preferences-status', preferences.temporary ? 'Defaults restored for this private session. Saved preferences unchanged.' : result.ok ? 'Saved preferences cleared. Defaults restored.' : 'Defaults restored; saved preferences could not be cleared.');
    });
  });
  preferences.load().then(result => {
    if (closed || preferencesChanged) return;
    // Never interrupt playback or scrolling if storage responds slowly.
    if (result.ok && engine.mode === 'paused') applyPreferences(result.value);
    text('#preferences-status', preferences.temporary ? 'Private session: preference changes are temporary.' : result.ok ? 'Preferences stay on this device.' : 'Preferences are temporary; storage is unavailable.');
  });
  paragraphView = setupParagraphView(article, $('.paragraph-pane'), seek, abort.signal);
  listen($('#word-view'), 'click', () => setView('words'));
  listen($('#paragraph-view'), 'click', () => setView('paragraphs'));
  const tick = now => { engine.tick(now - last); last = now; render(); frame = requestAnimationFrame(tick); };
  render(); frame = requestAnimationFrame(tick); dialog.tabIndex = -1; dialog.focus();
  return { close, engine };
}
