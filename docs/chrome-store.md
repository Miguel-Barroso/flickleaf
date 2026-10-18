# Chrome Web Store preparation

Prepared 29 September 2026; updated for 0.9.0 on 16 October 2026. The owner registered the Chrome Web Store developer account on 16 October 2026 (registration paid, contact email verified, declared by the owner as a non-trader account; publisher display name set to Miguel Barroso under Account settings on 17 October 2026). 0.9.0 was uploaded and submitted for review through the developer dashboard on 16 October 2026 (category Productivity › Tools, English (United States), five screenshots, promo tile and marquee, About-page privacy policy, no data-use categories, no remote code; Free, Public). The owner confirmed on 17 October 2026 that 0.9.0 is published: <https://chromewebstore.google.com/detail/eifchlcmjmhbkhdecfbfiedjgenajmnl>. Store installation verified by the owner the same day.

## Listing

Name: Flickleaf

Summary: Read articles and local PDFs one word at a time, with scrolling or hands-off playback at your pace.

Single purpose: Present user-selected articles, pasted text, and local PDF text in a reader with adjustable pace and paragraph context.

Support: https://github.com/Miguel-Barroso/flickleaf/issues. Homepage and privacy details: https://miguelbarroso.com/flickleaf/about/. Category: Productivity › Tools; language: English (United States). Leave the store's own Support tab off; support goes to GitHub issues.

**Description:**

Flickleaf puts the words in one place and lets your hand control the pace. Open an article and click the leaf to read it, or select a passage first. Scroll forward or backward, choose stepped word-by-word scrolling, a gentle glide, or longer freewheel motion, or press Play for hands-off reading.

Set a comfortable pace and minimum/maximum speed. Headings stay centered, with brief section pauses and navigation markers so you can find your place. Turn on Hold at sections to wait at each heading until you press Play, scroll, or step forward. Pause to see surrounding text whenever you need context. Switch to Paragraphs for a normal passage view with your current word highlighted, then return to Words without losing your place.

Paste your own text or open a text-based PDF. PDF processing happens on your device: the file, filename, and extracted text are not uploaded. Review and edit extracted text before reading. PDFs are limited to 25 MB and 300 pages; scanned documents need OCR elsewhere, password-protected documents need an unlocked copy, and complex column layouts may require cleanup.

Preview optional cleanup for repeated PDF headers, footers, and page numbers before applying changes. Hyphen joining is optional and should be reviewed. Cleanup and undo stay local.

Reading preferences are saved locally on this browser. Save place optionally stores one local bookmark: a text fingerprint and word position. Reopen the same text and choose Resume saved place to return while paused. Delete saved place removes it independently of preferences. No document text, PDF files, titles, filenames, URLs, or reading history are stored; bookmarks are not synced. There are no accounts, analytics, or remote executable code. You can reset saved preferences from the reader.

Flickleaf is an alternative way to present text, not a promise of faster comprehension. It requires desktop Chrome 120 or newer. Chrome-protected pages, such as chrome:// pages and the Chrome Web Store, cannot be read directly; paste text instead.

### Listing guidance — instructions for the author, never pasted into the store

Everything from the **Description** paragraphs above is public listing copy; nothing in this section belongs in a dashboard field. Keep the description in step with [Firefox store materials](firefox-store.md), changing only the browser requirement and protected-page wording.

## Permission justifications

- `activeTab`: temporary access to the page only after the user invokes Flickleaf.
- `scripting`: insert the reader in that selected page.
- `contextMenus`: expose Paste text from the extension toolbar context menu.
- `storage`: save pace, speed limits, scroll mode, theme, and an explicitly saved single text-fingerprint/index bookmark locally, without sync.

No blanket host access, remotely hosted executable code, accounts, analytics, or document uploads. Page text and PDFs are processed locally. Verify the final Chrome manifest and privacy-form definitions when submitting; do not conflate on-device processing with transmission or claim the website receives no ordinary requests.

## Package and review

Run `npm ci`, `npm run package:chrome`, and `npm run test:chrome`. Upload `artifacts/flickleaf-chrome-0.10.0.zip`, not the Firefox package. Test article extraction, selected text, protected-page paste fallback, PDF import, paragraph switching, private-session preferences, and reset.

Before submission, confirm the developer account and required account security setup. The owner handles any registration payment or new legal agreement. Store images come from `node scripts/capture-store-screenshots.mjs` after `npm run build:chrome`: five 1280×800 screenshots of the actual Chrome build reading Dario Amodei's essay "The Adolescence of Technology" live from its own site (the essay text is never committed), plus the 440×280 promo tile and an optional 1400×560 marquee, all in `artifacts/store-screenshots/`. The 128×128 store icon is `public/icons/icon-128.png`. The captures in `docs/images/` are web-reader documentation images, not store evidence.

## Remaining checklist

- [x] Verify account access and registration.
- [x] Capture Chrome extension screenshots and prepare the promotional tile.
- [x] Recheck listing, privacy disclosures, permissions, and package against the final version.
- [ ] Upload, submit, and record the review result. Submitted 16 October 2026; review result pending.
- [ ] Test the signed installation and publish the real installation link (README, web About availability line, which still says Firefox 0.8.0 and no Chrome release).

Official references checked 29 September 2026: [listing fields](https://developer.chrome.com/docs/webstore/cws-dashboard-listing), [images](https://developer.chrome.com/docs/webstore/images), [privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy), and [program policies](https://developer.chrome.com/docs/webstore/program-policies/policies).

## 0.10.0 submission

Submitted on 18 October 2026 with `npm run submit:chrome` (Chrome Web Store API v2, service-account authentication) from the `v0.10.0` tag, the first scripted Chrome submission. Upload succeeded and the revision went to review; approved and published on 18 October 2026 (`--status` reports PUBLISHED 0.10.0). Check with `npm run submit:chrome -- --status`. Listing text and screenshots were not changed.
