# Implementation plan and status

Branch: `redesign/phase-2-5-preventive-care`. Nothing on this branch is deployed. Production (karthikmannem.com) serves `main` at `ca868d6`.

Dependencies today: `next`, `react`, `react-dom`, `framer-motion`, `lucide-react`. Nothing has been added in this branch.

## Milestone 1: foundation. Done
- [x] Reference research (`DESIGN_RESEARCH.md`) and design system (`DESIGN_SYSTEM.md`)
- [x] Graphite / ivory / copper (`#D87B55`) / slate / signal tokens, Geist + Instrument Serif + Geist Mono
- [x] Navigation reduced to work, open source, about, lab, contact, search, résumé
- [x] Homepage order per brief. Library, games and experiments live at `/lab`
- [x] Floating widgets, ticker, curtain, fog and particle canvas removed from the homepage and hero
- [x] Contrast fixes to the small-text colours (see `DESIGN_SYSTEM.md`)

## Milestone 2: visual storytelling. Partly done
- [x] Claim-first hero with masked word entrance and four actions
- [x] **Featured-project showcase.** Three distinct compositions (`app/components/showcase/`): TaxProof screenshot-first with an animated evidence trail, Retail as an asymmetric split with a live forecast instrument, Preventive Care as a stage schematic. Each has expandable technical details and a case-study link. Mobile has its own layout (swipeable trail, metric strip, stage chips)
- [x] Kitchen wording removed from the footer, contact assistant, email template, palette, nav and Lab teaser. Still present inside the older project write-up modals and the "all projects" cards (`dishName` and similar fields in `resume.ts`)
- [x] Case-study layouts: Retail, TaxProof, Preventive Care

## Milestone 3: interactive engineering
- [x] Retail forecasting explorer, on verified repository data (hand-built SVG)
- [x] TaxProof evidence-graph explorer, plus a hash-chain demo
- [x] Preventive Care workflow explorer and revision-loop simulator
- [ ] Open-source "Code Evolution" viewer. Needs GitHub status and diffs fetched and verified for each contribution; not started

## Milestone 4: immersive features. Not started
- [~] Hero visual: CSS 3D kept (WebGL deferred by decision). Added a pointer-following light and floor glow; steps now scroll to the Retail showcase. Still to do: scroll-linked separation of the layers
- [ ] WebGL: deferred. Only if a concept appears that CSS and SVG cannot deliver
- [ ] Project Atlas (optional map of projects, themes and contributions)
- [ ] Lab refresh. Existing Lab experiences work and stay

## Milestone 5: production polish. Not started
- [ ] Lighthouse and Core Web Vitals measurements (none taken yet, so no claims)
- [ ] 768px tablet pass, keyboard walkthrough, screen reader spot check, Safari
- [ ] Delete dead components (`Ticker.tsx`, `CourseRail.tsx`, others after a reference search)

## Decisions made
- WebGL: deferred. No `three` or React Three Fiber.
- Résumé: corrected in `resume/resume.tex` (Pooled Cohort Equations, no vaccination plan, AWS wording, Preventive Care title and demo link). The PDF is built by `.github/workflows/build-resume.yml` when this reaches `main`; it has not been regenerated yet.
- Recorded live run of the Preventive Care demo: not now. Improve the corpus and add evaluation tests first.

## Open
1. Merge to `main`, which also regenerates the résumé PDF. Needs your approval. Deploying is a separate approval.
2. TaxProof is the first flagship on the site but is not on the résumé, which is one page. Adding it means trimming something. Your call.
3. The older project write-up modals and the "all projects" cards still use kitchen wording.
4. AWS wording on LinkedIn (carried over).
