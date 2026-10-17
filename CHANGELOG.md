# Changelog

## Unreleased

- Hold the current word for about 300 ms when scrolling reverses moving text, in every scroll mode and during autoplay, so the eye can re-anchor before the text runs back. Reversed input waits and still lands; a quick back-and-forth nets out in place. Text at rest reverses immediately.

## 0.9.0

- Add opt-in Hold at sections across web, Firefox, Chrome, and Safari. Forward playback and scrolling wait at each heading until Play, a scroll, or a step; held headings keep controls dim and stay at the reading focal point.
- Remember the section-hold preference locally, off by default; clearing preferences restores timed headings.
- Leave room for a two-line heading and its Section label on short phone screens.

- Swallow held or repeated C keys and C in Paragraphs view so the context shortcut never reaches the browser's find-as-you-type (Firefox).

## 0.8.0

- Add a Stepped scroll mode that moves exactly one word per wheel notch, accumulates fine trackpad and drag input, and never glides.
- Toggle the context line with the C key.
- Choosing the current section in the Section menu returns to the start of that section.
- Rename the Direct scroll mode to Glide. Saved preferences keep working unchanged.

## 0.7.0

- Add explicit Save place, Resume saved place, and Delete saved place across the shared reader. One local fingerprint/position bookmark; no document storage, automatic saving, or sync. Private extension sessions cannot access bookmarks.

## 0.6.0

- Add Paragraphs view with highlighted position, normal scrolling, word selection, and exact return to single-word reading.
- Bound long documents to passages while keeping section navigation and keyboard controls.
- Preserve extracted punctuation and spacing through shared token source ranges.

## 0.5.0

- Preview local PDF cleanup for repeated margin headers/footers and page numbers, then explicitly apply or undo it.
- Offer optional line-end hyphen joining, off by default.
- Preserve page navigation and discard stale suggestions after manual edits.
- Record a real-device release checklist and roadmap status.

## 0.4.0

- Remember reading pace, speed limits, scroll mode, and theme locally across web, Firefox, Chrome, and Safari, with a reset control. Document text and PDFs remain unsaved.
- Add automated browser checks and versioned development package generation.
- Prepare Firefox store listing and reviewer documentation, contributor issue templates, and a recorded roadmap.

## 0.3.0

- Open text PDFs locally, with editable extraction and page navigation.
- Add Safari macOS/iOS development packaging alongside Firefox and Chrome.

## 0.2.2

- Keep pace settings visible and request screen wake protection during autoplay.
