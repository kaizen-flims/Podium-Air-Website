# Wave shader hero

The hero now uses the supplied sine-wave WebGL shader and an adapted LiquidButton, with Podium Air copy, platform availability and a real `#download` link to the existing Android, Windows and macOS downloads. The approved opening sequence and every section after the hero are retained, including the original red gradients and download counter.

The project already supports React, TypeScript, Tailwind v4 and shadcn aliases. No CLI initialization or framework migration is required. Run `npm ci`, `npm run check`, `npm test`, and `npm run build`; deploy `dist` through the existing pipeline after PR approval.

- UI components: `components/ui/web-gl-shader.tsx` and `components/ui/liquid-glass-button.tsx`.
- Entry: `src/hero.tsx`, imported by the existing React bundle entry to share React and Three.js.
- Tailwind entry: `src/intro.css`; hero-specific layout and fallbacks: the scoped wave-hero block in `styles.css`.
- `components.json` maps `@/components/ui` to the existing root `/components/ui` folder. Keep reusable shadcn components here so imports and CLI-generated components use one convention.
- Dependencies: existing `three`; added `@radix-ui/react-slot` and `class-variance-authority` with lockfile updates.

The shader formula is preserved, with division-by-zero guards, container-sized rendering and physical-pixel resolution correction. It stops while the intro is playing, offscreen or in a hidden tab. Reduced-motion users get a static wave. A pause/play control is available for continuous animation. WebGL failure leaves a readable black hero and functional download link; JavaScript failure leaves static HTML content. Pixel ratio is capped to limit mobile GPU usage.

The supplied liquid-button effect is adapted for valid anchor composition, unique filter IDs, keyboard focus and a visible fallback where SVG backdrop filtering is unsupported. Only the hero uses the liquid treatment; lower sections keep their existing styles.
