# Podium Air Website

The official consumer website for [Podium Air](https://github.com/kaizen-flims/Podium-Air). It is a small, dependency-free static site deployed at https://podium-air-website.pages.dev through the connected Cloudflare Pages project; a GitHub Pages workflow is also included.

## Local preview

From this directory, run `python3 -m http.server 8080`, then open `http://localhost:8080`. No install is needed. For the production output, run `npm run build`.

## GitHub Pages

The repository's **Settings → Pages → Build and deployment** source is **GitHub Actions**. Pushing to `main` runs `.github/workflows/pages.yml`, which builds `dist` and publishes it at [kaizen-flims.github.io/Podium-Air-Website](https://kaizen-flims.github.io/Podium-Air-Website/). The build copies only public site files; source and repository metadata outside that allowlist are not published. You can also start the workflow manually in the Actions tab.

The workflow supplies `SITE_URL` for deployment-specific social image URLs. Cloudflare at `https://podium-air-website.pages.dev/` is the preferred search URL: both pages declare absolute canonicals there, and generated sitemap/robots discovery URLs use that same host even on the GitHub Pages mirror. Relative asset and navigation links still work at both a project path and a domain root. If the preferred domain changes, update the canonical links, homepage JSON-LD/`og:url`, and sitemap base in `scripts/build.mjs` together.

The homepage includes linked `WebSite`, `WebPage`, and `SoftwareApplication` JSON-LD for the existing app. It intentionally makes no rating or review claims; schema validity alone does not make it eligible for Google’s software-app rich result. SEO changes must preserve the page body, visuals, scripts, and assets. After an approved production deployment, inspect the canonical homepage in Search Console, request indexing, and check/submit `https://podium-air-website.pages.dev/sitemap.xml`.

## Creator identity

`prem.html` is the public professional profile for Prem Das, also known as Kaizen and `@nottt.premm`. Its canonical URL is `/prem` (Cloudflare serves HTML pages without the extension). It uses the existing information-page layout and is linked from the unchanged-text footer credit and sitemap. Its Person identifier is shared with the homepage WebSite creator and SoftwareApplication maintainer. Original app contributor credits remain in the app repository. This provides consistent public identity information; it does not guarantee a Google AI answer or Knowledge Panel.

## Releases

The Android buttons start with a verified signed v1.0.1 APK URL and then checks GitHub's public latest-release endpoint. It accepts only non-draft, non-prerelease semver tags with a matching `Podium-Air-vX.Y.Z.apk` asset in the app repository. On errors or rate limits, the verified fallback stays in place. Update the fallback in `index.html` and `script.js` after a future stable release if you want API-offline visitors to get the newest version too.

Windows preview downloads are currently removed. Android buttons retain their platform icon, stable release URL and compatibility note.

## APK download counter

The tall rolling counter is inside the hero, under the Android CTA. It counts uploaded APK release-asset downloads, including repeats. The adjacent red graph compares genuine dated snapshots with a dashed connector and a translucent red fill; daily history between observations is unavailable.

Cloudflare Pages serves `/api/downloads`. GitHub API results share a canonical 60-second edge cache; responses to browsers and CDNs use `no-store`. An optional server-only `GITHUB_TOKEN` Pages secret increases the upstream quota. The token is never returned or embedded in browser assets.

Cloudflare's shared unauthenticated GitHub quota can be exhausted. The `Refresh verified APK downloads` workflow uses the automatic Actions token to fetch all release pages every five minutes and publishes `download-count.json` and up to 366 daily verified observations to the dedicated `download-data` branch. Data-only commits use `[skip ci]` and do not require a website rebuild. The endpoint reads this independent snapshot on upstream failure, compares it with its last observation and build snapshot, and chooses the newest verification time. Fallbacks always return `live: false` with their original timestamp; no count or intervening daily history is invented. Actions schedules can be delayed by GitHub, so five minutes is a target rather than a guaranteed deadline. Failed runs leave the previous verified data intact.

The browser polls once per minute while visible, retries the visitor's public GitHub API quota when the edge returns a fallback, refreshes after returning to the tab/reconnecting/restoring a page, and synchronizes verified observations between tabs. Older responses cannot overwrite a newer observation. The counter and graph receive the same data event. The graph also fetches maintained daily observations every five minutes. Outages retain the last verified number and label it `LAST VERIFIED`; if no verified source exists the endpoint returns 503 instead of zero.

`npm test` checks aggregation, pagination, rate limits, edge caching and fallback ordering. `scripts/check-counter-browser.mjs` checks polling, graph agreement, stale data, outage recovery and tab synchronization with mocked test observations. Those test numbers are never shipped as production data. Build-generated HTML/JSON use only successful GitHub observations or an earlier verified snapshot.

## Assets and source

The app icon comes from the Podium Air application repository. The app screenshots were provided by Prem and show the actual app, including visible account and update dialogs. They are not fabricated product screens. The site has no runtime library dependency. Tall digits use self-hosted Barlow Condensed Bold under the included SIL Open Font License. App source and its GPLv3/upstream notices live in the [Android repository](https://github.com/kaizen-flims/Podium-Air).

The verification workflow checks Android buttons at 1440/768/390/320px, APK release discovery, gallery keyboard access, hero counter placement and red graph fill. Screenshots include the complete V1 hero and full desktop/mobile pages. Changes go through a pull request; production publication requires review/merge under AGENTS.md.
