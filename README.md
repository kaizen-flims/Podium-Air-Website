# Podium Air Website

The official consumer website for [Podium Air](https://github.com/kaizen-flims/Podium-Air). It is a small, dependency-free static site designed for Cloudflare Pages.

## Local preview

From this directory, run `python3 -m http.server 8080`, then open `http://localhost:8080`. No install is needed. For the production output, run `npm run build`.

## Cloudflare Pages

Connect this repository to a Cloudflare Pages project. Select **no framework**, build command `npm run build`, and output directory `dist`. The build copies only the public site files; repository metadata and sources outside that allowlist are not published. Choose the project subdomain in Cloudflare; `podiumair.pages.dev` is an intended address, not a reserved one.

Before publishing on a different address, replace `https://podiumair.pages.dev` in `robots.txt` and `sitemap.xml` with the confirmed site URL. The social image uses a stable absolute GitHub raw URL, which becomes available after this repository is created.

## Releases

The page starts with a verified signed v1.0.1 APK URL and then checks GitHub's public latest-release endpoint. It accepts only non-draft, non-prerelease semver tags with a matching `Podium-Air-vX.Y.Z.apk` asset in the app repository. On errors or rate limits, the verified fallback stays in place. Update the fallback in `index.html` and `script.js` after a future stable release if you want API-offline visitors to get the newest version too.

## Assets and source

The logo/icon and monochrome mark come from the Podium Air application repository. The app screenshots were provided by Prem and show the actual app, including visible account and update dialogs. They are not fabricated product screens. The site has no runtime dependency or third-party font. App source and its GPLv3/upstream notices live in the [Android repository](https://github.com/kaizen-flims/Podium-Air).
