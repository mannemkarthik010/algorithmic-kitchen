# Design system

Tokens live in `app/globals.css` (`:root`) and `app/lib/motion.ts`. Some token names (`--gold`, `--cream`) come from the earlier theme and now hold the new colours, to avoid a risky site-wide rename.

## Colour

| Role | Token | Value |
|---|---|---|
| Page | `--bg-page` | `#101317` graphite |
| Deeper band | `--bg-base` | `#0A0D10` |
| Text | `--cream` | `#F2EFE8` ivory |
| Secondary text | `--cream-2` | `#BDC2C4` |
| Accent | `--gold` / `--copper` | `#D87B55` muted copper |
| Quiet text | `--muted-hi` | `#8C9CA7` slate |
| Tertiary text | `--muted` | `#808C96` (raised from `#6D7882`) |
| Data and status only | `--signal` | `#70D5B3` |
| Small text on ivory | | `#B24420` deep copper, `#5F6B74` grey, `#146B50` green |

**Measured contrast (WCAG, computed from the hex values):**

| Pair | Ratio | Use |
|---|---|---|
| Ivory on graphite | 16.2 | body text |
| Signal on graphite | 10.5 | status |
| Slate on graphite | 6.6 | labels |
| Copper on graphite | 6.1 | accents, links |
| Graphite on copper | 6.1 | primary button |
| `--muted` on graphite | 5.4 | after the fix |
| `#B24420` on ivory | 4.9 | small copper text on ivory |
| `#5F6B74` on ivory | 4.8 | small grey text on ivory |
| White on `#B24420` / `#146B50` | 5.6 / 6.5 | badges |

Fixed this round: `--muted` was 4.1 and the small copper, grey and green used on ivory panels were 3.5, 4.0 and 3.7, all below the 4.5 AA threshold for small text. Plain `#D9532B` is kept for strokes and borders only (3.5, which meets the 3.0 non-text threshold). Copper on ivory (2.7) is never used for text.

## Type

- **Geist** (`--f-body`) for interface and headings: weight 600, tight tracking (-0.04 to -0.06em) at display sizes.
- **Instrument Serif italic** (`--f-display`) for a single accent word per heading, in copper. Used sparingly.
- **Geist Mono** (`--f-mono`) for labels, evidence, identifiers and numbers in tables, 10 to 12px with wide tracking when uppercase.
- Display sizes use `clamp()`. The hero headline is `clamp(2.7rem, 6.1vw, 5.7rem)` on desktop.

## Layout

- Container: `.container`, one column grid, `--space-*` scale (0.5 to 5rem).
- Hero: copy left, one visualization right, stacks under 900px.
- Case studies: hero with notice, a key-figures row, alternating sticky-rail sections, ivory interactive panels, and dark bands. The ivory panel marks "this part is interactive and uses real data".
- No shared card template. Each flagship's preview gets its own composition (Phase 2).

## Motion

One easing, `EASE = [0.22, 1, 0.36, 1]`, and a duration scale in `app/lib/motion.ts`:

| Token | Seconds | Use |
|---|---|---|
| `DUR.instant` | 0.12 | hover state |
| `DUR.fast` | 0.22 | micro-interactions |
| `DUR.normal` | 0.45 | reveals |
| `DUR.moderate` | 0.65 | section elements |
| `DUR.slow` | 0.88 | modal open |
| `STAGGER` | 0.09 | list stagger |

Meaning of motion: **draw** a connector when a dependency is shown, **highlight** along a path to show causality, **rise** text once on entry. Nothing loops on the page.

Rules, all in force:
- `useReducedMotion` removes entrance movement and autoplay. State changes still happen instantly.
- No scroll hijacking, no loading screens, no constant movement.
- Every hover has a click or keyboard equivalent (`aria-pressed` buttons, arrow keys on charts, Next/Previous on walkthroughs).
- Interactive diagrams have a text alternative: a lineage list, a forecast table, or a step-by-step panel.

## Provenance labelling (house rule for demos)
Every figure on a case-study page is one of: read from a repository at a pinned commit, computed on the page from those values, illustrative and labelled so, or absent and stated as absent. Generated model output is never shown unless it was actually captured from a run.
