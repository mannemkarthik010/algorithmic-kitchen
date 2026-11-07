"use client";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { animate } from "animejs";
import { EchoGame, TICK_MS } from "@/lib/echo/game";
import { Dir, Level, Pos, Run, currentPressed, ghostsAt, pressedIds } from "@/lib/echo/sim";
import { TILE, draw, type Frame } from "./render";

export interface BoardHandle { echo: () => void; retry: () => void; restart: () => void; press: (d: Dir) => void; release: (d: Dir) => void }
export type Sfx = "step" | "echo" | "plate" | "door" | "dead" | "win";

interface Props {
  game: EchoGame;
  /** replay mode: every run plays at once, nobody is controlled */
  replay?: Run[] | null;
  paused: boolean;
  reduced: boolean;
  showPad: boolean;
  onWon: () => void;
  onDead: (reason: string) => void;
  onEcho: () => void;
  onRetry: () => void;
  onReplayEnd: () => void;
  onStart: () => void;
  sfx: (s: Sfx) => void;
}

const KEY_DIR: Record<string, Dir> = { ArrowUp: 1, w: 1, W: 1, ArrowDown: 2, s: 2, S: 2, ArrowLeft: 3, a: 3, A: 3, ArrowRight: 4, d: 4, D: 4 };

/**
 * Canvas, input and the fixed-step loop. The simulation advances in exact ticks of TICK_MS using an accumulator, so a late
 * frame runs several ticks rather than skipping any (capped, so a background tab cannot queue seconds of movement).
 * Everything drawn is a function of simulation state plus an interpolation value; nothing animates game logic.
 */
const Board = forwardRef<BoardHandle, Props>(function Board(props, ref) {
  const { game } = props;
  const level: Level = game.level;
  const cv = useRef<HTMLCanvasElement>(null);
  const sweep = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const live = useRef(props);
  live.current = props;

  const held = useRef<Dir[]>([]);
  const tap = useRef<Dir | null>(null);
  const started = useRef(false);
  const prev = useRef<Pos>({ ...level.start });
  const doorV = useRef<Record<string, number>>({});
  const doorTarget = useRef<Record<string, number>>({});
  const reported = useRef(false);
  const replayT = useRef(0);
  const lastPressed = useRef("");

  const echoFx = useCallback(() => {
    const el = sweep.current;
    if (!el) return;
    if (live.current.reduced) { animate(el, { opacity: [0.6, 0], duration: 400 }); return; }
    animate(el, { opacity: [{ to: 0.95, duration: 40 }, { to: 0, duration: 520 }], translateX: ["-12%", "112%"], ease: "outQuad", duration: 560 });
    if (flash.current) animate(flash.current, { opacity: [0.28, 0], duration: 600, ease: "outCubic" });
  }, []);
  const deadFx = useCallback(() => { if (flash.current) animate(flash.current, { opacity: [0.55, 0], duration: 650, ease: "outCubic" }); }, []);

  const doEcho = useCallback(() => {
    if (live.current.paused || live.current.replay) return;
    if (game.echo()) { prev.current = { ...level.start }; started.current = false; reported.current = false; held.current = []; tap.current = null; echoFx(); live.current.sfx("echo"); live.current.onEcho(); }
  }, [game, level, echoFx]);
  const doRetry = useCallback(() => {
    if (live.current.paused || live.current.replay) return;
    game.retry(); prev.current = { ...level.start }; started.current = false; reported.current = false; held.current = []; tap.current = null; live.current.onRetry();
  }, [game, level]);
  const doRestart = useCallback(() => {
    if (live.current.paused || live.current.replay) return;
    game.restart(); prev.current = { ...level.start }; started.current = false; reported.current = false; held.current = []; tap.current = null; live.current.onRetry();
  }, [game, level]);
  const press = useCallback((d: Dir) => {
    if (live.current.paused || live.current.replay) return;
    held.current = [...held.current.filter((x) => x !== d), d];
    tap.current = d;
    if (!started.current && game.status === "playing") { started.current = true; live.current.onStart(); }
  }, [game]);
  const release = useCallback((d: Dir) => { held.current = held.current.filter((x) => x !== d); }, []);

  useImperativeHandle(ref, () => ({ echo: doEcho, retry: doRetry, restart: doRestart, press, release }), [doEcho, doRetry, doRestart, press, release]);

  useEffect(() => {
    const typing = (t: EventTarget | null) => /^(INPUT|TEXTAREA|SELECT)$/.test((t as HTMLElement | null)?.tagName ?? "");
    const down = (e: KeyboardEvent) => {
      if (typing(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const d = KEY_DIR[e.key];
      if (d) { e.preventDefault(); if (!e.repeat) press(d); return; }
      if (e.key === " ") { e.preventDefault(); if (!e.repeat) doEcho(); return; }
      if (e.key === "." || e.key === "x" || e.key === "X") { e.preventDefault(); if (!e.repeat) press(0 as Dir); return; }
      if (e.key === "r") { e.preventDefault(); doRetry(); return; }
      if (e.key === "R") { e.preventDefault(); doRestart(); }
    };
    const up = (e: KeyboardEvent) => { const d = KEY_DIR[e.key]; if (d) release(d); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [press, release, doEcho, doRetry, doRestart]);

  useEffect(() => {
    const canvas = cv.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = level.w * TILE * dpr;
    canvas.height = level.h * TILE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let raf = 0, last = performance.now(), acc = 0;

    const setDoors = (pressed: Set<string>, instant: boolean) => {
      for (const d of level.doors) {
        const k = `${d.x},${d.y}`;
        const target = pressed.has(d.id) ? 1 : 0;
        if (doorTarget.current[k] === target) continue;
        const had = k in doorTarget.current;
        doorTarget.current[k] = target;
        if (!had || instant || live.current.reduced) { doorV.current[k] = target; continue; }
        animate(doorV.current, { [k]: target, duration: 260, ease: "outQuad" });
        live.current.sfx("door");
      }
    };

    const frame = (now: number) => {
      const p = live.current;
      const dt = Math.min(250, now - last);
      last = now;
      const rep = p.replay;

      if (rep) {
        acc += dt;
        let n = 0;
        while (acc >= TICK_MS && n++ < 6) { acc -= TICK_MS; replayT.current += 1; }
        const t = replayT.current;
        const maxLen = Math.max(...rep.map((r) => r.length));
        const pressed = pressedIds(level, ghostsAt(rep, t));
        setDoors(pressed, false);
        draw(ctx, { level, t, ghosts: rep, player: null, trail: [], pressed, alpha: acc / TICK_MS, time: now, reduced: p.reduced, doorV: doorV.current, dead: false, won: false } as Frame);
        if (t > maxLen + 8 && !reported.current) { reported.current = true; p.onReplayEnd(); }
        raf = requestAnimationFrame(frame);
        return;
      }

      const w = game.world;
      if (!p.paused && started.current && w.status === "playing") {
        acc += dt;
        let n = 0;
        while (acc >= TICK_MS && n++ < 6 && game.status === "playing") {
          acc -= TICK_MS;
          const dir: Dir = tap.current !== null ? tap.current : held.current.length ? held.current[held.current.length - 1] : 0;
          tap.current = null;
          prev.current = { ...game.world.player };
          const before = pressedIds(level, [game.world.player, ...ghostsAt(game.ghosts, game.world.t)]);
          game.tick(dir);
          const after = currentPressed(game.world);
          for (const id of after) if (!before.has(id)) p.sfx("plate");
          if (dir !== 0) p.sfx("step");
        }
      } else if (!started.current) acc = 0;

      const alpha = game.status === "playing" ? Math.min(1, acc / TICK_MS) : 1;
      const pressed = currentPressed(game.world);
      const sig = [...pressed].join("");
      setDoors(pressed, sig === lastPressed.current && false);
      lastPressed.current = sig;

      draw(ctx, {
        level, t: game.world.t, ghosts: game.ghosts,
        player: { from: game.status === "playing" || alpha < 1 ? prev.current : game.world.player, to: game.world.player },
        trail: game.world.trail, pressed, alpha, time: now, reduced: p.reduced, doorV: doorV.current,
        dead: game.status === "dead", won: game.status === "won",
      });

      if (game.status !== "playing" && !reported.current) {
        reported.current = true;
        if (game.status === "won") { p.sfx("win"); p.onWon(); }
        else { p.sfx("dead"); deadFx(); p.onDead(game.world.reason ?? "hazard"); }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [game, level, deadFx]);

  const Pad = ({ d, label, cls }: { d: Dir; label: string; cls: string }) => (
    <button type="button" className={`eg-pad__b ${cls}`} aria-label={label}
      onPointerDown={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); press(d); }}
      onPointerUp={() => release(d)} onPointerCancel={() => release(d)}>
      {label === "Wait" ? "•" : ["", "▲", "▼", "◀", "▶"][d]}
    </button>
  );

  return (
    <div className="eg-board">
      <div className="eg-board__frame">
        <canvas ref={cv} className="eg-canvas" style={{ aspectRatio: `${level.w} / ${level.h}` }} role="img" aria-label={`Puzzle board, ${level.w} by ${level.h} tiles. Level: ${level.def.name}. ${level.def.hint}`} />
        <div ref={sweep} className="eg-sweep" aria-hidden="true" />
        <div ref={flash} className="eg-flash" aria-hidden="true" />
      </div>
      {props.showPad && (
        <div className="eg-pad" role="group" aria-label="On-screen controls">
          <div className="eg-pad__dir">
            <Pad d={1} label="Up" cls="u" /><Pad d={3} label="Left" cls="l" /><Pad d={0 as Dir} label="Wait" cls="w" /><Pad d={4} label="Right" cls="r" /><Pad d={2} label="Down" cls="d" />
          </div>
          <div className="eg-pad__act">
            <button type="button" className="eg-pad__echo" onClick={doEcho}>ECHO <small>new loop</small></button>
            <button type="button" className="eg-pad__retry" onClick={doRetry}>RETRY</button>
          </div>
        </div>
      )}
    </div>
  );
});

export default Board;
