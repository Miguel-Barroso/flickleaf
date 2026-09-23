export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Software wheel feel, not a model of any particular mouse's hardware.
const SCROLL_MODES = {
  direct: { gain: 4, coastMs: 420, stopSpeed: 12, brake: 1 },
  freewheel: { gain: 6, coastMs: 6000, stopSpeed: 20, brake: 1.5 },
};

export function tokenize(blocks, language = 'en') {
  let segmenter;
  try { segmenter = new Intl.Segmenter(language || 'en', { granularity: 'word' }); }
  catch { segmenter = new Intl.Segmenter('en', { granularity: 'word' }); }
  const tokens = [];
  blocks.forEach((block, paragraph) => {
    const text = block.text.replace(/\s+/gu, ' ').trim();
    const local = [];
    let prefix = '';
    for (const part of segmenter.segment(text)) {
      if (part.isWordLike) {
        local.push({ text: prefix + part.segment, paragraph, heading: block.heading });
        prefix = '';
      } else if (part.segment.trim()) {
        if (/[“‘「『（(\[]/u.test(part.segment) || !local.length) prefix += part.segment;
        else local.at(-1).text += part.segment;
      }
    }
    if (prefix && local.length) local.at(-1).text += prefix;
    if (block.heading && local.length) {
      // Headings stay together; weights follow the user's chosen WPM.
      const previous = tokens.at(-1);
      if (previous && !previous.heading) previous.weight += 1.5;
      tokens.push({ text, paragraph, heading: true, level: block.level || 2,
        wordCount: local.length, weight: Math.max(5, local.length + 2) });
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
    this.minSpeed = 300; this.maxSpeed = 900;
  }
  pause() { this.mode = 'paused'; this.velocity = 0; this.elapsed = 0; }
  play() {
    if (!this.tokens.length) return;
    if (this.index === this.tokens.length - 1) this.index = 0;
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
  impulse(pixels) {
    if (!Number.isFinite(pixels) || !pixels || !this.tokens.length) return;
    if (this.mode !== 'scrub') { this.velocity = 0; this.elapsed = 0; }
    const before = Math.sign(this.velocity);
    this.mode = 'scrub';
    const feel = SCROLL_MODES[this.scrollMode];
    const braking = before && before !== Math.sign(pixels);
    this.velocity = clamp(this.velocity + clamp(pixels, -240, 240) * feel.gain * (braking ? feel.brake : 1), -this.maxSpeed, this.maxSpeed);
    if (before !== Math.sign(this.velocity)) this.elapsed = 0;
  }
  tick(milliseconds) {
    if (this.mode === 'paused' || !this.tokens.length) return;
    // Never jump across unread text after a suspended or blocked browser frame.
    let remaining = clamp(milliseconds, 0, 80);
    while (remaining > 0 && this.mode !== 'paused') {
      const step = Math.min(remaining, 8); remaining -= step;
      const direction = Math.sign(this.velocity);
      // Keep invisible wheel momentum separate from the readable pace. At the
      // floor, continue at minSpeed until friction stops the wheel completely.
      this.elapsed += Math.abs(this.readingVelocity) * step / 60000;
      if (this.mode === 'scrub') {
        const feel = SCROLL_MODES[this.scrollMode];
        this.velocity *= Math.exp(-step / feel.coastMs);
        if (Math.abs(this.velocity) < feel.stopSpeed) { this.pause(); break; }
      }
      while (this.elapsed >= this.tokens[this.index].weight) {
        this.elapsed -= this.tokens[this.index].weight;
        const next = this.index + direction;
        if (next < 0 || next >= this.tokens.length) { this.pause(); break; }
        this.index = next;
      }
    }
  }
}
