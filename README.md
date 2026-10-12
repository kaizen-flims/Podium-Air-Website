# Podium Air Website

Official consumer website for [Podium Air](https://github.com/kaizen-flims/Podium-Air), deployed through the existing Cloudflare Pages project at https://podium-air-website.pages.dev. Dependency-free static HTML/CSS/JavaScript, with a cached Pages function for verified release-download counts.

## Build

Run `npm run check` and `npm run build`. Production files are allowlisted into `dist/`; stylesheet/script URLs are content-versioned. The existing GitHub Pages workflow supports the repository path and sitemap through `SITE_URL`.

## Product and downloads

White/red editorial design, real app screenshots supplied by Prem, a keyboard-accessible gallery, expandable feature details, mobile menu, the original third-person story, and signed Android APK downloads. The stable v1.0.1 fallback remains usable offline or during API errors. Release discovery accepts only matching stable semver APKs in the Android repository. Windows downloads remain removed.

The app icon and screenshots are authentic existing assets. The website points to Android source, upstream credits and GPLv3 notices. Barlow Condensed Bold is self-hosted for tall numerals under the SIL Open Font License in assets/FONT-LICENSE.txt; body/display text uses system sans fonts. No new runtime library is required.

## Download showcase

Very tall digit reels animate on viewport entry, respecting reduced motion. Uploaded branded APK assets are counted across paginated public releases, deduplicated by asset ID. A short-lived shared Cloudflare cache and last-verified build/local snapshot keep the counter truthful on errors. It counts download events rather than unique users or installations.

The red graph compares real timestamped observations in download-history.json plus the current verified result. Dashed connectors indicate gaps in daily history. Each build adds its fresh verified observation to the production history; preserve additional verified observations in the tracked history when updating the site. No inferred daily growth is shipped.

## Review and verification

AGENTS.md requires a pull request and prohibits automatic publication. The existing main-branch deployment flows remain in place for reviewed merges. GitHub Actions checks APK labels/logos/links, no Windows CTA, responsive bounds at 1440/768/390/320px, gallery keyboard behavior, mobile menu and stable-release discovery. Screenshots are uploaded as Platform-download-verification. The live check runs after main pushes.

See docs/RENOVATION.md for reference inspection, design rules, metrics provenance and verification limits.
