# Flickleaf

Flick. Read. Find your pace.

[Read in your browser](https://miguelbarroso.com/flickleaf/) · [About Flickleaf](https://miguelbarroso.com/flickleaf/about/)

A local-first Firefox extension presenting article text one word at a time. Scroll or drag to control forward and reverse playback; let go to settle toward a pause. No accounts, servers, analytics, or remote code.

## Try it in Firefox

Requires Firefox 142 or newer. The built extension is in `dist/`.

1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Choose **Load Temporary Add-on…** and select `dist/manifest.json`.
3. Open an article, then click **Flickleaf** in Firefox's extensions menu.
4. If extraction misses the text you want, select a passage and click the extension again.

Temporary add-ons are removed when Firefox restarts. A distributable release still needs Mozilla signing. Internal browser pages, the add-on store, and other protected pages cannot be read; Flickleaf opens the paste view when Firefox rejects access.

## Paste your own text

Click **Paste text** in the reader, or right-click the Flickleaf toolbar icon and choose **Paste text into Flickleaf**. Paste a document, notes, or any other text, optionally add a title, and choose **Start reading**. The playground also provides `paste.html`.

Blank lines separate paragraphs; wrapped lines remain in one paragraph. Markdown headings (`# Heading`, `## Subheading`, up to six levels) become heading cards and section markers. Plain text and HTML-like strings are treated as text. All existing playback and speed controls apply. Close the reader to return to your draft. Text stays in the tab and is never uploaded or saved by Flickleaf; closing or reloading the tab may discard it.

## Section navigation

The progress bar shows a tick at each heading: taller marks for main sections, shorter marks for subsections. Hover over the bar to preview the section at that position. Use the **Section** picker underneath to jump precisely to a heading, including on touch screens or pages with closely packed headings. Jumping pauses playback at the heading card; Play resumes from there. The picker follows the current section as you read or scrub. Pages without headings keep a simple slider.

## Reading speed limits

The **Min / Max** fields default to **300 / 900 WPM**. They cap the base reading pace in Direct, Freewheel, reverse scrolling, and hands-off playback. You can choose limits between 50 and 1,500 WPM. Changing either limit takes effect immediately; if you move one past the other, the other follows so the range stays valid. Blank or invalid entries restore the previous value.

Wheel momentum still decays naturally. When it would produce a pace below the minimum, reading holds at your minimum until the wheel settles, then pauses. Pause remains immediate. Punctuation and heading pauses still apply, so the average number of words shown per minute can be below your minimum base pace. Limits reset to 300–900 when you reopen the reader.

## Two scroll modes

Choose **Direct** or **Freewheel** below the playback controls.

- **Direct** keeps the original short glide and close control.
- **Freewheel** adds more momentum per flick and coasts much longer. Repeated flicks accelerate; opposite scrolling brakes first, then reverses. Space, Enter, Pause, seeking, or switching modes stops momentum immediately. Leaving the tab/window also stops it.

Freewheel is a software approximation of a freely spinning wheel, not a hardware-specific Logitech simulation. A moderate flick can coast for roughly 20 seconds; input from different wheels and trackpads varies. Both modes respect your minimum and maximum pace and retain heading timing. Hands-off Play still runs at the configured WPM. The mode resets to Direct when the reader is reopened.

For tuning: Direct uses gain 4 and a 420 ms exponential decay constant; Freewheel uses gain 6 and a 6,000 ms decay constant, with stronger opposing-input braking and a 20 WPM stop threshold. These constants live in `src/core.js`.

## Headings and section rhythm

Headings appear as complete cards labeled Section or Subsection. Body paragraphs remain one word at a time. Cards receive at least five base-word intervals, or their word count plus two, whichever is longer. The preceding body word receives another 1.5 intervals before the section change. At 300 WPM, a five-word heading stays for about 1.4 seconds, and the added section pause is 0.3 seconds. These are tunable starting values, not scientifically validated optimal timings.

Arrow keys step over a heading as one card; the word counter still includes every word in it. Scroll, reverse, seek, and hands-off controls continue to work on cards. There is no forced manual confirmation at each section.

Extraction filters navigation landmarks, forms, hidden elements, recognizable in-page contents lists, and standalone links styled as action buttons. It preserves ordinary linked prose and nested list/card text. Filtering is conservative and depends on page markup; unusual sites can still need text selection. Captions and substantive lists are retained.

## Controls

| Control | Action |
| --- | --- |
| Scroll down / up | Accelerate forward / reverse; momentum decays |
| Drag upward / downward in the reading area | Move forward / reverse |
| Play, Space, or Enter | Toggle hands-off continuous playback |
| Left / right or up / down arrows | Pause and step one word |
| Progress slider | Pause and seek |
| Page Up / Page Down, + / − keys or buttons, or WPM input | Set continuous playback speed within your chosen limits |
| Context button | Pause and show surrounding words |
| Hold Shift | Pause and temporarily show surrounding words |
| Escape or Close | Return to the original page |

Space and Enter control playback even after clicking a button. While editing the WPM input or using the progress slider, native input keys are preserved. Page Up / + increases pace by 25 WPM; Page Down / − decreases it, without starting paused playback. Held Space/Enter keys toggle only once. Reading starts paused. Switching tabs or windows pauses playback. Reopening the same article within a page session resumes the last word; refreshing the page clears it. The WPM setting is a base rate: punctuation and paragraph pauses reduce the effective average.

## Development

Use Node.js 22 or newer and npm.

```sh
npm ci
npm run build
npm run dev
```

The playground is at `http://127.0.0.1:4173/demo.html`. Add `?reader` to open straight into the reader. After rebuilding, reload the temporary add-on in Firefox.

```sh
npm test
npm run test:browser
npm run lint:extension
npm run package
```

Browser tests use `/Applications/Chromium.app/Contents/MacOS/Chromium` by default; set `CHROMIUM_PATH` for another Chromium executable. They exercise the built content script, playback, scroll reversal, themes, context, focus restoration, narrow layout, repeated injection, and extraction errors.

## Structure

- `src/core.js`: Unicode tokenization, punctuation timing, and browser-independent playback physics.
- `src/extract.js`: Mozilla Readability on a detached clone, or selected text.
- `src/reader.js` / `reader.css`: isolated Shadow DOM reader in a modal dialog, controls, focus and lifecycle.
- `src/content.js`: extension entry and page-session position memory.
- `src/background.js`: user-initiated active-tab injection and restricted-page feedback.

The extension asks for `activeTab`, `scripting`, and `menus` (for the toolbar’s Paste text menu). Article text is assigned with `textContent`; extracted HTML is never inserted into the live page. Firefox's modal dialog isolates keyboard focus without rewriting the underlying article. No article or reading state is sent anywhere.

## Current limits and next steps

This is the first desktop Firefox prototype. Chrome/Safari packaging, saved preferences, persistent reading history, and fixed recognition-point alignment are not implemented. Japanese uses `Intl.Segmenter`, but multilingual pacing still needs user testing. Touch drag is implemented; physical phone testing remains to be done. RSVP is a different presentation mode, not a promise of faster comprehension or less fatigue.

Mozilla's extension linter currently reports four `UNSAFE_VAR_ASSIGNMENT` warnings inside the bundled Readability library (two each in the content and playground bundles). These are its detached-document parsing operations; the reader itself renders article text only. Review this again when updating Readability.

API references: [Mozilla Readability](https://github.com/mozilla/readability), [script injection](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/scripting/executeScript), [background scripts](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background).

The extension keeps its original internal Firefox ID (`rsvp-reader@local.invalid`) so this rename remains an update to the same add-on. Its public name and icon are Flickleaf.

## Web version

`web/` is the standalone paste reader at `/flickleaf/`, with an About page at `/flickleaf/about/`. It shares the tokenizer and playback UI with the extension. Phone layouts have a compact settings disclosure. No text is uploaded or persisted by the app.

Run `npm run build:web` to generate `dist-web/flickleaf/`. Serve `dist-web` as a web root so absolute `/flickleaf/` paths resolve. `npm run test:web` checks Chromium and WebKit, including 390×844 and 375×667 phone layouts. Install matching test browsers with `npx playwright install chromium webkit` if needed.

Publish the generated `flickleaf` directory into the site's persistent web root. The hosting repository tracks a release copy and deployment notes. This version requires a connection to load; it does not register a service worker or provide offline caching.
