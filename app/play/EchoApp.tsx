"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { EchoGame, replayRuns } from "@/lib/echo/game";
import { DAILY_POOL, LEVELS, levelOf } from "@/lib/echo/levels";
import {
  GAME_URL, Progress, dailyLevel, dailyNumber, decodeRun, emptyProgress, encodeRun, isUnlocked, loadProgress,
  recordDaily, recordSolve, saveProgress, scoreOf, shareText,
} from "@/lib/echo/meta";
import type { LevelDef, Run } from "@/lib/echo/sim";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../components/ui/dialog";
import Board, { type BoardHandle, type Sfx } from "./Board";
import { GHOST_COLOR } from "./render";
import "./echo.css";

type Screen = "title" | "levels" | "game";
type Dlg = "how" | "settings" | "pause" | null;
interface Session { def: LevelDef; daily?: number; key: number }
interface Solved { loops: number; ticks: number; score: number; improved: boolean; par: number }

/* tiny original sound effects: oscillators only, no audio files */
function useSfx(enabled: boolean) {
  const ac = useRef<AudioContext | null>(null);
  return useCallback((s: Sfx) => {
    if (!enabled) return;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ac.current ??= new AC();
      const c = ac.current;
      const tone = (f0: number, f1: number, dur: number, type: OscillatorType, vol: number, at = 0) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = type; o.frequency.setValueAtTime(f0, c.currentTime + at); o.frequency.exponentialRampToValueAtTime(f1, c.currentTime + at + dur);
        g.gain.setValueAtTime(vol, c.currentTime + at); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + dur);
        o.connect(g).connect(c.destination); o.start(c.currentTime + at); o.stop(c.currentTime + at + dur + 0.02);
      };
      if (s === "step") tone(180, 150, 0.04, "triangle", 0.025);
      else if (s === "plate") tone(420, 760, 0.12, "sine", 0.06);
      else if (s === "door") tone(160, 90, 0.2, "sawtooth", 0.03);
      else if (s === "echo") { tone(260, 980, 0.34, "sine", 0.07); tone(520, 130, 0.34, "triangle", 0.03, 0.04); }
      else if (s === "dead") tone(220, 50, 0.3, "sawtooth", 0.06);
      else if (s === "win") [523, 659, 784, 1046].forEach((f, i) => tone(f, f, 0.22, "sine", 0.06, i * 0.09));
    } catch { /* audio is optional */ }
  }, [enabled]);
}

/* read the system setting directly so the game's own reduced mode always follows it */
const subscribeReduced = (cb: () => void) => { const m = window.matchMedia("(prefers-reduced-motion: reduce)"); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); };
const useSystemReduced = () => useSyncExternalStore(subscribeReduced, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);

const ordinal = (i: number) => String(i + 1).padStart(2, "0");

export default function EchoApp() {
  const [screen, setScreen] = useState<Screen>("title");
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [loaded, setLoaded] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [dlg, setDlg] = useState<Dlg>(null);
  const [solved, setSolved] = useState<Solved | null>(null);
  const [dead, setDead] = useState<string | null>(null);
  const [replay, setReplay] = useState<Run[] | null>(null);
  const [, bump] = useState(0);
  const [copied, setCopied] = useState(false);
  const [coarse, setCoarse] = useState(false);
  const sysReduced = useSystemReduced();
  const board = useRef<BoardHandle>(null);
  const deadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reduced = progress.settings.motion === "reduced" || !!sysReduced;
  const sfx = useSfx(progress.settings.sound);
  const today = useMemo(() => dailyNumber(new Date()), []);

  // load progress after mount (localStorage does not exist on the server), then honour ?level= and ?daily=
  /* eslint-disable react-hooks/set-state-in-effect -- localStorage and matchMedia only exist after hydration, so state is read here on purpose */
  useEffect(() => {
    const p = loadProgress(window.localStorage);
    setProgress(p);
    setLoaded(true);
    setCoarse(window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 820);
    const q = new URLSearchParams(window.location.search);
    const lv = q.get("level"), dn = Number(q.get("daily"));
    const byId = LEVELS.find((l) => l.id === lv);
    if (byId) { setSession({ def: byId, key: 1 }); setScreen("game"); }
    else if (dn >= 1 && dn <= today + 400) { setSession({ def: dailyLevel(dn), daily: dn, key: 1 }); setScreen("game"); }
  }, [today]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const update = useCallback((fn: (p: Progress) => Progress) => {
    setProgress((p) => { const n = fn(p); saveProgress(window.localStorage, n); return n; });
  }, []);

  const game = useMemo(() => (session ? new EchoGame(levelOf(session.def)) : null), [session]);

  const start = useCallback((def: LevelDef, daily?: number) => {
    setSolved(null); setDead(null); setReplay(null); setDlg(null);
    setSession((s) => ({ def, daily, key: (s?.key ?? 0) + 1 }));
    setScreen("game");
  }, []);

  const firstOpen = useMemo(() => {
    const i = LEVELS.findIndex((l) => !progress.best[l.id]);
    return i === -1 ? 0 : i;
  }, [progress]);

  const onWon = useCallback(() => {
    if (!game || !session) return;
    const r = game.result()!;
    const score = scoreOf(r.loops, session.def.par, r.ticks);
    let improved = true;
    update((p) => {
      let n = p;
      if (session.daily) n = recordDaily(n, session.daily, session.def.id, r.loops, score);
      else {
        const out = recordSolve(n, session.def.id, { loops: r.loops, ticks: r.ticks, score, runs: r.runs.map(encodeRun) });
        n = out.progress; improved = out.improved;
      }
      return n;
    });
    setSolved({ loops: r.loops, ticks: r.ticks, score, improved, par: session.def.par });
  }, [game, session, update]);

  const onDead = useCallback((reason: string) => {
    setDead(reason);
    if (deadTimer.current) clearTimeout(deadTimer.current);
    deadTimer.current = setTimeout(() => { board.current?.retry(); }, 900);
  }, []);
  useEffect(() => () => { if (deadTimer.current) clearTimeout(deadTimer.current); }, []);

  // Escape toggles pause while playing
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || screen !== "game" || solved) return;
      setDlg((d) => (d === "pause" ? null : d ? d : "pause"));
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [screen, solved]);

  const share = async () => {
    if (!session || !solved) return;
    const text = shareText({ daily: session.daily, level: session.def, loops: solved.loops, score: solved.score });
    try {
      if (navigator.share && coarse) await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
      setCopied(true); setTimeout(() => setCopied(false), 1800);
    } catch { /* user cancelled or clipboard blocked */ }
  };

  // the board ignores input while paused, so restart after the dialog or overlay has closed and React has re-rendered
  const restartSoon = () => setTimeout(() => board.current?.restart(), 80);

  const startReplay = () => {
    if (!session) return;
    const best = progress.best[session.def.id];
    if (!best?.runs.length) return;
    setSolved(null);
    setReplay(replayRuns(levelOf(session.def), best.runs.map(decodeRun)));
  };

  const idx = session ? LEVELS.findIndex((l) => l.id === session.def.id) : -1;
  const nextDef = idx >= 0 && idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
  const paused = dlg !== null || !!solved;
  const dailyDone = progress.daily[String(today)];

  const t = reduced ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div className={`eg${reduced ? " is-reduced" : ""}`} data-screen={screen}>
      <div className="eg-bg" aria-hidden="true"><i /><i /><i /></div>
      <AnimatePresence mode="wait" initial={false}>
        {screen === "title" && (
          <motion.main key="title" className="eg-title" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97, filter: "blur(8px)" }} transition={t}>
            <p className="eg-kicker">A time-loop puzzle game</p>
            <h1 className="eg-logo" aria-label="ECHO//SHIFT">
              <span aria-hidden="true" className="eg-logo__ghost g3">ECHO//SHIFT</span>
              <span aria-hidden="true" className="eg-logo__ghost g2">ECHO//SHIFT</span>
              <span aria-hidden="true" className="eg-logo__ghost g1">ECHO//SHIFT</span>
              <span className="eg-logo__main">ECHO<b>{"//"}</b>SHIFT</span>
            </h1>
            <p className="eg-tag">Your past self is your teammate.</p>
            <div className="eg-menu">
              <button type="button" className="eg-btn eg-btn--primary" onClick={() => start(LEVELS[firstOpen])} autoFocus>
                PLAY NOW <small>{loaded && progress.best[LEVELS[0].id] ? `level ${firstOpen + 1}` : "level 1"}</small>
              </button>
              <button type="button" className="eg-btn" onClick={() => start(dailyLevel(today), today)}>
                DAILY CHALLENGE #{today} <small>{dailyDone ? `solved · ${dailyDone.score}` : "new today"}</small>
              </button>
              <div className="eg-menu__row">
                <button type="button" className="eg-btn eg-btn--ghost" onClick={() => setDlg("how")}>HOW TO PLAY</button>
                <button type="button" className="eg-btn eg-btn--ghost" onClick={() => setScreen("levels")}>LEVELS</button>
                <button type="button" className="eg-btn eg-btn--ghost" onClick={() => setDlg("settings")}>SETTINGS</button>
              </div>
            </div>
            <p className="eg-credit">Created by <Link href="/">Karthik Mannem</Link></p>
          </motion.main>
        )}

        {screen === "levels" && (
          <motion.main key="levels" className="eg-levels" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={t}>
            <header className="eg-bar">
              <button type="button" className="eg-link" onClick={() => setScreen("title")}>← ECHO//SHIFT</button>
              <h2>Levels</h2>
            </header>
            <ol className="eg-grid">
              {LEVELS.map((l, i) => {
                const open = isUnlocked(progress, i);
                const best = progress.best[l.id];
                return (
                  <li key={l.id}>
                    <button type="button" className={`eg-lv${best ? " is-done" : ""}`} disabled={!open} onClick={() => start(l)} aria-label={`Level ${i + 1}, ${l.name}${best ? `, solved, best score ${best.score}` : open ? "" : ", locked"}`}>
                      <span className="eg-lv__n">{ordinal(i)}</span>
                      <span className="eg-lv__t">{l.name}</span>
                      <span className="eg-lv__m">{open ? (best ? `${best.loops} loop${best.loops > 1 ? "s" : ""} · ${best.score}` : `par ${l.par} loop${l.par > 1 ? "s" : ""}`) : "locked · solve the one before"}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <button type="button" className="eg-btn eg-btn--daily" onClick={() => start(dailyLevel(today), today)}>
              DAILY CHALLENGE #{today} <small>{dailyDone ? `solved in ${dailyDone.loops} · ${dailyDone.score}` : `${DAILY_POOL.length} handcrafted puzzles on rotation`}</small>
            </button>
          </motion.main>
        )}

        {screen === "game" && session && game && (
          <motion.main key={`game-${session.key}`} className="eg-game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={t}>
            <header className="eg-hud">
              <button type="button" className="eg-link" onClick={() => setScreen("levels")}>← LEVELS</button>
              <div className="eg-hud__title">
                <span>{session.daily ? `DAILY #${session.daily}` : `LEVEL ${ordinal(idx)}`}</span>
                <b>{session.def.name}</b>
              </div>
              <div className="eg-hud__loops" aria-live="polite">
                <span className="eg-hud__lab">LOOP {game.loops} · PAR {session.def.par}</span>
                <span className="eg-chips" aria-label={`${game.ghosts.length} echoes`}>
                  {game.ghosts.map((_, i) => (<i key={i} style={{ background: GHOST_COLOR[i % 4] }}>{i + 1}</i>))}
                </span>
              </div>
              <button type="button" className="eg-link" onClick={() => setDlg("pause")} aria-label="Pause">PAUSE</button>
            </header>

            <Board
              key={`${session.key}-${replay ? "r" : "p"}`}
              ref={board}
              game={game}
              replay={replay}
              paused={paused}
              reduced={reduced}
              showPad={coarse}
              sfx={sfx}
              onStart={() => setDead(null)}
              onWon={onWon}
              onDead={onDead}
              onEcho={() => { setDead(null); bump((n) => n + 1); }}
              onRetry={() => { setDead(null); bump((n) => n + 1); }}
              onReplayEnd={() => setReplay(null)}
            />

            <footer className="eg-foot">
              <p className="eg-hint" role="status">
                {dead ? (dead === "hazard" ? "Caught by a pulse. Wait for the gap. Restarting…" : dead === "crushed" ? "A door closed on you: something stopped holding its plate. Restarting…" : "Out of time. Restarting…") : replay ? "Replaying your best solution." : session.def.hint}
              </p>
              {!coarse && (
                <p className="eg-keys" aria-label="Controls">
                  <kbd>WASD</kbd><kbd>↑↓←→</kbd> move · <kbd>X</kbd> wait · <kbd>Space</kbd> echo · <kbd>R</kbd> retry · <kbd>Esc</kbd> pause
                </p>
              )}
              {replay && <button type="button" className="eg-link" onClick={() => setReplay(null)}>STOP REPLAY</button>}
            </footer>

            <AnimatePresence>
              {solved && (
                <motion.div className="eg-solved" role="dialog" aria-modal="true" aria-labelledby="eg-solved-h" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.3 }}>
                  <motion.div className="eg-solved__card" initial={reduced ? false : { y: 40, scale: 0.96 }} animate={{ y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 220, damping: 22 }}>
                    <p className="eg-kicker">{session.daily ? `Daily challenge #${session.daily}` : `Level ${ordinal(idx)} · ${session.def.name}`}</p>
                    <h2 id="eg-solved-h">{solved.loops <= solved.par ? "Perfect loop." : "Solved."}</h2>
                    <dl className="eg-stats">
                      <div><dt>Loops</dt><dd>{solved.loops}<small> par {solved.par}</small></dd></div>
                      <div><dt>Ticks</dt><dd>{solved.ticks}</dd></div>
                      <div><dt>Score</dt><dd>{solved.score}</dd></div>
                    </dl>
                    {!session.daily && solved.improved && <p className="eg-best">New personal best</p>}
                    <p className="eg-rule">Score = 1000 − 120 per loop over par − 2 per tick of the winning run.</p>
                    <div className="eg-solved__acts">
                      {nextDef && !session.daily && <button type="button" className="eg-btn eg-btn--primary" onClick={() => start(nextDef)} autoFocus>NEXT LEVEL</button>}
                      {(!nextDef || session.daily) && <button type="button" className="eg-btn eg-btn--primary" onClick={() => setScreen("levels")} autoFocus>{session.daily ? "ALL LEVELS" : "ALL LEVELS"}</button>}
                      <button type="button" className="eg-btn" onClick={share} aria-live="polite">{copied ? "COPIED" : "SHARE RESULT"}</button>
                      {!session.daily && <button type="button" className="eg-btn eg-btn--ghost" onClick={startReplay}>REPLAY SOLUTION</button>}
                      <button type="button" className="eg-btn eg-btn--ghost" onClick={() => { setSolved(null); restartSoon(); }}>PLAY AGAIN</button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.main>
        )}
      </AnimatePresence>

      <Dialog open={dlg === "how"} onOpenChange={(o) => setDlg(o ? "how" : null)}>
        <DialogContent className="eg-dialog">
          <DialogTitle>How to play</DialogTitle>
          <DialogDescription className="sr-only">The rules of ECHO//SHIFT and its controls.</DialogDescription>
          <ol className="eg-how">
            <li><b>Reach the exit.</b> The glowing rings. Move with WASD or the arrow keys.</li>
            <li><b>Plates open doors.</b> A plate lettered A opens every door lettered A, but only while something stands on it. If a plate letter appears twice, both must be held.</li>
            <li><b>Echo.</b> Press Space and your run becomes a numbered ghost that repeats it exactly, from the start. The ghost stays on its last tile.</li>
            <li><b>Be your own teammate.</b> Send an echo to hold a plate, then walk through the door it opens. Up to four echoes.</li>
            <li><b>Red pulses are deadly.</b> They flash amber one beat before they fire. Waiting is a move (X).</li>
            <li><b>Retry</b> (R) drops only the run you are on. Shift+R starts the level over.</li>
          </ol>
          <p className="eg-how__note">Nothing in the game depends on colour alone: plates and doors carry the same letter, ghosts carry numbers.</p>
        </DialogContent>
      </Dialog>

      <Dialog open={dlg === "settings"} onOpenChange={(o) => setDlg(o ? "settings" : null)}>
        <DialogContent className="eg-dialog">
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription className="sr-only">Sound and motion settings. Saved on this device only.</DialogDescription>
          <div className="eg-set">
            <div className="eg-set__row">
              <span id="set-sound">Sound</span>
              <div role="group" aria-labelledby="set-sound">
                <button type="button" className={`eg-seg${!progress.settings.sound ? " is-on" : ""}`} aria-pressed={!progress.settings.sound} onClick={() => update((p) => ({ ...p, settings: { ...p.settings, sound: false } }))}>Off</button>
                <button type="button" className={`eg-seg${progress.settings.sound ? " is-on" : ""}`} aria-pressed={progress.settings.sound} onClick={() => update((p) => ({ ...p, settings: { ...p.settings, sound: true } }))}>On</button>
              </div>
            </div>
            <div className="eg-set__row">
              <span id="set-motion">Animation</span>
              <div role="group" aria-labelledby="set-motion">
                <button type="button" className={`eg-seg${progress.settings.motion === "full" ? " is-on" : ""}`} aria-pressed={progress.settings.motion === "full"} onClick={() => update((p) => ({ ...p, settings: { ...p.settings, motion: "full" } }))}>Full</button>
                <button type="button" className={`eg-seg${progress.settings.motion === "reduced" ? " is-on" : ""}`} aria-pressed={progress.settings.motion === "reduced"} onClick={() => update((p) => ({ ...p, settings: { ...p.settings, motion: "reduced" } }))}>Reduced</button>
              </div>
            </div>
            <p className="eg-how__note">{sysReduced ? "Your system asks for reduced motion, so animation is reduced regardless." : "Reduced removes glows, trails and sweeps. Your system's reduced-motion setting is always respected."}</p>
            <button type="button" className="eg-btn eg-btn--ghost" onClick={() => { if (window.confirm("Erase saved progress on this device?")) update(() => emptyProgress()); }}>ERASE PROGRESS</button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dlg === "pause"} onOpenChange={(o) => setDlg(o ? "pause" : null)}>
        <DialogContent className="eg-dialog eg-dialog--pause">
          <DialogTitle>Paused</DialogTitle>
          <DialogDescription className="sr-only">The game is paused.</DialogDescription>
          <div className="eg-pause">
            <button type="button" className="eg-btn eg-btn--primary" onClick={() => setDlg(null)} autoFocus>RESUME</button>
            <button type="button" className="eg-btn" onClick={() => { setDlg(null); restartSoon(); }}>RESTART LEVEL</button>
            <button type="button" className="eg-btn" onClick={() => setDlg("settings")}>SETTINGS</button>
            <button type="button" className="eg-btn eg-btn--ghost" onClick={() => { setDlg(null); setScreen("levels"); }}>LEVELS</button>
          </div>
        </DialogContent>
      </Dialog>
      <span className="sr-only" aria-hidden="true">{GAME_URL}</span>
    </div>
  );
}
