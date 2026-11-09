/**
 * ECHO//SHIFT simulation core. Pure TypeScript, no DOM, no timers, no randomness.
 *
 * Time is a count of ticks. One tick = the player may move one tile. A run is the list of positions the player occupied,
 * one per tick (index 0 is the start tile). When the player "echoes", that run becomes a ghost: it replays the same
 * positions on the same timeline and, once it ends, stays on its final tile. Because the simulation never reads a
 * clock, it is exact however late a rendering frame arrives.
 *
 * Rules
 *  - Walls block. Plates are pressed while anything (the player or a ghost) stands on them.
 *  - A plate id is "pressed" only when EVERY plate with that id is covered. A door opens while its id is pressed.
 *  - Hazards are deadly to the player while active: active when (tick + phase) % period < on.
 *  - Ghosts ignore collisions: their recorded run was already legal, and opening doors is monotonic (more
 *    entities never close a door), so adding a later ghost can never invalidate an earlier one.
 */

export type Dir = 0 | 1 | 2 | 3 | 4; // none, up, down, left, right
export const DX = [0, 0, 0, -1, 1];
export const DY = [0, -1, 1, 0, 0];

export interface Pos { x: number; y: number }
export interface HazardPattern { period: number; on: number; phase: number }

export interface LevelDef {
  id: string;
  name: string;
  /** One sentence shown in the level, no tutorial wall. */
  hint: string;
  /** '#' wall  '.' floor  'S' start  'E' exit  a-c plate  A-C door (opens with the same letter)  1-4 hazard (see hazards). */
  rows: string[];
  hazards?: Record<string, HazardPattern>;
  /** The fewest loops (ghosts + the final run) a solution needs, proven by the solver in the tests. */
  par: number;
}

export interface Level {
  def: LevelDef;
  w: number;
  h: number;
  wall: boolean[];
  start: Pos;
  exit: Pos;
  plates: { x: number; y: number; id: string }[];
  doors: { x: number; y: number; id: string }[];
  hazards: { x: number; y: number; key: string; pattern: HazardPattern }[];
  plateIds: string[];
}

export function parseLevel(def: LevelDef): Level {
  const h = def.rows.length;
  const w = def.rows[0].length;
  const wall: boolean[] = new Array(w * h).fill(false);
  const plates: Level["plates"] = [];
  const doors: Level["doors"] = [];
  const hazards: Level["hazards"] = [];
  let start: Pos | null = null;
  let exit: Pos | null = null;
  def.rows.forEach((row, y) => {
    if (row.length !== w) throw new Error(`${def.id}: row ${y} has length ${row.length}, expected ${w}`);
    [...row].forEach((c, x) => {
      if (c === "#") wall[y * w + x] = true;
      else if (c === "S") start = { x, y };
      else if (c === "E") exit = { x, y };
      else if (c >= "a" && c <= "c") plates.push({ x, y, id: c });
      else if (c >= "A" && c <= "C") doors.push({ x, y, id: c.toLowerCase() });
      else if (c >= "1" && c <= "4") {
        const p = def.hazards?.[c];
        if (!p) throw new Error(`${def.id}: hazard ${c} has no pattern`);
        hazards.push({ x, y, key: c, pattern: p });
      } else if (c !== ".") throw new Error(`${def.id}: unknown tile '${c}'`);
    });
  });
  if (!start || !exit) throw new Error(`${def.id}: needs one S and one E`);
  const plateIds = [...new Set(plates.map((p) => p.id))].sort();
  for (const d of doors) if (!plateIds.includes(d.id)) throw new Error(`${def.id}: door ${d.id} has no plate`);
  return { def, w, h, wall, start, exit, plates, doors, hazards, plateIds };
}

/** A mirrored copy of a level (left-right). Solvable exactly when the original is: only geometry flips. */
export function mirrorDef(def: LevelDef): LevelDef {
  return { ...def, id: `${def.id}m`, name: `${def.name} (mirrored)`, rows: def.rows.map((r) => [...r].reverse().join("")) };
}

export type Run = Pos[];
export const posAt = (run: Run, t: number): Pos => run[Math.min(t, run.length - 1)];

export const hazardActive = (p: HazardPattern, t: number) => (t + p.phase) % p.period < p.on;

/** Ids whose every plate is covered by one of `occupants`. */
export function pressedIds(level: Level, occupants: Pos[]): Set<string> {
  const out = new Set<string>();
  for (const id of level.plateIds) {
    const mine = level.plates.filter((p) => p.id === id);
    if (mine.every((p) => occupants.some((o) => o.x === p.x && o.y === p.y))) out.add(id);
  }
  return out;
}

export const ghostsAt = (ghosts: Run[], t: number): Pos[] => ghosts.map((g) => posAt(g, t));

export function doorOpenAt(level: Level, ghosts: Run[], extra: Pos[], t: number, id: string): boolean {
  return pressedIds(level, [...ghostsAt(ghosts, t), ...extra]).has(id);
}

export type Status = "playing" | "won" | "dead";
export type DeathReason = "hazard" | "crushed" | "time";

export interface World {
  level: Level;
  ghosts: Run[];
  t: number;
  player: Pos;
  /** the run so far, one position per tick including tick 0 */
  trail: Run;
  status: Status;
  reason?: DeathReason;
}

export const TICK_LIMIT = 600;

export function createWorld(level: Level, ghosts: Run[]): World {
  return { level, ghosts, t: 0, player: { ...level.start }, trail: [{ ...level.start }], status: "playing" };
}

const doorAt = (level: Level, x: number, y: number) => level.doors.find((d) => d.x === x && d.y === y);
const hazardAtTile = (level: Level, x: number, y: number) => level.hazards.find((d) => d.x === x && d.y === y);

/** Advance one tick with the given input. Mutates and returns the world. */
export function stepWorld(w: World, dir: Dir): World {
  if (w.status !== "playing") return w;
  const { level } = w;
  const nt = w.t + 1;
  let nx = w.player.x + DX[dir];
  let ny = w.player.y + DY[dir];
  if (nx < 0 || ny < 0 || nx >= level.w || ny >= level.h || level.wall[ny * level.w + nx]) { nx = w.player.x; ny = w.player.y; }
  const door = doorAt(level, nx, ny);
  // the door must be open at the tick the player arrives; the player on a door tile presses no plate
  if (door && !doorOpenAt(level, w.ghosts, [], nt, door.id)) { nx = w.player.x; ny = w.player.y; }

  w.t = nt;
  w.player = { x: nx, y: ny };
  w.trail.push({ x: nx, y: ny });

  const stay = doorAt(level, nx, ny);
  if (stay && !doorOpenAt(level, w.ghosts, [], nt, stay.id)) { w.status = "dead"; w.reason = "crushed"; return w; }
  const hz = hazardAtTile(level, nx, ny);
  if (hz && hazardActive(hz.pattern, nt)) { w.status = "dead"; w.reason = "hazard"; return w; }
  if (nx === level.exit.x && ny === level.exit.y) { w.status = "won"; return w; }
  if (nt >= TICK_LIMIT) { w.status = "dead"; w.reason = "time"; }
  return w;
}

/** Every plate currently pressed, for rendering: positions of the player and all ghosts at the world's tick. */
export function currentPressed(w: World): Set<string> {
  return pressedIds(w.level, [w.player, ...ghostsAt(w.ghosts, w.t)]);
}
