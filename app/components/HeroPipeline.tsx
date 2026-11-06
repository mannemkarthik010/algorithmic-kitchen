"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import Link from "next/link";

/** The pipeline behind the Retail Demand Intelligence Platform, drawn as four layers in depth.
 *  Every figure comes from that project's own results. */
const STEPS = [
  { key: "Data", head: "240 synthetic store and department series", body: "Five years of weekly sales generated to mirror a retail chain, backtested with a rolling origin." },
  { key: "Model", head: "A winner chosen per series", body: "Seasonal-naive, Holt-Winters and gradient boosting compete; no single model wins everywhere." },
  { key: "Evaluation", head: "7.9% WAPE, and an honest gap", body: "The 80% prediction intervals covered 74.2% on held-out data. Reported, not hidden." },
  { key: "Deployment", head: "Live demo, honest scope", body: "Runs on Vercel with passing CI. The AWS Terraform is written and mock-tested, not yet applied to an account." },
] as const;

const GAP = 66; // px between layers in depth

function PlateArt({ i }: { i: number }) {
  if (i === 0) {
    return (
      <svg viewBox="0 0 120 70" aria-hidden="true">
        {Array.from({ length: 40 }).map((_, k) => {
          const c = k % 10, r = Math.floor(k / 10);
          return <rect key={k} x={6 + c * 11} y={8 + r * 15} width="8" height="10" rx="1.5" fill={(k * 7) % 5 === 0 ? "#E6946F" : "rgba(242,239,232,.22)"} />;
        })}
      </svg>
    );
  }
  if (i === 1) {
    return (
      <svg viewBox="0 0 120 70" aria-hidden="true">
        <rect x="16" y="38" width="22" height="24" fill="rgba(242,239,232,.25)" />
        <rect x="49" y="30" width="22" height="32" fill="rgba(242,239,232,.25)" />
        <rect x="82" y="14" width="22" height="48" fill="#E6946F" />
        <rect x="6" y="62" width="108" height="1.5" fill="rgba(242,239,232,.4)" />
      </svg>
    );
  }
  if (i === 2) {
    return (
      <svg viewBox="0 0 120 70" aria-hidden="true">
        <rect x="8" y="18" width="104" height="12" fill="none" stroke="rgba(242,239,232,.45)" strokeDasharray="3 3" />
        <rect x="8" y="18" width="77" height="12" fill="#E6946F" />
        <rect x="8" y="44" width="104" height="12" fill="none" stroke="rgba(242,239,232,.45)" strokeDasharray="3 3" />
        <rect x="8" y="44" width="38" height="12" fill="rgba(242,239,232,.5)" />
        <line x1="90" y1="10" x2="90" y2="64" stroke="#E6946F" strokeWidth="1.2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 70" aria-hidden="true">
      <path d="M18 35 H50 M50 35 L72 18 H102 M50 35 L72 52 H102" stroke="rgba(242,239,232,.45)" strokeWidth="1.5" fill="none" />
      {[[18, 35], [50, 35], [72, 18], [102, 18], [72, 52], [102, 52]].map(([x, y], k) => (
        <circle key={k} cx={x} cy={y} r="5" fill={k === 0 || k === 3 ? "#E6946F" : "rgba(242,239,232,.35)"} />
      ))}
    </svg>
  );
}

/** One layer. As the hero scrolls away the layers move apart in depth, from the whole system toward its parts. */
function Plate({ i, on, progress, rm, onPick }: { i: number; on: boolean; progress?: MotionValue<number>; rm: boolean | null; onPick: () => void }) {
  const fallback = useMotionValue(0);
  const z = useTransform(progress ?? fallback, [0, 1], [i * GAP, i * GAP * 1.9]);
  return (
    <motion.div className={`pipe__plate${on ? " is-on" : ""}`} style={rm || !progress ? { transform: `translateZ(${i * GAP}px)` } : { z }} aria-hidden="true" onClick={onPick}>
      <span className="pipe__no">0{i + 1}</span>
      <PlateArt i={i} />
    </motion.div>
  );
}

export default function HeroPipeline({ progress }: { progress?: MotionValue<number> }) {
  const rm = useReducedMotion();
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);

  // One pass of the pulse through the four layers on load, then it rests. It is an introduction, not a loop,
  // and the first hover, focus or click hands control to the visitor for good.
  useEffect(() => {
    if (rm || touched) return;
    let n = 0;
    const t = setInterval(() => {
      n += 1;
      setActive(n);
      if (n >= STEPS.length - 1) clearInterval(t);
    }, 2200);
    return () => clearInterval(t);
  }, [rm, touched]);
  const pick = (i: number) => { setActive(i); setTouched(true); };

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotZ = useSpring(useTransform(mx, [-0.5, 0.5], [-38, -22]), { stiffness: 90, damping: 18 });
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [56, 46]), { stiffness: 90, damping: 18 });

  const scene = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (rm || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    mx.set(x - 0.5);
    my.set(y - 0.5);
    // a light source that follows the pointer across the plates and the floor shadow
    scene.current?.style.setProperty("--lx", `${Math.round(x * 100)}%`);
    scene.current?.style.setProperty("--ly", `${Math.round(y * 100)}%`);
  };
  const onLeave = () => { mx.set(0); my.set(0); scene.current?.style.removeProperty("--lx"); scene.current?.style.removeProperty("--ly"); };

  return (
    <div className="pipe">
      <p className="pipe__eyebrow">One system, four layers · from the Retail Demand Intelligence Platform</p>

      <div className="pipe__scene" ref={scene} onPointerMove={onMove} onPointerLeave={onLeave}>
        <motion.div className="pipe__stack" style={rm ? { rotateX: 52, rotateZ: -30 } : { rotateX: rotX, rotateZ: rotZ }}>
          {STEPS.map((s, i) => (<Plate key={s.key} i={i} on={active === i} progress={progress} rm={rm} onPick={() => pick(i)} />))}
          {!rm && (
            <motion.span
              className="pipe__pulse"
              aria-hidden="true"
              animate={{ z: active * GAP + 4 }}
              transition={{ type: "spring", stiffness: 70, damping: 16 }}
            />
          )}
        </motion.div>
      </div>

      <ol className="pipe__steps">
        {STEPS.map((s, i) => (
          <li key={s.key}>
            <button
              type="button"
              className={`pipe__step${active === i ? " is-on" : ""}`}
              aria-pressed={active === i}
              onMouseEnter={() => pick(i)}
              onFocus={() => pick(i)}
              onClick={() => pick(i)}
            >
              <span className="pipe__k">0{i + 1} / {s.key}</span>
              <span className="pipe__h">{s.head}</span>
              <span className="pipe__b">{s.body}</span>
            </button>
          </li>
        ))}
      </ol>

      <p className="pipe__open">
        <span>Layer 0{active + 1} is read from a real project.</span>
        <Link href="/work/retail-demand-intelligence">Open the Retail case study <span aria-hidden="true">→</span></Link>
      </p>
    </div>
  );
}
