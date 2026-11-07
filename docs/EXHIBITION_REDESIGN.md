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
| Kokonut UI | AI Diff Review, Lightbox Grid | Installed, read | **Not integrated.** Code Evolution still uses my own diff viewer from the earlier round |
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
