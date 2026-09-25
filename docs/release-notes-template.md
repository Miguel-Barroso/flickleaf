These are development packages, not browser-store releases. Review and edit these notes before publishing this draft.

- Firefox ZIP: temporary installation; Mozilla signing is still required for normal installation.
- Chrome ZIP: unpack and load as an unpacked extension in Developer mode.
- Safari Xcode ZIP: unsigned source project for macOS and iOS/iPadOS. Signing and physical-device testing are required before distribution. No installable App Store/TestFlight build is included.
- Web ZIP: static site assets; deployment is a separate step.
- Source ZIP: original source and lockfile for review and rebuilding, including Mozilla source submission. See docs/releasing.md.
- SHA256SUMS.txt: SHA-256 checksums of the ZIP packages.

Before publishing: describe user-visible changes, record manual device checks and known limitations, and confirm the web deployment matches this version. Automated WebKit tests do not establish real Safari extension compatibility.
