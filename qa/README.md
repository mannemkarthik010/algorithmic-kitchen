# Browser QA harnesses

These scripts drive a real Chrome over the DevTools Protocol with real mouse, key, touch and scroll events. They need Node 22 or newer (they use the global `WebSocket`) and a local Chrome or Chromium. There are no extra dependencies.

## Run everything

```bash
npm run build
npx next start -p 3300
```

In a second terminal:

```bash
npm run qa
```

`npm run qa` first generates the ECHO//SHIFT solver solutions, then runs every suite below and prints a pass and fail total. It exits non-zero on any failure. Pass a different base URL as an argument, for example `node qa/run-all.mjs http://localhost:3000`. Run it against a production build (`next start`), not `next dev`, because the timing and layout checks assume production output.

## Suites

| Suite | Command | What it checks |
|---|---|---|
| layout | `node qa/fqa.mjs layout` | No horizontal overflow, no clipped text, and minimum target sizes at 390, 768, 1024 and 1440 px on every route. |
| links | `node qa/fqa.mjs links` | Internal links and hash targets exist, and the footer and nav links resolve. |
| keys | `node qa/fqa.mjs keys` | Keyboard journeys: gallery, overlay focus trap, Escape returning focus to the opener, the menu sheet, and the command palette. |
| touch | `node qa/fqa.mjs touch` | Touch swipes on the coverflow and the dossier, and scroll-lock behaviour. |
| motion | `node qa/fqa.mjs motion` | `prefers-reduced-motion` removes the springs, drawing and autoplay. |
| new | `node qa/fqa.mjs new` | Graphic covers, selection state kept across exhibits, the dossier opening at the selected line, the 390 px Retail miniature and Observatory. |
| finish | `node qa/fqa.mjs finish` | Dossier centred when opened at Lines 9, 28 and 29; the Lines 28 and 29 note (mileage contribution, not the complete calculation); the Lightbox grid is 4 columns on desktop and 2 on a phone with even 4:3 tiles. |
| nav | `node qa/navobs.mjs` | The floating navigation does not sit over chart controls (series strip, range buttons) on phone widths while scrolling. |
| hash | `node qa/hash.mjs` | `/#work`, `/#about`, `/#contact` and similar deep links land on their section on a cold load. |
| structure | `node qa/axaudit.mjs` | One `h1`, no skipped heading levels, landmarks, skip link, labelled controls, no dangling `aria-controls` or `aria-labelledby`. |
| gallery | `node qa/gqa.mjs` | Coverflow selection, overlay open and close from each window, the dossier opened at a chosen line. |
| game | `node qa/qa.mjs` | ECHO//SHIFT in the browser: every level solved with the solver's own solutions. |

Each script accepts the base URL as its last argument (default `http://localhost:3300`). Lines starting with `PASS` or `FAIL` are the results.

## Other tools

- `node qa/shot.mjs <url> <out.png> <w> <h> [scrollSelector] [waitMs] [actJS]` takes a screenshot at a given viewport after optional scrolling and a scripted action. The screenshots in `docs/screenshots/` come from this.
- `node qa/perf.mjs <path> <mobile|desktop> [clickExpr]` and `node qa/lcp.mjs` record load metrics and a long-task count. They are lab numbers from headless Chrome, not field data.
- `node qa/play.mjs <levelId> [shot.png] [base]` plays one ECHO//SHIFT level in the real page with real key events. `node qa/dbg.mjs <url> <jsExpression>` evaluates an expression in a fresh headless page, for reproducing a single defect.
- `qa/chrome.mjs` is the shared launcher and CDP client. Set `CHROME=/path/to/chrome` if Chrome is not in a default location.

`qa/.generated/` is git-ignored and rebuilt by `npm run qa:solutions`.

## What these suites do not cover

They run in Chrome only. They do not run in Safari, they do not run a screen reader, and they do not measure frame rate on a real device. Those checks are manual, below.

## Manual pass: desktop Safari and VoiceOver (about 15 minutes)

Run against a production build on `http://localhost:3300`, or the deployed URL. Use Safari, with VoiceOver on (Cmd+F5). In Safari's Settings, Advanced, tick "Press Tab to highlight each item on a webpage", or hold Option while pressing Tab, so Tab reaches links as well as form controls.

Record each step as pass, fail or not run, with a note on any failure.

**1. Navigation**
1. Load `/`. VoiceOver should announce the page title. Press Tab once: "Skip to content" should be the first stop. Press Return: focus moves to the main content.
2. Open the rotor (VO+U), Landmarks: expect a navigation landmark ("Main") and a main landmark.
3. Rotor, Headings: expect one level 1 and no jump from level 2 to level 4.
4. Activate "Work" in the navigation. The page should scroll to the gallery and VoiceOver should land on or near its heading ("Three working exhibits…"). Reload `/#about` directly: the page should land on About, not the top.
5. At a narrow window (under 960 px wide), scroll down: the bar should step away. Scroll up a little: it should return. Tab to it while hidden: it should reappear.

**2. Gallery selection**
1. Tab into the gallery. Use the arrow keys or the numbered controls to move between TaxProof, Retail and Preventive Care. VoiceOver should announce which exhibit is selected.
2. Only the selected window's inner controls should be reachable by Tab. Windows to either side should not trap focus.

**3. Overlay open and close**
1. On the selected window, activate "Expand" or "Open the … ". An overlay should open and VoiceOver should announce a dialog named for the exhibit.
2. Tab through the overlay: focus should stay inside. Shift+Tab from the first control should wrap to the last.
3. Press Escape. The overlay should close and focus should return to the control that opened it.
4. Repeat from TaxProof with Line 28 selected: the overlay should open on the dossier spread with a note that it shows only the mileage contribution, not the complete calculation of the line. Check that the dossier sits centred in the overlay.

**4. One case study**
1. From the gallery, activate "Open the case study" for Retail Demand Intelligence (or navigate to `/work/retail-demand-intelligence`).
2. Rotor, Headings: expect a logical outline with no skipped levels.
3. Tab to the forecast chart: arrow keys should read each week. Tab to the series and range buttons: each should announce its pressed state.
4. Use the tabs in the case-study panels: arrow keys move between tabs and the panel content changes.

## Results of the last pass

See `docs/QA_FINAL.md`, section "Finishing pass", for what was observed in Safari, in Mobile Safari (iOS Simulator), and what could not be run.
