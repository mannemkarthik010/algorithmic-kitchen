"use client";
import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";

type Kind = "idli" | "vada" | "dosa";

const KINDS: Record<Kind, { w: number; h: number; rate: number; label: string; emoji: string; tip: string }> = {
  idli: { w: 92, h: 62, rate: 30, label: "Idli", emoji: "🍚", tip: "Idli drinks sambar slowly — be patient." },
  vada: { w: 84, h: 84, rate: 46, label: "Medu Vada", emoji: "🍩", tip: "Vada is porous. It soaks fast!" },
  dosa: { w: 112, h: 46, rate: 62, label: "Crispy Dosa", emoji: "🫓", tip: "Dosa goes soggy in a blink. Quick fingers." },
};
const ORDER: Kind[] = ["idli", "dosa", "vada", "idli", "dosa"];

const STAGE_H = 400;
const BASE_TOP = 22;
const SURFACE = 262;
const BOWL_HALF = 128;

function Art({ kind }: { kind: Kind }) {
  if (kind === "idli") {
    return (
      <svg viewBox="0 0 92 62" width="100%" height="100%" aria-hidden="true">
        <defs><radialGradient id="g-idli" cx="38%" cy="28%" r="80%"><stop offset="0" stopColor="#FFFDF4" /><stop offset="1" stopColor="#E6D9B8" /></radialGradient></defs>
        <ellipse cx="46" cy="49" rx="42" ry="11" fill="#C9B88F" />
        <path d="M5 46 C5 8 87 8 87 46 C87 58 5 58 5 46Z" fill="url(#g-idli)" />
        <path d="M20 30 q26-14 52 0" stroke="rgba(120,90,30,0.14)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="34" cy="22" r="2" fill="rgba(255,255,255,0.7)" />
      </svg>
    );
  }
  if (kind === "vada") {
    return (
      <svg viewBox="0 0 84 84" width="100%" height="100%" aria-hidden="true">
        <defs><radialGradient id="g-vada" cx="35%" cy="30%" r="80%"><stop offset="0" stopColor="#E9A94A" /><stop offset="1" stopColor="#A55D17" /></radialGradient></defs>
        <path fillRule="evenodd" fill="url(#g-vada)" d="M42 3a39 39 0 1 0 0.01 0ZM42 31a11 11 0 1 1-0.01 0Z" />
        {[[18, 30], [62, 24], [24, 62], [66, 58], [44, 12], [40, 72], [12, 46]].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="2" fill="rgba(70,30,5,0.45)" />)}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 112 46" width="100%" height="100%" aria-hidden="true">
      <defs><linearGradient id="g-dosa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F0BE63" /><stop offset="0.6" stopColor="#D9902F" /><stop offset="1" stopColor="#A9611A" /></linearGradient></defs>
      <path d="M4 23 Q4 5 26 5 H94 Q108 5 108 23 Q108 41 94 41 H26 Q4 41 4 23Z" fill="url(#g-dosa)" />
      <path d="M24 10 V36 M38 8 V38 M52 8 V38 M66 8 V38 M80 8 V38" stroke="rgba(110,55,8,0.35)" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="102" cy="23" rx="7" ry="14" fill="#EBC45A" stroke="#B88620" strokeWidth="1.5" />
    </svg>
  );
}

function Dunkable({ kind, stageW, onSoak, onDone, onDry }: {
  kind: Kind; stageW: number;
  onSoak: (s: number) => void; onDone: (s: number, melted: boolean) => void; onDry: () => void;
}) {
  const k = KINDS[kind];
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const soak = useRef(0);
  const dragging = useRef(false);
  const finished = useRef(false);
  const [soakUI, setSoakUI] = useState(0);
  const [melt, setMelt] = useState(false);
  const rm = useReducedMotion();
  const cb = useRef({ onSoak, onDone, onDry });
  useEffect(() => { cb.current = { onSoak, onDone, onDry }; });

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      if (dragging.current && !finished.current) {
        const inBowl = Math.abs(x.get()) <= BOWL_HALF - k.w / 4;
        const bottom = BASE_TOP + y.get() + k.h;
        const f = inBowl ? Math.min(Math.max((bottom - SURFACE) / k.h, 0), 1) : 0;
        if (f > 0) {
          soak.current = Math.min(soak.current + dt * k.rate * f, 105);
          setSoakUI(soak.current);
          cb.current.onSoak(soak.current);
          if (soak.current >= 100) {
            finished.current = true;
            dragging.current = false;
            setMelt(true);
            cb.current.onDone(soak.current, true);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [k, x, y]);

  const release = () => {
    dragging.current = false;
    if (finished.current) return;
    if (soak.current < 1) {
      cb.current.onDry();
      animate(x, 0, { type: "spring", stiffness: 220, damping: 20 });
      animate(y, 0, { type: "spring", stiffness: 220, damping: 20 });
      return;
    }
    finished.current = true;
    cb.current.onDone(soak.current, false);
    // let it slump into the bowl a little, "watch it go"
    animate(y, Math.min(SURFACE - BASE_TOP - k.h * 0.1, y.get() + 28), { duration: rm ? 0 : 0.5 });
  };

  const half = Math.max(stageW / 2 - k.w / 2, 0);
  const tint = soakUI / 100;

  return (
    <>
      <motion.div
        className="dunk__item"
        drag
        dragMomentum={false}
        dragElastic={0.05}
        dragConstraints={{ left: -half, right: half, top: 0, bottom: STAGE_H - 30 - k.h - BASE_TOP }}
        onDragStart={() => { if (!finished.current) dragging.current = true; }}
        onDragEnd={release}
        style={{
          x, y, width: k.w, height: k.h, marginLeft: -k.w / 2, top: BASE_TOP,
          filter: `brightness(${1 - tint * 0.35}) saturate(${1 + tint * 0.6}) sepia(${tint * 0.55})`,
          opacity: melt ? 0 : 1, transition: "opacity .5s",
        }}
        role="img"
        aria-label={`${k.label}. Drag it down into the sambar, hold, then let go.`}
        whileTap={{ scale: 1.06 }}
      >
        <Art kind={kind} />
      </motion.div>
      {melt && (
        <div className="dunk__crumbs" style={{ top: SURFACE - 20 }} aria-hidden="true">
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.span key={i}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: (i - 4.5) * 14, y: -30 - (i % 3) * 18, opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.9, ease: "easeOut" }} />
          ))}
        </div>
      )}
    </>
  );
}

type Msg = { text: string; tone: "good" | "ok" | "bad"; pts: number };

function judge(s: number, melted: boolean): Msg {
  if (melted) return { text: "MELTED INTO THE SAMBAR!", tone: "bad", pts: 0 };
  if (s >= 70 && s <= 90) return { text: "PERFECT SOAK!", tone: "good", pts: 3 };
  if (s >= 50 && s < 70) return { text: "JUST ABOUT…", tone: "ok", pts: 1 };
  if (s > 90) return { text: "TOO SOGGY!", tone: "bad", pts: 0 };
  return { text: "STILL DRY!", tone: "bad", pts: 0 };
}

/** Drag a South Indian tiffin item into the sambar. Hold until it's perfectly soaked, then let go. */
export default function DunkGame() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageW, setStageW] = useState(420);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [msg, setMsg] = useState<Msg | null>(null);
  const [soak, setSoak] = useState(0);
  const [nudge, setNudge] = useState(false);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStageW(el.clientWidth));
    ro.observe(el);
    setStageW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const finishRound = (s: number, melted: boolean) => {
    const m = judge(s, melted);
    setMsg(m);
    setSoak(Math.min(s, 100));
    setScore((v) => v + m.pts);
    setStreak((v) => (m.tone === "good" ? v + 1 : 0));
    timer.current = setTimeout(() => {
      setMsg(null); setSoak(0);
      if (round + 1 >= ORDER.length) {
        setDone(true);
      } else setRound((r) => r + 1);
    }, 1500);
  };

  const restart = () => {
    setBest((b) => Math.max(b, score));
    setScore(0); setStreak(0); setRound(0); setMsg(null); setSoak(0); setDone(false);
  };

  const kind = ORDER[round];
  const verdict = score >= 13 ? "Sambar Sommelier 🏆" : score >= 9 ? "Tiffin Centre Pro 🥇" : score >= 5 ? "Hostel Mess Regular 🍛" : "Needs more sambar 🥣";

  return (
    <div className="dunk">
      <div className="dunk__bar">
        <span className="dunk__chip">DISH {Math.min(round + 1, ORDER.length)}/{ORDER.length}</span>
        <span className="dunk__chip dunk__chip--score">{score} pts</span>
        <span className="dunk__chip">🔥 streak {streak}</span>
        {best > 0 && <span className="dunk__chip">best {best}</span>}
      </div>

      <div className="dunk__stage" ref={stageRef} style={{ height: STAGE_H }}>
        {/* the tiffin plate the item rests on */}
        <div className="dunk__plate" aria-hidden="true"><span>{KINDS[kind].emoji}</span></div>

        {/* steel katori (bowl) back */}
        <div className="dunk__bowl" style={{ top: SURFACE - 14, width: BOWL_HALF * 2 + 12 }} aria-hidden="true" />
        <div className="dunk__bowl-label" style={{ top: SURFACE + 112 }} aria-hidden="true">SAMBAR 🥣</div>

        {!done && (
          <Dunkable
            key={round}
            kind={kind}
            stageW={stageW}
            onSoak={setSoak}
            onDone={finishRound}
            onDry={() => { setNudge(true); setTimeout(() => setNudge(false), 1400); }}
          />
        )}

        {/* sambar in front of the item = looks submerged */}
        <div className="dunk__sambar" style={{ top: SURFACE, width: BOWL_HALF * 2 }} aria-hidden="true">
          <svg className="dunk__wave" viewBox="0 0 200 12" preserveAspectRatio="none"><path d="M0 6 Q25 0 50 6 T100 6 T150 6 T200 6 V12 H0Z" fill="#C8561A" /></svg>
          <span className="dunk__veg dunk__veg--1" /><span className="dunk__veg dunk__veg--2" /><span className="dunk__veg dunk__veg--3" />
        </div>

        {nudge && <p className="dunk__nudge">Dunk it into the sambar first! ↓</p>}
        {msg && <p className={`dunk__msg dunk__msg--${msg.tone}`} role="status">{msg.text}{msg.pts > 0 ? ` +${msg.pts}` : ""}</p>}

        {done && (
          <div className="dunk__end" role="status">
            <p className="dunk__end-score">{score}/15</p>
            <p className="dunk__end-verdict">{verdict}</p>
            <button type="button" className="pill-cta" onClick={restart}>Dunk again ↻</button>
          </div>
        )}
      </div>

      {/* soak gauge */}
      <div className="dunk__gauge" aria-hidden="true">
        <div className="dunk__zones"><i style={{ width: "50%" }} /><i style={{ width: "20%" }} className="z-ok" /><i style={{ width: "20%" }} className="z-perfect" /><i style={{ width: "10%" }} className="z-bad" /></div>
        <div className="dunk__marker" style={{ left: `${Math.min(soak, 100)}%` }} />
        <div className="dunk__zone-labels"><span>dry</span><span>decent</span><span>PERFECT</span><span>soggy</span></div>
      </div>
      {!done && <p className="dunk__tip">{KINDS[kind].tip} Drag it in → hold → let go in the green.</p>}
    </div>
  );
}
