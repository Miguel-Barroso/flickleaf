# Validation and releases

Every pull request and main-branch push runs dependency installation from the lockfile, version consistency, all four builds, unit tests, Chromium reader and real Chrome-extension checks, desktop/mobile WebKit web checks, Safari WebKit checks with mocked extension APIs, and Firefox manifest lint. Node 24 is used because the locked dependency tree requires modern Node. The Linux build creates Safari web resources; it does not run Apple's converter.

## Prepare a version

1. Update package.json, both root version fields in package-lock.json, and public/manifest.json together. Update web asset cache versions, setup/About documentation and release notes where needed.
2. Run `npm ci`, `npx playwright install --with-deps chromium webkit`, `npm run build:all`, `npm test`, every `test:*` browser script, and `npm run lint:extension`. Inspect warnings; a successful lint exit means no errors, not zero warnings.
3. On a Mac with full Xcode, run `npm run package:safari` and verify both generated schemes. The converter regenerates its output, so never keep irreplaceable signing edits there.
4. Manually test installed extensions, real iPhone Safari scrolling, headings, autoplay/sleep handling, local PDF import, preferences, and page reading. Automated WebKit runs mock extension APIs and do not replace this check.
5. Commit and push, then create and push an annotated `vX.Y.Z` tag matching the package version. Tags should identify reviewed commits on main. Do not tag unreviewed changes.

The Package release workflow first reuses validation, then generates Firefox, Chrome, Safari Xcode, static web, and original-source ZIPs on macOS 15. Both Apple app targets compile with signing disabled. It adds checksums, uploads workflow artifacts, and creates a **draft** GitHub release. No store credentials or hosting secrets are used, and nothing is submitted to Mozilla, Google, Apple, or the live website.

Manual workflow runs must select the matching existing version tag, not a branch. A version mismatch fails. A draft/release that already exists also fails rather than silently replacing published assets; inspect the existing release and deliberately resolve it before retrying.

## Review the draft

Replace the release-note template with actual changes and manual checks. Review all packages and SHA256SUMS.txt, deploy the matching web files through the documented hosting process, and publish the draft only when ready. Firefox packages are unsigned, Chrome packages are for unpacked installation, and Safari packages contain unsigned Xcode source, not an installable iPhone application. Store submission and Apple signing remain separate deliberate steps.

## Submit to Mozilla

`npm run submit:firefox` performs the listed-channel Firefox submission as one deliberate local step. It verifies version consistency, refuses a dirty working tree or an untagged HEAD (the uploaded source archive comes from HEAD and must match the built package), rebuilds `dist`, recreates the source ZIP exactly as the release workflow does, then uploads both through Mozilla's submission API via `web-ext sign --channel listed`. It returns after AMO validation; human review still takes days and is tracked on the Developer Hub, where release notes are added. Credentials are a JWT issuer/secret pair generated once at the [Developer Hub API keys page](https://addons.mozilla.org/developers/addon/api/key/), exported as `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET` in your own terminal; they are never stored in the repository or CI. `npm run submit:firefox -- --dry-run` runs every check and build but submits nothing — the `--` separator is required, because npm consumes flags that come before it and the script would then submit for real. Chrome (`npm run submit:chrome`, below), Apple signing, and website deployment remain separate deliberate steps.

## Submit to the Chrome Web Store

`npm run submit:chrome` uploads and submits the Chrome package through the [Chrome Web Store API v2](https://developer.chrome.com/docs/webstore/using-api) as one deliberate local step. It applies the same gates as Firefox (matching versions, clean tree, HEAD tagged `vX.Y.Z`), runs `npm run package:chrome`, refuses to continue while another submission is pending review, uploads `artifacts/flickleaf-chrome-X.Y.Z.zip`, waits for processing, checks the version the store read from the manifest, then publishes. Publishing submits for review with the listing's existing visibility; the update goes live once approved. Listing text, screenshots, and privacy answers are not changed by the API and stay in the dashboard. `npm run submit:chrome -- --status` reports the published and submitted revisions without changing anything, and is a safe way to test credentials. `npm run submit:chrome -- --dry-run` runs the gates and build but contacts nothing.

Credentials stay in your own terminal, never in the repository or CI. `CWS_PUBLISHER_ID` comes from the Developer Dashboard address or Publisher → Settings. Authentication uses the `cws-publisher@flickleaf-publishing.iam.gserviceaccount.com` service account (Google Cloud project `flickleaf-publishing`, Chrome Web Store API enabled, no keys, no project roles). It is registered in the Developer Dashboard under **Publisher → Settings** (one per publisher), and the owner's Google account holds Service Account Token Creator on it, so gcloud mints a one-hour token per run and nothing long-lived is stored:

    CWS_PUBLISHER_ID=$(security find-generic-password -s cws-publisher-id -w) CWS_ACCESS_TOKEN=$(gcloud auth print-access-token --impersonate-service-account=cws-publisher@flickleaf-publishing.iam.gserviceaccount.com --scopes=https://www.googleapis.com/auth/chromewebstore) npm run submit:chrome

Add `-- --status` to read review state only. A 403 "Permission denied on resource" means the service account is not registered on the publisher; a token error means `gcloud auth login` is needed. The script also accepts an OAuth client and refresh token (`CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`) instead of `CWS_ACCESS_TOKEN`.

## Submit to the App Store (Safari)

`FLICKLEAF_APPLE_TEAM=Z7UA3YM9LU npm run submit:safari` archives the iOS and macOS apps and uploads both to App Store Connect, using the Apple account signed in to Xcode and automatic App Store signing (cloud-managed Apple Distribution certificates). It checks version consistency and a clean tree, and refuses if the extension source (`src`, `public`, `safari/public`, `build.mjs`, the lockfile) differs from the `vX.Y.Z` tag; the container app in `safari/app` may change after a tag. The build number derives from the version (0.10.0 → 1000), so each version uploads once; release a new version to upload again. The app record must already exist in App Store Connect. `-- --dry-run` exports store-signed builds to `artifacts/app-store` without uploading. Xcode's IPA step needs Apple's `rsync`, so the script runs Xcode with a system-only PATH; Homebrew's rsync 3.x makes exports fail with "Copy failed". Listing copy, privacy answers, and review notes are in [safari-store.md](safari-store.md).

## Source for Mozilla review

The source ZIP is produced by `git archive` at the exact release commit; it contains original code, package-lock.json, and build scripts, with no node_modules or generated output. Extract it, enter flickleaf-source, install Node 24, run `npm ci` and `npm run build`. The resulting dist directory is the Firefox extension; `npm run package` produces its ZIP. Builds use esbuild and local npm dependencies, including PDF.js assets. Supply this source ZIP with the Firefox package when Mozilla requests original source, together with these instructions and any dependency/reviewer notes. ZIP timestamps may differ when rebuilding; compare unpacked contents rather than archive bytes.

## Current validation limits

CI exercises Firefox-target JavaScript in Chromium and lints the Firefox manifest; it does not install the unsigned extension in Firefox. Safari JavaScript is exercised in WebKit with mocked extension APIs, and native app compilation is unsigned. Neither proves signed Safari installation or physical-device behavior. Browser-store review findings must be resolved separately.
