# Maintainability plan

Suggestions for a future contributor or coding agent, recorded 1 October 2026 against 0.7.0. Each step below is meant to be its own reviewable change. None of them should change behavior.

## Ground rules for this work

- Follow `AGENTS.md`: tokenizer, playback engine, and reader UI stay in shared `src/` modules for web, Firefox, Chrome, and Safari. Never fork code per target.
- Refactors must be behavior-preserving. Keep heading cards at the quiet focal point, pace limits and scroll modes directly visible, and all processing local.
- Before and after every step, run `npm run build:all`, `npm test`, every `npm run test:*` script, and `npm run lint:extension` (0 errors; 13 known dependency warnings). Compare `.test-results/*.png` screenshots before and after any markup or CSS change.
- Do not add a UI framework, a remote dependency, or a build step that the Mozilla source review (see `docs/releasing.md`) cannot reproduce with `npm ci && npm run build`.

## Where the cost is today

| File | Lines | Longest line | Notes |
| --- | --- | --- | --- |
| `src/reader.js` | 298 | ~2,500 chars | One `openReader` closure holds the template, state, rendering, keyboard, wheel, touch, sections, pace controls, and preferences. |
| `src/reader.css` | 69 | ~1,400 chars | Hand-minified rule blocks. |
| `web/index.html`, `web/about/index.html`, `web/site.css` | 2–4 each | up to ~10,000 chars | Whole pages on single lines; any copy edit is a one-line diff. |
| `src/pdf-cleanup-ui.js`, `src/pdf-cleanup.css` | 59 / 1 | ~1,500 chars | Inline template and one-line stylesheet. |

There is no formatter or JavaScript linter. Reviews, blame, and merge conflicts all suffer because most changes touch the same few enormous lines.

## Recommended steps, in order

### 1. Add formatting and linting (mechanical, one commit)

- Add Prettier and ESLint (flat config, `eslint:recommended`, browser + webextensions globals) as dev dependencies, with `npm run format`, `npm run format:check`, and `npm run lint` scripts. Add `format:check` and `lint` to `.github/workflows/validate.yml`.
- Run the formatter once over `src/`, `web/`, `tests/`, and root scripts in a single formatting-only commit. Record that commit's hash in `.git-blame-ignore-revs`.
- Watch for whitespace-sensitive output: the reader template is assigned with `innerHTML`, and reformatting can insert whitespace text nodes between inline elements (buttons, `<kbd>`, spans). Check the screenshots and the narrow-layout tests. If spacing changes, fix it in CSS or keep those elements adjacent, rather than skipping the formatter.
- Fix genuine ESLint findings in separate commits from the formatting.

### 2. Move static markup out of JavaScript strings

- Move the reader `dialog.innerHTML` template into `src/reader.html` and import it with esbuild's `text` loader, as CSS already is. Do the same for the PDF cleanup panel (`src/pdf-cleanup.html`).
- Keep the security property stated in `reader.js`: the template stays static, and article strings are only ever assigned through `textContent`.

### 3. Define each keyboard exception once

`src/reader.js` repeats the list of controls whose Space/Enter should keep native behavior in both the `keydown` handler and the `keyup` handler. Every new button so far (paragraph view, saved places) has had to be added to both. Replace both with one shared constant, or better, a `data-native-keys` attribute in the markup checked with `closest('[data-native-keys]')`. Add a browser test that presses Space on each such control and confirms playback does not toggle.

### 4. Split `openReader` into setup modules

`setupParagraphView` and `setupReadingPosition` already show the pattern: `setupX(root, engine or callbacks, signal)` returning a small API, with listeners registered against the shared `AbortSignal`. Extract, least-coupled first:

1. `sections.js`: ticks, hover preview, and the Section picker.
2. `pace-controls.js`: speed, min/max limits, scroll mode, and their preference persistence.
3. `reader-input.js`: wheel, touch/pointer drag, mouse-movement wake, and keyboard handling.
4. What remains in `reader.js`: creating the dialog, the render loop, focus restoration, and close/lifecycle.

Move one module per commit and run the full suite each time. Keep `Playback` in `core.js` free of DOM access.

### 5. Document the shared data shapes

Add JSDoc typedefs in `src/core.js` for a token (`text`, `paragraph`, `heading`, `level`, `start`, `end`, `weight`, `wordCount`) and an article (`title`, `blocks`, `tokens`, `position`, `error`). Paragraph view and bookmarks depend on `paragraph` indexing `article.blocks` and on `start`/`end` offsets into whitespace-normalized block text. Optionally enable `// @ts-check` with `tsc --noEmit --allowJs --checkJs` in CI.

### 6. Name the tuning constants

Replace bare numbers with named, commented constants beside their logic:

- Paragraph window: 200 tokens before the current word and 600 in total.
- PDF cleanup: margin bands `.12` and `.88`, the 60% repetition share, and the `.045` hyphen line gap.
- Heading timing: weights 5 and 1.5.

Scroll-mode constants in `core.js` are already well named.

### 7. Consolidate browser-test launching

`tests/browser.mjs`, `tests/chrome.mjs`, `tests/web.mjs`, and `tests/safari.mjs` each launch browsers differently. Add a `tests/launch.mjs` helper that honors `CHROMIUM_PATH` and Playwright defaults in one place. Replace the macOS-only default in `tests/browser.mjs` with Playwright's Chromium. Add `npm run test:all` to run every suite in CI order.

## Known behavior issue to fix separately

`passageWindow` in `src/paragraph-view.js` trims the window back to whole paragraphs. If the paragraph after the current one is long, the trim removes all of it. For example, in `tests/paragraph-browser.mjs` (a heading, a 12-word paragraph, then a paragraph of about 1,260 words), the view renders only the first 13 tokens, and **Later passage** is needed to see anything else. The renderer already supports partial paragraphs (it adds `…`), so only trim when that keeps most of the window. Example rule: do not trim more than half of the 600-token budget. Add a unit test in `tests/paragraph.test.js` for a short paragraph followed by a long one. This is a behavior change, so keep it out of the refactor commits.
