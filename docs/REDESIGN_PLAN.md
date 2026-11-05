# Redesign plan and status

Branch: `redesign/phase-2-5-preventive-care`. Nothing on this branch is deployed. Production (karthikmannem.com) serves commit `ca868d6` on `main`.

## Audit (2026-11-05)

**Stack.** Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind 4 (used lightly, most styling is `app/globals.css`), framer-motion 12, lucide-react. No other runtime dependencies. Routes: `/`, `/lab`, `/work/retail-demand-intelligence`, `/work/taxproof`.

**Local vs deployed.** Production was deployed from the clean working tree at `ca868d6`; the live `/work/taxproof` and the home page links were checked after deploy.

**Measured on the homepage at 390px (dev build):**

| Item | Value |
|---|---|
| Total page height | about 18,360 px |
| Work section height | about 5,100 px for three projects |
| Words on the page | about 1,970 |
| Horizontal overflow | none |

**Problems found, ranked by impact**

1. The Work section repeats one rounded-card template three times and is far too long on a phone. Highest impact.
2. The hero still carried unused kitchen-era code: a gate, a curtain, fog, a particle canvas and a looping ambient sound. Fixed in Phase 1.
3. Floating widgets (sound toggle, terminal launcher, side course rail, custom cursor) and a technology ticker competed with the content. Removed from the homepage; the toggle, terminal and cursor remain on `/lab`.
4. The hero led with the name rather than the claim. Fixed in Phase 1.
5. Several components are now dead code (see Phase 5).

## Phases

### Phase 1: design system, navigation, hero, simplification. Mostly done
- [x] Graphite / ivory / copper / slate / signal tokens. Copper is now `#D87B55` as specified in the latest brief.
- [x] Geist, Geist Mono and an italic Instrument Serif accent.
- [x] Navigation reduced to work, open source, about, lab, contact, plus search and résumé.
- [x] Homepage order: hero, selected work, open source, experience, engineering expertise, about, contact. Library, games and experiments live at `/lab`.
- [x] Hero: claim as the headline, name and role lockup, supporting text on applied ML, LLM systems, evaluation and production engineering, Explore work / Résumé / GitHub / LinkedIn, one visualization, masked word entrance that is plain text under reduced motion.
- [x] Removed the ticker, floating sound toggle, terminal launcher, course rail and cursor from the homepage.
- [ ] Open item: the Work section is still too long, which Phase 2 addresses.

### Phase 2: featured-project showcase. Not started
Give each flagship its own presentation instead of a shared card, and cut the homepage Work section to a fraction of its current length. Each shows problem, my contribution, core architecture and one verified result, with demo, GitHub and case-study links. Screenshots stay as the real captured product views.

### Phase 3: case-study pages
- [x] Retail Demand Intelligence: interactive forecast explorer with real backtest results and measured interval coverage.
- [x] TaxProof: evidence-graph explorer (value, rule, extracted value, document, page), hash-chain demo, access matrix.
- [ ] Preventive Care Recommendation Agent: sample-query RAG walkthrough with safe sample queries, clearly labelled as a prototype and not medical advice.

### Phase 4: signature 3D interaction. Not started, needs approval
The current hero visualization is CSS 3D. React Three Fiber would add `three` and `@react-three/fiber`. I will ask before installing, and will only adopt it if it beats CSS/SVG on the data, model, evaluation, deployment scene. A static fallback is required either way.

### Phase 5: polish, performance, accessibility, regression
Lighthouse / Core Web Vitals runs, keyboard and screen-reader pass, Safari check, touch check, deleting dead components, and a final regression pass. Not started; no performance numbers are claimed yet.

## Dead code to remove in Phase 5
`Ticker.tsx`, `CourseRail.tsx`, and the unused hero helpers if no longer referenced. Verify each with a search before deleting.
