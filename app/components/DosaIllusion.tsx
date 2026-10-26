"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

const C = 210;
function spiral(turns: number, maxR: number, flip: boolean) {
  const steps = turns * 90;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const th = t * turns * 2 * Math.PI;
    const r = t * maxR;
    const x = C + (flip ? -1 : 1) * r * Math.cos(th);
    const y = C + r * Math.sin(th);
    d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

const STARE_SECONDS = 15;

/** A rotating dosa-batter spiral (two counter-rotating layers) with a 15-second stare-and-look-away test. */
export default function DosaIllusion() {
  const rm = useReducedMotion();
  const turns = 8;
  const maxR = 186;
  const sw = maxR / turns / 2;
  const a = useMemo(() => spiral(turns, maxR, false), []);
  const b = useMemo(() => spiral(turns, maxR, true), []);
  const dots = useMemo(() => Array.from({ length: 36 }).map((_, i) => {
    const th = (i / 36) * Math.PI * 2;
    return [C + 205 * Math.cos(th), C + 205 * Math.sin(th)] as const;
  }), []);

  const [phase, setPhase] = useState<"idle" | "staring" | "done">("idle");
  const [left, setLeft] = useState(STARE_SECONDS);
  const [reverse, setReverse] = useState(false);
  const iv = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (iv.current) clearInterval(iv.current); }, []);

  const start = () => {
    if (iv.current) clearInterval(iv.current);
    setPhase("staring"); setLeft(STARE_SECONDS);
    const t0 = Date.now();
    iv.current = setInterval(() => {
      const rem = Math.max(STARE_SECONDS - (Date.now() - t0) / 1000, 0);
      setLeft(rem);
      if (rem <= 0) { if (iv.current) clearInterval(iv.current); setPhase("done"); }
    }, 100);
  };
  const reset = () => { setPhase("idle"); setLeft(STARE_SECONDS); };

  const paused = rm || phase === "done";
  const speed = phase === "staring" ? 14 : 28;

  return (
    <div className="dosa-ill">
      <div className="dosa-ill__disc" style={{ ["--spin" as string]: `${speed}s`, ["--dir" as string]: reverse ? "reverse" : "normal", ["--state" as string]: paused ? "paused" : "running" }}>
        <svg viewBox="0 0 420 420" role="img" aria-label="A hypnotic spiral shaped like a dosa on a tawa. Stare at the centre for fifteen seconds, then look away.">
          <circle cx={C} cy={C} r="198" fill="#1b0f06" stroke="#080402" strokeWidth="10" />
          <g className="dosa-ill__spin"><path d={a} fill="none" stroke="#E7B05A" strokeWidth={sw} strokeLinecap="butt" /></g>
          <g className="dosa-ill__spin dosa-ill__spin--rev" style={{ mixBlendMode: "screen" }}><path d={b} fill="none" stroke="#FFE2A6" strokeOpacity="0.22" strokeWidth={sw} /></g>
          <circle cx={C} cy={C} r="9" fill="#FFF1C9" /><circle cx={C} cy={C} r="3.5" fill="#B8321C" />
          {dots.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.6" fill="#F3E3C0" opacity="0.8" />)}
        </svg>
      </div>

      <div className="dosa-ill__copy" aria-live="polite">
        {phase === "idle" && <>
          <p className="dosa-ill__q">Is this dosa getting bigger… or smaller?</p>
          <p>Stare at the red dot for {STARE_SECONDS} seconds. Then look at your hand — or the page.</p>
          <div className="dosa-ill__btns">
            <button type="button" className="pill-cta" onClick={start}>Start staring 👀</button>
            <button type="button" className="dosa-ill__ghost" onClick={() => setReverse((r) => !r)}>Flip spin ⟲</button>
          </div>
        </>}
        {phase === "staring" && <>
          <p className="dosa-ill__q">Don&apos;t blink. Eyes on the red dot.</p>
          <div className="dosa-ill__timer"><i style={{ width: `${((STARE_SECONDS - left) / STARE_SECONDS) * 100}%` }} /></div>
          <p className="dosa-ill__count">{Math.ceil(left)}s</p>
        </>}
        {phase === "done" && <>
          <p className="dosa-ill__q">Now look away — or at the frozen dosa.</p>
          <p>It should seem to <b>breathe the other way</b>. That&apos;s the spiral after-effect: your eyes got tired of the motion.</p>
          <div className="dosa-ill__btns"><button type="button" className="pill-cta" onClick={reset}>Go again ↻</button></div>
        </>}
      </div>
    </div>
  );
}
