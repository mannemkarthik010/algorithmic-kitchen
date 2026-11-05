# QA report

Last updated 2026-11-05 on branch `redesign/phase-2-5-preventive-care`. This lists what was actually run. Anything not listed was not tested.

## Automated checks (this branch)
| Check | Result |
|---|---|
| `tsc --noEmit` | passes |
| `npm run lint` | passes |
| `npm run build` | passes, 10 static routes including `/work/taxproof` and `/work/preventive-care` |
| `npm run sync:check` (résumé against site data) | passes |
| Data scripts (`build-retail-data.py`, `build-taxproof-data.py`, `build-preventive-data.py`) | each asserts its figures against the pinned source and passes |

There is no unit or end-to-end test suite in this repository.

## Visual checks in a browser
| Page | 1360 to 1440px | 390px | 768px |
|---|---|---|---|
| Home hero | checked | checked, no horizontal overflow | not checked |
| `/work/taxproof` | checked, all three lineages, hash chain, tamper toggles | checked, no overflow | not checked |
| `/work/preventive-care` | checked: walkthrough, step controls, loop arc, simulator | checked, no overflow | not checked |
| `/work/retail-demand-intelligence` | checked in an earlier round | checked in an earlier round | not checked |
| `/lab` | not re-checked this round | not re-checked | not checked |
| Featured Work section | seen at 1440px and 390px during the audit | | not checked |

The colour-contrast edits (below) were made after most of these screenshots. I have not re-checked every page by eye since.

## Interaction checks run
- TaxProof: selecting nodes updates the detail panel and the upstream and downstream highlighting; switching traces re-lays out the graph; "show every step" works; the hash chain fails at the edited row, and when the row is re-hashed the break moves to the next row. The browser's SHA-256 matches the Python output for the untouched sample.
- Preventive Care: sample-patient switching, previous/next, node click, and the loop simulator. All-fail gives 3 drafts, 2 revisions and a final counter of 3. A pass on draft 2 gives 2 drafts and "Self-critique passed."
- Not tested: autoplay ("Play through") end-to-end, touch input, screen readers, Safari and Firefox.

## Accessibility
- Computed contrast for the palette (see `DESIGN_SYSTEM.md`). Found and fixed small text below 4.5:1: `--muted` (4.1 to 5.4), grey labels on ivory (4.0 to 4.8), copper text on ivory (3.5 to 4.9), green and copper badges.
- Interactive diagrams have text alternatives (lineage list, step panel, forecast table). Controls are buttons with `aria-pressed`. Charts and the graph support keyboard use.
- Not done: automated audit (axe or Lighthouse), focus-order review across the whole site, screen-reader pass.

## Performance
**Not measured.** No Lighthouse or Core Web Vitals run has been taken, so LCP, INP and CLS are unknown. The dev server in the browser pane also logs HMR websocket errors, which are dev-only.

## Findings fixed while testing
- Dev server served stale CSS after edits (Turbopack cache). Clearing `.next` fixed it. Production builds were not affected.
- Wires crossed cards in the TaxProof graph on narrow screens. Replaced with a paired layout and a side bus for narrow widths.
- Preventive Care site copy overstated the product. It said every recommendation cites a source and page, and that chunks were 512 tokens. The code lists the five retrieved sources beside the plan, and chunks are 512 characters. Site text corrected.

## Known issues
- Featured Work is still three identical cards and very tall on mobile.
- Footer and some older sections still use kitchen wording.
- `resume/resume.tex` line 219 describes a Framingham score and a vaccination plan that the code does not have. Awaiting your decision.
