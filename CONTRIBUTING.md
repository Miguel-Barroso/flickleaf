# Contributing to Flickleaf

Start with the [one-minute guide](docs/quick-start.md), [roadmap](docs/roadmap.md), and [project conventions](AGENTS.md). Open an issue before a large feature so its scope and privacy implications can be discussed.

## Run locally

Use Node 24 and npm. Clone the repository, then run:

```sh
npm ci
npm run build
npm run dev
```

Open `http://127.0.0.1:4173/demo.html`; add `?reader` to start in the reader. The standalone website is built with `npm run build:web` into `dist-web/flickleaf/`; serve `dist-web` as the root so `/flickleaf/` paths resolve.

## Where changes belong

Keep playback and tokenization in `src/core.js`, shared reader controls in `src/reader.js`, paragraph rendering in `src/paragraph-view.js`, and preference storage in `src/preferences.js`. Web and extension entry points should reuse those modules. Never add a document upload or persistent text/history storage implicitly.

Shared reader changes must reach web, Firefox, Chrome, and Safari. Keep pace controls visible, headings centered, keyboard access intact, and host-page scrolling locked only while the reader is open.

## Validate a change

For shared behavior changes, run:

```sh
npx playwright install chromium webkit
npm run build:all
npm test
npm run test:browser
npm run test:web
npm run test:chrome
npm run test:safari
npm run lint:extension
```

See README for `CHROMIUM_PATH` when the default executable is unavailable. Firefox-target automation runs in Chromium; Safari automation uses WebKit with mocked extension APIs. Record actual device checks separately in [the device checklist](docs/device-checklist.md). Documentation-only changes need link/copy review and a web build when website files change.

## Send a focused contribution

Describe the problem, the resulting behavior, and what you tested. Include screenshots for visible changes, using non-sensitive sample text. Do not attach private PDFs, credentials, or personal browsing data. Retain dependency license notices. Release tags, store submissions, signing, and production deployment are maintainer tasks; see [releasing](docs/releasing.md).
