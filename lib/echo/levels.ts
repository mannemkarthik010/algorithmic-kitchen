import { LevelDef, mirrorDef, parseLevel, Level } from "./sim";

/**
 * Six handcrafted levels. `par` is the fewest loops (ghosts plus the final run) that solve each one; the test suite
 * runs a breadth-first solver on every level and fails if par is wrong or the level cannot be solved.
 */
export const LEVELS: LevelDef[] = [
  {
    id: "first-echo",
    name: "First Echo",
    hint: "Walk to the glowing exit. Arrow keys or WASD.",
    par: 1,
    rows: [
      "#########",
      "#S......#",
      "#.#####.#",
      "#.....#E#",
      "#########",
    ],
  },
  {
    id: "the-switch",
    name: "The Switch",
    hint: "Stand on the plate, then press Space. Your echo holds it while the next you walks through.",
    par: 2,
    rows: [
      "###########",
      "#S....#...#",
      "#.....#...#",
      "#a....A..E#",
      "###########",
    ],
  },
  {
    id: "parallel-lives",
    name: "Parallel Lives",
    hint: "The door needs both plates at once. You can only stand on one.",
    par: 3,
    rows: [
      "#############",
      "#a.....#....#",
      "#......#....#",
      "#S.....A...E#",
      "#......#....#",
      "#a.....#....#",
      "#############",
    ],
  },
  {
    id: "the-locked-path",
    name: "The Locked Path",
    hint: "The second plate is behind the first door.",
    par: 3,
    rows: [
      "###############",
      "#S...#....#...#",
      "#....#....#...#",
      "#a...A..b.B..E#",
      "#....#....#...#",
      "#....#....#...#",
      "###############",
    ],
  },
  {
    id: "timing-matters",
    name: "Timing Matters",
    hint: "The red lines pulse. Wait for a gap; waiting is a move.",
    par: 2,
    hazards: {
      "1": { period: 6, on: 3, phase: 0 },
      "2": { period: 6, on: 3, phase: 3 },
      "3": { period: 8, on: 4, phase: 0 },
    },
    rows: [
      "#############",
      "#S..1..2..a.#",
      "#.###########",
      "#.....3.A.E.#",
      "#############",
    ],
  },
  {
    id: "the-paradox",
    name: "The Paradox",
    hint: "One plate opens the way to another. Two plates open the exit. Mind the pulse.",
    par: 4,
    hazards: { "3": { period: 7, on: 3, phase: 2 } },
    rows: [
      "################",
      "#S....#.....####",
      "#.....B..a..3AE#",
      "#b....#.....####",
      "#....a##########",
      "################",
    ],
  },
];

export const LEVEL_BY_ID: Record<string, LevelDef> = Object.fromEntries(LEVELS.map((l) => [l.id, l]));

/** The pool the daily challenge draws from: every level, and its mirror image (same solution, flipped). */
export const DAILY_POOL: LevelDef[] = LEVELS.flatMap((l) => [l, mirrorDef(l)]).filter((l) => l.par >= 2);

const cache = new Map<string, Level>();
export function levelOf(def: LevelDef): Level {
  let l = cache.get(def.id);
  if (!l) { l = parseLevel(def); cache.set(def.id, l); }
  return l;
}
