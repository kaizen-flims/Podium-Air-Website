# Podium Air intro

The existing website is static HTML/CSS/JavaScript. Its opening sequence now uses a small React island built with Vite, TypeScript, Tailwind CSS v4 and Three.js. All existing content, story, download links and download counter remain in the static page.

## Work on the component

```sh
npm ci
npm run check
npm test
npm run build
```

Deploy the resulting `dist` directory using the existing pipeline. Build output includes `dist/intro/intro.js` and `dist/intro/intro.css`. A raw source-file server won't compile the React component; build first.

- Reusable UI components: `/components/ui`; supplied shader: `components/ui/shader-animation.tsx`.
- React entry: `src/intro.tsx`.
- Tailwind styles: `src/intro.css`; existing site and intro framing: `styles.css`.
- `@/*` resolves from the repository root in TypeScript and Vite.
- `components.json` defines shadcn aliases. `lib/utils.ts` provides `cn`.

This project previously had no component directory. `/components/ui` gives shadcn and copied components a consistent import location (`@/components/ui/...`). No separate framework migration is needed. To add another shadcn component, run `npx shadcn@latest add <component>` and review any requested styles/dependencies. Tailwind intentionally loads utilities without Preflight, so installing a component must not reset the existing static site's styles. Components that use shadcn semantic color tokens require their associated theme variables in `src/intro.css`.

## Playback

The intro opens on unanchored homepage visits, shows the supplied animated shader with white “Podium” and red “Air” and no icon or controls, then fades at 3.6 seconds and is removed at 4.2 seconds. It is decorative and hidden from assistive technology. The page underneath is initially hidden, including its focus targets. It becomes visible for the fade.

Reduced-motion visitors and direct section links skip the sequence. If WebGL fails, it reveals the page immediately; if the React bundle fails, a separate watchdog reveals the page within 4.2 seconds. Hiding the tab or navigating away also ends the intro. Three.js releases its animation loop, observer, GPU resources and canvas on exit. Device pixel ratio is capped at 1.5 to limit mobile GPU load.

The browser CI checks mobile/desktop layouts, intro rendering and dismissal, reduced-motion/no-JavaScript behavior, missing WebGL/bundle recovery, existing download links, gallery, story and real download counter. Screenshots are saved with the workflow artifacts; still screenshots do not show motion.
