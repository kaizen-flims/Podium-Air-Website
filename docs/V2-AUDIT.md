# Podium Air V2 — visual audit and implementation

Baseline: production commit `b8b23ef97b877d96d229b47a725fea2356e6b59f` (PR #12).
Direction: Controlled Aggression × Cinematic Futurism × Dark Luxury.

## Classification

| Area | Decision | Evidence / treatment |
|---|---|---|
| Hero, shader, intro and glass controls | A — protected | Strong luminous composition. HTML block, styles, React islands, timings and behavior unchanged. Before/after hero pixel comparison at four widths in CI (only the unchanged logo bitmap is masked because Chromium resamples it after scrolling). |
| Logo, red vinyl artwork, genuine app screenshots | A — protected assets | Original binaries retained. Vinyl reused at large scale in the AutoMix composition; real screenshots remain navigable. |
| Transparent floating navigation | A — protected | Approved glass treatment retained, including scroll contrast and no black header bar. |
| Counter / chart | C — redesign | Small chunky numerals and pink dashed chart weakened the opening. Monumental Six Caps numerals, real text, thin technical red geometry, full-width composition. |
| Experience / details | C — redesign | Rounded card grid and cartoon record circles replaced by editorial feature rows, original full-width vinyl, large lyrics typography and precision metadata. |
| Product gallery | B — keep / refine | Working keyboard tabs and actual interfaces kept; darker exhibition framing, larger scale and quiet screen index replace friendly glow. |
| Journey | C — redesign | Repeated oversized pink badges become a three-act editorial sequence. All facts retained: Prem, 12 attempts, success on 13, local Podium, online Air, three weeks. |
| Family / downloads / footer | C — redesign | Catalogue layouts and ruled platform rows replace soft pills. Existing signature red gradient preserved; platform destinations, beta disclosures, credits and privacy retained. |
| Dots / light mode | B — keep / refine | Dots reduced in contrast on non-hero surfaces. Warm mineral light surfaces maintain contrast and the same hierarchy. No dots added to hero. |

## Architecture and performance

`revamp.css` is scoped to `.v2` on lower sections and footer. No root tokens or protected selectors are changed. The existing stylesheet and intro/hero implementation remain byte-identical. No runtime dependencies or animation libraries added. The existing GPU-friendly reveals, digit reels, gallery transitions and reduced-motion behavior remain.

Six Caps is locally served (46 KB), licensed under SIL OFL 1.1; license is `assets/SIX-CAPS-OFL.txt`. Source: https://github.com/google/fonts/tree/main/ofl/sixcaps . Actual font outlines are used without CSS distortion. Digit slots fit the widest numeral, and sizing adapts to the digit count, including the maximum JavaScript safe integer.

Download fetching, edge cache, periodic refresh, fallback timestamps and cross-tab updates are unchanged. The chart still connects only actual verified snapshots; explanatory text explicitly states daily history is unavailable. Events are never described as unique users. SEO metadata, robots and sitemap logic are unchanged.

## Verification and evidence

Local syntax/type checks, 9 data tests and production build pass. Browser verification runs in the existing GitHub Actions environment because this Work container has no supported local browser preview. Direct live-site retrieval was blocked by the environment; the approved production commit and its existing desktop/mobile screenshots provided the baseline. CI renders that exact baseline and the new source side by side.

CI checks 320, 390, 768 and 1440 px; both themes; fonts and glyph fit; 5-, 6-, 7- and 16-digit counter values; links; gallery keyboard controls; transparent dock; intro animation and exit; shader pause/resume/offscreen; reduced motion; missing WebGL/bundle and no JavaScript; periodic downloads, outage retention, stale rejection, recovery and cross-tab updates. Protected hero screenshots must match baseline pixels outside the unchanged logo bitmap; its exact bytes are checked separately. Section captures avoid a Chromium full-page tiling artifact beyond 8192 px. Existing source/asset checks below protect intro implementation as well.

Before/after images and motion recording are attached in the PR workflow artifact `Platform-download-verification`. Preview only; production remains on the approved baseline until explicit approval.
