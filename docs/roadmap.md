# Flickleaf roadmap

Agreed 25 September 2026; updated 29 September 2026.

## Completed

- 0.4.0: Local pace, speed limits, scroll mode, and theme preferences with reset. No document/history persistence.
- 0.4.0: Automated validation and versioned Firefox, Chrome, Safari, web, and source packages. First CI and draft release succeeded.
- 0.4.0: Firefox listing/reviewer materials, issue templates, and MIT licensing.
- 0.5.0: Local PDF cleanup preview, explicit apply and undo, repeated margin/page-number suggestions, and optional line-end hyphen joining.
- 0.5.0: Real-device release checklist.

- 0.6.0: Paragraph view with exact position switching, native scrolling, and bounded passages.

- Contributor onboarding: one-minute illustrated guide and CONTRIBUTING instructions. Chrome listing and permission materials prepared; account and submission remain pending.

- 0.7.0: Opt-in single local bookmark, exact-text matching, explicit resume, and independent deletion. No document storage.

- 0.8.0: Stepped scroll mode (one word per notch, no glide), a C shortcut for context, section-menu reset to the current section's start, and the Direct mode relabeled Glide.

## Next, in recommended order

1. Finish Firefox store follow-through: 0.8.0 is approved and publicly listed (submitted 6 October via the scripted `npm run submit:firefox`). Verify the signed installation, refresh the listing description, release notes, and screenshots for 0.8.0, and address any later reviewer requests; follow with [Chrome submission](chrome-store.md). Safari signing and physical Apple-device testing remain pending.
2. Validate bookmarks on physical devices and gather feedback before expanding to multiple saved places. Saving document text remains a separate, unimplemented feature requiring explicit choice.
3. Expand the illustrated contributor guide with a short recorded demo and actual extension screenshots. The quick-start captures were refreshed from the live 0.8.0 web reader via `scripts/capture-quick-start.mjs`.
4. Expand PDF cleanup only from representative documents and feedback; column/table reordering and OCR remain outside the current cleanup.
5. Optional hold at sections: a toggle so arriving on a heading card pauses indefinitely until the reader scrolls, steps, or presses Play, replacing the timed section pause. Off by default; remembered with the other preferences. Suggested label **Hold at sections**, a quiet aria-pressed button beside the Section picker, since both appear only when headings exist. Implementation notes: stop in the engine when forward playback or momentum lands on a heading token, without re-triggering at the same index on resume; keep the quiet reading state while holding — a heading must not reveal the surrounding controls by pausing (today the dimmed `reading` state drops whenever the engine pauses, so holding needs its own state or an explicit exception); suggested status line "Holding at section · scroll to continue".
6. Direction-change grace: when scroll input reverses direction, hold the current word briefly (a tunable ~300 ms) before motion continues, so the eye can re-anchor instead of the text immediately running backward. Engine-level, all scroll modes (Glide/Freewheel already brake first, so the grace applies once velocity crosses zero; Stepped applies it to the first reversed step). A behavior refinement, not a toggle; must not eat deliberate rapid back-and-forth corrections entirely — the reversed input still lands, it just waits out the grace. It matters most for a short reverse scroll: a nudge back of a word or two to re-read should settle there long enough to be read, not immediately run further backward.
7. Japanese localization: reader UI, web pages, and store listings in Japanese. The tokenizer already segments Japanese text (covered by unit tests); this is interface language only. Needs the reader's inline template strings lifted into a shared strings module in src, extension `_locales`/browser.i18n wiring for the manifest and UI, a lang="ja" variant of the web pages, and translated AMO/Chrome listing copy. Keep the quiet-reading voice of the English copy; have a native speaker review before shipping.

## Guardrails

All reader changes reach web, Firefox, Chrome, and Safari through shared source. Keep text and PDF processing local, pace settings directly visible, and headings at the same quiet reading focal point. Do not claim comprehension or speed benefits that have not been demonstrated.

See [store preparation](firefox-store.md), [release process](releasing.md), and [device checklist](device-checklist.md).
