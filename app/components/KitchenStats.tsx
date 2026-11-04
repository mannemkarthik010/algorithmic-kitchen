"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { resume } from "../data/resume";
import { contributions } from "../data/contributions";
import { EASE } from "../lib/motion";

/** Renders the real value in the HTML (crawlers, link previews, no-JS) and animates up from 0 once on screen. */
function CountUp({ to, decimals = 0, run }: { to: number; decimals?: number; run: boolean }) {
  const rm = useReducedMotion();
  const [v, setV] = useState(to);

  useEffect(() => {
    if (!run || rm) return;
    const start = performance.now();
    const dur = 1300;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1);
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, to, rm]);

  return <>{v.toFixed(decimals)}</>;
}

/** Three proof points, straight from the data files. */
export default function KitchenStats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const merged = contributions.filter((c) => c.prStatus === "merged").length;
  const open = contributions.filter((c) => c.prStatus === "open").length;
  const closed = contributions.filter((c) => c.prStatus === "closed").length;
  const stats = [
    { n: resume.projects.length, label: "projects built", sub: `${resume.projects.filter((p) => p.demo).length} with live demos` },
    { n: 3.92, d: 2, label: "M.S. GPA", sub: "CSUN · graduated May 2026" },
    { n: contributions.length, label: "open-source PRs", sub: `${merged} merged · ${open} open · ${closed} closed` },
  ];

  return (
    <section aria-label="By the numbers" style={{ padding: "var(--space-5) 0 var(--space-4)" }}>
      <div className="container" ref={ref}>
        <p className="sh-label" style={{ marginBottom: "var(--space-3)" }}>At a glance</p>
        <div className="stats-grid">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="stat"
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
            >
              <span className="stat__n"><CountUp to={s.n} decimals={s.d ?? 0} run={inView} /></span>
              <span className="stat__label">{s.label}</span>
              <span className="stat__sub">{s.sub}</span>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
