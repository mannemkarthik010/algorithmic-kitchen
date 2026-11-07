# Browser QA harnesses

These scripts drive a real Chrome over the DevTools Protocol. They need Node 22 or newer (they use the global `WebSocket`) and Google Chrome (set `CHROME=/path/to/chrome` if it is not in a default location). The project's own dev dependencies are enough; `npm run qa` also uses `vite-node` to generate the game solutions.

Every suite runs in **headless Chrome only**. Nothing here runs Safari, WebKit, a screen reader, or a physical device. Those checks are the manual checklist in [`docs/MANUAL_REVIEW.md`](../docs/MANUAL_REVIEW.md), and they are **not run** until someone completes it.

## Run everything

```bash
npm run build
npx next start -p 3300
```

In a second terminal:

```bash
npm run qa
```

`npm run qa` generates the ECHO//SHIFT solutions, then runs each suite below as a child process. A suite counts as failed if it printed a `FAIL` line, exited non-zero, was killed by a signal, timed out (15 minutes), could not be started, or printed no `PASS` or `FAIL` line at all. A printed `PASS` never outweighs any of those. The run exits non-zero if any suite failed.

`npm run qa:selftest` proves that rule without a server or a browser. It runs the real runner against deliberately failing fixtures in `qa/fixtures/` (PASS lines then exit 3, PASS then SIGKILL, PASS then a hang, a program that cannot start, a FAIL line, a silent suite, and one bad suite among good ones) and checks the exit status and the reason printed.

Pass a different base URL as an argument, for example `node qa/run-all.mjs http://localhost:3000`. Use a production build (`next start`): that is what the suites were run against, and the frame-time check in particular was never tried against `next dev`.

## Suites, and what each one actually exercises

Each script takes the base URL as its last argument (default `http://localhost:3300`) and prints `PASS` or `FAIL` lines.

| Suite | Command | What it checks | What it does not check |
|---|---|---|---|
| layout | `node qa/fqa.mjs layout` | At 390, 768, 1024 and 1440 px, on each of 7 routes (`/`, `/work/archive`, the three case studies, `/lab`, `/play`): no horizontal overflow, no clipped content, no interactive target under 24 px, no console errors. | Anything visual beyond those four properties. 24 px is the minimum tested, not a 44 px target rule. |
| links | `node qa/fqa.mjs links` | Every internal link on the 7 routes returns HTTP 200 (and its `#hash` exists in the served HTML), every in-page anchor targets an element in the live DOM, and no link points at five removed section names (`#projects`, `#experience`, `#expertise`, `#skills`, `#live`). | External links are collected but not fetched. |
| keys | `node qa/fqa.mjs keys` | On `/`: Tab reaches the end of the page without a trap, every focused control has an accessible name and a visible focus indicator and is not inert or invisible, and there are no console errors. Enter on "Open the observatory" opens the overlay and focuses its close control, and Escape returns focus to the opener. On the Retail case study: keyboard activation of a section link scrolls there and marks it current. | The menu sheet, the command palette, the dossier and the theatre are not driven by keyboard here. |
| touch | `node qa/fqa.mjs touch` | At 390 px with touch emulation: a vertical swipe starting on the Retail chart scrolls the page, the series strip scrolls sideways without moving the page, and the TaxProof case study's on-this-page strip scrolls sideways. Reading downward the nav steps away and the sticky on-this-page bar sits at the top edge; scrolling up the nav returns and the bar sits 66 px down. | Swiping the coverflow or the dossier, and scroll locking, are not tested. |
| motion | `node qa/fqa.mjs motion` | Frame intervals in headless Chrome while switching gallery tabs and while opening the Theatre overlay: 95th percentile under 50 ms, on desktop and at 390 px with a 4× CPU slowdown. | Not reduced motion (see `gallery` and `game`). It is a lab measurement from headless Chrome, not the frame rate of a real phone. |
| new | `node qa/fqa.mjs new` | The inactive gallery windows show their graphic cover, TaxProof's selected line survives visiting another exhibit, the dossier opens at the selected line and says so, "Start from the cover" resets it, and the 390 px Retail miniature and Observatory do not spill, keep readable axis text and keep a visible Expand button. | |
| finish | `node qa/fqa.mjs finish` | The dossier is centred in the overlay when opened at Lines 9, 28 and 29; the Line 28 and 29 note says the spread shows the mileage contribution, not the complete calculation; the Lightbox grid has 4 columns on desktop and 2 on a phone, with 4:3 tiles and no sideways overflow. | The note's wording is matched by pattern, not judged. |
| nav | `node qa/navobs.mjs` | At 390 px with **real touch**: a tap selects the Retail tab; touch scrolling down hides the bar; touch scrolling up in 70 px steps through the chart controls and the gallery selector, sampling after each step that the visible centre of every control (selector tabs and the active exhibit's buttons) is what a pointer would hit; the bar yields while the selector or a control strip is under it and returns after; and, with **real key events**, Shift+Tab from the first control after the bar brings the hidden bar back, and it hides again after focus leaves and the page is read downward. Counts of controls found are part of the assertions. | One setup step is programmatic: `focus()` places focus on the first control after the bar before the real Shift+Tab. Chrome's touch emulation, not an iOS finger. Phone width only (390 px). |
| hash | `node qa/hash.mjs` | Opening `/#work`, `/#contributions`, `/#about` and `/#contact` cold at 1440 and 390 px lands within about 140 px of the section, and clicking the footer or back link on the three case studies and the archive lands on `/#work` or `/#contact` as appropriate (4 clicks, headless Chrome, programmatic `click()`). | Safari. The defect was first seen in Safari and the fix was confirmed there by eye only. |
| structure | `node qa/axaudit.mjs` | For each of the 7 routes: one `h1` and one `main`, document language and title; no skipped heading levels; every control has an accessible name, every image has alt text, no duplicate ids; the skip link exists and its target exists; tabs carry `aria-selected` and have no dangling `aria-controls`. Plus: the gallery on `/` has a heading. | This is a structure check of the DOM, not a screen reader. It does not test that tab widgets follow the keyboard pattern, or that toggle buttons announce their state (see "Known gaps"). |
| gallery | `node qa/gqa.mjs` | Coverflow: ArrowRight, End and Home on the project index; clicking the visible edge of a receding window; only the active window is interactive. TaxProof: selecting Line 9 changes the result and rule. Retail: choosing a series updates the chart, arrow keys read weeks. Preventive: the "never passes" replay ends at Route with the revision cap. Overlay: opens as a dialog, locks the page, focuses the close control, Tab stays inside, Escape restores scroll and focus. At 390 px: no overflow, one exhibit at a time, selector targets at least 44 px, controls at least 32 px, the Theatre opens and closes. With reduced motion: the overlay opens immediately and closes with Escape. Console errors on desktop, phone and reduced motion. | |
| game | `node qa/qa.mjs` | ECHO//SHIFT in the browser: level "first-echo" solved by keyboard with the solver's solution and by touch controls, saved progress and unlock after reload, level select, share text, replay of a saved solution, the active-pulse death and auto-restart, the daily challenge number and its determinism, no overflow at 390 px, 44 px pad buttons, reduced-motion mode. It also uses the solutions for "the-switch". | The other levels are not played in the browser (the 38 unit tests in `lib/echo` cover the engine). |

## Other tools

- `node qa/shot.mjs <url> <out.png> <w> <h> [scrollSelector] [waitMs] [actJS]` takes a screenshot at a viewport after optional scrolling and a scripted action. The screenshots in `docs/screenshots/` come from this. Its scripted actions scroll programmatically.
- `node qa/perf.mjs <path> <mobile|desktop> [clickExpr]` and `node qa/lcp.mjs <url>` record load metrics from headless Chrome. They are lab numbers, not field data.
- `node qa/play.mjs <levelId> [shot.png] [base]` plays one ECHO//SHIFT level with real key events. `node qa/dbg.mjs <url> <jsExpression>` evaluates an expression in a fresh headless page.
- `qa/chrome.mjs` finds Chrome; `qa/runner.mjs` decides pass or fail for a suite; `qa/.generated/` is git-ignored and rebuilt by `npm run qa:solutions`.

## Known gaps in these suites

- Chrome only. No Safari, no VoiceOver or other screen reader, no physical phone, no Lighthouse, no field INP.
- `nav` and `touch` use Chrome's touch emulation, which is not the same as a finger on iOS.
- A passing suite says only that the listed properties held in that run. It is not evidence for anything the table does not list.
- Two accessibility gaps were found while checking the manual script against the code, and no suite tests for them: on the Retail case study, the series strip is marked as a tablist but arrow keys do not move between its tabs, and the time-range buttons do not expose a pressed state. They are recorded in `docs/QA_FINAL.md`.
