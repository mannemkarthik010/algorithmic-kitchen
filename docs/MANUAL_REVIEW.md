# Manual review: desktop Safari and VoiceOver

**Status: NOT RUN.** No one has completed this checklist. Until someone fills in the results table below, desktop Safari interaction and VoiceOver are *untested*, and every document that says so is correct. The automated suites (`qa/README.md`) run in headless Chrome only and are not a substitute.

Time: about 25 minutes. Needs a Mac with Safari and VoiceOver.

## Set up the branch

```bash
git fetch origin
git switch redesign/exhibition
git log -1 --oneline
npm ci
npm run build
npx next start -p 3300
```

Open `http://localhost:3300` in Safari. Record the commit hash printed by `git log` in the results table.

In Safari, Settings, Advanced: tick "Press Tab to highlight each item on a webpage" (or hold Option while pressing Tab), so Tab reaches links and not only form controls. Turn VoiceOver on and off with Cmd+F5. The VoiceOver key (VO) is Control+Option; the rotor is VO+U.

Do the first part (A) with VoiceOver **off**, to test Safari on its own. Then switch it on for the rest.

For each step write **Pass**, **Fail** or **Not run**, and a note on any failure (what you heard or saw). Do not mark a step Pass from memory of the code.

## A. Desktop Safari, VoiceOver off

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| A1 | Open `/#work` in a fresh tab | The page lands on the gallery, not the top | | |
| A2 | Open `/#about` and `/#contact` the same way | Each lands on its section | | |
| A3 | Click the three gallery tabs; then press Left/Right/Home/End on the focused tab | The selected exhibit changes; focus stays on the tab strip | | |
| A4 | On the Retail window, click "Open the observatory", then press Escape | An overlay grows from the window; Escape closes it and focus returns to the button | | |
| A5 | On TaxProof, choose Line 28, open the dossier | The dossier is centred under a note saying it shows the mileage contribution, not the complete calculation | | |
| A6 | Open Retail Demand Intelligence from the gallery, then use the chart with the arrow keys | The readout changes week by week | | |
| A6b | On the same page, Tab to the series buttons ("Store 3 · Dept 5" and the others) and press Space, then Enter, on different ones; then Tab to "1 year", "2 years", "All 5 years" and do the same | Each is a separate Tab stop; Space and Enter select; the chart changes; the selected button looks selected | | |
| A7 | Make the window under 960 px wide, scroll down then up a little over the gallery | The bar steps away on the way down and returns on the way up, but not on top of the gallery selector or a chart control strip | | |
| A7b | At 1024 px and wider, scroll slowly up and down through the gallery, past the selector and the Retail chart buttons | The bar stays, except that the left or right capsule slides up while a control is under it and comes back after; you can always click the control | | |
| A8 | Resize back and look at the nav against the blue case-study opening (Preventive Care) | The bar stays readable over the blue | | |

## B. VoiceOver on

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| B1 | Load `/`; press Tab once | "Skip to content" is announced first; Return moves focus to the main content | | |
| B2 | Rotor, Landmarks | A navigation landmark named "Main" and a main landmark | | |
| B3 | Rotor, Headings | One level 1; no jump from level 2 to level 4; a heading for the gallery ("Three working exhibits…") | | |
| B4 | Activate "Work" in the navigation | The page scrolls to the gallery and VoiceOver lands on or near its heading | | |
| B5 | Move into the gallery tab strip; use the arrow keys | Each tab is announced with its name and whether it is selected | | |
| B6 | Tab from the strip into the selected window | Only the selected window's controls are reachable; windows beside it are not | | |
| B7 | Activate "Open the observatory" | A dialog is announced, named for the exhibit; focus is on "Back to the gallery" | | |
| B8 | Tab and Shift+Tab around the overlay | Focus stays inside; it wraps from last to first and first to last | | |
| B9 | Press Escape | The overlay closes; focus is back on the button that opened it | | |
| B10 | Open the Retail case study; Rotor, Headings | A logical outline with no skipped levels | | |
| B11 | Tab to the forecast chart; use Left/Right | The chart is announced; the readout is read as it changes | | |
| B12 | On the Retail case study, move onto the series buttons | A group named "Series"; each button is announced as a toggle with its name and whether it is pressed (the wording varies by VoiceOver version); exactly one is pressed | | |
| B13 | Move onto the time-range buttons and press one with VO+Space | A group named "Time range"; the pressed state moves to the button you chose and is announced | | |

## What changed since the first version of this checklist

The Retail case study's series strip and time-range buttons used to be a `tablist` with no arrow-key behaviour and buttons with no pressed state. They are now a labelled group of buttons with `aria-pressed` (steps A6b, B12, B13 check this by hand). The automated suite `retail-a11y` checks it in Chrome's accessibility tree and with real key events; it cannot say what VoiceOver announces.

## Same pattern elsewhere, not examined

Reading the markup found the same shape (selection shown only by a CSS class, or `role="tablist"` without arrow-key handling) in `app/components/case/EvidenceGraph.tsx` (the TaxProof "Choose a lineage" chips), `HashChain.tsx` (three mode chips), `TaxProofCase.tsx` (layer buttons) and `PipelineDiagram.tsx` (step buttons). They were **not** tested in a browser and are **not** fixed. If you open the TaxProof or Preventive Care case studies during this review, note whether VoiceOver announces which one is selected.

## Results

| | |
|---|---|
| Reviewer | |
| Date | |
| Commit (`git log -1 --oneline`) | |
| macOS and Safari version | |
| VoiceOver steps completed | |
| Overall | |

When finished, put a copy of the filled table in the pull request or in `docs/QA_FINAL.md` and change the "not run" lines there to what you observed.
