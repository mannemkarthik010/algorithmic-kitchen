# QA report

Last updated 2026-11-05 (library integration round) on branch `redesign/phase-2-5-preventive-care`. This lists what was actually run. Anything not listed was not tested.

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
| Selected work (new showcases) | checked: all three compositions, forecast series switching and scrub, disclosure, stage selector | checked, no horizontal overflow | checked, no horizontal overflow |
| Footer | checked | not re-checked | not checked |

The colour-contrast edits (below) were made after most of these screenshots. I have not re-checked every page by eye since.

## Interaction checks run
- TaxProof: selecting nodes updates the detail panel and the upstream and downstream highlighting; switching traces re-lays out the graph; "show every step" works; the hash chain fails at the edited row, and when the row is re-hashed the break moves to the next row. The browser's SHA-256 matches the Python output for the untouched sample.
- Preventive Care: sample-patient switching, previous/next, node click, and the loop simulator. All-fail gives 3 drafts, 2 revisions and a final counter of 3. A pass on draft 2 gives 2 drafts and "Self-critique passed."
- Not tested: autoplay ("Play through") end-to-end, touch input, screen readers, Safari and Firefox.

## Selected work: measured
| Item | Before | After |
|---|---|---|
| Homepage Work section height at 390px | about 5,100px | about 4,440px |
| Of that, the three projects | | about 3,710px (1,240 / 1,340 / 1,120) |
| Horizontal overflow at 390, 768, 1440px | none | none |

The mobile reduction is real but modest (about 13%). Most of the height now sits in the preview, the evidence trail and the chart, which are the content. Further cuts would mean hiding evidence.

Interactions run: Retail series switch morphs the lines and the readout updates on pointer move; the TaxProof disclosure opens by button with `aria-expanded` and shows seven sections; the case-study link plays a 340ms exit and then routes, and browser Back returns to the page with normal state; every external link resolves (200, with Streamlit answering through its usual redirect).
Not run: keyboard-only pass through the whole section, touch on a real device, screen reader, Safari.

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
- Older project modals and the "all projects" cards still use kitchen wording.
- The résumé PDF has not been regenerated. `resume.tex` is corrected, and CI builds the PDF on merge to `main`.
- The `sw-index` side navigation only appears at 1440px and wider.
- Dev-server CSS goes stale after edits in the browser pane (HMR socket fails). Restarting with a cleared `.next` fixes it. Production builds are unaffected.


## Library integration round

### Production measurements
Run against `next build` served by `next start` on localhost, in the browser pane, unthrottled. These are not Lighthouse scores and do not include network conditions.

| Metric | 1440px | 390px |
|---|---|---|
| LCP | 276 ms (headline) | 64 ms (after fix) |
| CLS | 0.013 | 0 |
| TTFB | 18 ms | 12 ms |
| JavaScript transferred | about 560 KB across 17 files | same |
| INP | not measured: scripted events do not register as real input |

Finding fixed: on a phone the largest element was the hero paragraph, which I had fading in with a delay. LCP was 1.66 s until it rendered immediately.

### Accessibility audit (scripted, in the page)
Found and fixed: contact-form inputs had no accessible name (labels were not tied to fields) and footer links were 21 px tall. After the fixes there are no unnamed controls, no images without alt, no duplicate ids, one h1.
Not done: axe or Lighthouse, a real screen-reader pass, full keyboard-only walkthrough, reduced-motion behaviour in a browser.

### Layout
Phone selector had been widened to 950 px by a grid track growing to fit its content. Fixed. No element wider than the viewport at 390 px afterwards. Work section on a phone: 1,740 to 2,320 px depending on the project, from about 5,100 px at the start of the redesign.

### Screenshots
`docs/screenshots/`: hero at 1440, 768 and 390 px; the TaxProof and Preventive Care case-study tops at 1440 px. Headless captures cannot scroll, so section-level before and after images were not produced. I could not capture a faithful "before" because the old build's entrance animations do not settle in headless mode. Comparisons were made by eye in the browser pane.

### Checks
Typecheck, lint (vendored shadcn, Bklit and Kokonut sources excluded), production build and résumé sync all pass. There is still no unit or end-to-end test suite.
