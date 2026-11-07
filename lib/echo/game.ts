import { Dir, Level, Pos, Run, World, createWorld, stepWorld } from "./sim";

export const MAX_GHOSTS = 4;
/** Fixed simulation rate. Rendering runs at any frame rate and interpolates; the simulation never does. */
export const TPS = 10;
export const TICK_MS = 1000 / TPS;

export interface Result { loops: number; ticks: number; runs: Dir[][] }

/**
 * One play session of one level: the ghosts so far, the live world, and the input log of every run (so a solution can be
 * stored and replayed). No DOM, no clock: the caller feeds it one input per tick.
 */
export class EchoGame {
  level: Level;
  ghosts: Run[] = [];
  /** input per tick of each committed run */
  logs: Dir[][] = [];
  cur: Dir[] = [];
  world: World;
  /** counts every run started, including failed ones; for display only */
  attempts = 1;

  constructor(level: Level) {
    this.level = level;
    this.world = createWorld(level, this.ghosts);
  }

  get loops() { return this.ghosts.length + 1; }
  get status() { return this.world.status; }
  get canEcho() { return this.world.status === "playing" && this.world.trail.length > 1 && this.ghosts.length < MAX_GHOSTS; }

  tick(dir: Dir) {
    if (this.world.status !== "playing") return;
    this.cur.push(dir);
    stepWorld(this.world, dir);
  }

  /** The time-loop reset: the run so far becomes a ghost and a new run starts at tick 0. */
  echo(): boolean {
    if (!this.canEcho) return false;
    this.ghosts = [...this.ghosts, this.world.trail.map((p) => ({ ...p }))];
    this.logs = [...this.logs, this.cur];
    this.cur = [];
    this.world = createWorld(this.level, this.ghosts);
    this.attempts += 1;
    return true;
  }

  /** Throw away the current run only. Ghosts stay. */
  retry() {
    this.cur = [];
    this.world = createWorld(this.level, this.ghosts);
    this.attempts += 1;
  }

  /** Start the level over with no ghosts. */
  restart() {
    this.ghosts = [];
    this.logs = [];
    this.cur = [];
    this.world = createWorld(this.level, this.ghosts);
    this.attempts = 1;
  }

  result(): Result | null {
    if (this.world.status !== "won") return null;
    return { loops: this.loops, ticks: this.world.t, runs: [...this.logs, this.cur] };
  }
}

/** Turn a stored input log back into positions, given the ghosts that were present. Used to replay saved solutions. */
export function runFromDirs(level: Level, ghosts: Run[], dirs: Dir[]): Run {
  const w = createWorld(level, ghosts);
  for (const d of dirs) stepWorld(w, d);
  return w.trail;
}

/** Rebuild every run of a stored solution, in order. The last run is the one that reached the exit. */
export function replayRuns(level: Level, logs: Dir[][]): Run[] {
  const runs: Run[] = [];
  for (const dirs of logs) runs.push(runFromDirs(level, [...runs], dirs));
  return runs;
}

export const samePos = (a: Pos, b: Pos) => a.x === b.x && a.y === b.y;
