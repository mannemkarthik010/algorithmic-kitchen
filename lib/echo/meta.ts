import { DAILY_POOL, LEVELS } from "./levels";
import type { Dir, LevelDef } from "./sim";

/* ───────── scoring ───────── */
/**
 * Score for a solved level, out of 1000:
 *   start at 1000
 *   minus 120 for every loop beyond the level's par
 *   minus 2 for every tick of the winning run (a tick is a tenth of a second)
 * never below 100. Par is the fewest loops a solution needs; nobody can score above 1000 - 2 x the shortest run.
 */
export function scoreOf(loops: number, par: number, ticks: number): number {
  return Math.max(100, 1000 - 120 * Math.max(0, loops - par) - 2 * ticks);
}

/* ───────── daily challenge ───────── */
const EPOCH = Date.UTC(2026, 0, 1);
const DAY = 86_400_000;

/** Challenge number for a date, counted in UTC days from 1 Jan 2026 (that day is #1). Same date, same number, everywhere. */
export function dailyNumber(date: Date): number {
  const utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((utc - EPOCH) / DAY) + 1;
}

/** Predictable rotation over the verified pool. 3 is coprime with the pool size, so every level appears once per cycle. */
export function dailyLevel(n: number): LevelDef {
  const len = DAILY_POOL.length;
  const i = (((n * 3 + 1) % len) + len) % len;
  return DAILY_POOL[i];
}

/* ───────── share text ───────── */
export const GAME_URL = "https://karthikmannem.com/play";

export function shareText(opts: { daily?: number; level?: LevelDef; loops: number; score: number }): string {
  const head = opts.daily ? `Daily Challenge #${opts.daily}` : `Level ${LEVELS.findIndex((l) => l.id === opts.level?.id) + 1}: ${opts.level?.name}`;
  const url = opts.daily ? `${GAME_URL}?daily=${opts.daily}` : `${GAME_URL}?level=${opts.level?.id}`;
  return `ECHO//SHIFT\n${head}\nSolved in ${opts.loops} loop${opts.loops === 1 ? "" : "s"} · score ${opts.score}\nCan you beat me?\n${url}`;
}

/* ───────── persistence (local only; no accounts, no backend) ───────── */
export interface StorageLike { getItem(k: string): string | null; setItem(k: string, v: string): void }

export interface Best { loops: number; ticks: number; score: number; /** one digit per tick, one string per run */ runs: string[] }
export interface Settings { sound: boolean; motion: "full" | "reduced"; seenIntro: boolean }
export interface Progress { v: 1; best: Record<string, Best>; daily: Record<string, { levelId: string; loops: number; score: number }>; settings: Settings }

export const KEY = "echoshift:v1";
export const emptyProgress = (): Progress => ({ v: 1, best: {}, daily: {}, settings: { sound: false, motion: "full", seenIntro: false } });

export function loadProgress(st: StorageLike | null): Progress {
  if (!st) return emptyProgress();
  try {
    const raw = st.getItem(KEY);
    if (!raw) return emptyProgress();
    const p = JSON.parse(raw);
    if (!p || p.v !== 1 || typeof p.best !== "object") return emptyProgress();
    return { ...emptyProgress(), ...p, settings: { ...emptyProgress().settings, ...(p.settings ?? {}) } };
  } catch { return emptyProgress(); }
}

export function saveProgress(st: StorageLike | null, p: Progress) {
  try { st?.setItem(KEY, JSON.stringify(p)); } catch { /* private mode or full: progress just will not persist */ }
}

/** Record a solve. Keeps the better of old and new by score. Returns the new progress and whether it was a personal best. */
export function recordSolve(p: Progress, levelId: string, b: Best): { progress: Progress; improved: boolean } {
  const old = p.best[levelId];
  const improved = !old || b.score > old.score;
  return { progress: improved ? { ...p, best: { ...p.best, [levelId]: b } } : p, improved };
}

export function recordDaily(p: Progress, n: number, levelId: string, loops: number, score: number): Progress {
  const old = p.daily[String(n)];
  if (old && old.score >= score) return p;
  return { ...p, daily: { ...p.daily, [String(n)]: { levelId, loops, score } } };
}

/** Level i is open when it is the first or the one before it has been solved. */
export const isUnlocked = (p: Progress, i: number) => i === 0 || !!p.best[LEVELS[i - 1].id];

export const encodeRun = (dirs: Dir[]) => dirs.join("");
export const decodeRun = (s: string): Dir[] => [...s].map((c) => Number(c) as Dir);
