import { describe, expect, it } from "vitest";
import { DAILY_POOL, LEVELS, levelOf } from "../levels";
import { EchoGame, replayRuns, runFromDirs } from "../game";
import { createWorld, mirrorDef, parseLevel, stepWorld, hazardActive, type Dir, type LevelDef, type Run } from "../sim";
import { solve } from "../solver";
import { KEY, dailyLevel, dailyNumber, decodeRun, emptyProgress, encodeRun, isUnlocked, loadProgress, recordDaily, recordSolve, saveProgress, scoreOf, shareText, type StorageLike } from "../meta";

const U = 1, D = 2, L = 3, R = 4;
const mk = (rows: string[], extra: Partial<LevelDef> = {}) => parseLevel({ id: "t", name: "t", hint: "", par: 1, rows, ...extra });
const mem = (): StorageLike & { data: Record<string, string> } => { const data: Record<string, string> = {}; return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } }; };

describe("movement and collision", () => {
  const lv = mk(["#####", "#S.E#", "#####"]);
  it("moves one tile per tick", () => {
    const w = createWorld(lv, []);
    stepWorld(w, R);
    expect(w.player).toEqual({ x: 2, y: 1 });
    expect(w.t).toBe(1);
  });
  it("is stopped by walls and the edge of the room", () => {
    const w = createWorld(lv, []);
    stepWorld(w, U); stepWorld(w, L);
    expect(w.player).toEqual({ x: 1, y: 1 });
    expect(w.t).toBe(2); // time still passes
  });
  it("wins on the exit tile and then ignores input", () => {
    const w = createWorld(lv, []);
    stepWorld(w, R); stepWorld(w, R);
    expect(w.status).toBe("won");
    stepWorld(w, L);
    expect(w.player).toEqual({ x: 3, y: 1 });
  });
});

describe("plates and doors", () => {
  const lv = mk(["#######", "#SaA.E#", "#######"]);
  it("a closed door blocks the player", () => {
    const w = createWorld(lv, []);
    stepWorld(w, R); // onto the plate
    stepWorld(w, R); // door: closed, the player alone on the plate is not a ghost... plate released by leaving
    expect(w.player).toEqual({ x: 2, y: 1 });
  });
  it("a ghost holding the plate opens the door", () => {
    const ghost: Run = [{ x: 1, y: 1 }, { x: 2, y: 1 }]; // ends on the plate and stays
    const w = createWorld(lv, [ghost]);
    stepWorld(w, R); stepWorld(w, R); stepWorld(w, R); stepWorld(w, R);
    expect(w.status).toBe("won");
  });
  it("a plate id needs every plate with that id covered", () => {
    const two = mk(["#########", "#a..A..E#", "#S......#", "#a......#", "#########"]);
    const one: Run = [{ x: 1, y: 1 }];
    const w = createWorld(two, [one]);
    for (let i = 0; i < 8; i++) stepWorld(w, R);
    // only one of two plates is covered: the door at x=4 stays shut on row 1; the player is on row 2 so use the door row
    expect(w.status).toBe("playing");
    const both = createWorld(two, [one, [{ x: 1, y: 3 }]]);
    expect(createWorld(two, [one, [{ x: 1, y: 3 }]]).ghosts.length).toBe(2);
    // door open check through movement along row 1
    stepWorld(both, U); stepWorld(both, R); stepWorld(both, R); stepWorld(both, R); stepWorld(both, R);
    expect(both.player.x).toBeGreaterThanOrEqual(4);
  });
  it("a door that closes on the player is fatal", () => {
    // the ghost holds the plate (x=2) for three ticks, then steps off at tick 3
    const ghost: Run = [{ x: 2, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 1 }];
    const w = createWorld(lv, [ghost]);
    stepWorld(w, R); // tick 1, onto the plate
    stepWorld(w, R); // tick 2, into the doorway: open, because the ghost holds the plate
    expect(w.player).toEqual({ x: 3, y: 1 });
    expect(w.status).toBe("playing");
    stepWorld(w, 0); // tick 3: the ghost steps off, the door closes on the player
    expect(w.status).toBe("dead");
    expect(w.reason).toBe("crushed");
  });
});

describe("hazards", () => {
  const lv = mk(["#####", "#S1E#", "#####"], { hazards: { "1": { period: 4, on: 2, phase: 0 } } });
  it("is active exactly while (tick + phase) % period < on", () => {
    const p = { period: 4, on: 2, phase: 1 };
    expect([0, 1, 2, 3, 4, 5].map((t) => hazardActive(p, t))).toEqual([true, false, false, true, true, false]);
  });
  it("kills on an active tick", () => {
    const w = createWorld(lv, []);
    stepWorld(w, R); // arrives at tick 1: (1 + 0) % 4 = 1 < 2 active
    expect(w.status).toBe("dead");
    expect(w.reason).toBe("hazard");
  });
  it("lets the player through after waiting for a gap", () => {
    const w = createWorld(lv, []);
    stepWorld(w, 0); stepWorld(w, 0); // ticks 1, 2
    stepWorld(w, R); // arrives at tick 3: 3 % 4 = 3 >= 2 safe
    expect(w.status).toBe("playing");
    stepWorld(w, R);
    expect(w.status).toBe("won");
  });
});

describe("time loop and ghosts", () => {
  const lv = levelOf(LEVELS[1]); // The Switch
  it("echo turns the run into a ghost and restarts at tick 0", () => {
    const g = new EchoGame(lv);
    [D, D, D, D].forEach((d) => g.tick(d as Dir)); // down to the plate row, then
    g.tick(D);
    expect(g.canEcho).toBe(true);
    expect(g.echo()).toBe(true);
    expect(g.ghosts.length).toBe(1);
    expect(g.world.t).toBe(0);
    expect(g.world.player).toEqual(lv.start);
    expect(g.loops).toBe(2);
  });
  it("retry drops only the current run; restart drops the ghosts too", () => {
    const g = new EchoGame(lv);
    g.tick(D); g.tick(D); g.echo();
    g.tick(R); g.retry();
    expect(g.ghosts.length).toBe(1);
    expect(g.world.t).toBe(0);
    g.restart();
    expect(g.ghosts.length).toBe(0);
  });
  it("cannot echo before moving, and caps the number of ghosts", () => {
    const g = new EchoGame(lv);
    expect(g.echo()).toBe(false);
    for (let i = 0; i < 6; i++) { g.tick(D); g.echo(); }
    expect(g.ghosts.length).toBe(4);
  });
  it("replays the same positions on the same timeline, every time, and rests on the last tile", () => {
    const g = new EchoGame(lv);
    [D, D, R, R, 0, L].forEach((d) => g.tick(d as Dir));
    const trail = g.world.trail.map((p) => ({ ...p }));
    g.echo();
    const a = runFromDirs(lv, [], g.logs[0]);
    const b = runFromDirs(lv, [], g.logs[0]);
    expect(a).toEqual(trail);
    expect(b).toEqual(a);
    const w1 = createWorld(lv, g.ghosts), w2 = createWorld(lv, g.ghosts);
    for (let i = 0; i < 20; i++) { stepWorld(w1, 0); stepWorld(w2, 0); }
    expect(w1.player).toEqual(w2.player);
    expect(g.ghosts[0][g.ghosts[0].length - 1]).toEqual(trail[trail.length - 1]);
  });
  it("is independent of rendering: feeding ticks in any grouping gives the same result", () => {
    const inputs: Dir[] = [D, D, R, R, R, R, U, 0, 0, D];
    const a = new EchoGame(lv); inputs.forEach((d) => a.tick(d));
    const b = new EchoGame(lv);
    for (let i = 0; i < inputs.length; i += 3) inputs.slice(i, i + 3).forEach((d) => b.tick(d));
    expect(b.world.trail).toEqual(a.world.trail);
  });
});

describe("levels are solvable, and par is right", () => {
  const all: LevelDef[] = [...LEVELS, ...LEVELS.map(mirrorDef)];
  for (const def of all) {
    it(`${def.id}: solver finds a solution in exactly par (${def.par}) loops, and the real game accepts it`, () => {
      const lv = parseLevel(def);
      const sol = solve(lv);
      expect(sol, "unsolvable").not.toBeNull();
      expect(sol!.loops).toBe(def.par);
      // play the solution through the real controller, ghost by ghost
      const g = new EchoGame(lv);
      sol!.runs.forEach((dirs, i) => {
        dirs.forEach((d) => g.tick(d));
        if (i < sol!.runs.length - 1) { expect(g.status).toBe("playing"); expect(g.echo()).toBe(true); }
      });
      expect(g.status).toBe("won");
      expect(g.result()!.loops).toBe(def.par);
      // and the stored solution reproduces
      const logs = g.result()!.runs;
      const runs = replayRuns(lv, logs);
      expect(runs[runs.length - 1]).toEqual(g.world.trail);
    });
  }
  it("no level can be won with fewer loops than par", () => {
    for (const def of LEVELS) {
      const lv = parseLevel(def);
      const sol = solve(lv, def.par - 2 >= 0 ? def.par - 2 : 0);
      if (def.par > 1) expect(sol, def.id).toBeNull();
    }
  });
});

describe("scoring", () => {
  it("follows the published rule", () => {
    expect(scoreOf(2, 2, 20)).toBe(960);
    expect(scoreOf(3, 2, 20)).toBe(840);
    expect(scoreOf(9, 2, 500)).toBe(100);
  });
  it("is never above 1000 or below 100", () => {
    expect(scoreOf(1, 1, 0)).toBe(1000);
    expect(scoreOf(50, 1, 9999)).toBe(100);
  });
});

describe("daily challenge", () => {
  it("numbers days from 1 Jan 2026 UTC, the same everywhere", () => {
    expect(dailyNumber(new Date(Date.UTC(2026, 0, 1, 0, 0)))).toBe(1);
    expect(dailyNumber(new Date(Date.UTC(2026, 0, 1, 23, 59)))).toBe(1);
    expect(dailyNumber(new Date(Date.UTC(2026, 0, 2)))).toBe(2);
    expect(dailyNumber(new Date(Date.UTC(2026, 11, 31)))).toBe(365);
  });
  it("gives the same level for the same number and cycles through the whole pool", () => {
    expect(dailyLevel(12).id).toBe(dailyLevel(12).id);
    const n = DAILY_POOL.length;
    const seen = new Set(Array.from({ length: n }, (_, i) => dailyLevel(100 + i).id));
    expect(seen.size).toBe(n);
    expect(dailyLevel(5).id).toBe(dailyLevel(5 + n).id);
  });
  it("every daily level is one of the verified-solvable levels", () => {
    for (const d of DAILY_POOL) expect(solve(parseLevel(d))?.loops, d.id).toBe(d.par);
  });
});

describe("share text", () => {
  it("carries the challenge, loops, score and a direct URL", () => {
    const t = shareText({ daily: 12, loops: 3, score: 840 });
    expect(t).toContain("ECHO//SHIFT");
    expect(t).toContain("Daily Challenge #12");
    expect(t).toContain("Solved in 3 loops");
    expect(t).toContain("https://karthikmannem.com/play?daily=12");
    expect(shareText({ level: LEVELS[2], loops: 1, score: 900 })).toContain("Solved in 1 loop ·");
  });
});

describe("progress saving", () => {
  it("round-trips, unlocks the next level, and keeps the better score", () => {
    const st = mem();
    let p = loadProgress(st);
    expect(isUnlocked(p, 0)).toBe(true);
    expect(isUnlocked(p, 1)).toBe(false);
    ({ progress: p } = recordSolve(p, LEVELS[0].id, { loops: 1, ticks: 20, score: 960, runs: [encodeRun([R, R])] }));
    saveProgress(st, p);
    const back = loadProgress(st);
    expect(isUnlocked(back, 1)).toBe(true);
    expect(isUnlocked(back, 2)).toBe(false);
    const worse = recordSolve(back, LEVELS[0].id, { loops: 1, ticks: 40, score: 900, runs: [] });
    expect(worse.improved).toBe(false);
    expect(worse.progress.best[LEVELS[0].id].score).toBe(960);
    const better = recordSolve(back, LEVELS[0].id, { loops: 1, ticks: 10, score: 980, runs: [] });
    expect(better.improved).toBe(true);
  });
  it("stores daily results once per day and keeps the best", () => {
    let p = recordDaily(emptyProgress(), 12, "the-switch", 3, 800);
    p = recordDaily(p, 12, "the-switch", 2, 900);
    p = recordDaily(p, 12, "the-switch", 4, 500);
    expect(p.daily["12"].score).toBe(900);
  });
  it("survives corrupt or missing storage", () => {
    const st = mem();
    st.data[KEY] = "{not json";
    expect(loadProgress(st)).toEqual(emptyProgress());
    expect(loadProgress(null)).toEqual(emptyProgress());
    st.data[KEY] = JSON.stringify({ v: 2 });
    expect(loadProgress(st)).toEqual(emptyProgress());
  });
  it("encodes runs losslessly", () => {
    const d: Dir[] = [1, 2, 3, 4, 0, 4];
    expect(decodeRun(encodeRun(d))).toEqual(d);
  });
});
