# Component integration record

What was actually installed and used, what was only studied, and what was not done. Verified 2026-11-05 on branch `redesign/phase-2-5-preventive-care`.

"Verified" means I ran it in a browser or measured it. Nothing is claimed beyond that.

## Installed and used

| Library | Component | Route | Purpose | Installed via | Verification |
|---|---|---|---|---|---|
| motion (12.x) | `motion/react` everywhere | all | Reveals, layout and shared-element transitions, scroll-linked hero | `npm i motion`, replaced `framer-motion` (same library, new name; Bklit imports `motion/react`, so keeping both would ship two copies) | Production build passes; interactions run in browser |
| animejs 4.5 (MIT) | `createTimeline`, `createDrawable`, `stagger` | `/work/taxproof` | Evidence lineage: unrelated wires dim, related wires redraw in lineage order, detail chips stagger in | `npm i animejs` | Checked: unrelated wires 0.12 opacity, related 1.0, after selecting a node. Skipped under reduced motion in code, not browser-tested |
| shadcn/ui | NavigationMenu, Sheet | all pages | Desktop nav with a Work panel of the three flagships; phone menu | shadcn CLI | Nav renders, Work trigger present; phone sheet not exercised end to end |
| shadcn/ui | Command (cmdk), Dialog | all pages | Cmd/Ctrl+K and `/` palette: case studies, sections, projects, links | shadcn CLI | Opened by key event: 4 groups, 23 items |
| shadcn/ui | Tabs | `/`, `/work/preventive-care` | Phone project selector; forecast series; contribution selector; sample patients | shadcn CLI | Switching verified |
| shadcn/ui | Slider (customised to a range with labelled thumbs) | `/` | Zoom range and week scrubber for the forecasting studio | shadcn CLI, edited | Renders; keyboard reading via the week slider |
| shadcn/ui | Collapsible, HoverCard | `/` | Forecast data table; explanation of the 80% band | shadcn CLI | Renders |
| shadcn/ui | Dialog | `/` | Expanded diff in Code Evolution | shadcn CLI | Component present; opened by button, not screenshot-verified |
| Bklit (MIT, shadcn registry) | LineChart, Line, Band, ProjectionLine, ReferenceArea, Grid, XAxis, YAxis, ChartTooltip | `/` | Retail forecasting studio on real repository data | shadcn CLI (`@bklit/*`) into `components/charts` | Renders with real data, tab and zoom controls work. Original SVG chart kept as an error-boundary fallback |
| Kokonut UI (MIT, public registry) | AI Agent Lanes (customised) | `/work/preventive-care` | The pipeline as lanes with inputs, outputs and limits per stage | shadcn CLI (`@kokonutui/ai-agent-lanes`) | Verified: lane select shows In / Out / Limit text. Seconds replaced by stages and no streamed output |
| Kokonut UI | Scroll Index | `/` | Section rail with ticks per heading | shadcn CLI | Rail present with 5 ticks at 1440px; hidden under 1100px |
| Kokonut UI | Slide Text Button | `/` hero | Primary call to action, wrapped in my own Motion magnet | shadcn CLI | Renders; magnet is mouse-only |
| (no new library) | Proof of engineering band | `/` | Figures imported from the pinned retail, TaxProof, Preventive and GitHub JSON; project map and stack moved here | none | Values match the data files; 0 unnamed controls; reads at 390, 768, 1440 px |

Also added: `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`, Radix primitives, `cmdk`, `vaul`, d3 scale/shape/array, `@number-flow/react` (Bklit tooltips), and `@types/d3-*`. Tailwind v4 utilities are now generated (previously the stylesheet's `@tailwind` lines produced nothing), without Tailwind's preflight, so the handwritten CSS is unchanged.

## Studied, not used, and why

| Item | Reason |
|---|---|
| Kokonut AI Diff Review | Installed and read, then removed. It is built around an AI agent's edits with accept and reject controls. That would misrepresent human code review. I borrowed only the visual pattern (change bars, animated line reveal) in my own viewer |
| Kokonut kinetic, cradle, plucked text | Pointer-physics headlines cost readability. One masked word-rise is used instead |
| Kokonut Pro components | Paid, not copied |
| Bklit brush | The registry has no separate brush component. LineChart exposes `xDomain` for zoom, driven by the shadcn range Slider and preset buttons |
| Bklit Sparkline, Markers | Installed with the chart bundle, not used |
| shadcn Drawer, HoverCard on nav | Installed; Drawer not used (the Sheet covers the phone menu) |
| Anime.js motion path, morphing, scroll observer | No place where they were better than Motion |
| MotionSites | Sells prompts, not code. Nothing to integrate |

## Not done

- React Three Fiber prototype. No WebGL dependency was added, as decided. The CSS 3D hero was improved instead (scroll-linked layer separation, pointer light).
- Résumé: TaxProof not added. The page is full and I cannot compile LaTeX here to confirm a one-page fit.
- `/lab` creative experiments (3D geometry and so on). Existing Lab experiences are unchanged.
