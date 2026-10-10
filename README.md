# Podium Air Website

The official consumer website for [Podium Air](https://github.com/kaizen-flims/Podium-Air). It is a small, dependency-free static site deployed at https://podium-air-website.pages.dev through the connected Cloudflare Pages project; a GitHub Pages workflow is also included.

## Local preview

From this directory, run `python3 -m http.server 8080`, then open `http://localhost:8080`. No install is needed. For the production output, run `npm run build`.

## GitHub Pages

The repository's **Settings → Pages → Build and deployment** source is **GitHub Actions**. Pushing to `main` runs `.github/workflows/pages.yml`, which builds `dist` and publishes it at [kaizen-flims.github.io/Podium-Air-Website](https://kaizen-flims.github.io/Podium-Air-Website/). The build copies only public site files; source and repository metadata outside that allowlist are not published. You can also start the workflow manually in the Actions tab.

The workflow supplies `SITE_URL` so the sitemap includes the repository path. If you change the Pages address or add a custom domain, update that variable in the workflow. Relative asset and navigation links work at both a project path and a domain root. The social image uses an absolute GitHub raw URL.

## Releases

The Android buttons start with a verified signed v1.0.1 APK URL and then checks GitHub's public latest-release endpoint. It accepts only non-draft, non-prerelease semver tags with a matching `Podium-Air-vX.Y.Z.apk` asset in the app repository. On errors or rate limits, the verified fallback stays in place. Update the fallback in `index.html` and `script.js` after a future stable release if you want API-offline visitors to get the newest version too.

The hero and download section also offer a Windows x64 MSI, linked directly to the explicitly published `v0.2.0-preview.1` release asset in `kaizen-flims/Podium-Air-Windows-`. It is labelled as an unsigned local-music preview. Android release discovery updates only anchors marked `data-platform="android"`; it cannot replace Windows links. Both platforms have inline SVG logos, responsive controls and separate compatibility/version notes. Windows source and preview notes are linked alongside the download.

## APK download counter

The compact counter below the header sums uploaded Podium Air APK assets across all public releases, including paginated results and future version or architecture names. It counts release-asset downloads, not unique users. The GitHub link opens the public releases as the source of the count.

Cloudflare Pages serves `/api/downloads` through `functions/api/downloads.js`, sharing verified GitHub results for up to two minutes and retaining a last verified snapshot for API failures. `_routes.json` limits function invocations to that endpoint, keeping the rest of the website static. GitHub Pages falls back to the public GitHub API directly. No token or secret is needed.

On each load, vertical digit reels decelerate and settle in two seconds after the existing logo intro. Slow API requests never delay the animation: the counter starts from verified data, locks onto a live result if it arrives during the roll, and updates statically if the result arrives later. Reduced-motion visitors get the number without rolling digits. The counter runs in an independent module so a failed request cannot interrupt tabs, release links, or scroll reveals.

Every build refreshes the verified HTML fallback from GitHub when available. The browser also retains its last verified count locally. API failures and rate limits show the newest available snapshot with a small “LAST VERIFIED” label and a verification timestamp in the tooltip; they never show dashes or an invented live count. The build versions the counter module, existing app script, and stylesheet by content hash.

## Assets and source

The app icon comes from the Podium Air application repository. The app screenshots were provided by Prem and show the actual app, including visible account and update dialogs. They are not fabricated product screens. The site has no runtime dependency or third-party font. App source and its GPLv3/upstream notices live in the [Android repository](https://github.com/kaizen-flims/Podium-Air).

The independent platform-download verification workflow checks both platforms in Chromium at 1440/768/390/320 px, checks their labels/logos/links and confirms that a future Android API result cannot replace the Windows installer link. It also verifies the live Cloudflare HTML after deployment. Screenshots and live evidence are uploaded as `Platform-download-verification`. Playwright 1.62.1 is installed only for CI verification; the public site remains dependency-free.
