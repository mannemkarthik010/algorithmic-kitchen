"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { resume } from "../data/resume";
import { contributions } from "../data/contributions";
import { useGithubPulse } from "../hooks/useGithubPulse";
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

/** "By the numbers" strip — static facts from the data files + a live GitHub heat strip. */
export default function KitchenStats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const pulse = useGithubPulse();

  const merged = contributions.filter((c) => c.prStatus === "merged").length;
  const open = contributions.filter((c) => c.prStatus === "open").length;
  const closed = contributions.filter((c) => c.prStatus === "closed").length;
  const stats = [
    { n: resume.projects.length, label: "projects built", sub: `${resume.projects.filter((p) => p.demo).length} with live demos` },
    { n: 3.92, d: 2, label: "M.S. GPA", sub: "CSUN · graduated May 2026" },
    { n: contributions.length, label: "open-source PRs", sub: `${merged} merged · ${open} open · ${closed} closed` },
    ...(pulse ? [{ n: pulse.repos, label: "public repos", sub: "live from GitHub" }] : []),
  ];
  const max = Math.max(1, ...(pulse?.days ?? [1]));

  return (
    <section aria-label="By the numbers" style={{ padding: "var(--space-5) 0 var(--space-4)" }}>
      <div className="container" ref={ref}>
        <p className="mono c-gold" style={{ textAlign: "center", letterSpacing: "0.24em", fontSize: 11, marginBottom: "var(--space-3)" }}>
          ✦ &nbsp;AT A GLANCE&nbsp; ✦
        </p>
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

        {pulse && (
          <motion.div
            className="pulse"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="pulse__head">
              <span className="status-dot status-dot--pulse" style={{ background: "#6FCF7C" }} aria-hidden="true" />
              <span><b>{pulse.pushes}</b> pushes to GitHub in the last 30 days</span>
              <a href={resume.github} target="_blank" rel="noopener noreferrer">@mannemkarthik010 ↗</a>
            </div>
            <div className="pulse__bars" role="img" aria-label={`Daily GitHub pushes over the last 30 days, ${pulse.pushes} total`}>
              {pulse.days.map((d, i) => (
                <motion.span
                  key={i}
                  title={`${d} push${d === 1 ? "" : "es"}`}
                  initial={{ scaleY: 0 }}
                  animate={inView ? { scaleY: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.015, ease: EASE }}
                  style={{ height: d === 0 ? 4 : 8 + (d / max) * 36, opacity: d === 0 ? 0.25 : 0.45 + (d / max) * 0.55, transformOrigin: "bottom" }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
