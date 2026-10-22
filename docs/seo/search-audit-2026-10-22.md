# Podium Air search and identity audit — 22 October 2026

## Scope and method

This pass tested 16 query variants across two web lookup engines, inspected one direct Google browser search for `podium air`, compared five user-supplied Google screenshots, and inspected the live homepage, an intentionally missing URL, repository documentation and actual release assets. These are observations from particular environments, not a universal Google ranking or an AI-answer evaluation score. The lookup tools are not a Google rank tracker; many returned weak or unrelated matches even with exact phrases or site filters. Missing results do not establish non-indexing.

The new browser session is signed out of Search Console. No fresh private performance, indexing or sitemap report was available in this pass. Earlier same-day Search Console findings are historical evidence, not refreshed measurements: the homepage was indexed; Google selected the Cloudflare URL; last crawl displayed October 15; the three exact-query filters had no reportable sample; a manual indexing request hit the daily quota; the corrected sitemap submission was accepted but reported a fetch failure. Do not repeatedly submit requests to work around the quota.

## Search tests

| Queries | Observation in this pass | Interpretation |
| --- | --- | --- |
| `"Podium Air"`; `"Podium Air" music app download`; `"Podium Air" developer`; `"Podium Air" official website` | Initial four-query lookup returned a mixed set dominated by unrelated Podium products. | Brand ambiguity / retrieval weakness; not a Google position measurement. |
| `"Podium Air" "music app"` | Unrelated pages, including a fictional music UI prompt collection. | No useful app match returned by this lookup. |
| `"Podium Air" "download"` | Unrelated Podium developer-tool comparison. | No useful app match returned by this lookup. |
| `"Podium Air" "Prem"` | Unrelated news and other pages. | Cannot measure Prem-to-app recognition from this result. |
| `"Podium Air" "Windows" "macOS"` | Unrelated Podium developer-tool material. | Verify real platforms from release assets instead. |
| `Podium Air music app official website` | Other apps named Podium. | Official URL needs prominent first-party references. |
| `Podium Air music app developer Prem` | Included GHOSTxASR/podium-music-player, whose primary README calls its app Podium. | Confusion candidate in retrieval; not proof of the Google AI system's causal source. |
| `Podium Air kaizen-flims download` | Unrelated Kaizen audio product. | No useful match returned by this lookup. |
| `who is nottt.premm Podium Air` | Unrelated Podium business software and products. | The handle/profile connection is not reliably retrieved here. |
| `site:podium-air-website.pages.dev` | No results returned by this lookup. | Not proof of exclusion; the user's Google screenshot shows the site. |
| `"Podium Air" "GHOSTxASR"` | No result returned by this lookup. | No verified first-party equivalence; inspect actual repository identity. |
| `"Podium Air" "music without limits"` | Unrelated music page. | Cannot validate Google AI's promotional/tagline claims. |
| `site:github.com/kaizen-flims/Podium-Air` | Returned an unrelated repository. | A retrieval/filter coverage limitation, not a repository absence. |
| Direct Google browser UI: `podium air` | The visible first-page results were dominated by inflatable podiums, FOX bicycle products and related pages. The official app site was not visible among those results. | A single cloud-browser observation; not comparable to a fixed India/device rank. |
| User screenshots | One shows the official site under the standalone query, with the older title and site name Cloudflare. Others show AI output naming GHOSTxASR and its different repository, following conversational prompts. | Search visibility exists in that user environment. The AI output is not reliable attribution evidence. |

The live homepage already has the new music-app title, WebSite name `Podium Air`, canonical Cloudflare URL, SoftwareApplication and Prem's linked Person data. Repeatedly rewriting these correct fields would not make Google process them faster. Google says title and site-name updates require recrawling/reprocessing, which may take days to weeks. The exact cause of any AI response cannot be established from screenshots alone.

## Verified problems and fixes

| Finding | Evidence | Proposed correction |
| --- | --- | --- |
| Weak reciprocal official links | The app README did not prominently name/link the website, Prem's profile or website repository. | Add concise official-project references and current Android/desktop release guidance. |
| Upstream-only maintainer identity | MAINTAINERS.md says it lists BitChord's maintainers and contains no Podium Air maintainer section. THIRD_PARTY_NOTICES.md already identifies Prem as maintainer/brander. | Add a Podium Air section; preserve the original BitChord table and complete contributor block. |
| Desktop documentation directs readers to upstream downloads | DESKTOP.md is inherited BitChord documentation with upstream release URLs and filenames. | Add a clear Podium Air release entry point and label the remaining material as inherited technical reference; do not rewrite commands or build configuration. |
| No concise app identity reference page | The homepage is product/editorial copy; the profile page primarily describes Prem. | Add `/about` with official source/download links, actual platforms, maintainer/upstream distinction and factual differentiation of similarly named repositories. Link it from the existing profile and sitemap. |
| Missing-path homepage fallback | `/seo-audit-missing-page` displays the full homepage. Source has no top-level 404.html; Cloudflare documents this as its default SPA behavior. | Package a top-level 404.html, noindex, outside the sitemap, with recovery links. Verify an actual 404 HTTP status after deployment. No status code was inferred from the browser page alone. |
| Privacy canonical points through a redirect | Cloudflare serves the page at `/privacy`, while canonical/sitemap used `/privacy.html`. | Align privacy canonical and sitemap to `/privacy`; preserve existing visible page content and links. |

Actual release API verification: Android v1.0.2 is public/non-prerelease with uploaded Podium-Air-v1.0.2.apk. desktop-v1.0.1-beta1 is a public prerelease with Windows x64 and macOS arm64/x64 assets. The fact page does not announce new iOS, PWA or Linux releases. It does not install or execute app packages.

## Protected scope and validation

- V2 index.html must remain byte-identical to d01008bb4da3e1b884644724e28d5216ee212d7f.
- No shaders, stylesheets, animations, images, logos, runtime scripts, app source, app signing, dependency manifests or lockfiles change.
- Website changes reuse the existing information-page styles. Source credit, license, BitChord maintainer table and original contributors stay intact.
- Build, type/syntax checks, nine download tests, existing protection assertions and the new built-output SEO check are run before PR creation.
- The new SEO check is wired into the existing verification workflow after the build. It checks canonical/sitemap alignment, linked identity, official links, noindex/packaging for 404 and unchanged V2 homepage.
- No local responsive screenshots or post-deployment HTTP checks are claimed. New content is not live before review/approval.

## Release and remaining external work

Keep changes in separate website and app-documentation PRs. Merge/deploy only after explicit approval. Publish the website before the app documentation so the new `/about` link is live. App documentation commits should skip CI to avoid an unrelated Android release from a docs-only update.

After publication: verify `/about`, `/prem`, `/privacy`, sitemap XML, the homepage and download destinations; confirm a deliberately missing URL returns HTTP 404; recheck Search Console's sitemap status when signed in; request indexing only when quota permits. The earlier failed sitemap entry should not be removed automatically. Search visibility, AI wording and processing times are not guaranteed.

Do not add fabricated ratings, fake press mentions, competitor ownership claims, keyword lists or special AI files. Do not adopt an alleged official tagline or TikTok promotion claim merely because a generated answer says it. Existing slogans and branding remain unchanged.

## Primary references

- [Cloudflare Pages serving and SPA behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/)
- [Google title links and reprocessing](https://developers.google.com/search/docs/appearance/title-link)
- [Google site names](https://developers.google.com/search/docs/appearance/site-names)
- [Google recrawl requests](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)
- [Podium Air source](https://github.com/kaizen-flims/Podium-Air)
- [Prem's separate Podium source](https://github.com/kaizen-flims/Podium)
- [Separately published GHOSTxASR Podium](https://github.com/GHOSTxASR/podium-music-player)
