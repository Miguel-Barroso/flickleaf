# Flickleaf roadmap

Agreed 25 September 2026; updated 26 September 2026.

## Completed

- 0.4.0: Local pace, speed limits, scroll mode, and theme preferences with reset. No document/history persistence.
- 0.4.0: Automated validation and versioned Firefox, Chrome, Safari, web, and source packages. First CI and draft release succeeded.
- 0.4.0: Firefox listing/reviewer materials, issue templates, and MIT licensing.
- 0.5.0: Local PDF cleanup preview, explicit apply and undo, repeated margin/page-number suggestions, and optional line-end hyphen joining.
- 0.5.0: Real-device release checklist.

## Next, in recommended order

1. Finish Firefox store readiness: real Firefox installation checks, final screenshots, and exact source/package review. The owner does not yet have a Mozilla developer account and asked us to prepare everything before submission. Once the account is ready, review and submit; follow with Chrome. Safari signing and physical Apple-device testing remain pending.
2. Add a normal paragraph view that keeps the reading position when switching to or from single-word playback. This helps readers review dense material without saving personal text.
3. Offer optional local reading-position resume. Saving document text must be a separate explicit choice, with deletion controls and updated privacy documentation.
4. Improve contributor onboarding with a short demo and screenshots.
5. Expand PDF cleanup only from representative documents and feedback; column/table reordering and OCR remain outside the current cleanup.

## Guardrails

All reader changes reach web, Firefox, Chrome, and Safari through shared source. Keep text and PDF processing local, pace settings directly visible, and headings at the same quiet reading focal point. Do not claim comprehension or speed benefits that have not been demonstrated.

See [store preparation](firefox-store.md), [release process](releasing.md), and [device checklist](device-checklist.md).
