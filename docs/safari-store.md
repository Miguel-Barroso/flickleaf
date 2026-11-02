# App Store preparation (Safari)

Prepared 18 October 2026 for 0.10.1. One App Store Connect record covers iPhone, iPad, and Mac: the iOS and macOS apps share the bundle ID `com.miguelbarroso.flickleaf` (extension `com.miguelbarroso.flickleaf.Extension`), so it is a single free universal purchase. Development signing and device testing passed on a Mac and an iPhone 15 Pro (see [device checklist](device-checklist.md)). App Store Connect record "Flickleaf" created on 18 October 2026 (iOS and macOS); 0.10.1 build 1001 uploaded for both platforms with `npm run submit:safari` the same day. Listing copy, screenshots (iPhone 1206 × 2622, iPad 2064 × 2752, Mac 1440 × 900), header (3840 × 1646) and search-results (3840 × 2560) images, and builds were entered for both platforms on 19 October 2026; source images are in `artifacts/app-store-screenshots/upload/` (not committed). App Store Connect's iPhone slot now defaults to the 6.1″/6.3″ medium display (1206 × 2622 or 1179 × 2556), and the macOS page has no header or search assets. Apple Developer Support changed the seller (team) name to "Miguel Barroso" on 25 October 2026. Both versions were submitted for review on 29 October 2026. App Review answered macOS on 30 October and iOS on 31 October with Guideline 2.1 – Information Needed, its standard request for accounts with little review history: a screen recording made on a physical device running the latest OS, plus the answers under Notes for App Review below. Nothing in the app was reported broken. For macOS, reply on the App Review page with those answers and also enter them in the Notes field; for iOS, enter them in the Notes field and resubmit.

## Listing copy

**Name** (30 characters max): Flickleaf

**Subtitle** (30 max): Read one word at a time

**Promotional text** (170 max, editable without review): Swipe or scroll to set the pace, or press Play. Articles and PDFs are read on your device, with nothing uploaded.

**Description:**

Flickleaf puts the words in one place and lets your hand set the pace. Open an article in Safari and choose Flickleaf to read it one word at a time. Swipe or scroll forward and back, choose stepped word-by-word movement, a gentle glide, or longer freewheel motion, or press Play for hands-off reading.

TURN IT ON IN SAFARI
iPhone and iPad: open Settings → Apps → Safari → Extensions, tap Flickleaf and turn it on, and under Permissions allow Other Websites. Then, on an article in Safari, tap the page menu button in the address bar (on iPad, the puzzle-piece icon to the right of the address), choose Flickleaf, and tap Read this page.
Mac: open Safari → Settings → Extensions and tick Flickleaf, allowing it on the sites you read. Then click the Flickleaf leaf in the Safari toolbar and choose Read this page.
The Flickleaf app shows these steps too.

READ AT YOUR PACE
Set a comfortable pace and minimum and maximum speeds. When you reverse direction, the current word holds for a moment so your eye can find its place. Headings stay centred as section cards; turn on Hold at sections to wait at each one. Tap the timeline to jump between sections, show nearby words for context, or switch to Paragraphs to read normally with your current word highlighted.

YOUR TEXT STAYS YOURS
Paste your own text or open a text-based PDF from Files. Everything is processed on your device: pages, PDFs, filenames, and extracted text are never uploaded. There are no accounts, analytics, or ads. Preferences stay on this device, and Save place keeps only a text fingerprint and word position.

Flickleaf is an alternative way to present text, not a promise of faster comprehension. PDFs are limited to 25 MB and 300 pages; scanned documents need OCR elsewhere. Flickleaf works in Safari, not in other browsers on iPhone and iPad.

**Keywords** (100 max, comma-separated, no spaces needed): reader,reading,rsvp,one word,word by word,focus,article,pdf,pace,scroll,safari extension

**Support URL:** https://github.com/Miguel-Barroso/flickleaf/issues

**Marketing URL:** https://miguelbarroso.com/flickleaf/about/

**Privacy policy URL:** https://miguelbarroso.com/flickleaf/about/#privacy

**Copyright:** 2026 Miguel Barroso

**Category:** Productivity (primary), Reference (secondary)

**Price:** Free, all territories.

### Listing guidance — for the author, not pasted into App Store Connect

Keep the TURN IT ON IN SAFARI section near the top: the owner found enabling and opening the extension hard to discover on iPhone, and App Review also checks that the app explains how to use its extension. Keywords avoid "speed reading" and accessibility terms: following the roadmap guardrail, Flickleaf does not suggest speed, comprehension, or accessibility benefits that have not been demonstrated. If "Flickleaf" is already taken as an App Store name, use "Flickleaf Reader".

## App Privacy

Answer **Data Not Collected**. Flickleaf transmits nothing: page text, pasted text, and PDFs are processed in the extension, and preferences and the optional bookmark use Safari's local extension storage. The container app shows bundled static instructions only. Tracking: No.

## Age rating

No objectionable content in any category; no unrestricted web access is provided by the app itself (the extension reads pages the user already opened in Safari). Expected rating 4+.

## Notes for App Review

Answers to App Review's Guideline 2.1 questions (October 2026), numbered as Apple asked. Paste the block into App Review Information → Notes (4,000 characters max) for both platforms and attach the recordings there; for macOS, also send it as the reply on the App Review page.

```text
Flickleaf is a free Safari web extension for iPhone, iPad, and Mac. The app shows how to turn the extension on; reading happens in Safari.

1. Screen recording
Recordings from a physical iPhone and Mac, each on the latest OS, are attached. Each starts by launching Flickleaf, then turns on the extension, opens an article in Safari, reads it with Play and with swipes or scrolling, jumps between sections, switches to Paragraphs, and opens pasted text and a PDF. Flickleaf has no account registration or login, no user-generated content shared with other people, and no paid content or in-app purchases.

2. Purpose and audience
Flickleaf shows an article one word at a time at a fixed point on the screen, and the reader's hand sets the pace: swipe or scroll forward and back, or press Play for hands-off reading at a chosen speed. It is for people who read long articles or documents on screen and prefer one word at a time, at their own pace, to a full page of text. Headings appear as section cards, a timeline jumps between sections, and the Paragraphs view returns to normal reading with the current word highlighted. It is an alternative way to present text; it makes no claim of faster reading or better comprehension.

3. Setup and main features
No login or sample files are needed.
iPhone and iPad: open Settings → Apps → Safari → Extensions, tap Flickleaf, turn it on, and under Permissions allow Other Websites. In Safari, open any article, for example https://www.darioamodei.com/essay/the-adolescence-of-technology, tap the page menu button in the address bar (on iPad, the puzzle-piece icon to the right of the address), choose Flickleaf, then Read this page.
Mac: open the Flickleaf app, click Quit and Open Safari Settings…, tick Flickleaf, and allow it on websites. On an article, click the Flickleaf leaf in the Safari toolbar, then Read this page.
In the reader, press Play, or swipe (iPhone, iPad) or scroll (Mac) on the word. Tap the timeline to jump to a section, and use Words / Paragraphs to switch views. Paste text / Open PDF, in the same Flickleaf menu, opens a page for pasting text or choosing a text-based PDF from Files (up to 25 MB and 300 pages).

4. External services
None. Flickleaf runs entirely on the device: it uses no servers, accounts, analytics, advertising, payment, or AI services, and makes no network requests of its own. Page text is extracted with Mozilla Readability and PDFs are read with Mozilla PDF.js, open-source libraries bundled in the extension. Preferences stay in Safari's local extension storage.

5. Regional differences
None. Flickleaf works the same in all regions. The interface is in English.

6. Regulated industries and protected material
Not applicable. Flickleaf is not in a regulated industry and includes no third-party content; it only shows pages the user opens in Safari and text or PDFs the user chooses. The bundled libraries are open source under the Apache License 2.0.
```

**Recordings — for the author.** Apple asks for the latest OS: macOS 27.2 was current on 2 November 2026 (this Mac ran 26.7.2), so update the Mac and iPhone first and check that the submitted build (0.10.1 build 1001, installed from TestFlight) still reads correctly on 27 — App Review tests there too. Start each recording before launching the app and keep it to about two minutes. iPhone: Control Center → Screen Recording; tap Flickleaf on the Home Screen, then Settings → Safari → Extensions → Flickleaf on → Safari → the essay → page menu → Flickleaf → Read this page → Play, swipe back and forth, tap a timeline section, Paragraphs and back, close → Paste text / Open PDF → paste a few lines → Start reading → open a text PDF from Files. Mac: Shift-Command-5 → Record Entire Screen; open Flickleaf from Applications → Quit and Open Safari Settings… → tick Flickleaf → the essay → toolbar leaf → Read this page → Play, scroll, timeline, Paragraphs → Paste text / Open PDF. If Safari 27 has moved the extension menu, fix step 3 above to match before pasting.

## Screenshots

Required sets, captured from the real extension in Safari reading the live essay page (the essay text is never committed):
- iPhone 6.9″: 1320 × 2868 (iPhone 17 Pro Max simulator). Smaller iPhone sizes are scaled from this set.
- iPad 13″: 2064 × 2752 (iPad Pro 13-inch simulator), required because the app supports iPad.
- Mac: 2880 × 1800 (or 1440 × 900), 16:10.
Suggested shots: the reader on a word, a section card with the timeline, Paragraphs view, the setup screen of the app, and the paste/PDF page.

## Seller name

App Store shows the developer account holder's name as the seller, which for an individual account is their full legal name rather than a chosen one; the owner wants only "Miguel Barroso" shown. Resolved: on 25 October 2026 Apple Developer Support changed the team name to "Miguel Barroso"; contracts in App Store Connect can take up to two weeks to show it, and earlier tax forms keep the previous name. (The legal name and the support case id are deliberately not recorded here: this repository is public.)

## Upload and submission checklist

1. `FLICKLEAF_APPLE_TEAM=Z7UA3YM9LU npm run package:safari` at the release tag.
2. Archive both schemes for App Store distribution (Apple Distribution certificate, automatic signing) and upload to App Store Connect.
3. Test the build through TestFlight on a real iPhone.
4. Fill in the listing copy above, App Privacy, age rating, screenshots, and review notes; submit both the iOS and macOS versions for review.
