# Manual review: the Reading Room in Safari and VoiceOver

**Status: NOT RUN.** No one has completed this checklist. Until the results table at the end is filled in, Safari, VoiceOver, iOS Safari and a physical phone are *untested* for the Reading Room, and every document that says so is correct. The automated suites (`qa/README.md`) run in headless Chrome only.

This is separate from `docs/MANUAL_REVIEW.md`, which is the checklist for the exhibition branch (`redesign/exhibition`, still at `bbbb543`). Do not fill the two in as one.

Time: about 30 minutes. Needs a Mac with Safari and VoiceOver. Steps marked *(optional, iPhone)* need an iPhone and are marked NOT RUN unless you have one.

## Set up this branch

```bash
git fetch origin
git switch redesign/reading-room
git log -1 --oneline
npm ci
npm run build
npx next start -p 3300
```

Open `http://localhost:3300/lab#library` in Safari. If `git switch` says the branch does not exist, it has not been pushed from the machine where it was made; ask for it to be pushed, or copy the repository from there. Record the commit shown by `git log` in the results table.

In Safari, Settings, Advanced: tick "Press Tab to highlight each item on a webpage" (or hold Option while pressing Tab). Turn VoiceOver on and off with Cmd+F5; the VoiceOver key (VO) is Control+Option, the rotor is VO+U.

Do parts A to D with VoiceOver **off**; part E with it **on**.

For each step write **Pass**, **Fail** or **Not run**, and a note on any failure (what you saw or heard). Do not mark a step Pass from memory of the code.

## A. Safari browsing, VoiceOver off

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| A1 | Open `/lab#library` in a fresh tab | The page lands on the Reading Room: the "(01) The Reading Room" label, the heading, four shelf pills, the books | | |
| A2 | Look at the books | The spines and the pulled-out cover are drawn as solid 3D books, with no flicker, tearing, missing faces or blank rectangles | | |
| A3 | Press ArrowRight and ArrowLeft with the section focused (click empty paper first, or Tab to it) | The shelf steps one book at a time; the caption (status, author, title, note) slides to the new book | | |
| A4 | Drag the shelf sideways with the mouse or a trackpad click-drag | The book changes; the overlay does not open | | |
| A5 | Scroll sideways over the shelf with a trackpad two-finger swipe | The shelf moves; a plain vertical scroll over the shelf still scrolls the page | | |
| A6 | Click a spine next to the cover, then click the front cover | The spine comes forward; the front cover opens the note | | |
| A7 | Click each shelf pill (All, Engineering, Thinking, Philosophy) | The shelf moves to that group; the selected pill is filled | | |
| A8 | Scroll the page up and down past the Reading Room at a normal window width, then in a window narrower than 960 px | The navigation bar never covers a shelf pill, the three round and orange controls, or the credit link at rest; at 960 px and below it tucks away when you scroll down | | |
| A9 | Resize to about 600 px wide, then to a short wide window (about 840 × 390) | No sideways scrolling; everything reachable; the books are small but legible in the short window | | |

## B. Covers (VoiceOver off)

Covers load from `covers.openlibrary.org`.

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| B1 | Reload and watch the front cover as it loads | The generated artwork is there first; the real cover fades in over it | | |
| B2 | Turn images off (Safari menu Develop, Disable Images; enable the Develop menu in Safari Settings, Advanced, if you need to), reload, open the note on a book that has a real cover (Quiet) | The cover on the shelf and in the overlay show the generated artwork, with no flat grey block and no broken-image icon | | |
| B3 | Turn images back on. In the Network tab (Develop, Show Web Inspector), throttle or block `covers.openlibrary.org` if you can, reload | Same as B2 while the images are pending or blocked | | |

## C. The overlay: scrolling and focus (VoiceOver off)

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| C1 | Tab to "Open reading note" and press Return | A full-screen dark overlay grows from the cover; focus is on "Back to the shelf" | | |
| C2 | Make the window short (about 500 px high) and scroll the overlay with the trackpad or arrow keys | The overlay content scrolls and the bar with "Back to the shelf" stays at the top; the page behind does not scroll | | |
| C3 | Press Tab and Shift+Tab repeatedly | Focus never leaves the overlay | | |
| C4 | Press Escape | The overlay shrinks back to the cover; focus is back on "Open reading note" (you can see its ring) | | |
| C5 | Open the note by clicking the front cover, then click "Back to the shelf" | The overlay closes; the page behind is scrollable again; pressing Tab or arrow keys continues from the Reading Room | | |
| C6 | Click the front cover, press Escape, then press ArrowRight | The shelf moves (focus returned inside the Reading Room) | | |
| C7 *(optional, iPhone)* | Touch-drag the shelf, scroll the page with a finger that starts on the shelf, tap the cover, scroll the overlay, tap "Back to the shelf" | Each works; rotate to landscape and repeat | | |

## D. Reduced motion (VoiceOver off)

System Settings, Accessibility, Display, Reduce motion: on. Reload the page.

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| D1 | Press ArrowRight | The shelf and the caption change at once; no sliding | | |
| D2 | Open the note with Return on "Open reading note" | The overlay is there immediately, with no growing animation | | |
| D3 | Press Escape | It closes immediately; focus returns to the button | | |
| D4 | Turn Reduce motion off again and repeat D1 to D3 | The animations return | | |

## E. VoiceOver on

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| E1 | Rotor (VO+U), Headings | A heading "Books that shaped the way I build." under the page's "One game. One bookshelf." heading | | |
| E2 | VO-Right through the section from the heading | You meet the four shelf buttons (announced with their pressed state), then a line like "Quiet … by Susan Cain. Reading now.", then Previous book, Open reading note, Next book, then the credit link. You do **not** hear a long list of book buttons (the 42 tapes are hidden from VoiceOver on purpose) | | |
| E3 | Move onto Open reading note | VoiceOver reads the button and then the book's note as its description (for Quiet: "Deep, sustained focus is an introvert's native advantage…") | | |
| E4 | Activate Next book, then Previous book | The new selection is announced ("… by … . Reading now." or "Read.") | | |
| E5 | Activate a shelf button | It is announced as pressed; the selected book changes | | |
| E6 | Activate Open reading note | A dialog is announced, named with the book's full title; focus is on Back to the shelf | | |
| E7 | VO-Right through the overlay | Author and genre, the title, status and shelf, the note, the story line, key ideas; no stray "image" or cover noise | | |
| E8 | Try to move out of the dialog with VO-Right and Tab | You cannot leave it | | |
| E9 | Press Escape | The dialog closes; VoiceOver lands on Open reading note | | |
| E10 | Visual order versus VoiceOver order, in a window about 390 px wide (or on an iPhone) | On a phone the three controls sit under the books and above the status, title and note on screen; in VoiceOver the selection line comes first, then the controls. Note whether this order is acceptable; it was judged acceptable from the accessibility tree, not heard | | |

## Known, from the automated checks, so you are not surprised

- On a phone-width screen, the page's own fixed "Sound off" and "Terminal" buttons (bottom right, part of `/lab`, not the Reading Room) can cover the **Next book** button when the action row is scrolled into the bottom 110 px of the screen. Scrolling it up clears it. This was found in Chrome and is **not fixed**.
- The note is not shown to VoiceOver in the caption itself (the visible caption text is hidden from it to avoid double reading while it slides); it is the description of the Open reading note button and the text of the overlay.
- Covers come from Open Library over the network; a cover that fails to load is expected to leave the generated artwork showing.

## Results

| | |
|---|---|
| Reviewer | |
| Date | |
| Commit (`git log -1 --oneline`) | |
| macOS and Safari version | |
| iPhone and iOS version (if used) | |
| Parts completed (A, B, C, D, E) | |
| Overall | |

When finished, copy the filled table into the pull request or into `docs/READING_ROOM_REDESIGN.md` and change the "not run" lines there to what you observed.
