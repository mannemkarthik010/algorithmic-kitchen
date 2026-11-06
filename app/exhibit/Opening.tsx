"use client";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import { retail } from "../components/case/retail-data";
import MagneticSlideButton from "../components/MagneticSlideButton";

export const EXHIBITS = [
  { slug: "taxproof", n: "01", name: "TaxProof", kind: "Evidence dossier" },
  { slug: "retail", n: "02", name: "Retail Intelligence", kind: "Forecasting instrument" },
  { slug: "preventive", n: "03", name: "Preventive Care", kind: "Agent theatre" },
] as const;

export const openExhibit = (i: number) => {
  window.dispatchEvent(new CustomEvent("ex:open", { detail: i }));
  document.getElementById("work")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
};

/* ───────── Artifact 01: TaxProof, four sheets with one evidence path through them ───────── */
function ArtTax({ draw }: { draw: boolean }) {
  const sheets = [
    { t: "Source", c: "packet · page 3", rows: [90, 62, 78, 40] },
    { t: "Extracted", c: "value as read", rows: [70, 88, 50, 64] },
    { t: "Rule", c: "form line logic", rows: [84, 46, 72, 58] },
    { t: "Result", c: "return line", rows: [56, 80, 38, 66] },
  ];
  return (
    <div className="art-tax" aria-hidden="true">
      {sheets.map((s, i) => (
        <div key={s.t} className="art-tax__sheet" style={{ transform: `translate(${i * 34}px, ${i * -30}px) rotate(${-4 + i * 2.6}deg)`, zIndex: i }}>
          <span className="art-tax__h">{String(i + 1).padStart(2, "0")} · {s.t}</span>
          {s.rows.map((w, k) => (<i key={k} style={{ width: `${w}%` }} />))}
          <em>{s.c}</em>
        </div>
      ))}
      <svg viewBox="0 0 330 330" className="art-tax__path">
        <motion.path
          d="M 38 270 C 80 236, 96 246, 128 226 S 196 168, 232 140 S 290 70, 318 46"
          fill="none" stroke="#F45132" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="1 0"
          initial={{ pathLength: 0 }} animate={{ pathLength: draw ? 1 : 0 }} transition={{ duration: 1.5, delay: 1.1, ease: [0.65, 0, 0.35, 1] }}
        />
        {[[38, 270], [128, 226], [232, 140], [318, 46]].map(([x, y], i) => (
          <motion.circle key={i} cx={x} cy={y} r="7" fill="#EDEBE4" stroke="#F45132" strokeWidth="3"
            initial={{ scale: 0 }} animate={{ scale: draw ? 1 : 0 }} transition={{ delay: 1.1 + i * 0.38, type: "spring", stiffness: 260, damping: 16 }} style={{ transformOrigin: `${x}px ${y}px` }} />
        ))}
      </svg>
    </div>
  );
}

/* ───────── Artifact 02: Retail, a forecast line from the repository's own series ───────── */
function ArtRetail({ draw }: { draw: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const g = useMemo(() => {
    const s = retail.series[0];
    const hist = s.history.slice(-30).map((p) => p.v);
    const fc = s.forecast;
    const all = [...hist, ...fc.map((f) => f.v), ...fc.map((f) => f.lo), ...fc.map((f) => f.hi)];
    const min = Math.min(...all), max = Math.max(...all);
    const W = 440, H = 190, n = hist.length + fc.length;
    const x = (i: number) => 12 + (i / (n - 1)) * (W - 24);
    const y = (v: number) => H - 14 - ((v - min) / (max - min)) * (H - 32);
    const line = (vals: number[], off: number) => vals.map((v, i) => `${i ? "L" : "M"}${x(i + off).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
    const hl = hist.length - 1;
    const actual = line(hist, 0);
    const fcPath = `M${x(hl).toFixed(1)} ${y(hist[hl]).toFixed(1)} ` + fc.map((f, i) => `L${x(hl + 1 + i).toFixed(1)} ${y(f.v).toFixed(1)}`).join(" ");
    const band = fc.map((f, i) => `${i ? "L" : "M"}${x(hl + 1 + i).toFixed(1)} ${y(f.hi).toFixed(1)}`).join(" ") + " " + [...fc].reverse().map((f, i) => `L${x(hl + fc.length - i).toFixed(1)} ${y(f.lo).toFixed(1)}`).join(" ") + " Z";
    const pts = fc.map((f, i) => ({ x: x(hl + 1 + i), y: y(f.v), v: f.v, d: f.d }));
    return { actual, fcPath, band, pts, W, H, id: s.id, split: x(hl) };
  }, []);
  const p = hover === null ? g.pts[g.pts.length - 1] : g.pts[hover];
  return (
    <div className="art-retail" aria-hidden="true">
      <div className="art-retail__top"><span>Forecast · 8 weeks</span><span>80% band · synthetic data</span></div>
      <svg viewBox={`0 0 ${g.W} ${g.H}`} onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width) * g.W;
        let best = 0, bd = 1e9; g.pts.forEach((q, i) => { const d = Math.abs(q.x - px); if (d < bd) { bd = d; best = i; } });
        setHover(best);
      }} onPointerLeave={() => setHover(null)}>
        {[0.2, 0.4, 0.6, 0.8].map((f) => (<line key={f} x1="0" x2={g.W} y1={g.H * f} y2={g.H * f} stroke="#EDEBE4" strokeOpacity=".08" />))}
        <line x1={g.split} x2={g.split} y1="6" y2={g.H - 6} stroke="#EDEBE4" strokeOpacity=".25" strokeDasharray="2 4" />
        <motion.path d={g.band} fill="#4169E1" fillOpacity=".28" initial={{ opacity: 0 }} animate={{ opacity: draw ? 1 : 0 }} transition={{ delay: 1.9, duration: 0.8 }} />
        <motion.path d={g.actual} fill="none" stroke="#EDEBE4" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: draw ? 1 : 0 }} transition={{ delay: 0.9, duration: 1.4, ease: [0.65, 0, 0.35, 1] }} />
        <motion.path d={g.fcPath} fill="none" stroke="#7C98F2" strokeWidth="2.6" strokeDasharray="5 5" initial={{ pathLength: 0 }} animate={{ pathLength: draw ? 1 : 0 }} transition={{ delay: 2.2, duration: 0.9, ease: "easeOut" }} />
        <motion.circle r="6" fill="#F45132" initial={false} animate={{ cx: p.x, cy: p.y, opacity: draw ? 1 : 0 }} transition={{ type: "spring", stiffness: 160, damping: 20, opacity: { delay: 2.8 } }} />
      </svg>
      <div className="art-retail__foot"><span>{g.id}</span><span>{p.d} · {Math.round(p.v).toLocaleString()}</span></div>
    </div>
  );
}

/* ───────── Artifact 03: Preventive Care, five stages and the one real loop ───────── */
function ArtPrev({ draw }: { draw: boolean }) {
  const st = ["Risk", "Retrieve", "Draft", "Critique", "Route"];
  const xs = [34, 108, 182, 256, 330];
  return (
    <div className="art-prev" aria-hidden="true">
      <svg viewBox="0 0 364 210">
        <motion.path d="M34 120 H330" stroke="#EDEBE4" strokeOpacity=".5" strokeWidth="2" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: draw ? 1 : 0 }} transition={{ delay: 1.3, duration: 1.1, ease: [0.65, 0, 0.35, 1] }} />
        <motion.path d="M330 100 C 330 28, 182 28, 182 100" stroke="#F45132" strokeWidth="2.6" strokeDasharray="6 5" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: draw ? 1 : 0 }} transition={{ delay: 2.3, duration: 0.9, ease: "easeOut" }} />
        <text x="256" y="46" textAnchor="middle" fill="#F45132" fontSize="10" fontFamily="var(--f-mono)" letterSpacing="1.5">REVISE ≤ 2</text>
        {st.map((s, i) => (
          <motion.g key={s} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: draw ? 1 : 0, scale: draw ? 1 : 0.6 }} transition={{ delay: 1.1 + i * 0.16, type: "spring", stiffness: 220, damping: 18 }} style={{ transformOrigin: `${xs[i]}px 120px` }}>
            <rect x={xs[i] - 17} y="103" width="34" height="34" rx="3" transform={`rotate(45 ${xs[i]} 120)`} fill={i === 3 ? "#4169E1" : i === 4 ? "#F45132" : "#121212"} stroke="#EDEBE4" strokeOpacity={i < 3 ? 0.7 : 0} strokeWidth="1.5" />
            <text x={xs[i]} y="124" textAnchor="middle" fill="#EDEBE4" fontSize="13" fontWeight="700" fontFamily="var(--f-body)">{i + 1}</text>
            <text x={xs[i]} y="170" textAnchor="middle" fill="#A3A29E" fontSize="9.5" fontFamily="var(--f-mono)" letterSpacing="1.2">{s.toUpperCase()}</text>
          </motion.g>
        ))}
      </svg>
      <p>Prototype · sequential, not parallel</p>
    </div>
  );
}

const subscribeCoarse = (cb: () => void) => { const m = window.matchMedia("(pointer: coarse)"); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); };
const useCoarse = () => useSyncExternalStore(subscribeCoarse, () => window.matchMedia("(pointer: coarse)").matches, () => false);

/* ───────── one exhibit in the installation ───────── */
function Artifact({ i, rot, className, children, label, ready }: { i: number; rot: number; className: string; children: React.ReactNode; label: string; ready: boolean }) {
  const rm = useReducedMotion();
  const coarse = useCoarse();
  const moved = useRef(false);
  const e = EXHIBITS[i];
  return (
    <motion.button
      type="button"
      className={`ex-art ${className}`}
      aria-label={`${e.n} ${e.name}: open the ${e.kind.toLowerCase()}`}
      initial={rm ? false : { opacity: 0, y: 90, rotate: rot + 10, scale: 0.88 }}
      animate={ready ? { opacity: 1, y: 0, rotate: rot, scale: 1 } : {}}
      transition={{ type: "spring", stiffness: 62, damping: 15, delay: rm ? 0 : 0.3 + i * 0.24 }}
      whileHover={rm ? undefined : { scale: 1.035, zIndex: 6 }}
      drag={!rm && !coarse}
      dragConstraints={{ left: -46, right: 46, top: -34, bottom: 34 }}
      dragElastic={0.28}
      dragSnapToOrigin
      dragTransition={{ bounceStiffness: 220, bounceDamping: 16 }}
      onDragStart={() => { moved.current = true; }}
      onDragEnd={() => setTimeout(() => { moved.current = false; }, 60)}
      onClick={() => { if (!moved.current) openExhibit(i); }}
    >
      {children}
      <span className="ex-art__cap"><b>{e.n}</b> {e.name}<small>{label} →</small></span>
    </motion.button>
  );
}

export default function Opening() {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = requestAnimationFrame(() => setReady(true)); return () => cancelAnimationFrame(t); }, []);
  return (
    <section className="ex-open" id="top" aria-label="Introduction">
      <div className="ex-open__copy">
        <p className="ex-mono ex-open__eyebrow">(00) &nbsp;Systems in motion · an exhibition of intelligent software</p>
        <p className="ex-open__lede">AI engineer. I build systems you can <em>inspect, test, and trust</em>, and I show the evidence.</p>
        <div className="ex-open__cta">
          <MagneticSlideButton href="#work" text="Enter the exhibition" hoverText="Start with 01" />
          <a className="ex-link" href="/Karthik_Mannem_Resume.pdf" target="_blank" rel="noopener noreferrer">Résumé ↗</a>
        </div>
        <ol className="ex-open__index" aria-label="Exhibits">
          {EXHIBITS.map((e, i) => (
            <li key={e.slug}><a href="#work" onClick={() => openExhibit(i)}><span>{e.n}</span>{e.name}</a></li>
          ))}
        </ol>
      </div>

      <div className="ex-install">
        <Artifact i={0} rot={-6} className="ex-art--tax" label="Open the dossier" ready={ready}><ArtTax draw={ready} /></Artifact>
        <Artifact i={1} rot={2.5} className="ex-art--retail" label="Open the instrument" ready={ready}><ArtRetail draw={ready} /></Artifact>
        <Artifact i={2} rot={-2} className="ex-art--prev" label="Open the theatre" ready={ready}><ArtPrev draw={ready} /></Artifact>
        <p className="ex-install__hint ex-mono" aria-hidden="true">Drag · hover · click</p>
      </div>

      <h1 className="ex-name"><span>Karthik</span><span>Mannem</span></h1>
    </section>
  );
}
