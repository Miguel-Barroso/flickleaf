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

## Source for Mozilla review

The source ZIP is produced by `git archive` at the exact release commit; it contains original code, package-lock.json, and build scripts, with no node_modules or generated output. Extract it, enter flickleaf-source, install Node 24, run `npm ci` and `npm run build`. The resulting dist directory is the Firefox extension; `npm run package` produces its ZIP. Builds use esbuild and local npm dependencies, including PDF.js assets. Supply this source ZIP with the Firefox package when Mozilla requests original source, together with these instructions and any dependency/reviewer notes. ZIP timestamps may differ when rebuilding; compare unpacked contents rather than archive bytes.

## Current validation limits

CI exercises Firefox-target JavaScript in Chromium and lints the Firefox manifest; it does not install the unsigned extension in Firefox. Safari JavaScript is exercised in WebKit with mocked extension APIs, and native app compilation is unsigned. Neither proves signed Safari installation or physical-device behavior. Browser-store review findings must be resolved separately.
