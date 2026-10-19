# Verified V1 CSS cleanup

Base: `main` at `3091b1d61673cb03abda63982f34306e1dad3824` (PR #15).

Within the cleanup itself, only `styles.css` changes the deployed website: 34 rules and one orphaned keyframe are deleted, totaling **2,315 bytes** (29,210 → 26,895 bytes). No retained CSS declaration, selector, whitespace, ordering, animation or media/supports wrapper is changed. The cleanup does not alter runtime JavaScript, HTML, React components, assets, dependencies, build configuration or SEO/download implementation. PR #17 now also includes the approved work from PR #16, as described below.

## Deletion evidence

The classes below do not occur as class tokens in either HTML page, JavaScript/React markup, or dynamically assigned classes. They are also absent from the open PR #16 runtime sources. Substring matches such as `wave-hero-copy` and `wave-hero-lead` are different, active V2 classes and remain untouched.

- Retired phone/record hero: `hero-copy`, `hero-lead`, `hero-actions`, `hero-art`, `record-stage`, `hero-phone`, including their responsive/descendant rules.
- Retired red pill CTA: `button-red` and its hover rule.
- Retired decorative concentric circles: `mix-visual` and its descendant rules.
- Abandoned reveal mechanism: `scroll-reveal`, pending/visible states and reduced-motion override. No script generates these classes.
- `phone-settle`: its only reference was the retired `hero-phone` rule. No other stylesheet or script references this keyframe.

Exact deletions follow. The accompanying JSON manifest records each baseline range and SHA-256 digest without retaining obsolete CSS code. The protection check derives the expected stylesheet by deleting only those ranges from the pinned baseline, then compares **every remaining byte**. All other existing protection checks remain in place.

| Deleted rule | Context |
| --- | --- |
| `.hero-copy` | `root` |
| `.hero-lead` | `root` |
| `.hero-actions` | `root` |
| `.button-red` | `root` |
| `.button-red:hover` | `root` |
| `.hero-art` | `root` |
| `.record-stage` | `root` |
| `.record-stage img` | `root` |
| `.hero-phone` | `root` |
| `.hero-phone img` | `root` |
| `.hero-art:after` | `root` |
| `.mix-visual` | `root` |
| `.mix-visual span` | `root` |
| `.mix-visual span:after` | `root` |
| `.mix-visual span+span` | `root` |
| `.hero-art` | `@media (max-width:1279px)` |
| `.hero-phone` | `@media (max-width:1279px)` |
| `.hero-lead` | `@media (max-width:767px)` |
| `.hero-actions` | `@media (max-width:767px)` |
| `.hero-actions .button` | `@media (max-width:767px)` |
| `.hero-actions .text-link` | `@media (max-width:767px)` |
| `.hero-art` | `@media (max-width:767px)` |
| `.record-stage` | `@media (max-width:767px)` |
| `.hero-phone` | `@media (max-width:767px)` |
| `.hero-art:after` | `@media (max-width:767px)` |
| `.hero-art` | `@media (max-width:359px)` |
| `.hero-actions` | `@media (max-width:359px)` |
| `.hero-actions .button` | `@media (max-width:359px)` |
| `.hero-actions .text-link` | `@media (max-width:359px)` |
| `.scroll-reveal` | `@media (prefers-reduced-motion:no-preference)` |
| `.scroll-reveal.is-pending` | `@media (prefers-reduced-motion:no-preference)` |
| `.scroll-reveal.is-visible` | `@media (prefers-reduced-motion:no-preference)` |
| `.hero-phone` | `@media (prefers-reduced-motion:no-preference) > @supports (animation-timeline:view())` |
| `@keyframes phone-settle` | `@media (prefers-reduced-motion:no-preference) > @supports (animation-timeline:view())` |
| `.scroll-reveal` | `@media (prefers-reduced-motion:reduce)` |

## Deliberately retained

- All V2 code, loading screen, hero, shaders, typography, text/story/graph/vinyl animations and shared styles. A historical-looking selector that still matches markup is not removed merely because V2 overrides some declarations.
- `intro-away` and the related listeners: these actively coordinate the current loading screen and download counter.
- All standalone scripts: each has a current runtime, build, CI or verification purpose.
- Every asset: current screenshots/fonts remain referenced; `red-record.webp` is explicitly protected V2 artwork; the former `social-card.png` may still be requested by cached social cards. No asset was established to be safe to delete.
- Provenance/audit documents and asset licenses.
- PR #16's performance and text-animation changes are now included unchanged in this combined PR, at Prem's request. All runtime files match PR #16 exactly except for the already-verified V1 CSS deletions in `styles.css`. The loading screen, hero and shader sources remain byte-identical to main.

## Regression verification

`node scripts/check-v1-cleanup.mjs` serves the built page and compares the original and cleaned stylesheets on the same DOM. It checks every computed property and bounding rectangle for every element and its before/after pseudo-elements, and asserts that removed selectors match no elements. Coverage: home/privacy, 320/390/768/1024/1440px, light/dark, JavaScript enabled/disabled, with scroll, gallery tabs, vinyl toggle and focus additionally exercised on the JavaScript homepage at 390/1440px. CSS animation/transition playback is frozen only inside this test for deterministic comparison; active animation source and compiled intro/hero bundles are separately byte checked.

An optional build-directory argument can repeat the comparison against another checkout's build. The new regression now runs directly against the combined build and runs in the existing platform-download CI workflow after the browser tools are installed.

Local results are recorded in the pull request. Build warnings about existing large shader bundles and preserved `use client` directives are pre-existing; no V2 optimization is attempted.

## Combined delivery

PR #17 incorporates PR #16 at `4ac1ebe30b21b0b3bb8a5373798cc3f80f412289`, including its word-by-word heading/paragraph motion, reversible Podium → Podium Air story, responsive WebP screenshots, lazy loading and equivalent WOFF font. These files are imported without edits. The 34 V1 rules and orphaned keyframe remain deleted, with the same 2,315-byte reduction and exact protection manifest. Both regression suites run in the combined workflow. Review and merge only PR #17; merging PR #16 separately is unnecessary. Neither PR is merged by this change.
