# Real-device release checklist

Record device, OS/browser version, package version/commit, date, and result for each run. Unticked items are not claims of support. Use non-sensitive sample documents. Automated WebKit emulation is not a physical iPhone test.

## Platforms

- [ ] Desktop Firefox: temporary-install the exact packaged manifest, invoke on a real article/selection, and check the local PDF worker. Repeat with the signed package after Mozilla approval.
- [ ] Desktop Chrome: load the exact unpacked release and test toolbar/Paste text paths.
- [ ] Mac Safari: sign/install the generated app, enable extension, grant page access, and test popup/reader/PDF import.
- [ ] iPhone Safari: sign/install, enable the extension, grant page access, and test an article and a PDF from Files.
- [ ] iPhone Firefox web app: sample/pasted text, PDF selection from Files, and swipe reading. This browser cannot use the Safari extension.
- [ ] Android Chrome web app: pasted text, PDF picker, short/tall viewports, and gesture behavior.
- [ ] Firefox Android: do not claim extension support until the actual installation and required APIs pass.

## Reading and privacy

- [ ] Heading cards stay centered and do not reveal the background during playback.
- [ ] Swipes move the reader without scrolling the underlying page; closing restores the original page position.
- [ ] Pace and scroll-mode controls remain visible; small screens can reach every control and reset.
- [ ] Saved preferences survive reopening/reload. Reset clears only Flickleaf preferences; extension private sessions do not save changes.
- [ ] Autoplay requests screen wake protection; pause, tab changes, and close release it. Note OS power-saving denial rather than claiming a guarantee.
- [ ] PDF import, cancellation, malformed/scanned/password errors preserve the draft.
- [ ] Cleanup preview leaves the draft unchanged; apply and undo work; manual editing discards stale suggestions. Review real compounds before enabling hyphen joining.
- [ ] Page section markers survive cleanup. No original file, extracted text, filename, or preview text is sent in network requests or saved to persistent storage.
- [ ] Keyboard navigation, zoom, portrait/landscape changes, and the software keyboard do not hide essential actions.

## Current evidence

0.4.0 passed unit tests, Chromium/WebKit automation, actual Chromium extension loading, and unsigned Apple app compilation. Physical Safari/iPhone extension verification and signed browser-store installation are still pending. Add dated results rather than checking boxes based only on automated tests.

On 26 September 2026, version 0.6.0 (`cb716ac`) passed 37 unit tests, all browser automation suites, and CI including unsigned macOS/iOS compilation. A real desktop Firefox temporary installation passed paste fallback, Paragraphs/Words switching, keyboard playback, and local two-page PDF extraction. These are smoke checks, not completion of every checklist item above; OS/browser versions were not recorded. Signed Firefox installation and physical Apple-device verification remain pending.
