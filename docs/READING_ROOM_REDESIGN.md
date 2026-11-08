# Reading Room redesign (`/lab`)

Branch `redesign/reading-room`, cut from `bbbb543` (the manual-review candidate on `redesign/exhibition`, which is untouched). Nothing here is merged, deployed or pushed.

Scope: the Reading Room section only. The homepage, case studies, game, navigation and the rest of `/lab` (hero, ECHO//SHIFT block, Terminal, Sound toggle) are unchanged. Application code changed in three files only: `app/components/Library.tsx`, `app/exhibit/exhibit.css` and `app/globals.css`, and in the two CSS files only `.lib*` rules were removed or added. The QA scripts (`qa/fqa.mjs`, `qa/run-all.mjs`, `qa/README.md`) gained the `reading-room` suite.

## What changed

| Before | After |
|---|---|
| Dark walnut ground with a warm radial glow, a wooden shelf plank, and a film-grain overlay | A flat paper scene (`--paper`), ink type, no glow, no plank, no grain |
| A separate "The Reading Room / KARTHIK MANNEM" logo lockup, a bordered "LAB / LIBRARY" box, and a "14 BOOKS / 3 SHELVES" corner label | The exhibition's numbered section label `(01) The Reading Room`, the count on the right, and a display heading "Books that shaped the way *I build.*" (the old footer line, same words) |
| Shelf tabs as bordered boxes with a sliding orange block | Pill buttons (44 px), the selected one filled ink; each reports `aria-pressed` |
| Heavy shadows (a 70 px black drop and an orange glow on the cover) | A quiet 36 px ink shadow under the pulled-out cover, a hairline edge on every book |
| An oversized custom "OPEN BOOK" cursor that replaced the system cursor, plus a separate round play icon over the cover | Neither. One orange pill, **Open reading note**, in the caption. The system cursor is used; books show the pointer cursor |
| A centred caption of title, "AUTHOR / GENRE" and "READING NOW" in light type | An editorial caption: status dot and author on one line, the title in the exhibition display weight, then the book's note in Instrument Serif, then one action row |
| Previous and next as bare arrows at the far corners | Round 52 px buttons either side of the action (on a phone, directly under the books) |
| Overlay: a clip-path sheet that grew from the cover with an ink-blot reveal, line-by-line text masks, an unfocused-return `root.focus()`, no focus trap | The exhibition overlay itself (`gx-over` classes: ink ground, the same bar with "← Back to the shelf" and an Esc key cap, a "Reading note" title, and "05 / 14"). It grows from the cover's rectangle like the exhibits, traps focus, and Escape or the close button returns focus to whatever opened it |

## Kept as it was

- The 14 books, their data (`app/lib/library.ts`), the generated spines and covers (`LibraryArt.tsx`), and the Open Library cover images.
- The shelf engine: spring scrolling, the loop, drag, sideways wheel, click a spine to bring it forward, click the front cover to open, the hover lift, the tilt toward the pointer, and the sliding caption lines. It now measures the shelf element and not the whole section, so the section can be an ordinary flowing layout.
- Keyboard: ArrowLeft and ArrowRight step the shelf, Enter on the focused section opens the note, Escape closes it.
- The overlay's content: author, genre, title, status, shelf, the note, the story line, and the key ideas.

## Removed on purpose

The ink-blot reveal of the cover, the line-by-line text reveals in the overlay, the second "Back to the shelf" button (the overlay has one close, like the exhibits), the sliding tab indicator, and the drag/click hint on phones (it is still shown from 768 px up).

## Decisions worth a second look

- **The section number is (01).** The lab page's hero says "(Lab)" and the game block has no number, so the Reading Room starts the count. Say if you would prefer a different number or none.
- **On phones the action row sits above the status, title and note.** With the row below the note, its position moved by 25 px across the 14 books (the longest note wraps to six lines at 390 px), which is a bad thing to happen under a thumb; reserving six lines would leave a lot of dead space under short notes. Putting the row first keeps it still and within thumb reach of the books. From 768 px up the row stays below the note, where its position is constant.
- **The overlay is ink, not paper**, like every other exhibition overlay, so it reads as the same family and the covers sit on a dark ground.
- **The credit link moved to the left of the footer**, because the page's fixed Sound and Terminal buttons sit at the bottom right and used to cover it.

## Screenshots (`docs/screenshots/`)

| | Before | After |
|---|---|---|
| Shelf, 1440 px | `reading-room-before-shelf-1440.png` | `reading-room-after-shelf-1440.png` |
| Note overlay, 1440 px | `reading-room-before-detail-1440.png` | `reading-room-after-detail-1440.png` |
| Shelf, 390 px | `reading-room-before-shelf-390.png` | `reading-room-after-shelf-390.png` |
| Note overlay, 390 px | `reading-room-before-detail-390.png` | `reading-room-after-detail-390.png` |
| Shelf, 768 px | | `reading-room-after-shelf-768.png` |
| Shelf, 600 px | | `reading-room-after-shelf-600.png` |
| Shelf, phone landscape 844x390 | | `reading-room-after-landscape-shelf-844x390.png`, `reading-room-after-landscape-caption-844x390.png` |
| Overlay, phone landscape 844x390 | | `reading-room-after-landscape-detail-844x390.png` |
| Shelf, small phone landscape 667x375 | | `reading-room-after-landscape-shelf-667x375.png` |

The before images show the viewport at the section; the after shelf images are taller viewports so the whole section is visible. All were taken in headless Chrome with `qa/shot.mjs`. The landscape captures were re-taken after the nav fix and scrolled by script a little, so they show the bar stepped aside.

## Checks run

Headless Chrome on this Mac, against `next start` of this branch.

- `node qa/fqa.mjs reading-room`: **39 of 39**. At 1440 px with a real keyboard and mouse: the old cursor, play ring, grain, logo, top bar and indicator are gone; paper background, `(01)` label, display heading and exactly one "Open reading note"; status, author, title and note present and descending in size; ArrowRight through 14 distinct books and wrap, ArrowLeft back; the screen-reader line follows the selection; the row never moves and nothing overflows across all 14 books; Tab order is the four shelves, Previous, Open reading note, Next, the credit link; Enter on a shelf tab; real drag, sideways wheel and a click on a neighbouring spine each change the book (none opens the overlay); a vertical wheel scrolls the page and leaves the book alone; Enter on the section opens the overlay and Escape returns focus to the section; overlay opens full screen as a modal dialog named for the book with the page locked, focus moves to the close button, it shows the caption's note, Tab and Shift+Tab stay inside, Escape closes it and focus returns to the action; clicking the front cover opens it and the close button returns focus into the section. Reduced motion: shelf and caption change at once, the overlay opens and closes within 250 ms with focus returned. At 390 and 768 px with real touch: no sideways overflow, the shelves and controls on screen and at least 44 px, a touch at each control's centre reaches it, Next and Previous work, the row never moves across 14 books, Open reading note opens a full-screen overlay whose text clears the screen edge, Back to the shelf closes it and returns focus. Console errors: none.
- Two things this suite found and I fixed: the overlay text touched the screen edge on phones (the overlay is portalled to `<body>` and had not inherited the `--gut` spacing variable), and the action row moved by 25 px across books on phones (above).
- The whole browser suite (`npm run qa`, 17 suites, after the finishing pass): **347 of 347**, exit 0 (reading-room 39, rr-covers 16, rr-touch 45; the other 14 suites are unchanged). That includes the existing layout check of `/lab` at 390, 768, 1024 and 1440 px (no overflow, no clipped content, no target under 24 px, no console errors) and the structure check of `/lab` (one `h1`, no skipped heading levels, named controls). The homepage, case-study, gallery, navigation and game suites are unchanged and still pass.
- Project checks: `tsc` clean; `eslint` 0 errors, 1 warning (unused `i` in `EvidenceGraph.tsx`, predates this work); `vitest` 38 of 38; `next build` succeeds; `sync:check` passes; `npm run qa:selftest` 8 of 8.

Information only, not assertions: with the action row at 20%, 50% and 85% of the screen height at 390 and 768 px, nothing (including the page's fixed Sound and Terminal buttons) covered any of its controls.

## Finishing pass: failing and slow covers, reading order, touch, odd layouts

Scope: tests and concrete fixes only; no visual redesign. All of it ran in headless Chrome.

**1. A failed or slow cover hid the generated artwork (confirmed, fixed).** Chrome was made to fail, 404 or hang every `covers.openlibrary.org` request (`node qa/fqa.mjs reading-room-covers`). Against the previous code:
- *Overlay, request fails or 404:* a flat tint block was drawn over the artwork, with the browser's **broken-image icon** on top of it.
- *Overlay, request hangs:* a flat grey block for as long as the request was pending (screenshot detail 0.0).
- *Shelf, request hangs:* 33 cover images showed as bare tint boxes over the artwork (detail 0.0).
- *Shelf, request fails or 404:* already fine (the image hid itself on error).

Fix: the shelf cover is a small `CoverImg` component that stays invisible, with no background, until it has loaded (it also checks once for an image that finished loading before hydration, which never fires `onLoad`); the overlay preloads the remote cover and draws its tint block and `<image>` only after it has loaded. Afterwards the generated artwork shows in all three failure modes, shelf and overlay, and when a slow image finally arrives it replaces the artwork in both places. 16 checks.

**2. Reading order against visual order on a phone (two defects, fixed).** On phones the action row sits above the status, title and note on screen; in the DOM it comes after them.
- Tab order matches the screen: a real Tab visits the four shelves, Previous, Open reading note, Next and the credit link, top to bottom.
- *Defect:* the 42 shelf tapes were exposed to assistive technology as buttons with names ("Quiet by Susan Cain"): 17 of them in the accessibility tree at one moment, each book three times. They are now hidden (`aria-hidden` on the stage; the books stay clickable with a pointer, and Previous and Next, the arrow keys and the summary line serve everyone else).
- *Defect:* the book's note, visible in the caption, was hidden from assistive technology (the caption text is `aria-hidden` so the sliding lines are not read twice), so a screen-reader user only got the title, author and status until they opened the overlay. The note is now the accessible description of the "Open reading note" button.
- *Judgement, not a defect:* assistive technology meets the selection line before the controls, while a sighted phone user sees the controls first. The line says which book the controls act on, so that order was kept. It was read from Chrome's accessibility tree; it has not been heard in VoiceOver.

**3. Real touch dragging and odd layouts (`node qa/fqa.mjs reading-room-touch`).** At 390x844, 600x900, 844x390 and 667x375: a real touch drag across the shelf changes the book (both directions) without opening the overlay or scrolling the page; a vertical swipe that starts on the shelf scrolls the page and leaves the book alone; tapping a neighbouring spine works; the overlay scrolls by touch with the page behind it still and the close button reachable; no sideways overflow; every control at least 44 px and reachable; the pulled-out cover at least 120 px tall. 45 checks with the items above.

**4. The navigation bar covered the Reading Room's first shelf tab (confirmed, fixed).** Scrolling up through the Reading Room with real touch or mouse-wheel input, the nav's brand capsule sat on the "All" tab at 844x390, 1024x768 and 1440x900 (`ALL @scrollY …`). The bar's rule for stepping aside knew the gallery's controls but not these. The Reading Room's shelf tabs, action row and credit link are now in that rule (`ExNav.tsx`, one selector), and the sweep finds none covered at 390, 844x390, 1024 and 1440 px. At 390 px the page ends before the tabs can reach the bar, so that sweep reaches only a few positions.

**Test mistakes found on the way (all in my tests, fixed):** an overlay-scroll threshold that ignored a short scroll range; a vertical-swipe test that picked a direction with no room (the page had 74 px left, so the swipe "failed"); an accessibility-order regex that missed text split into runs and upper-case rendered labels; and a sweep that ended at once because the whole section fits in one phone screen.

**Remaining, not fixed:**
- At 390 px, with the action row in the bottom 110 px of the screen, the page's fixed **"Sound off"** button covers **Next book**. Those fixed Sound and Terminal buttons belong to `/lab`, not the Reading Room, and moving them is outside this pass. The 600 px and both landscape sizes showed no such covering. Reported by the suite as information only.
- At 844x390 and 667x375 the shelf is small (the books are 156 and 127 px tall) because the height is set from the screen height. They are legible, but they are not the dominant exhibit they are on a taller screen. This was left as designed.

## Not tested

- **Safari, VoiceOver and any other screen reader: untested.** The shelf uses 3D transforms, `perspective` and the Web Animations API, which is where a WebKit difference would show. The Reading Room's own checklist is `docs/MANUAL_REVIEW_READING_ROOM.md` (Safari browsing, covers, overlay scrolling, focus return, reduced motion, VoiceOver, and an optional iPhone part); its status is **NOT RUN** and its results table is empty. The exhibition branch's `docs/MANUAL_REVIEW.md` is separate and unchanged.
- **A physical phone**; touch here is Chrome's emulation, including the touch drag, the page scroll and the overlay scroll. iOS Safari behaviour (touch-action, momentum, the dynamic toolbar changing the viewport height) is untested.
- **Real slow or flaky connections.** Failing, 404 and hanging requests were simulated in Chrome (see above); a throttled real connection, partial images and cover images that load but are wrong were not.
- **Frame rate** of the shelf on real hardware, and Lighthouse or INP.
- Keyboard use of the shelf by Tab alone: the 42 book tapes (three copies of the 14 books, so the shelf can loop) are not Tab stops (as before); browsing by keyboard is ArrowLeft and ArrowRight on the section, or the Previous and Next buttons.
- Widths between 390 and 600 px, and between 600 and 844 px; other landscape sizes. Landscape was checked at 844x390 and 667x375 only, with emulation, not by rotating a device.

## Rerun

```bash
npm run build && npx next start -p 3300
node qa/fqa.mjs reading-room        # or reading-room-covers, reading-room-touch; or: npm run qa
```
