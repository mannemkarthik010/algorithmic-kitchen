import { Dir, DX, DY, Level, Pos, Run, ghostsAt, hazardActive, posAt, pressedIds } from "./sim";

/**
 * Breadth-first solver over (x, y, tick). It exists to PROVE levels solvable and to compute par, not to play for the
 * user. It uses exactly the movement rules of stepWorld (doors judged by the ghosts at the arrival tick, hazards by the
 * arrival tick), so a solution it returns replays identically through the real simulation.
 */
const T_MAX = 140;

interface Found { dirs: Dir[]; run: Run }

function bfs(level: Level, ghosts: Run[], goal: Pos): Found | null {
  const { w, h } = level;
  // plate ids pressed by the ghosts alone at each tick
  const open: Set<string>[] = [];
  for (let t = 0; t <= T_MAX; t++) open.push(pressedIds(level, ghostsAt(ghosts, t)));
  const idx = (x: number, y: number, t: number) => (t * h + y) * w + x;
  const prev = new Int32Array((T_MAX + 1) * w * h).fill(-2);
  const prevDir = new Int8Array((T_MAX + 1) * w * h);
  const doorAt = new Map(level.doors.map((d) => [`${d.x},${d.y}`, d.id]));
  const hazAt = new Map(level.hazards.map((d) => [`${d.x},${d.y}`, d.pattern]));
  const q: number[] = [];
  const s = idx(level.start.x, level.start.y, 0);
  prev[s] = -1;
  q.push(s);
  for (let qi = 0; qi < q.length; qi++) {
    const cur = q[qi];
    const x = cur % w;
    const y = Math.floor(cur / w) % h;
    const t = Math.floor(cur / (w * h));
    if (x === goal.x && y === goal.y) {
      const dirs: Dir[] = [];
      const run: Run = [];
      for (let c = cur; c !== -1; c = prev[c]) {
        run.push({ x: c % w, y: Math.floor(c / w) % h });
        if (prev[c] !== -1) dirs.push(prevDir[c] as Dir);
      }
      return { dirs: dirs.reverse(), run: run.reverse() };
    }
    if (t >= T_MAX) continue;
    for (const d of [1, 2, 3, 4, 0] as Dir[]) {
      let nx = x + DX[d], ny = y + DY[d];
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || level.wall[ny * w + nx]) { nx = x; ny = y; }
      const door = doorAt.get(`${nx},${ny}`);
      if (door && !open[t + 1].has(door)) { nx = x; ny = y; if (d === 0) continue; }
      const stay = doorAt.get(`${nx},${ny}`);
      if (stay && !open[t + 1].has(stay)) continue; // crushed
      const hz = hazAt.get(`${nx},${ny}`);
      if (hz && hazardActive(hz, t + 1)) continue;
      const n = idx(nx, ny, t + 1);
      if (prev[n] !== -2) continue;
      prev[n] = cur;
      prevDir[n] = d;
      q.push(n);
    }
  }
  return null;
}

export interface Solution { loops: number; runs: Dir[][]; ghosts: Run[]; final: Run }

/** The fewest-loops solution using at most `maxGhosts` ghosts, each of which walks to one plate and stays. */
export function solve(level: Level, maxGhosts = 4): Solution | null {
  const tiles = level.plates;
  const attempt = (chosen: number[]): Solution | null => {
    const ghosts: Run[] = [];
    const runs: Dir[][] = [];
    for (const ti of chosen) {
      const f = bfs(level, ghosts, tiles[ti]);
      if (!f) return null;
      ghosts.push(f.run);
      runs.push(f.dirs);
    }
    const fin = bfs(level, ghosts, level.exit);
    if (!fin) return null;
    runs.push(fin.dirs);
    return { loops: chosen.length + 1, runs, ghosts, final: fin.run };
  };
  const perms = (k: number, used: number[]): number[][] => {
    if (used.length === k) return [used];
    const out: number[][] = [];
    for (let i = 0; i < tiles.length; i++) if (!used.includes(i)) out.push(...perms(k, [...used, i]));
    return out;
  };
  for (let k = 0; k <= Math.min(maxGhosts, tiles.length); k++) {
    for (const p of perms(k, [])) {
      const s = attempt(p);
      if (s) return s;
    }
  }
  return null;
}

export { posAt };
