export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Software wheel feel, not a model of any particular mouse's hardware.
const SCROLL_MODES = {
  stepped: { notch: 40, swipe: 120, drag: 90, holdMs: 900 },
  direct: { gain: 4, coastMs: 420, stopSpeed: 12, brake: 1 },
  freewheel: { gain: 6, coastMs: 6000, stopSpeed: 20, brake: 1.5 },
};
// Reversing moving text keeps the current word in view briefly so the eye can
// re-anchor. Reversed input is held, not discarded, and lands afterwards.
export const REVERSAL_GRACE_MS = 300;

// Safari on macOS reports each mouse-wheel notch with a fractional pixel delta
// (4.000244 px when slow, accelerated beyond that) and no sideways motion.
// Trackpads send whole-pixel streams, so they keep accumulating.
export function isSafariWheelNotch({ deltaX, deltaY, deltaMode }) {
  return deltaMode === 0 && !deltaX && Number.isFinite(deltaY) && !Number.isInteger(deltaY);
}

export function tokenize(blocks, language = 'en') {
  let segmenter;
  try { segmenter = new Intl.Segmenter(language || 'en', { granularity: 'word' }); }
  catch { segmenter = new Intl.Segmenter('en', { granularity: 'word' }); }
  const tokens = [];
  blocks.forEach((block, paragraph) => {
    const text = block.text.replace(/\s+/gu, ' ').trim();
    const local = [];
    let prefix = '', prefixStart = null;
    for (const part of segmenter.segment(text)) {
      if (part.isWordLike) {
        local.push({ text: prefix + part.segment, paragraph, heading: block.heading, start: prefixStart ?? part.index, end: part.index + part.segment.length });
        prefix = ''; prefixStart = null;
      } else if (part.segment.trim()) {
        if (/[“‘「『（(\[]/u.test(part.segment) || !local.length) { prefix += part.segment; prefixStart ??= part.index; }
        else { local.at(-1).text += part.segment; local.at(-1).end = part.index + part.segment.length; }
      }
    }
    if (prefix && local.length) { local.at(-1).text += prefix; local.at(-1).end = text.length; }
    if (block.heading && local.length) {
      // Headings stay together; weights follow the user's chosen WPM.
      const previous = tokens.at(-1);
      if (previous && !previous.heading) previous.weight += 1.5;
      tokens.push({ text, paragraph, heading: true, level: block.level || 2,
        start: 0, end: text.length, wordCount: local.length, weight: Math.max(5, local.length + 2) });
      return;
    }
    local.forEach((token, i) => {
      token.wordCount = 1;
      token.weight = (/[.!?。！？][”’」』)\]]*$/u.test(token.text) ? 1.8 : /[,;:、，；：][”’]*$/u.test(token.text) ? 1.3 : 1);
      if (i === local.length - 1) token.weight += 0.7;
      tokens.push(token);
    });
  });
  return tokens;
}

// A time-based engine, independent of the browser and rendering.
export class Playback {
  constructor(tokens) {
    this.tokens = tokens; this.index = 0; this.speed = 300;
    this.velocity = 0; this.mode = 'paused'; this.elapsed = 0;
    this.scrollMode = 'direct';
    this.stepCharge = 0; this.stepHold = 0;
    this.minSpeed = 300; this.maxSpeed = 900;
    this.holdAtSections = false; this.holding = false;
    this.moved = 0; this.grace = 0; this.graceSteps = 0;
  }
  pause() {
    this.mode = 'paused'; this.velocity = 0; this.elapsed = 0; this.stepCharge = 0; this.stepHold = 0; this.holding = false;
    this.moved = 0; this.grace = 0; this.graceSteps = 0;
  }
  play() {
    if (!this.tokens.length) return;
    const wasHolding = this.holding;
    this.pause();
    if (this.index === this.tokens.length - 1) this.index = 0;
    else if (wasHolding) this.advance(1);
    if (this.holding) return; // Adjacent headings each get their own hold.
    this.elapsed = 0; this.mode = 'play'; this.velocity = this.speed;
  }
  toggle() { this.mode === 'paused' ? this.play() : this.pause(); }
  seek(index) { this.pause(); this.index = clamp(Math.round(index), 0, Math.max(0, this.tokens.length - 1)); }
  get readingVelocity() {
    return this.velocity ? Math.sign(this.velocity) * clamp(Math.abs(this.velocity), this.minSpeed, this.maxSpeed) : 0;
  }
  setLimits(minimum, maximum) {
    if (!Number.isFinite(minimum) || !Number.isFinite(maximum)) return;
    this.minSpeed = clamp(Math.round(minimum), 50, 1500);
    this.maxSpeed = clamp(Math.round(maximum), this.minSpeed, 1500);
    this.velocity = clamp(this.velocity, -this.maxSpeed, this.maxSpeed);
    this.setSpeed(this.speed);
  }
  setSpeed(speed) {
    if (!Number.isFinite(speed)) return;
    this.speed = clamp(speed, this.minSpeed, this.maxSpeed);
    if (this.mode === 'play') this.velocity = this.speed;
  }
  setScrollMode(mode) {
    if (!Object.hasOwn(SCROLL_MODES, mode) || mode === this.scrollMode) return;
    this.pause();
    this.scrollMode = mode;
  }
  setHoldAtSections(enabled) {
    this.holdAtSections = enabled === true;
    if (!this.holdAtSections && this.holding) this.pause();
  }
  // Only forward arrivals hold. Seeking is deliberate navigation, and resuming
  // starts beyond the current heading so it cannot hold again at the same place.
  advance(steps) {
    const target = clamp(this.index + steps, 0, this.tokens.length - 1);
    if (this.holdAtSections && steps > 0) {
      for (let next = this.index + 1; next <= target; next++) {
        if (this.tokens[next].heading) {
          this.index = next; this.pause(); this.holding = true;
          return;
        }
      }
    }
    this.index = target;
  }
  // `notch` marks input known to be one discrete wheel notch, whatever its size.
  impulse(pixels, notch = false) {
    if (!Number.isFinite(pixels) || !pixels || !this.tokens.length) return;
    if (this.scrollMode === 'stepped') return this.step(clamp(pixels, -240, 240), notch);
    const wasHolding = this.holding;
    this.holding = false;
    if (this.mode !== 'scrub') { this.velocity = 0; this.elapsed = 0; }
    const before = Math.sign(this.velocity);
    this.mode = 'scrub';
    const feel = SCROLL_MODES[this.scrollMode];
    const braking = before && before !== Math.sign(pixels);
    this.velocity = clamp(this.velocity + clamp(pixels, -240, 240) * feel.gain * (braking ? feel.brake : 1), -this.maxSpeed, this.maxSpeed);
    const direction = Math.sign(this.velocity);
    if (before !== direction) this.elapsed = 0;
    // Grace starts when momentum turns against the text's last movement; turning
    // back before it elapses cancels it, since the word has not moved.
    if (direction !== -this.moved) this.grace = 0;
    else if (before !== direction) this.grace = REVERSAL_GRACE_MS;
    if (wasHolding) this.advance(Math.sign(pixels));
  }
  // No glide: a wheel notch moves one word immediately, a larger swipe a few,
  // and fine trackpad or drag input accumulates toward whole words. Nothing
  // continues once the hand stops; scrub only lingers for the reading chrome.
  step(pixels, notch = false) {
    const feel = SCROLL_MODES.stepped;
    if (this.mode !== 'scrub' && !this.holding) { this.velocity = 0; this.elapsed = 0; this.stepCharge = 0; }
    let steps;
    if (notch) { steps = Math.sign(pixels); this.stepCharge = 0; }
    else if (Math.abs(pixels) >= feel.notch) {
      steps = Math.sign(pixels) * Math.max(1, Math.trunc(Math.abs(pixels) / feel.swipe));
      this.stepCharge = 0;
    } else {
      if (Math.sign(pixels) !== Math.sign(this.stepCharge)) this.stepCharge = 0;
      this.stepCharge += pixels;
      steps = Math.trunc(this.stepCharge / feel.drag);
      this.stepCharge -= steps * feel.drag;
    }
    if (this.holding && !steps) return; // Fine input still needs a full step.
    this.holding = false; this.mode = 'scrub'; this.stepHold = feel.holdMs;
    if (this.grace > 0 || Math.sign(steps) === -this.moved) {
      // Steps during grace net out, so a quick back-and-forth stays in place.
      if (!this.grace) this.grace = REVERSAL_GRACE_MS;
      this.graceSteps += steps;
      if (Math.sign(this.graceSteps) === -this.moved) return;
      steps = this.graceSteps; this.grace = 0; this.graceSteps = 0;
    }
    if (steps) this.moved = Math.sign(steps);
    this.advance(steps);
  }
  tick(milliseconds) {
    if (this.mode === 'paused' || !this.tokens.length) return;
    // Never jump across unread text after a suspended or blocked browser frame.
    let remaining = clamp(milliseconds, 0, 80);
    while (remaining > 0 && this.mode !== 'paused') {
      const step = Math.min(remaining, 8); remaining -= step;
      const direction = Math.sign(this.velocity);
      if (this.grace > 0) {
        // Momentum and step timeouts wait too, so held input is not lost.
        this.grace -= step;
        if (this.grace <= 0 && this.graceSteps) {
          const steps = this.graceSteps; this.graceSteps = 0;
          this.stepHold = SCROLL_MODES.stepped.holdMs; this.moved = Math.sign(steps);
          this.advance(steps);
        }
        continue;
      }
      // Keep invisible wheel momentum separate from the readable pace. At the
      // floor, continue at minSpeed until friction stops the wheel completely.
      this.elapsed += Math.abs(this.readingVelocity) * step / 60000;
      if (this.mode === 'scrub') {
        if (this.scrollMode === 'stepped') {
          this.stepHold -= step;
          if (this.stepHold <= 0) { this.pause(); break; }
        } else {
          const feel = SCROLL_MODES[this.scrollMode];
          this.velocity *= Math.exp(-step / feel.coastMs);
          if (Math.abs(this.velocity) < feel.stopSpeed) { this.pause(); break; }
        }
      }
      while (this.elapsed >= this.tokens[this.index].weight) {
        this.elapsed -= this.tokens[this.index].weight;
        const next = this.index + direction;
        if (next < 0 || next >= this.tokens.length) { this.pause(); break; }
        this.moved = direction;
        this.advance(direction);
        if (this.holding) break;
      }
    }
  }
}
