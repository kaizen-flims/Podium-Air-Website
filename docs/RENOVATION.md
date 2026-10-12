# Podium Air renovation

## Design read and audit
Consumer music-product showcase, white/red brand, bold sans display and restrained motion. DESIGN_VARIANCE 7, MOTION_INTENSITY 6, VISUAL_DENSITY 3. Native CSS and existing dependency-free JavaScript preserve the small static-site stack; these are aesthetic choices, not an official Apple web design system.

Preserved: logo and wordmark, Experience / The journey / Downloads navigation, #experience / #journey / #download anchors, privacy route and its legal text, Android signed-release discovery, original story, real screenshot assets, source/license credits, cached APK counter and Cloudflare Pages functions. Windows links were already removed on main; obsolete verification still expected them.

Replaced: long blocking splash, decorative orbit rings, numbered section labels, looping ticker, repeated split sections, dark section inversion, and compact counter placement.

## Five references inspected individually
- Taste Skill (https://www.tasteskill.dev/): brief inference, audit before redesign, consistent tokens, responsive composition, purposeful motion and preflight review. Installed Taste plugin guidance also consulted.
- Vercel Web Design Guidelines (https://github.com/vercel-labs/agent-skills/blob/main/skills/web-design-guidelines/SKILL.md), with its current command.md: semantics, focus, reduced motion, font loading, image dimensions, touch access and interaction states.
- Image to Code (https://github.com/Leonxlnx/taste-skill/blob/main/skills/image-to-code-skill/SKILL.md): generated and inspected a standalone hero composition before implementation. Extracted asymmetric balance, two-line sans headline, white canvas, red accent and pill CTA; authentic app screenshots remain the product visuals.
- Awesome Design MD (https://github.com/VoltAgent/awesome-design-md/): collection inspected; Apple's reference examined for whitespace and imagery principles. The current linked page is a catalog surface, not a local installed skill. No copied brand identity or third-party product screenshots.
- Microsoft Playwright CLI (https://github.com/microsoft/playwright-cli): requirements, installation and browser/session/test commands inspected. CI uses the repository's existing Playwright runner rather than adding runtime browser dependencies.

## Metrics provenance
209 on 2026-10-07T10:55:34.000Z comes from the previously committed index.html verified fallback. 522 on 2026-10-12T19:52:08.280Z was read from the GitHub releases API: 519 for v1.0.1 plus 3 for v1.0.0. These count APK asset-download events, not users or installations.

The graph plots actual dated observations. Dashed connectors explicitly indicate missing intervening daily data. Builds add a freshly verified observation to dist/download-history.json; unavailable API data retains the original timestamp. The tracked download-history.json preserves earlier observations. Keep future verified observations there when updating the site; do not backfill guessed daily counts. Same-day points consolidate to the latest observation. Runtime successful counters update the graph, and stale fallback responses cannot replace newer observations.

## Motion and accessibility
Logo entrance establishes brand; hero enters without a blocking overlay. IntersectionObserver reveals content once. Counter rolls once when its section enters view. Graph entrance highlights snapshot comparison. Gallery transition indicates a selected screen. Links and buttons provide focus/hover/press feedback. Reduced motion disables entrance/reveal/rolling behavior.

Mobile collapses are explicit. Gallery tabs support arrow keys, Home and End. Menu closes on selection, Escape and desktop resize. Native details provide keyboard-accessible feature and installation guidance. Images retain dimensions and accurate alt text.

## Verification limit
This managed workspace has no control-browser capability. No local preview server or improvised browser was launched. Responsive visual checks and screenshots are performed by the pull request's GitHub Actions Playwright job. Build and static/data checks run locally. Deployment requires review/merge under AGENTS.md.
