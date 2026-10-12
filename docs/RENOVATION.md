# V1 enhancement

The complete redesign was rejected. This revision restores the production V1 layout, typography, splash introduction, floating hero artwork, gallery, feature sections, story chapters and footer.

Only requested presentation changes remain: refined button radius/hover/press states; a code-native crop that reduces the logo's baked-in black edge without generating a replacement brand; tall rolling APK download digits in the hero under the Android CTA; and a red graph with a soft red area fill fading toward its baseline.

Counts remain verified APK asset-download events, including repeats, not unique users or installs. 209 at 2026-10-07T10:55:34.000Z comes from the previously committed production fallback. 522 at 2026-10-12T19:52:08.280Z comes from GitHub releases (519 for v1.0.1 plus 3 for v1.0.0). The graph connects actual observations with a dashed line and explicitly states that daily history is unavailable. The tint adds presentation without claiming intermediate daily measurements.

The original stable Android discovery, source credits, privacy text, routes and anchors are retained. Windows remains removed. The same public GitHub data/cache mechanism supports both the counter and graph. Builds retain real history plus the current verified observation, without inventing timestamps on API failure.

The five references were inspected in the preceding revision; their usable guidance informs focus/press states, reduced motion, consistent tokens and real screenshots. The user's explicit instruction to enhance V1 replaces the earlier complete-redesign direction.

Local browser control is unavailable in this managed workspace. Builds and script checks run locally; the pull request's existing Playwright workflow checks 1440/768/390/320px layouts, Android buttons, gallery keyboard behavior, hero counter placement and the graph fill. CI artifacts provide screenshots for visual review. AGENTS.md requires a pull request and prohibits automatic publication.
