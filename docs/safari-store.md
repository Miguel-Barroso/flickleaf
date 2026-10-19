# App Store preparation (Safari)

Prepared 18 October 2026 for 0.10.1. One App Store Connect record covers iPhone, iPad, and Mac: the iOS and macOS apps share the bundle ID `com.miguelbarroso.flickleaf` (extension `com.miguelbarroso.flickleaf.Extension`), so it is a single free universal purchase. Development signing and device testing passed on a Mac and an iPhone 15 Pro (see [device checklist](device-checklist.md)). App Store Connect record "Flickleaf" created on 18 October 2026 (iOS and macOS); 0.10.1 build 1001 uploaded for both platforms with `npm run submit:safari` the same day. Listing copy, screenshots (iPhone 1206 × 2622, iPad 2064 × 2752, Mac 1440 × 900), header (3840 × 1646) and search-results (3840 × 2560) images, and builds were entered for both platforms on 19 October 2026; source images are in `artifacts/app-store-screenshots/upload/` (not committed). App Store Connect's iPhone slot now defaults to the 6.1″/6.3″ medium display (1206 × 2622 or 1179 × 2556), and the macOS page has no header or search assets. Not yet submitted for review: the seller-name question was sent to Apple Developer Support on 18 October 2026 and awaits a reply.

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

Flickleaf is a Safari web extension; the app explains how to enable it.
1. On iPhone or iPad, open Settings → Apps → Safari → Extensions → Flickleaf, turn it on, and allow Other Websites. On Mac, open Safari → Settings → Extensions and tick Flickleaf.
2. In Safari, open any article (for example https://www.darioamodei.com/essay/the-adolescence-of-technology), open the page menu (iOS) or click the toolbar leaf (Mac), choose Flickleaf, then Read this page.
3. Press Play, or swipe/scroll on the word to move through it. Paste text / Open PDF opens a local paste page for your own text or a PDF from Files.
No account or sign-in is needed. Nothing is uploaded; all processing is on the device.

## Screenshots

Required sets, captured from the real extension in Safari reading the live essay page (the essay text is never committed):
- iPhone 6.9″: 1320 × 2868 (iPhone 17 Pro Max simulator). Smaller iPhone sizes are scaled from this set.
- iPad 13″: 2064 × 2752 (iPad Pro 13-inch simulator), required because the app supports iPad.
- Mac: 2880 × 1800 (or 1440 × 900), 16:10.
Suggested shots: the reader on a word, a section card with the timeline, Paragraphs view, the setup screen of the app, and the paste/PDF page.

## Seller name

App Store shows the developer account holder's name as the seller. For an individual account that is the legal name, "Miguel Christopher Gambell Barroso"; the owner wants only "Miguel Barroso" shown. Status: ask Apple Developer Support before the first submission.

## Upload and submission checklist

1. `FLICKLEAF_APPLE_TEAM=Z7UA3YM9LU npm run package:safari` at the release tag.
2. Archive both schemes for App Store distribution (Apple Distribution certificate, automatic signing) and upload to App Store Connect.
3. Test the build through TestFlight on a real iPhone.
4. Fill in the listing copy above, App Privacy, age rating, screenshots, and review notes; submit both the iOS and macOS versions for review.
