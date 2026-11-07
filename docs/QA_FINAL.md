# Final QA: consistency milestone (`redesign/exhibition`)

This file separates what was **observed in this milestone** from what earlier documents reported. Earlier documents (`QA_REPORT.md`, `EXHIBITION_REDESIGN.md`) describe earlier states of the site; their numbers were not re-measured here unless a row below says so.

## Finishing pass (supersedes the counts and two defects below)

Scope: keep `#3A5CCB` and the current design; no merge, no deployment.

### Changes
1. **Dossier centred.** The page-flip frame is `mx-auto max-w-4xl`; opened at Lines 9, 28 and 29 it sits within 2 px of the overlay's centre.
2. **Lines 28 and 29.** The opened spread now says it shows only the mileage contribution to the line (the car-and-truck amount, $8,260), not the line's complete calculation. The gallery button reads "Open the mileage part in the dossier" for those two lines.
3. **Mobile Lightbox.** Two columns of even 4:3 tiles up to 860 px wide, four columns above. Screenshot: `docs/screenshots/screens-lightbox-390.png`.
4. **Floating navigation versus chart controls.** Reproduced at 390 px: the capsules sat over the "26 wk" and "80% band" buttons when those were scrolled under the bar. The bar now steps away while reading down on screens up to 960 px, returns on any upward scroll, at the top, or when it receives focus. Screenshots: `nav-hidden-retail-390.png` (nothing over the controls) and `nav-returned-retail-390.png` (the bar back, over the top of the tab strip, by design).

### Defects found in this pass and fixed
- **Deep links landed at the top.** `ScrollToTop` called `scrollTo(0, 0)` on every mount, so `/#work`, `/#about` and similar loaded at the top. Found while looking at desktop and iOS Safari; reproduced in Chrome. `ScrollToTop` now honours the hash (retries for about 1.2 s while the layout settles, and stops as soon as the visitor scrolls or presses a key). My earlier link test only checked that targets existed, which is why it missed this; `qa/hash.mjs` now loads each hash cold and checks where the page lands.
- **Structure.** The gallery had no heading, there was no skip link, four case-study panels jumped from `h2` to `h4`, and the shared `TabsTrigger` pointed `aria-controls` at ids that did not exist. All fixed; `qa/axaudit.mjs` covers each.
- **A stale check.** The "on-this-page bar stays 66 px below the nav" test contradicted the new auto-hide. It now asserts both states (bar at the top edge while the nav is hidden, 66 px below the nav once it returns).

### Browser suites, rerun on the final build
156 checks in 12 suites, all passing (`npm run qa`; see `qa/README.md`). New in this pass: `finish` (7), `nav` (1), `hash` (12), `structure` (32). Earlier suites grew by one check (`touch`). These are Chrome-only.

| Project check | Result |
|---|---|
| `tsc --noEmit` | clean |
| `eslint` | 0 errors, 1 warning (unused `i` in `EvidenceGraph.tsx`, predates this pass) |
| `vitest` | 38 of 38 (ECHO//SHIFT engine only) |
| `next build` | succeeds; 10 routes, 12 static pages |
| `sync:check` | résumé and site agree |

### Safari, observed in this pass
- **Mobile Safari (iOS Simulator, iPhone 17 Pro, WebKit), driven by touch:** `/#work` lands on the gallery; the nav capsules are absent while scrolling down and return after scrolling up; the Retail tab opens.
- **Desktop Safari:** launched and viewed read-only (screenshots). The deep-link defect above was seen there before the fix and the corrected landing was seen after it.

### Could not be run (recorded, not claimed)
- **VoiceOver.** Not run. The structure audit is a programmatic stand-in, not a screen-reader pass. A manual script is in `qa/README.md`.
- **Desktop Safari beyond viewing.** My computer-use access to Safari is read-only (clicks and typing are blocked), and Safari's automation setting stays off. So gallery selection, overlay open and close with the keyboard, the case-study journey and Tab order were **not** exercised in desktop Safari.
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
- All project checks and 156 browser checks pass on the final build; no known failing check. (103 was the earlier count.)
- Branch is pushed; nothing is merged or deployed.
- The unverified areas (desktop Safari interaction, VoiceOver, a physical phone, real-device frame rate) are the honest gap between "passes everything I could run" and "verified on the devices people use".
