"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { resume } from "../data/resume";
import { AKMark, Btn } from "./ui";
import { useSoundFx } from "../hooks/useSoundFx";
import { EASE, DUR } from "../lib/motion";
import { STATUS } from "../lib/status";
import HeroPipeline from "./HeroPipeline";

/* ─── Particle canvas ────────────────────── */
function Particles({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active) return;
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const pts = Array.from({ length: 44 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.12, vy: -(Math.random() * 0.18 + 0.04),
      r: Math.random() * 1.2 + 0.3, a: Math.random() * 0.14 + 0.03,
    }));
    let id: number;
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      pts.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.y < 0) { p.y = c.height; p.x = Math.random() * c.width; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,134,91,${p.a})`; ctx.fill();
      });
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", resize); };
  }, [active]);
  return <canvas ref={ref} aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }} />;
}

/* ─── Fog layer ──────────────────────────── */
function Fog() {
  const rm = useReducedMotion();
  return (
    <div aria-hidden="true" style={{ position: "absolute", bottom: 80, left: 0, right: 0, height: 200, pointerEvents: "none", overflow: "hidden", zIndex: 1 }}>
      {[0,1,2].map((i) => (
        <motion.div key={i}
          style={{ position: "absolute", bottom: 0, left: `${-8+i*4}%`, width: "120%", height: 50 + i * 38,
            background: `radial-gradient(ellipse 75% 100% at 50% 100%, rgba(255,134,91,${0.03+i*0.01}), transparent 70%)`,
            filter: "blur(18px)" }}
          animate={rm ? {} : { x: ["-2%","2%","-2%"] }}
          transition={{ duration: 14 + i*5, repeat: Infinity, ease: "easeInOut", delay: i*3 }}
        />
      ))}
    </div>
  );
}

/* ─── Curtain ────────────────────────────── */
function Curtain() {
  return (
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 120, pointerEvents: "none" }}>
      <motion.div initial={{ x: 0 }} animate={{ x: "-100%" }} transition={{ duration: 1.45, ease: EASE }}
        style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "50%", background: "linear-gradient(180deg, #161B20, #0A0D10)", boxShadow: "inset -24px 0 50px rgba(255,155,118,0.08)" }} />
      <motion.div initial={{ x: 0 }} animate={{ x: "100%" }} transition={{ duration: 1.45, ease: EASE }}
        style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: "50%", background: "linear-gradient(180deg, #161B20, #0A0D10)", boxShadow: "inset 24px 0 50px rgba(255,155,118,0.08)" }} />
      <motion.div initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 1.2 }}
        style={{ position: "absolute", left: "50%", top: 0, height: "100%", width: 1, background: "linear-gradient(to bottom, transparent, rgba(255,220,160,0.55), transparent)" }} />
    </div>
  );
}

/* ─── Stage types ────────────────────────── */
type Stage = 0 | 1 | 2 | 3 | 3.5 | 4;

export default function Hero() {
  const [stage, setStage]       = useState<Stage>(4);
  const [showCurtain, setShowCurtain] = useState(false);
  const { play, loop }          = useSoundFx();

  // The cinematic intro (gate + curtain) is still available at /?intro=1.
  // By default the page opens straight onto the hero so visitors see the work immediately.
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("intro")) return;
    queueMicrotask(() => setStage(0));
    const t1 = setTimeout(() => setStage(1), 380);
    const t2 = setTimeout(() => setStage(2), 1700);
    const t3 = setTimeout(() => setStage(3), 3100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleOpen = useCallback(() => {
    play("/sounds/click.mp3", 0.25);
    loop("/sounds/ambient-kitchen.mp3", 0.06);
    setStage(3.5);
    setTimeout(() => { setShowCurtain(true); setStage(4); }, 600);
  }, [play, loop]);

  const open = stage >= 4;

  return (
    <section id="hero"
      style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "110px 0 90px", position: "relative", overflow: "hidden" }}
    >
      <Particles active={open} />

      {/* Depth atmosphere */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 120% 65% at 50% 110%, rgba(255,134,91,0.09) 0%, transparent 55%)", pointerEvents: "none", zIndex: 0, opacity: open ? 1 : 0, transition: "opacity 1.2s ease" }} />
      <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: "30%", background: "linear-gradient(to bottom,rgba(10,13,16,0.55),transparent)", pointerEvents: "none", zIndex: 0 }} />

      {/* Environment */}
      <motion.div initial={false} animate={{ opacity: open ? 1 : 0 }} transition={{ duration: 1.3 }}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <Fog />
      </motion.div>

      {/* Curtain */}
      <AnimatePresence>{showCurtain && <Curtain key="curtain" />}</AnimatePresence>

      {/* ── GATE ── */}
      <AnimatePresence mode="wait">
        {stage < 3.5 && (
          <motion.div key="gate"
            exit={{ opacity: 0, filter: "blur(18px)", scale: 0.96 }}
            transition={{ duration: 0.55, ease: [0.4,0,0.2,1] }}
            style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 20, gap: "var(--space-2)" }}
          >
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 55% 55% at 50% 50%, transparent 0%, rgba(10,13,16,0.82) 100%)", pointerEvents: "none" }} />

            <AnimatePresence>
              {stage >= 1 && (
                <motion.div key="ak" initial={{ opacity: 0, scale: 0.45, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.85, ease: EASE }} style={{ position: "relative", zIndex: 1 }}>
                  <motion.div animate={{ scale: [1,1.15,1], opacity: [0.25,0.55,0.25] }} transition={{ duration: 3.2, repeat: Infinity }}
                    style={{ position: "absolute", inset: -18, borderRadius: 26, background: "radial-gradient(circle, rgba(255,134,91,0.2), transparent 70%)", filter: "blur(12px)" }} />
                  <AKMark size="lg" />
                </motion.div>
              )}
            </AnimatePresence>

            {stage >= 1 && (
              <motion.p key="brand" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, letterSpacing: "0.34em" }} transition={{ duration: 0.8, delay: 0.22, ease: EASE }}
                className="label c-gold" style={{ position: "relative", zIndex: 1 }}>
                The Algorithmic Kitchen
              </motion.p>
            )}

            {stage >= 2 && (
              <motion.div key="copy" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: EASE }}
                style={{ textAlign: "center", position: "relative", zIndex: 1, marginTop: "var(--space-1)" }}>
                <p className="heading-md c-muted" style={{ fontStyle: "italic", marginBottom: "0.4rem" }}>Welcome, Chef.</p>
                <p className="heading-xl c-cream" style={{ fontWeight: 300, marginBottom: "0.15rem" }}>Tonight&apos;s Special:</p>
                <p className="heading-xl t-grad" style={{ fontWeight: 600 }}>Artificial Intelligence.</p>
              </motion.div>
            )}

            {stage >= 3 && (
              <motion.div key="btn" initial={{ opacity: 0, y: 14, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: EASE }}
                style={{ marginTop: "var(--space-2)", position: "relative", zIndex: 1 }}>
                <motion.button onClick={handleOpen}
                  className="btn btn-primary anim-pulse"
                  style={{ padding: "14px 56px", fontSize: 13, letterSpacing: "0.2em", cursor: "pointer", borderRadius: 27 }}
                  whileHover={{ scale: 1.04, boxShadow: "0 0 32px rgba(255,134,91,0.4)" }}
                  whileTap={{ scale: 0.96 }}>
                  Open Kitchen
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO MAIN — two column cinematic layout ── */}
      <AnimatePresence>
        {stage >= 4 && (
          <motion.div key="main"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: DUR.cinematic, ease: EASE, delay: 0.4 }}
            style={{ position: "relative", zIndex: 5, width: "100%", maxWidth: 1200, padding: "0 var(--space-4)" }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: "var(--space-6)", alignItems: "center" }}>

              {/* LEFT — dramatic stacked title */}
              <div>
                {/* Brand eyebrow */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: DUR.moderate, ease: EASE }}
                  style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "var(--space-3)" }}>
                  <AKMark size="sm" />
                  <span className="label c-gold" style={{ letterSpacing: "0.2em" }}>PORTFOLIO 2026 · LOS ANGELES</span>
                </motion.div>

                {/* Name */}
                <h1 style={{ marginBottom: "var(--space-2)", lineHeight: 1, fontWeight: 400 }}>
                  <motion.span className="hero-word-algorithmic" style={{ display: "block" }}
                    initial={{ opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: DUR.moderate, ease: EASE }}>Karthik</motion.span>
                  <motion.span className="hero-word-kitchen" style={{ display: "block" }}
                    initial={{ opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.27, duration: DUR.moderate, ease: EASE }}>Mannem</motion.span>
                </h1>

                {/* Role + one-line specialisation */}
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: DUR.moderate }}
                  className="hero-role">Machine Learning &amp; AI Engineer</motion.p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: DUR.moderate }}
                  className="body-xl c-muted" style={{ maxWidth: 520, lineHeight: 1.6, marginBottom: "var(--space-3)" }}>
                  I build AI systems you can inspect, test, and trust. From real-world data to measurable, deployed intelligence.
                </motion.p>

                {/* Proof chips */}
                <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: DUR.moderate }}
                  className="hero-proof" aria-label="Highlights">
                  <li>M.S. Computer Science · CSUN · 3.92 GPA</li>
                  <li>Merged open-source PR · pandera</li>
                  <li>{resume.projects.filter((p) => p.demo).length} live demos</li>
                </motion.ul>

                {/* CTAs */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: DUR.moderate, ease: EASE }}
                  style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginBottom: "var(--space-3)" }}>
                  <Btn href="#projects" variant="primary">Selected work</Btn>
                  <Btn href="/Karthik_Mannem_Resume.pdf" variant="secondary" target="_blank" rel="noopener noreferrer">Résumé ↗</Btn>
                  <Btn href={resume.github} variant="secondary" target="_blank" rel="noopener noreferrer">GitHub ↗</Btn>
                </motion.div>

                {/* Availability */}
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85, duration: DUR.moderate }}
                  className="hero-now">
                  <span className="status-dot status-dot--pulse" style={{ background: STATUS.live.color }} aria-hidden="true" />
                  Open to full-time roles
                </motion.p>

                {/* Terminal hint */}
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.22 }} transition={{ delay: 3.5, duration: 1.5 }}
                  className="label c-muted hero-hint" style={{ marginTop: "var(--space-3)" }}>
                  PRESS ⌃` FOR DEVELOPER MODE
                </motion.p>
              </div>

              {/* RIGHT — floating cookbook artifact */}
              <HeroPipeline />
            </div>

            {/* Scroll indicator */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.28 }} transition={{ delay: 2.8, duration: 1 }}
              style={{ position: "absolute", bottom: "-4rem", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <span className="label c-muted">scroll</span>
              <motion.div animate={{ scaleY: [0,1,0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: 1, height: 36, background: "linear-gradient(to bottom,var(--gold),transparent)", transformOrigin: "top" }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
