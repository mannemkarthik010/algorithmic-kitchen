# Exhibition redesign and ECHO//SHIFT

Branch `redesign/exhibition`. Nothing here is merged or deployed. The previous design is kept in Git (`redesign/phase-2-5-preventive-care`) and its screenshots are in `docs/screenshots/previous-*.png`.

## Reference board

| Reference | What I took from it | Where it shows up |
|---|---|---|
| Marlow (marlow-template.vercel.app) | Project covers are working miniature interfaces laid out as a few huge exhibits with an index counter; serif display with italic emphasis | Opening installation (three artifacts built from real data); the gallery's large index, one dominant exhibit |
| Agenta (template-agenta.vercel.app) | Dramatic display typography, layered depth | Oversized cropped name, ghosted "About", layered echo logo in the game |
| Fleet (fleet-template-omega.vercel.app) | The product itself on the landing page; multi-stage workflow with a replay control | Preventive Care exhibit: stage rail, replay, the revise loop |
| Kokonut docs | Free components, MIT, installed through the documented registry | See table below |
| MotionSites | Sells prompts, not code. Spatial ideas only | Not used. A React Three Fiber hero prototype was built, then removed (commit `13749f4`) because the redesign replaced the hero it was for |

## Integration record

| Library | Component | Where | Status |
|---|---|---|---|
| Kokonut UI (MIT) | Shape Hero | Contact screen: its rigid-body physics carries four contact pills; real links sit in the action row | Used |
| Kokonut UI | Page Flip | TaxProof dossier (cover, legend, four original pages, extracted values, calculated output, verification) | Used |
| Kokonut UI | AI Agent Lanes (customised) | `/work/preventive-care` | Used (earlier round) |
| Kokonut UI | Slide Text Button | Hero call to action | Used |
| Kokonut UI | Scroll Index | Installed; no longer on the homepage (the brief limits it to long case studies) | Installed, not placed on a case page yet |
| Kokonut UI | AI Diff Review (patched: `readOnly`, `defaultOpen`) | Code Evolution, Change and Validation stages and the expanded view, fed by the real GitHub hunks | Used. Every accept, reject, undo and bulk control is removed so nothing implies a write to GitHub |
| Kokonut UI | Lightbox Grid | "The real screens" under the gallery: three flagship screenshots and the SplitWise poster | Used |
| Kokonut UI | Split Nav, Extruded Text | Pro (paid). Not copied | I built an original split-capsule navigation instead |
| Motion | springs, drag with constraints, layoutId, AnimatePresence, scroll | Hero artifacts, gallery index and exhibit transitions, nav, game screens and results | Used |
| Anime.js | timeline, drawable | TaxProof explorer wires (earlier round); game time-reset sweep, door and flash | Used |
| Bklit (MIT) | LineChart, Band, zoom domain | Retail forecasting studio | Used (earlier round, restyled by the new tokens) |
| shadcn/ui | Sheet, Command, Dialog, Tabs, Slider, Collapsible | Phone menu, Cmd/Ctrl+K, game dialogs, Retail studio | Used |
| Vitest 3 | | 38 tests of the game engine | Used (Vitest 5 needs newer `@types/node` than the project has) |

## What changed on the homepage

Ink and paper scenes alternate: opening installation (ink), live gallery (paper), code gallery (ink), about (paper), contact (ink). Palette and display type are set through the existing tokens (`--gold` and friends now hold signal orange), so the case-study pages, which I did not redesign, inherit the new colours and Inter Tight but keep their old layouts.

Removed from the homepage, still in Git: the At-a-glance stats, proof band, project atlas, experience timeline, stack sections, contact form, project modal and the old hero. The other, non-flagship projects no longer appear on the homepage at all; they are on the résumé. That is a content decision for the owner.

## ECHO//SHIFT

`/play`. A deterministic time-loop puzzle game: your previous runs replay as ghosts and hold plates or pass through doors while you walk through. Logic in `lib/echo` (no DOM, no clock): `sim.ts` (rules), `game.ts` (controller), `solver.ts` (breadth-first solver), `levels.ts`, `meta.ts` (score, daily, share, persistence). Rendering and UI in `app/play`.

- Levels: First Echo, The Switch, Parallel Lives, The Locked Path, Timing Matters, The Paradox. A solver proves each, and each level mirrored, solvable at exactly its par and not in fewer loops. The solver found a real flaw in Timing Matters (solvable in one loop by walking round the door); fixed.
- Score: 1000, minus 120 per loop beyond par, minus 2 per tick of the winning run, never below 100.
- Daily challenge: UTC days counted from 1 Jan 2026; a fixed rotation over the verified pool (five levels with par 2 or more, each also mirrored).
- Progress, settings and best solutions are stored locally only. No accounts, no leaderboard, no network.
- The old games (Cook an AI Model, Real or Fake, the dunk game, the dosa illusion, Build Your Plate) were removed; they remain in Git history.

## Verification

Run: `tsc`, `eslint` (0 errors, 1 pre-existing warning), `vitest` (38 pass), `next build`, résumé sync.

Played in a real browser with real key events at tick-accurate timing (`qa.mjs` style harness over the DevTools protocol): all six levels solved at par; progress saved and the next level unlocked after a reload; replay of a saved solution; share text copied with loops, score and URL; walking into an active pulse kills the run and restarts it; the daily number gives the same puzzle in separate sessions; a 390px touch device shows 58px on-screen controls, has no horizontal overflow, and level 1 was solved with touch events; system reduced motion switches the game to reduced mode.

Performance (production build, headless Chrome on this Mac, cold cache, 390px, 4x CPU slowdown, 1.6 Mbps and 150 ms RTT):

| Page | FCP / LCP | CLS | JS transferred | A real click |
|---|---|---|---|---|
| `/` | 1.6 s / 1.6 s | 0 | 355 KB | 32 ms (project tab) |
| `/play` | 1.5 s / 1.5 s | 0 | 393 KB | 64 ms (a menu button) |
| `/lab` | 1.5 s / 1.5 s | 0 | 417 KB (plus 449 KB images) | none |

Desktop, unthrottled: LCP 120 ms (`/`), 84 ms (`/play`). These are single cold loads and one interaction each, not Lighthouse scores and not a true INP over a session. The homepage JavaScript was about 615 KB before the redesign. The long-task observer reported about 0 ms of blocking time, which I would not lean on at 4x throttle.

## Not done, or not verified

- Marlow-style miniature product covers on the gallery index; a coverflow; depth-of-field beyond the blur transition.
- Retail is the earlier Bklit studio in new colours, not a rebuilt full-screen workstation. Preventive Care is the earlier stage rail with replay, not a rebuilt canvas. The code gallery is unchanged.
- Kokonut AI Diff Review and Lightbox Grid are installed but not used.
- Case-study pages and the Lab's Library and Terminal were not redesigned and not re-screenshotted.
- At 768px the opening artwork sits left of centre with empty space on the right.
- `/api/chat` and `/api/contact` remain but nothing on the site calls them now.
- Not tested: Safari, a physical touch device, a screen reader, a full keyboard-only pass of the homepage (the gallery has arrow, Home and End keys and the game is fully keyboard-playable, but I did not drive the homepage with the keyboard), sound.
- The game has no audio files: sound is tiny oscillator effects behind an off-by-default toggle.

---

## Milestone 2: the flagship gallery and full-screen exhibits

Branch `redesign/exhibition` (pushed; not merged or deployed).

**Gallery** (`app/exhibit/Gallery.tsx`, `app/exhibit/gallery/*`). A depth coverflow on a soft-grey floor: the active exhibit is large, sharp and interactive; the other two turn away, recede, dim and blur, and a click on the visible part of one brings it forward (the index is also a keyboard tablist: arrows, Home, End). Three working miniature applications, each with its own identity:

| Exhibit | What you can do in the miniature | Opens into |
|---|---|---|
| TaxProof (paper workpaper) | Pick a return line; Anime.js draws the original pages, the values read, the rule and the result from the real mileage lineage. The duplicated page 3 is flagged | The flippable dossier (Kokonut Page Flip) and the full evidence explorer |
| Retail (ink instrument) | Choose among 7 real series, change the range, toggle the 80% band, hover or arrow through weeks; error by model; the 74.2% vs 80% coverage | Forecasting Observatory: the Bklit chart dominant under three metrics (7.9%, 154 of 240, 74.2% shown against its 80% target) |
| Preventive Care (blue editor) | Select any of the five real stages; choose a sample patient (real computed risk); replay one pass through the real router under three critic scenarios | Agent Theatre: five large stage modules, replay, the real LoopSim, and the four limitations |

Each overlay grows from the on-screen rectangle of the window that opened it and shrinks back to wherever that window is; focus is trapped, the page is locked, Escape closes and returns focus to the button that opened it.

**What the pages do not do.** The Theatre runs only the risk arithmetic and the router. It shows no retrieved passages, drafts, critic text or medical recommendations, and says so on every stage module. The TaxProof miniature follows selected lineages only; the dossier does not follow the line selected in the miniature (Page Flip has no controlled page API).

**Work Archive** `/work/archive`: Woodlands IMS, SplitWise Pro, Fake Currency Detection, the Netflix recommender and the BERT length predictor, read from `resume.ts`, with real GitHub and demo links and no link where none exists. "Explore all projects" sits under the gallery.

**Tablet.** 1024: the installation is scaled as one piece and every link is clear of the artwork. 768: the copy runs in two columns and the three artifacts cascade across the full width on a diagonal.

**Case studies.** They inherit the new type and colours through the tokens, and hard-coded old copper, slate and ivory values in their panels and charts were migrated. They keep their original all-dark layouts, which is the main remaining inconsistency with the ink and paper rhythm of the homepage.

### Verification

`tsc` clean, `eslint` 0 errors (1 existing warning), 38 tests pass, production build (`/work/archive` is static), résumé sync passes.

Real browser input over the DevTools protocol, run against the production server:
- Gallery, 28 checks, all pass: arrow, Home and End keys on the index with focus following; clicking a receding window; only the active window interactive; the TaxProof line change (result $8,260 and rule R-STANDARD-MILEAGE); Retail series choice and arrow-key week reading; the "never passes" replay reaching the revision cap; overlay dialog, scroll lock, initial focus, Tab trapped, Escape closing and focus returning to the opener; at 390px one exhibit at a time, no horizontal overflow, selector targets 75px, controls at least 32px, the theatre opening and closing; reduced motion; zero console errors in desktop, phone and reduced-motion runs.
- ECHO//SHIFT regression, 17 of 17 pass (keyboard, saved progress, replay, share, hazard death, daily, touch, reduced motion).

Bugs the checks found, now fixed: reduced motion caused a React hydration mismatch (Motion's hook reports the client value on first render); the overlay recorded its opener after the lazy module loaded, so focus returned to the wrong element; a CSS rule I added disabled pointer events on the click-to-bring-forward veil.

Performance (production build, headless Chrome on this Mac, cold cache, 390px, 4x CPU, 1.6 Mbps, 150 ms RTT):

| Page | FCP / LCP | CLS | JS up front | Slowest real event |
|---|---|---|---|---|
| `/` | 1.76 s | 0 | 377 KB | 40 ms (project tab), 24 ms (opening the dossier overlay) |
| `/work/archive` | 1.53 s | 0 | 378 KB | none |
| `/play` | 1.50 s | 0 | 473 KB | none |

Desktop, unthrottled: LCP 100 ms, CLS 0.015. The overlay code (Bklit, the dossier, the explorer) loads when an exhibit is opened and is not in the up-front figure. Single cold loads and one interaction each: not Lighthouse and not a true INP.

### Visual comparison

`docs/screenshots/compare-marlow-vs-gallery.png` sets Marlow's selected work beside this gallery. Marlow's covers are polished product-mockup objects on coloured grounds, all in view at once. Mine are denser, working data interfaces in depth: more interactive, less graphic. Tablet and phone captures: `exhibition-hero-{1440,1024,768,390}.png`, `gallery-retail-390.png`, `overlay-theatre-390.png`.

### Not done, or not verified

- The gallery is a coverflow of working applications, not Marlow-style graphic covers. A graphic cover state for the inactive windows would make the three feel more like objects.
- The dossier does not sync with the line selected in the TaxProof miniature.
- Case-study pages still use their original layouts (all dark).
- Not tested: Safari, a physical touch device, a screen reader. The homepage was driven by keyboard in the gallery and overlays only, not end to end.
- The coverflow blurs and transforms are CSS and Motion; no frame-rate measurement was made on a real mid-range phone.

---

## Superseded by the consistency milestone

`docs/QA_FINAL.md` is the current record. Statements above that it changes: the case studies **no longer** keep their original layouts (new openings, sticky section bar, paper sections, next-exhibit links, one shared footer); inactive gallery windows **now show graphic covers**; the dossier **now opens at the selected line's evidence** instead of only at its cover; the electric blue is **#3A5CCB**, not #4169E1; and the performance table for case studies and the homepage was re-measured there.
