# Flickleaf roadmap

Agreed 25 September 2026; updated 1 October 2026.

## Completed

- 0.4.0: Local pace, speed limits, scroll mode, and theme preferences with reset. No document/history persistence.
- 0.4.0: Automated validation and versioned Firefox, Chrome, Safari, web, and source packages. First CI and draft release succeeded.
- 0.4.0: Firefox listing/reviewer materials, issue templates, and MIT licensing.
- 0.5.0: Local PDF cleanup preview, explicit apply and undo, repeated margin/page-number suggestions, and optional line-end hyphen joining.
- 0.5.0: Real-device release checklist.

- 0.6.0: Paragraph view with exact position switching, native scrolling, and bounded passages.

- Contributor onboarding: one-minute illustrated guide and CONTRIBUTING instructions. Chrome listing and permission materials prepared; account and submission remain pending.

- 0.7.0: Opt-in single local bookmark, exact-text matching, explicit resume, and independent deletion. No document storage. Submitted to Mozilla on 1 October 2026.

- 0.7.1: Saved places on plain `http:` pages, drag-safe paragraph selection, roman-numeral and two-page PDF cleanup, and a [maintainability plan](maintainability.md).

## Next, in recommended order

1. Finish Firefox store readiness: real Firefox installation checks, final screenshots, and exact source/package review. 0.6.0 is approved and publicly listed; 0.7.0 is awaiting review, with 0.7.1 to follow. Add listing screenshots, address any reviewer requests, then verify signed installation and update public install links; follow with [Chrome submission](chrome-store.md). Safari signing and physical Apple-device testing remain pending.
2. Validate bookmarks on physical devices and gather feedback before expanding to multiple saved places. Saving document text remains a separate, unimplemented feature requiring explicit choice.
3. Expand the illustrated contributor guide with a short recorded demo and actual extension screenshots.
4. Expand PDF cleanup only from representative documents and feedback; column/table reordering and OCR remain outside the current cleanup.

## Guardrails

All reader changes reach web, Firefox, Chrome, and Safari through shared source. Keep text and PDF processing local, pace settings directly visible, and headings at the same quiet reading focal point. Do not claim comprehension or speed benefits that have not been demonstrated.

See [store preparation](firefox-store.md), [release process](releasing.md), and [device checklist](device-checklist.md).
