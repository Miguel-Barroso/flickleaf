# Chrome Web Store preparation

Prepared 29 September 2026 for 0.6.0. No Chrome developer account, uploaded item, payment, or store approval has been verified. This document is submission material, not a claim of publication.

## Listing

Name: Flickleaf

Summary: Read articles and local PDFs one word at a time, with scrolling or hands-off playback at your pace.

Single purpose: Present user-selected articles, pasted text, and local PDF text in a reader with adjustable pace and paragraph context.

Use the feature description and privacy statement in [Firefox store materials](firefox-store.md), replacing the Firefox minimum/protected-page wording with desktop Chrome 120 or newer. Support: https://github.com/Miguel-Barroso/flickleaf/issues. Homepage and privacy details: https://miguelbarroso.com/flickleaf/about/.

## Permission justifications

- `activeTab`: temporary access to the page only after the user invokes Flickleaf.
- `scripting`: insert the reader in that selected page.
- `contextMenus`: expose Paste text from the extension toolbar context menu.
- `storage`: save only pace, speed limits, scroll mode, and theme locally, without sync.

No blanket host access, remotely hosted executable code, accounts, analytics, or document uploads. Page text and PDFs are processed locally. Verify the final Chrome manifest and privacy-form definitions when submitting; do not conflate on-device processing with transmission or claim the website receives no ordinary requests.

## Package and review

Run `npm ci`, `npm run package:chrome`, and `npm run test:chrome`. Upload `artifacts/flickleaf-chrome-0.6.0.zip`, not the Firefox package. Test article extraction, selected text, protected-page paste fallback, PDF import, paragraph switching, private-session preferences, and reset.

Before submission, confirm the developer account and required account security setup. The owner handles any registration payment or new legal agreement. Prepare an extension icon, a 440×280 promotional tile, and at least one 1280×800 (or supported 640×400) screenshot of the actual Chrome build. The captures in `docs/images/` are web-reader documentation images, not Chrome store evidence; capture the packaged extension before upload.

## Remaining checklist

- [ ] Verify account access and registration.
- [ ] Capture Chrome extension screenshots and prepare the promotional tile.
- [ ] Recheck listing, privacy disclosures, permissions, and package against the final version.
- [ ] Upload, submit, and record the review result.
- [ ] Test the signed installation and publish the real installation link.

Official references checked 29 September 2026: [listing fields](https://developer.chrome.com/docs/webstore/cws-dashboard-listing), [images](https://developer.chrome.com/docs/webstore/images), [privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy), and [program policies](https://developer.chrome.com/docs/webstore/program-policies/policies).
