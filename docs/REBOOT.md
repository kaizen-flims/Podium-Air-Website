# Podium Air reboot experiment

This branch is an approval-only redesign. Do not merge or deploy until Prem approves.

## Design read
A consumer music launch for people who love listening. Apple-inspired product hierarchy, red audio-campaign art direction, oversized Barlow typography, real screenshots and scroll-led storytelling. Taste dials: variance 9, motion 7, density 3. Native CSS matches this existing buildless site; no framework or runtime dependency added.

The previous white/red V1 had a splash intro, condensed counter inside the hero, floating logo and repeated numbered sections. This experiment removes that composition. It introduces a split record-stage hero, dedicated milestone section, asymmetric feature composition, sticky desktop story introduction and a focused download centre. The logo remains the original asset. System light/dark themes use semantic tokens; the theme toggle is session-only. Native scrolling is preserved.

## Preserved functionality
- Stable Android discovery and verified APK fallback.
- Windows x64 beta, Apple Silicon beta and Intel Mac download destinations.
- Live APK counter, minute refresh, verified snapshot fallback, cross-tab updates and source verification link.
- Graph of real observations, including explicit missing daily-history disclosure.
- Three real app screenshots and keyboard-operable gallery tabs.
- Background playback, ad-free listening, offline downloads, local library, lyrics, crossfade, sleep timer and playback settings.
- Prem's twelve unsuccessful attempts, successful thirteenth Podium build, online-listening pivot and three weeks creating Podium Air.
- Podium versus Podium Air explanation; credits, changelog, legal copy, privacy route, Google verification file, sitemap generation and metadata.
- Existing anchor destinations: top, main, experience, journey, download, downloads-count.

AutoMix, playlist import and Android in-app updates are surfaced in the feature presentation, consistent with the requested update campaign. Static link copies were consolidated into the download centre; all distinct destinations remain.

## References and asset provenance
- Taste design-taste-frontend v2: inference, overhaul audit, spacing, hierarchy, meaningful motion and mobile fallback.
- VoltAgent awesome-design-md/apple/DESIGN.md: product scale, typography hierarchy and restrained chrome; adapted to Podium's red identity.
- Vercel web-interface-guidelines/command.md: semantics, focus, motion, image dimensions and resilient loading.
- Repo-required image-to-code and Playwright resources consulted. Real product screenshots take priority over generated UI.
- `assets/red-record.webp`: built-in image-generation output, compressed to WebP (about 132 KB). Prompt: wide premium music campaign photo, extreme macro of black vinyl with scarlet centre, raking red studio lighting, wine-red negative space, no typography, logos, people, smoke or purple. The image is decorative; it makes no product claim.

## Verification
Local syntax checks and all nine download/API tests pass. Static build passes using the truthful committed fallback when live GitHub is unavailable. Verify all distinct links, local assets, unique IDs, anchor targets and SEO metadata against main. Privacy copy and backend data contracts are unchanged.

Local browser QA is unavailable in this managed environment. The PR's existing Playwright workflow tests 1440/768/390/320px, download targets and bounds, theme switching, gallery keyboard interaction, counter/graph updates, stale/offline recovery, no-JavaScript content and motion. It uploads screenshots for review. No Lighthouse score is claimed. Production deployment remains gated on approval and merge.
