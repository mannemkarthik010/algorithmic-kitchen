# Design research

Researched 2026-11-05 by reading each reference's public pages in a browser. Only what those pages stated is recorded. Where a requested item did not appear, it says so and is not described from memory.

## Summary of decisions

| Reference | Verdict | Used for |
|---|---|---|
| shadcn/ui | Pattern reference only. No install. | Keyboard and focus behaviour for the command palette, dialogs and tabs |
| Bklit | Evaluated, not adopted now | Retail forecast chart stays hand-built SVG |
| Kokonut UI Pro | Paid. Inspiration only, no code | The "pulses travel the edges" idea in the Preventive Care workflow |
| Anime.js | Not adopted yet | Held back for SVG morphing or motion paths if the hero or Atlas needs them |
| Motion | Already in use as `framer-motion` 12 | All entrance, layout and path-draw animation |
| MotionSites AI | Nothing usable | Sells prompts, not code. Concept is original |

## 1. shadcn/ui
**Verified:** the components index lists Navigation Menu, Command, Dialog, Drawer, Tabs, Tooltip, Hover Card, Sheet and Collapsible, among others (also Chart, Combobox, Kbd, Resizable).
**Fit:** good accessibility reference. The site already has a command palette and its own tab and chip controls.
**Cost of adopting:** shadcn adds Radix primitives, a `components.json`, and class-variance utilities to a project whose styling is mostly one hand-written stylesheet. That is a new dependency set and a second styling approach for no capability the site lacks.
**Licence:** open source, copied into the repo. I did not re-read the licence text this session.
**Decision:** no install. Borrow the behaviours: roving focus on tab-like chip groups, `aria-pressed` toggles, `Escape` to close, visible focus rings. Use the native `<dialog>` element if a modal is needed.

## 2. Bklit
**Verified:** "a component library built on top of shadcn/ui". Line Chart installs with `pnpm dlx shadcn@latest add @bklit/line-chart` and imports from `@bklitui/ui/charts` (`LineChart`, `Line`, `Grid`, `XAxis`, `ChartTooltip`). Data changes tween the y-domain without replaying the enter animation. Extras seen: `LineBackdrop`, line glow, a hover highlight that follows the cursor, gradient strokes. The chart index lists Area, Bar, Candlestick, Choropleth, Composed, Funnel, Gauge, Heatmap, Line, Live Line, Pie, Radar, Radial, Ring, Scatter, Sankey and Sparkline.
**Not verified:** prediction or uncertainty bands, brush or range selection, and the licence. None of the pages I read mention them. I am not assuming they exist.
**Fit for Retail:** the existing forecast explorer already has an 80% interval band, range selection, a hover scrubber with arrow-key stepping, model comparison and a table fallback, all in plain SVG.
**Cost:** requires `shadcn init` plus the package. Would replace working, tested chart code.
**Decision:** not adopted. Revisit only if a Bklit area chart is confirmed to support a filled band between two series and the licence permits it.

## 3. Kokonut UI
**Verified on the Pro page:** a paid collection ("Get Kokonut UI Pro", 120+ components, 6 templates) built on Tailwind CSS and Motion. Relevant entries: Agent Flow Hero ("a live node graph of a run: pulses travel the edges and steps tick their results"), Kinetic Type Hero ("letters lean away from the cursor"), Chart Hero ("scrub crosshair and range tabs"), Docs Search ("an answer that cites each source"), Slash Command Menu. A free "Background Components" set (dot fields, flow fields, canvas and WebGL) is also listed.
**Not found on that page:** Scroll Index, AI Agent Lanes, AI Inline Citations, AI Diff Review, Background Paths, Magnetic Button. I have not seen them and do not describe them.
**Licence:** Pro code is paid. I am not copying any of it.
**Decision:** inspiration only. The Agent Flow idea (activity travelling along edges, steps lighting in sequence) is implemented from scratch in the Preventive Care workflow with `framer-motion` path drawing and a step highlight.

## 4. Anime.js
**Verified:** "100% free", 27.13 KB bundle stated on its homepage, modular imports. Capabilities listed: timeline, stagger, springs, draggable, scroll observer, scope with media queries, WAAPI, and an SVG toolset (shape morphing, line drawing, motion path).
**Fit:** line drawing is already handled by `framer-motion`'s `pathLength`. Morphing and motion paths are the genuine extras.
**Decision:** not adopted. A second animation library needs a specific requirement. Candidates if one appears: a morph between pipeline stages in the hero, or a particle travelling a connector in Project Atlas.

## 5. Motion
**Verified:** 516 examples, some free and 510+ behind Motion+ (paid, lifetime). A featured example morphs Three.js particles between a photograph and a globe using a TSL `uniform()` node and `threeEffect` in Motion.
**Fit:** the site already uses the React build (`framer-motion` 12) for reveals, layout and path drawing.
**Decision:** keep as the primary system. Motion+ is not needed. The Three.js example is a reference for how the animation layer could drive a scene if Phase 4 goes ahead; I have not tried it.

## 6. MotionSites AI
**Verified:** the 3D page advertises "3D Website Prompts": paid prompts for generating sites with AI, "100+ future 3D websites". Previews and prompt text were not available to me in readable form.
**Decision:** nothing to study or copy. The hero concept (an instrument of four layers: data, model, evaluation, deployment) is original and already exists as a CSS 3D version.

## Feature to technique map

| Feature | Technique | New dependency |
|---|---|---|
| Hero entrance | `framer-motion` masked word reveal, plain text under reduced motion | none |
| Hero visualization | CSS 3D today. WebGL only if it clearly beats it | `three` + `@react-three/fiber` (needs approval) |
| TaxProof evidence graph | HTML nodes plus a measured SVG wire overlay, `pathLength` draw | none |
| Retail forecast lab | Hand-built SVG | none |
| Preventive Care workflow | HTML nodes, SVG loop arc, step controls | none |
| Hash-chain demo | Web Crypto SHA-256 | none |
| Project Atlas | SVG graph. Anime.js only if motion paths are needed | none yet |
| Command navigation | Existing palette, restyled | none |

## How these avoid looking like a component showcase
Every interactive piece is built on this project's own data and carries its provenance on screen: what was computed, what was read from a repository, and what is not shown. None of the reference components were copied, and nothing was installed to get a look.
