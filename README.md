# Podium Air Website

The official consumer website for [Podium Air](https://github.com/kaizen-flims/Podium-Air). It is a small, dependency-free static site deployed through GitHub Pages.

## Local preview

From this directory, run `python3 -m http.server 8080`, then open `http://localhost:8080`. No install is needed. For the production output, run `npm run build`.

## GitHub Pages

The repository's **Settings → Pages → Build and deployment** source is **GitHub Actions**. Pushing to `main` runs `.github/workflows/pages.yml`, which builds `dist` and publishes it at [kaizen-flims.github.io/Podium-Air-Website](https://kaizen-flims.github.io/Podium-Air-Website/). The build copies only public site files; source and repository metadata outside that allowlist are not published. You can also start the workflow manually in the Actions tab.

The workflow supplies `SITE_URL` so the sitemap includes the repository path. If you change the Pages address or add a custom domain, update that variable in the workflow. Relative asset and navigation links work at both a project path and a domain root. The social image uses an absolute GitHub raw URL.

## Releases

The page starts with a verified signed v1.0.1 APK URL and then checks GitHub's public latest-release endpoint. It accepts only non-draft, non-prerelease semver tags with a matching `Podium-Air-vX.Y.Z.apk` asset in the app repository. On errors or rate limits, the verified fallback stays in place. Update the fallback in `index.html` and `script.js` after a future stable release if you want API-offline visitors to get the newest version too.

## Assets and source

The app icon comes from the Podium Air application repository. The app screenshots were provided by Prem and show the actual app, including visible account and update dialogs. They are not fabricated product screens. The site has no runtime dependency or third-party font. App source and its GPLv3/upstream notices live in the [Android repository](https://github.com/kaizen-flims/Podium-Air).
