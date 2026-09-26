# Firefox store preparation

Status: 0.6.0 package uploaded to AMO with 0 errors and 13 warnings. Listing details saved under `flickleaf`; matching source selected and final Continue clicked. Final confirmation is not yet verified because the Mac locked. No Mozilla approval is claimed. Policy references checked 26 September 2026.

Release revision: `cb716ac` (`v0.6.0`). Local build: Node v26.10.0, npm 11.19.1, macOS arm64. A clean `npm ci && npm run build` from the submitted source archive matched every unpacked file in `dist/`. Firefox smoke checks passed for paste fallback, paragraph view, keyboard return to autoplay, and local two-page PDF extraction. All automated suites and GitHub release validation passed, including unsigned Safari macOS/iOS compilation.

Submitted package SHA-256: `d0c934ad2f55ca0ee5b66fd9b72bf07367f6cdb1e00cedc143411dadba36b4dc`. Submitted source SHA-256: `b18f800b79ff761d2ea90c7a2c93cb2532c7e742009f2056001ddb4c9cd9687f`. These are the local AMO archives; CI ZIP container checksums can differ.

Resume in the signed-in Developer Hub and verify the final source submission and review status before claiming completion. Listing uses MIT, Feeds/News/Blogging, GitHub issue support, the privacy statement below, and desktop Firefox only.

## Listing copy

**Name:** Flickleaf

**Summary:** Read articles and local PDFs one word at a time, with scrolling or hands-off playback at your pace.

**Description:**

Flickleaf puts the words in one place and lets your hand control the pace. Open an article and click the leaf to read it, or select a passage first. Scroll forward or backward, choose a gentle glide or longer freewheel motion, or press Play for hands-off reading.

Set a comfortable pace and minimum/maximum speed. Headings stay centered, with section pauses and navigation markers so you can find your place. Pause to see surrounding text whenever you need context. Switch to Paragraphs for a normal passage view with your current word highlighted, then return to Words without losing your place.

Paste your own text or open a text-based PDF. PDF processing happens on your device: the file, filename, and extracted text are not uploaded. Review and edit extracted text before reading. PDFs are limited to 25 MB and 300 pages; scanned documents need OCR elsewhere, password-protected documents need an unlocked copy, and complex column layouts may require cleanup.

Preview optional cleanup for repeated PDF headers, footers, and page numbers before applying changes. Hyphen joining is optional and should be reviewed. Cleanup and undo stay local.

Reading preferences are saved locally on this browser. Flickleaf does not save document text, PDF files, or a persistent reading history. There are no accounts, analytics, or remote executable code. You can reset saved preferences from the reader.

Flickleaf is an alternative way to present text, not a promise of faster comprehension. It requires Firefox 142 or newer. Firefox-protected pages cannot be read directly; paste text instead.

**Homepage / privacy details:** https://miguelbarroso.com/flickleaf/about/

**Support:** https://github.com/Miguel-Barroso/flickleaf/issues

**Source:** https://github.com/Miguel-Barroso/flickleaf

Suggested category: Productivity. Do not claim Firefox for Android support until the packaged extension has been checked there. Screenshots should show an ordinary article, section navigation, pace controls, and local PDF import with non-sensitive sample text.

## Privacy statement for the extension

Flickleaf processes selected page text, pasted text, and PDFs locally. It does not transmit document content, filenames, browsing history, preferences, identifiers, or usage analytics to the developer or a third party. PDF.js, its worker, fonts, and character maps are included in the extension package.

Only reading preferences (pace, pace limits, scroll mode, and theme) are saved in browser-local extension storage, not browser sync. Document text and PDF bytes remain in the current tab's memory. Reopening the reader on the same page can retain the current position for that page session; refreshing or closing the page clears it. No persistent reading history is created. Reset preferences to remove saved settings. Private browsing must not write preferences or reading data to persistent storage.

Opening the separate website or GitHub sends ordinary website requests to those services. The website's hosting provider can run browser security checks. Those services are separate from local extension parsing; Flickleaf does not attach a PDF or its extracted text to those requests.

Verify the preference claims against the final release package before copying this text to AMO. The manifest's `data_collection_permissions.required: ["none"]` remains appropriate only while the extension transmits no user data. Mozilla defines transmission separately from on-device processing; see its [policy FAQ](https://extensionworkshop.com/documentation/publish/add-on-policies-faq/).

## Permissions for users and reviewers

| Permission | Purpose |
| --- | --- |
| `activeTab` | Temporarily access the page after you invoke Flickleaf. |
| `scripting` | Insert the reader into that page. |
| `menus` | Add Paste text to the toolbar icon's context menu. |
| `storage` | Remember only reading preferences locally. |

No blanket host permission, remote service, account, native messaging, or document-upload endpoint is needed. Preserve `rsvp-reader@local.invalid`: it is the existing internal Firefox add-on ID despite the public rename. An AMO name/slug availability check remains necessary at submission.

## Notes for reviewers

Flickleaf uses Manifest V3 and bundles its own source with esbuild. Include the matching source archive for each uploaded version and the exact release commit. Do not submit a source archive from a different revision. Mozilla's [source submission guide](https://extensionworkshop.com/documentation/publish/source-code-submission/) explains reviewer build requirements.

Rebuild Firefox from the source archive root:

```sh
npm ci
npm run build
npm run lint:extension
npm run package
```

The extension files are in `dist/`; the Firefox ZIP is in `artifacts/`. Only the Firefox build is needed for this review: no Xcode, signing identity, server credentials, or web deployment is required. Record the actual Node/npm versions, operating system, architecture, and archive SHA-256 used for the release in the submission. The lockfile pins the dependency tree; verify a clean rebuild matches the submitted unpacked files. Do not include node_modules, personal documents, credentials, or build caches in the source archive.

Dependencies:

- `@mozilla/readability` 0.6.0: article extraction from a detached document clone; [upstream source](https://github.com/mozilla/readability). Use the exact version in package-lock.json for the submitted build.
- `pdfjs-dist` 6.3.289: [published package](https://www.npmjs.com/package/pdfjs-dist/v/6.3.289), [upstream source](https://github.com/mozilla/pdf.js). `pdf-assets.mjs` copies the published legacy parser and worker unchanged, plus CMaps, standard fonts, and the PDF.js license. Dependency declarations and lockfile identify the public package distributions, as permitted by Mozilla's [third-party library guidance](https://extensionworkshop.com/documentation/publish/third-party-library-usage/).

At the 0.3.0 baseline, `web-ext lint` reports 0 errors and 13 warnings. Four concern Readability parsing, one concerns the dynamic import in `src/pdf-input.js`, and eight concern PDF.js compatibility helpers/imports/Function constructors. This is not a guarantee of store acceptance. Re-run for the submitted version and attach the current report.

The PDF import URL is built from the packaged paste script's URL and a fixed `pdfjs/` path; user file bytes cannot choose it. The native module worker is also a fixed local packaged URL. `getDocument` receives bytes directly with `isEvalSupported: false` and `useWasm: false`. Only `getTextContent` is used; PDF rendering, scripting, and actions are not invoked. These options do not remove compatibility code from the distributed library, so reviewers still need its source and the warning explanation. Extracted article/PDF strings reach the live reader as text, not executable markup.

Test walkthrough: invoke on an article, select a passage and invoke again, change pace and reopen, toggle Play/pause, seek a heading, open Paste text, import a small text PDF, cancel an import, try a scanned or malformed PDF, and reset preferences. Inspect traffic to confirm parsing uses only packaged resources. Verify private browsing does not persist settings.

## Before submission

- [x] The author selected MIT for Flickleaf; include the top-level LICENSE and retain dependency license notices in the release.
- [x] Mozilla developer account is signed in; submission proceeds directly to public distribution/upload without another agreement screen.
- [x] Verify listing name/slug availability and desktop compatibility in AMO.
- [ ] Verify preference-only storage, reset behavior, private browsing, and the `storage` permission; keep data-collection declaration accurate.
- [x] Run automated checks and a real Firefox smoke test of the packaged add-on, including the PDF worker. Chromium/WebKit checks do not replace Firefox testing.
- [x] Create clean reproducible source/package archives from the same release revision; record build environment and checksums.
- [ ] Review every linter warning and include dependency/reviewer notes above; resolve any reviewer request before calling the release approved.
- [ ] Capture accurate screenshots and finalize listing/privacy wording against actual shipped behavior.
- [ ] Upload the listed Firefox package and matching source, complete AMO validation, and inspect the final listing before publishing.
- [ ] After Mozilla signs/approves it, test the signed installation and replace temporary-install guidance with the actual AMO link.

Use Mozilla's [submission walkthrough](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/) and [add-on policies](https://extensionworkshop.com/documentation/publish/add-on-policies/) at submission time; requirements can change. Any new developer agreement must be reviewed by the owner. Store submission is authorized in the current task; verify its final status before calling it complete.
