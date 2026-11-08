# Changelog

## Unreleased

- Dragging along the timeline follows your finger or pointer. Once a press moves, a section tick only catches when you pass right over it (about 3 px), so positions between sections are reachable; a tap or click still lands on a nearby section start. On touch screens the label above the timeline names the section under your finger while you drag.
- Play dims the controls at once instead of after 1.6 seconds.
- Scrolling or swiping in Glide or Freewheel during Play no longer stops reading: the text follows your scroll, then Play carries on at your minimum speed. Stepped still stops.
- The pause before a new section is 2.5 word intervals instead of 1.5: 0.5 seconds at 300 WPM instead of 0.3.
- `npm run package:safari` works with Xcode 27.2, whose converter writes the new `project.xcproj` project format.
- On touch screens, the timeline handles taps and drags itself instead of the native slider. On some sites (darioamodei.com) one tap on the timeline in the iPhone extension made every later tap move the timeline instead of pressing the button under your finger; that can no longer happen, and timeline taps still work on pages that intercept touch events. Mouse, keyboard, and VoiceOver keep the native slider.
- Save place works on plain `http:` pages in the extensions. Browsers withhold Web Crypto there, so the fingerprint failed and saved places were reported unavailable; Flickleaf now computes the same SHA-256 itself, so existing bookmarks still match.
- In Paragraphs view, a long paragraph next to a short one is shown in part instead of dropped: the passage no longer shrinks to a few sentences and needs **Later passage** for the rest.
- In Paragraphs view, a click that ends a drag no longer moves your place, so selecting text is safe.
- PDF cleanup removes lowercase roman page numbers (i, iv, xii) in the margins, keeping capitals, which are often chapter titles, and finds repeated headers and footers in two-page PDFs.

## 0.10.1

- Section ticks on the timeline are magnetic: tapping or dragging near one lands on that section's start, and anywhere else keeps word precision. Touch gets a wider pull than a mouse or pen; the keyboard always moves exactly. Replaces 0.10.0's snap-to-nearest-section on touch, which made positions between sections unreachable.
- Centre the current word without a CSS transform, in a box spanning the reading width. iPad Safari could draw a word shifted right with its first letters cut off.

## 0.10.0

- Hold the current word for about 300 ms when scrolling reverses moving text, in every scroll mode and during autoplay, so the eye can re-anchor before the text runs back. Reversed input waits and still lands; a quick back-and-forth nets out in place. Text at rest reverses immediately.
- Leave footnote markers, their hover tooltips, and footnote backlinks out of the reading text, so a reference number no longer joins the word before it and hidden notes are not read inline. The footnote list itself is still read where the article places it.
- On touch screens, swipes anywhere above the controls read, not only on the word itself. While reading, swipes over the dimmed controls read too, and a tap on a dimmed control still works; when paused, the controls panel scrolls. Touch swipes are 25% less sensitive.
- Keep numbers as their own words in Safari, whose word segmenter does not mark them as words: dates such as "January 2026" and reference numbers no longer join the previous word.
- Swiping no longer stalls on heading cards. A new touch swipe adds to a glide in progress instead of restarting it, and while you move the text by hand a heading takes about a sentence ending's distance; Play keeps the full heading time. A tap still stops a glide.
- In Safari on macOS, Stepped mode moves exactly one word per mouse-wheel notch, however fast the wheel turns. Safari reports accelerated notches from 4 px, which previously stalled or skipped words; trackpad input still accumulates.
- On touch screens, tapping or dragging the timeline lands on the nearest section start and names it. Mouse and keyboard keep word precision.

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
