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
- [ ] **Featured-project showcase.** Still three identical cards and about 5,100px tall on a phone. Highest remaining impact. Each flagship needs its own composition and a short summary, with the case study carrying the detail
- [ ] Remove remaining kitchen wording from the footer and older sections (`Footer.tsx`, section labels)
- [x] Case-study layouts: Retail, TaxProof, Preventive Care

## Milestone 3: interactive engineering
- [x] Retail forecasting explorer, on verified repository data (hand-built SVG)
- [x] TaxProof evidence-graph explorer, plus a hash-chain demo
- [x] Preventive Care workflow explorer and revision-loop simulator
- [ ] Open-source "Code Evolution" viewer. Needs GitHub status and diffs fetched and verified for each contribution; not started

## Milestone 4: immersive features. Not started
- [ ] Interactive hero. The current CSS 3D visual is a placeholder. Making it respond to hover, click and scroll needs no new dependency. A WebGL version needs `three` and `@react-three/fiber`: see approvals below
- [ ] Project Atlas (optional map of projects, themes and contributions)
- [ ] Lab refresh. Existing Lab experiences work and stay

## Milestone 5: production polish. Not started
- [ ] Lighthouse and Core Web Vitals measurements (none taken yet, so no claims)
- [ ] 768px tablet pass, keyboard walkthrough, screen reader spot check, Safari
- [ ] Delete dead components (`Ticker.tsx`, `CourseRail.tsx`, others after a reference search)

## Approvals and decisions needed
1. **WebGL.** Adding `three` + `@react-three/fiber` (+ `@react-three/drei`) would be one dynamically imported chunk, free and open source. I will only do it if you approve. Honest expectation: the instrument is four flat layers, which CSS 3D already renders well. WebGL would add real lighting and depth at the cost of a larger lazy bundle and a static fallback to maintain.
2. **Résumé wording.** `resume/resume.tex` line 219 says "Framingham risk score" and "vaccination plan". The code computes the 2013 ACC/AHA Pooled Cohort Equations, and the plan has screening, lifestyle, pharmacological and follow-up sections, no vaccinations. Not edited. It is your résumé.
3. **A recorded live run.** The Preventive Care page shows no generated plan because I will not invent one. If you want a real sample, I can submit a fictional patient to your Streamlit demo and capture the output, labelled as a recording. That spends your model-endpoint credits and submits a form, so I am asking first.
4. **AWS wording** in the résumé (carried over from earlier).
