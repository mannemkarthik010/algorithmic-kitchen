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

The before images show the viewport at the section; the after shelf images are taller viewports so the whole section is visible. All were taken in headless Chrome with `qa/shot.mjs`.

## Checks run

Headless Chrome on this Mac, against `next start` of this branch.

- `node qa/fqa.mjs reading-room`: **39 of 39**. At 1440 px with a real keyboard and mouse: the old cursor, play ring, grain, logo, top bar and indicator are gone; paper background, `(01)` label, display heading and exactly one "Open reading note"; status, author, title and note present and descending in size; ArrowRight through 14 distinct books and wrap, ArrowLeft back; the screen-reader line follows the selection; the row never moves and nothing overflows across all 14 books; Tab order is the four shelves, Previous, Open reading note, Next, the credit link; Enter on a shelf tab; real drag, sideways wheel and a click on a neighbouring spine each change the book (none opens the overlay); a vertical wheel scrolls the page and leaves the book alone; Enter on the section opens the overlay and Escape returns focus to the section; overlay opens full screen as a modal dialog named for the book with the page locked, focus moves to the close button, it shows the caption's note, Tab and Shift+Tab stay inside, Escape closes it and focus returns to the action; clicking the front cover opens it and the close button returns focus into the section. Reduced motion: shelf and caption change at once, the overlay opens and closes within 250 ms with focus returned. At 390 and 768 px with real touch: no sideways overflow, the shelves and controls on screen and at least 44 px, a touch at each control's centre reaches it, Next and Previous work, the row never moves across 14 books, Open reading note opens a full-screen overlay whose text clears the screen edge, Back to the shelf closes it and returns focus. Console errors: none.
- Two things this suite found and I fixed: the overlay text touched the screen edge on phones (the overlay is portalled to `<body>` and had not inherited the `--gut` spacing variable), and the action row moved by 25 px across books on phones (above).
- The whole browser suite (`npm run qa`, 15 suites): **286 of 286**, exit 0. That includes the existing layout check of `/lab` at 390, 768, 1024 and 1440 px (no overflow, no clipped content, no target under 24 px, no console errors) and the structure check of `/lab` (one `h1`, no skipped heading levels, named controls). The homepage, case-study, gallery, navigation and game suites are unchanged and still pass.
- Project checks: `tsc` clean; `eslint` 0 errors, 1 warning (unused `i` in `EvidenceGraph.tsx`, predates this work); `vitest` 38 of 38; `next build` succeeds; `sync:check` passes; `npm run qa:selftest` 8 of 8.

Information only, not assertions: with the action row at 20%, 50% and 85% of the screen height at 390 and 768 px, nothing (including the page's fixed Sound and Terminal buttons) covered any of its controls.

## Not tested

- **Safari, VoiceOver and any other screen reader: untested.** The shelf uses 3D transforms, `perspective` and the Web Animations API, which is where a WebKit difference would show. `docs/MANUAL_REVIEW.md` is the exhibition branch's checklist and has no Reading Room steps yet.
- **A physical phone**; touch here is Chrome's emulation. The shelf's own touch drag (as opposed to taps and the page scroll) was not exercised with touch.
- **Offline or slow covers.** Covers are hotlinked from Open Library, as before; when one fails to load the generated art shows. The suite does not assert on cover images.
- **Frame rate** of the shelf on real hardware, and Lighthouse or INP.
- Keyboard use of the shelf by Tab alone: the 42 book tapes (three copies of the 14 books, so the shelf can loop) are not Tab stops (as before); browsing by keyboard is ArrowLeft and ArrowRight on the section, or the Previous and Next buttons.
- Mobile landscape and widths between 390 and 768 px beyond the two sizes above.

## Rerun

```bash
npm run build && npx next start -p 3300
node qa/fqa.mjs reading-room        # or: npm run qa
```
