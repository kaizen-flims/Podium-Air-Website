# Tester build distribution

Hub: https://podiumair.pages.dev/testers
Public asset repository: kaizen-flims/PodiuAirTesters

The public asset repository was created by Prem. Android audit binaries are copied from the pinned CI artifact, verified by checksum, and distributed as prereleases. Each manifest update must follow a verified release upload.

## Distribution model

- App source and PRs remain in Podium-Air; website code remains here.
- Copy approved PR binaries into prereleases in the dedicated asset repository. Never call these stable or rename an audit version to v1.0.3.
- The release repository is public for downloads without a GitHub login. It can be found through GitHub or shared URLs; this is obscurity, not access control.
- Leave it out of the official homepage navigation, profile pins, topics and the website sitemap. The hub and build manifest have noindex metadata/headers. Do not use robots Disallow to prevent crawlers seeing noindex.
- Do not automatically publish arbitrary PR artifacts or run PR code with release credentials. Select the expected trusted commit and verify artifacts first.

## First Android package

- PR: https://github.com/kaizen-flims/Podium-Air/pull/6
- Commit: 6cd04956ae3e65a1d17716c463f9c7273cd4dc14
- Actions run: 39635593788; artifact: 12362086145
- ZIP digest from GitHub: 5427700eb0c9a41194d3e8209a7a0c2d888a031f9ad4573adbaca2d872b70ed2
- APK name: Podium-Air-Audit-2-v1.8.1.apk
- Version: 1.0.2-audit2-v1.8.1-branding4
- Android package: com.podium.air.audit2
- Label: Podium Air Audit 2

Keep the artifact unchanged. Extract the APK, verify its version/package/signature and SHA-256, and include a SHA256SUMS file. Use a prerelease tag such as android-audit2-branding4. Include a link to the exact source commit and GPL license/credits in the asset repository/release. This preserves source access and attribution for distributed binaries.

After publishing, open the exact release asset download signed out to verify that it works. Then add the real asset to testers-builds.json with name, label, size, SHA-256 and browser_download_url. The page only accepts download URLs under the dedicated asset repository. Change the Android status to Available for testing only after verification. Update the manifest via a website PR for each new build.

Desktop packages need a separate review of their install identities before publication; do not imply side-by-side isolation. Web/PWA remains on hold.

## Feedback

The report form only generates text in the browser. It does not upload reports, attach screenshots, create GitHub issues or send messages. The tester copies it and shares it with Prem through their existing channel. Form contents are not persisted; only checklist completion is saved locally, scoped to platform and build version.

## Checks

npm run build
node scripts/check-testers.mjs
node scripts/check-seo.mjs
node scripts/check-protected.mjs
npm run check
npm test

APK SHA-256: b7ecb2ef09f168f8bb3fc861aaf3e41645cd2d954f6611d047e1a283a115b518
