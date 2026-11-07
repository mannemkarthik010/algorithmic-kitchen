# Final QA: consistency milestone (`redesign/exhibition`)

This file separates what was **observed in this milestone** from what earlier documents reported. Earlier documents (`QA_REPORT.md`, `EXHIBITION_REDESIGN.md`) describe earlier states of the site; their numbers were not re-measured here unless a row below says so.

## Finishing pass (supersedes the counts and two defects below)

Scope: keep `#3A5CCB` and the current design; no merge, no deployment.

### Changes
1. **Dossier centred.** The page-flip frame is `mx-auto max-w-4xl`; opened at Lines 9, 28 and 29 it sits within 2 px of the overlay's centre.
2. **Lines 28 and 29.** The opened spread now says it shows only the mileage contribution to the line (the car-and-truck amount, $8,260), not the line's complete calculation. The gallery button reads "Open the mileage part in the dossier" for those two lines.
3. **Mobile Lightbox.** Two columns of even 4:3 tiles up to 860 px wide, four columns above. Screenshot: `docs/screenshots/screens-lightbox-390.png`.
4. **Floating navigation versus controls.** Reproduced at 390 px: the capsules sat over the "26 wk" and "80% band" buttons when those were scrolled under the bar. The bar steps away while reading down on screens up to 960 px, and returns on upward scroll, at the top, or when it holds keyboard focus. The QA correction pass below found that this was not enough: on the way back up it could still land on the gallery selector, so it now also stays away while the selector or a miniature's control strip is under it. Screenshots: `nav-hidden-retail-390.png`, `nav-yields-to-selector-390.png`, `nav-returned-after-selector-390.png`.

### Defects found in this pass and fixed
- **Deep links landed at the top.** `ScrollToTop` called `scrollTo(0, 0)` on every mount, so `/#work`, `/#about` and similar loaded at the top. Found while looking at desktop and iOS Safari; reproduced in Chrome. `ScrollToTop` now honours the hash (retries for about 1.2 s while the layout settles, and stops as soon as the visitor scrolls or presses a key). My earlier link test only checked that targets existed, which is why it missed this; `qa/hash.mjs` now loads each hash cold and checks where the page lands.
- **Structure.** The gallery had no heading, there was no skip link, four case-study panels jumped from `h2` to `h4`, and the shared `TabsTrigger` pointed `aria-controls` at ids that did not exist. All fixed; `qa/axaudit.mjs` covers each.
- **A stale check.** The "on-this-page bar stays 66 px below the nav" test contradicted the new auto-hide. It now asserts both states (bar at the top edge while the nav is hidden, 66 px below the nav once it returns).

### QA correction pass

Scope: the test harness and one navigation defect it exposed. No redesign.

**1. The runner could report success for a failing suite.** `qa/run-all.mjs` counted `PASS` and `FAIL` lines and ignored how the child process ended, so a suite that printed `PASS` and then crashed, was killed, or hung would still count as `ok`. The pass/fail rule is now in `qa/runner.mjs`: a suite fails if it printed a `FAIL`, exited non-zero, was terminated by a signal, timed out (15 minutes), could not be started, or printed no results. Verified with deliberately failing fixtures (`npm run qa:selftest`, 8 of 8): PASS then exit 3, PASS then SIGKILL, PASS then a hang (timeout), a program that does not exist, a FAIL line, a silent suite, and one bad suite among good ones all make the run exit 1 with the reason printed, and the control exits 0. As a mutation check I disabled the exit, signal and error handling: 5 of the 8 cases then failed, and the old behaviour showed as `ok exit3 2 passed` with the run exiting 0.

**2. `qa/navobs.mjs` did not do what its comment said.** It scrolled with `window.scrollBy`, sampled one state, and would have passed if it found no controls. It now uses real touch input (a tap and `Input.synthesizeScrollGesture` swipes) and real key events, asserts that controls were found, and checks after every scroll step that the visible centre of every control is what a pointer would hit. 11 assertions; 86 control checks across 7 sampled positions in the last run. One setup step is programmatic: `focus()` puts focus on the first control after the bar before a real Shift+Tab.

**3. The new test found a real defect in the previous behaviour.** I ran it against the previous `ExNav`: it failed with `01 TaxProof @y30 hit NAV; 03 Preventive Care @y30 hit NAV`, and the assertion that the bar stays clear of the selector failed too. That is, when the bar returned on scroll up, a touch on the TaxProof or Preventive Care tab would have landed on the nav capsules. The earlier note that the returned bar covering the top of the tab strip was "by design" understated this and is withdrawn. Fix at the time: the bar yielded while `.gx__index`, `.rm__bar`, `.rm__ctl`, `.pm__ctl` or `.tm__lines` (in the active exhibit) was within 72 px of the top, returned once it had passed (the rule in force now is described in the next section), and stays reachable by keyboard (focus on the bar reveals it; focus does not re-hide it while inside). The new suite passes 11 of 11 against the fix and fails against the old code.

**4. README overstated what the scripts exercise.** Corrected in `qa/README.md`, which now lists for each suite what it checks and what it does not. The wrong statements were: `motion` is a frame-time measurement, not a reduced-motion test (reduced motion is in `gallery` and `game`); `keys` does not drive the menu sheet or the command palette; `touch` does not swipe the coverflow or the dossier; `game` plays level "first-echo" (keyboard and touch) and uses "the-switch", not every level; `links` fetches internal links only and checks five removed section names, not four; `structure` checks DOM structure and has no navigation-landmark or dialog assertion; "no extra dependencies" omitted `vite-node`. The manual checklist moved to `docs/MANUAL_REVIEW.md`.

**5. Two Retail case-study accessibility defects found while checking the manual script against the code.** Fixed in the next section.

**Scope of the nav fix at this point.** Applied at 960 px and below and tested at 390 px only; above 960 px the bar never hid. Superseded by the next section.

### Retail accessibility and nav-width pass

Scope: the two confirmed Retail case-study defects and the nav at wider widths. Design and blue unchanged.

**1 and 2. Retail explorer semantics (`ForecastExplorer.tsx`).** The series strip was `role="tablist"` with `role="tab"` buttons: arrow keys did nothing, and each button was its own Tab stop, which the tabs pattern says it should not be. The time-range buttons showed their state only through a CSS class. The series strip is now a labelled group (`role="group"`, "Series") of buttons with `aria-pressed`, and the time-range buttons carry `aria-pressed` too. I chose the group over the full tabs pattern because the buttons choose which data one chart shows and there are no tab panels. No visual change (same classes). Every button also has `type="button"`.

**3. Regression checks (`node qa/fqa.mjs retail-a11y`, 11 checks).** They read Chrome's accessibility tree and use real key events. They assert: one "Series" group of 7 buttons, each a button exposing a pressed state, exactly one pressed, names matching the visible labels; a "Time range" group of 3 buttons with the same properties; no tab or tablist roles in the explorer; Tab moves to the next series button without selecting it; Space selects it (the tree reports it pressed and the previous one not, the chart's label and drawing change, focus stays); Tab then Enter does the same; Shift+Tab goes back; the same for the time-range buttons; no console errors. One programmatic setup step: `focus()` on the currently pressed button before the real keys. Run against the old component the suite fails 10 of 11 (only the console check passes); with the fix it passes 11 of 11. This is Chrome's accessibility tree, not what VoiceOver says.

**4. Nav obstruction at 768, 960, 1024 and 1440 px.** `qa/navobs.mjs` now runs the same journey at 390, 768, 960 (touch) and 1024, 1440 px (real mouse wheel and clicks): tap or click Retail, scroll down to the chart ranges, scroll back up in small steps past the controls and the selector, and after each step check that every control's visible centre is what a pointer hits and that the bar's own controls are hit at their centres.
- **Confirmed overlap, run before changing anything:** 390, 768 and 960 px passed. At 1024 px the Preventive Care tab was hit by the bar (`03 Preventive Care @y21 hit NAV`); at 1440 px the Retail range buttons were (`26 wk`, `1 yr`, `All`, `80% band` at y35 hit NAV). Above 960 px the bar never moved out of the way.
- **Fix, no redesign:** the same "yield while a control is under it" rule now applies at every width, using real geometry (a control whose box meets a capsule's horizontal extent inside the top 66 px). At 1024 px and wider only the overlapped capsule slides up, then returns; at 960 px and below the behaviour is as before (the whole bar steps away on scroll down and waits on the way back up). The bar re-checks after a click, because choosing another exhibit moves controls without any scroll. Screenshot: `docs/screenshots/nav-capsule-yields-1440.png`.
- **What it costs on desktop:** while scrolling through the gallery a capsule steps aside in a good share of positions (4 of 8 samples at 1024 px, 6 of 10 at 1440 px in the final sweep, which covers the densest stretch of the page). One capsule at a time; the other stays.
- **A flaky check in my own test, found and fixed:** in one full run the 768 px assertion "found 0 Retail controls" failed. The cause was the test, not the page: it stopped scrolling when the range buttons were within 60 px of the top, and at 768 px three gestures land at 57 to 59 px, right on that line, so a run that landed just above it scrolled once more and overshot the controls off the top. Positioning is now corrective (gestures in either direction until the buttons are 0 to 60 px from the top). Six consecutive runs at 768 px then passed, including two that needed a corrective gesture.
- **Not covered:** only the gallery selector and the controls inside the active exhibit are sampled. Other controls elsewhere on the page are not tested against the bar. The yield behaviour has not been seen in Safari. (At the time of this section the keyboard case was not run at 1024 px and wider; the next section adds it.)

**Correction.** This section originally ended with a paragraph saying the same defect pattern was found in `EvidenceGraph.tsx`, `HashChain.tsx`, `TaxProofCase.tsx` and `PipelineDiagram.tsx`. For the last two that was wrong: both already carry `aria-pressed`. I had searched with output that was cut off at 150 characters and read the missing text as absent. `EvidenceGraph` and `HashChain` were as described. The next section covers what was done.

### Keyboard focus and the stepped-aside capsule; the other case-study selectors

Scope: a defect in the previous nav fix, and the same selection-state problem in two more case-study components. Design, blue and the overlap protection unchanged.

**1. Focus entering the bar now clears everything (`ExNav.tsx`, `exhibit.css`).** In the previous fix, keyboard focus on the bar cleared the whole-bar hiding but not a stepped-aside capsule, so tabbing into a yielded capsule put focus on a link that was off screen. Confirmed before fixing: against the committed code, Shift+Tab into the header at 1024 and 1440 px landed on the command-palette button with `on screen false; hit false; yielded b:true r:true`, and the forward entry (skip link, then brand link) was the same. Now `onFocusCapture` clears both the whole-bar and the capsule state, and `onBlurCapture` re-evaluates the overlap once focus leaves the header (no scroll needed). A CSS rule (`.exnav:focus-within`, placed after the yield rules, which have equal specificity) also keeps the capsules in place while focus is inside, so nothing depends on how quickly React state updates.

**2. Desktop keyboard regression at 1024 and 1440 px (`qa/navobs.mjs`, 6 checks per width).** It records where a capsule stepped aside during the wheel-scroll sweep, returns there, and asserts: a capsule really is stepped aside with focus in the page; a real Shift+Tab into the header brings every capsule back (8 bar controls, none obstructed) with the focused ⌘K button on screen and hit at its centre; Enter on it opens the command palette and Escape closes it; after a real mouse click on empty page the capsule yields again at the same scroll position (the re-check after focus leaves); and Tab from the top of the page (skip link, then brand link) brings the brand capsule back with its link on screen and hit at its centre. Against the committed code the two focus checks fail at both widths; with the fix all pass. Programmatic setup steps: `focus()` on the first control after the bar, `scrollTo()` back to the recorded position, and focusing `<body>` so that Tab starts from the skip link. While writing this I fixed two mistakes in the test itself (an "empty page" scan that excluded everything because `<main>` has `tabindex="-1"`, and a forward-entry case that started with focus still in the header).

**3. Two more selectors converted.** `EvidenceGraph.tsx` (TaxProof's lineage chips): `role="tablist"`/`role="tab"` with `aria-selected` and no arrow-key handling, now a labelled group ("Choose a lineage") of `aria-pressed` buttons. `HashChain.tsx` (three sample-log modes): already a labelled group ("Tamper with the sample log"), now with `aria-pressed` on each button. No visual change.

**4. `TaxProofCase` layer buttons and `PipelineDiagram` stage buttons: unchanged.** They already carried `aria-pressed`, and testing found no defect: in Chrome's accessibility tree each exposes a button with a pressed state and exactly one pressed, Tab/Shift+Tab move between them without selecting, Space and Enter select, and the detail panel changes. (They also select on mouse hover; that is not tested.)

**Verification (`node qa/fqa.mjs case-a11y`, 21 checks).** For the lineage chips, the sample-log modes, the system-design layers and the Retail pipeline: each button exposes a pressed state in the accessibility tree with exactly one pressed; the two converted sets sit in a labelled group; a real Tab or Shift+Tab moves to the neighbour without selecting it; Space selects it, the tree moves the pressed state and the page content changes; the next Tab or Shift+Tab then Enter does the same; no tab roles remain in the lineage selector; no console errors. Against the old markup the lineage and sample-log checks fail (for example the old lineage selector reported `role tablist`); the cascade of failures after the first was not analysed.

### Browser suites, rerun on the final build
247 checks in 14 suites, all passing, exit 0 (`npm run qa`; see `qa/README.md`). By suite: layout 28, links 3, keys 9, touch 6, motion 4, new 9, finish 7, retail-a11y 11, case-a11y 21, nav 62, hash 12, structure 30, gallery 28, game 17. `structure` is one lower than before because the TaxProof page no longer contains tabs, so its tab-attribute check no longer applies there. Plus `npm run qa:selftest`: 8 of 8. All Chrome-only.

| Project check | Result |
|---|---|
| `tsc --noEmit` | clean |
| `eslint` | 0 errors, 1 warning (unused `i` in `EvidenceGraph.tsx`, predates this pass) |
| `vitest` | 38 of 38 (ECHO//SHIFT engine only) |
| `next build` | succeeds; 10 routes, 12 static pages |
| `sync:check` | résumé and site agree |

### Safari, observed in this pass
- **Mobile Safari (iOS Simulator, iPhone 17 Pro, WebKit), driven by touch:** `/#work` lands on the gallery; the nav capsules are absent while scrolling down and return after scrolling up; the Retail tab opens. **These observations predate the correction pass.** The newer behaviour (the bar staying away while the selector or a control strip is under it) has been exercised in headless Chrome only, not in Safari.
- **Desktop Safari:** launched and viewed read-only (screenshots). The deep-link defect above was seen there before the fix and the corrected landing was seen after it.

### Could not be run (recorded, not claimed)
- **VoiceOver: not run.** The structure audit is a programmatic stand-in, not a screen-reader pass. The checklist is `docs/MANUAL_REVIEW.md`; its status line says NOT RUN and its results table is empty. It now includes steps for the Retail series and time-range buttons, the TaxProof lineage and sample-log buttons, and the nav at 1024 px and wider including keyboard entry into a stepped-aside capsule.
- **Desktop Safari interaction: not run.** My computer-use access to Safari is read-only (clicks and typing are blocked), and Safari's automation setting stays off. So gallery selection, overlay open and close with the keyboard, the case-study journey and Tab order were **not** exercised in desktop Safari.
- **A physical phone**, **Lighthouse and a true INP**, and **frame rate on a real mid-range phone**: not available here.

## Observed in the earlier milestone (counts below are superseded by the finishing pass)

### Project checks (run on the final commit)
| Check | Result |
|---|---|
| `tsc --noEmit` | clean |
| `eslint` | 0 errors, 1 warning (an unused variable in `EvidenceGraph.tsx`, present before this milestone) |
| `vitest` | 38 of 38 pass (the ECHO//SHIFT engine; there are no tests for the portfolio pages) |
| `next build` | succeeds; 10 routes, `/work/archive`, `/play`, `/lab` and the three case studies are static |
| `sync:check` | résumé and site agree |

### Real-input browser suites, headless Chrome on this Mac, against `next start`
103 checks in 8 suites, all passing on the final build. Method: Chrome DevTools protocol with genuine mouse, key, touch and scroll events.

| Suite | Checks | What it covers |
|---|---|---|
| layout | 28 | 7 pages × 390, 768, 1024, 1440 px: no horizontal overflow, no content spilling outside its box, no interactive target under 24 px, no console errors |
| links | 3 | every internal link on 7 pages returns 200 (30 unique hrefs; external links not fetched); 27 in-page anchors exist in the live DOM; no link to a removed section |
| keys | 9 | Tab from the top to the footer in 52 stops without a trap, every stop named, visible focus ring on every stop, nothing inert focused; Enter opens an overlay, Escape returns focus to the opener; case-study section links work by keyboard |
| touch | 5 | a vertical swipe on the chart scrolls the page; the series strip and the on-this-page strip scroll sideways; no horizontal page scroll; the sticky bar stays stuck |
| motion | 4 | rAF frame cadence while switching exhibits and opening an overlay, at 1440 and at 390 with 4× CPU slowdown |
| new | 9 | covers and preserved state; the dossier opening at the selected line and its way back to the cover; the 390 px Retail miniature (nothing spills, 10 px axis labels, 36 px Expand button); the 390 px Observatory (chart starts at 381 px, metrics 81 px tall) |
| gallery | 28 | the earlier gallery suite: keyboard index, clicking a receding window, each miniature, overlay focus handling, phone fit, reduced motion, console errors |
| game | 17 | the ECHO//SHIFT regression suite |

### Real Mobile Safari (iOS Simulator, iPhone 17 Pro, iOS 26.5, WebKit)
Driven by touch: home page loaded; scrolled; "Enter the exhibition" scrolled to the gallery; the TaxProof workpaper, the Retail miniature and the full-screen Observatory (opened by tap) were viewed. Safari found two layout defects Chrome did not (a rotated stamp colliding with the next label, and the footnote squeezed into a one-word column); both were fixed and the stamp fix was re-confirmed in Safari. Captures: `safari-ios-simulator-*.png`. This is a simulator, not a device.

### Defects found by this QA and fixed
- `body { overflow-x: hidden }` made `body` a scroll container, so **every `position: sticky` on the site silently failed** (the new on-this-page bar, and the old case-study side rail). Now `overflow-x: clip`.
- Preventive Care case study LCP was **2.96 s** on an emulated phone: the headline was server-rendered at opacity 0 and only appeared after hydration. Now visible on first paint: **1.61 s**.
- Case-study back links, the old footer, and the palette pointed at `/#projects`, `/#experience`; the palette did nothing off the homepage. One shared footer; links reach `/#work`; the palette navigates.
- Mobile Retail miniature was wider than its frame (a scrolling strip widened the grid track); chart labels were about 4 px. Now drawn at measured size, 10 px labels.
- Narrow TaxProof chain: stamp over the next label; footnote squeezed. Fixed.
- Nav turned amber over the blue opening (difference blending). Plain white while the blue opening is behind it.
- Interactive targets under 24 px (footer links, case-study link rows, checkboxes, Library chips, summaries): raised.
- Electric blue `#4169E1` gave 4.06:1 for paper text on it and for it as text on paper. Deepened to `#3A5CCB` (4.93:1 both ways). **This departs from the exact hex in the brief.**

### Performance, production build, headless Chrome, cold cache, 390 px, 4× CPU, 1.6 Mbps, 150 ms RTT
| Page | FCP / LCP | CLS | JS up front | Slowest real event |
|---|---|---|---|---|
| `/` | 1.66 s | 0 | 379 KB | 56 ms (project tab) |
| `/work/retail-demand-intelligence` | 1.60 s | 0 | 474 KB | none |
| `/work/taxproof` | 1.81 s | 0 | 472 KB | none |
| `/work/preventive-care` | 1.61 s | 0 | 476 KB | none |
| `/work/archive` | 1.54 s | 0 | 379 KB | none |

Desktop, no throttle: `/` LCP 84 ms, CLS 0.017, slowest event 40 ms. Single cold loads, one interaction each: not Lighthouse and not a true INP.

### Animation smoothness: what was and was not measured
rAF cadence was a flat 16.7 ms (p95 16.8 ms, 0 % of frames over 50 ms) across exhibit switches and overlay opens, at 1440 and at 390 with 4× CPU throttle. Headless Chrome cannot see compositor or raster cost (the blur filters on receding windows, the overlay's growing rectangle), so this shows the main thread is not the bottleneck. It does **not** show the animation is smooth on a real phone.

## Not tested
- **Safari desktop.** Safari's WebDriver is disabled (it needs "Allow Remote Automation" in Safari's Developer settings; I did not change that).
- **Keyboard use in Safari**, and the dossier, Theatre and game in Safari.
- **A physical phone.** None was connected.
- **A screen reader** (VoiceOver was not run). Accessible names, roles, live regions and focus order were checked programmatically only.
- **Lighthouse** and a true INP over a session.
- Frame rate on a real mid-range phone.

## Remaining defects and risks
1. ~~The dossier sat left of centre on later spreads.~~ Fixed in the finishing pass.
2. Case-study pages have new openings, a sticky section bar, paper sections and next-exhibit links, but their interactive explorers are the earlier components in new colours; only the problem and decisions sections are on paper.
3. Kokonut Page Flip (`initialSpread`) and AI Diff Review (`readOnly`, `defaultOpen`) are vendored with small documented local changes; upgrading them means re-applying those.
4. Kokonut Scroll Index is installed but not used on any page. `/api/chat` and `/api/contact` exist and nothing calls them.
5. The deeper blue differs from the brief's hex (see above).
6. ~~The mobile Lightbox grid was a cramped mosaic.~~ Fixed in the finishing pass (2×2).
7. The `mix-blend-mode: difference` navigation is clever but fragile on saturated backgrounds; the blue opening needed a special case.

## Merge-readiness evidence (not a claim that it should merge)
- All project checks, 247 browser checks and the 8 runner self-tests pass on the final build; no known failing check. (103 was the earlier count.)
- Branch is pushed; nothing is merged or deployed.
- The unverified areas (desktop Safari interaction and VoiceOver, both marked NOT RUN in `docs/MANUAL_REVIEW.md`; a physical phone; real-device frame rate; the nav fix in Safari) are the honest gap between "passes everything I could run" and "verified on the devices people use".
