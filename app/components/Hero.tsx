"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { resume } from "../data/resume";
import { AKMark, Btn } from "./ui";
import { useSoundFx } from "../hooks/useSoundFx";
import { EASE, DUR } from "../lib/motion";

/* ─── Typewriter ─────────────────────────── */
function Typewriter({ text, speed = 30, startDelay = 0 }: { text: string; speed?: number; startDelay?: number }) {
  const [out, setOut]   = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setOut(text.slice(0, i));
        if (i >= text.length) { setDone(true); clearInterval(iv); }
      }, speed);
      return () => clearInterval(iv);
    }, startDelay);
    return () => clearTimeout(t);
  }, [text, speed, startDelay]);
  return (
    <>{out}{!done && <motion.span animate={{ opacity: [1,0,1] }} transition={{ duration: 0.75, repeat: Infinity }} style={{ color: "var(--gold)" }}>|</motion.span>}</>
  );
}

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
        ctx.fillStyle = `rgba(200,145,58,${p.a})`; ctx.fill();
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
            background: `radial-gradient(ellipse 75% 100% at 50% 100%, rgba(200,145,58,${0.03+i*0.01}), transparent 70%)`,
            filter: "blur(18px)" }}
          animate={rm ? {} : { x: ["-2%","2%","-2%"] }}
          transition={{ duration: 14 + i*5, repeat: Infinity, ease: "easeInOut", delay: i*3 }}
        />
      ))}
    </div>
  );
}

/* ─── Kitchen counter SVG ────────────────── */
function Counter() {
  return (
    <svg aria-hidden="true" viewBox="0 0 1440 200"
      style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: 200, pointerEvents: "none" }}
      preserveAspectRatio="none">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1B1309"/><stop offset="100%" stopColor="#0C0805"/>
        </linearGradient>
        <linearGradient id="eg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="transparent"/>
          <stop offset="22%" stopColor="rgba(200,145,58,0.32)"/>
          <stop offset="50%" stopColor="rgba(200,145,58,0.58)"/>
          <stop offset="78%" stopColor="rgba(200,145,58,0.32)"/>
          <stop offset="100%" stopColor="transparent"/>
        </linearGradient>
        <radialGradient id="pg" cx="50%" cy="100%" r="50%">
          <stop offset="0%" stopColor="rgba(200,145,58,0.09)"/>
          <stop offset="100%" stopColor="transparent"/>
        </radialGradient>
      </defs>
      <ellipse cx="720" cy="170" rx="700" ry="58" fill="url(#pg)"/>
      <rect x="0" y="140" width="1440" height="60" fill="url(#cg)"/>
      <rect x="0" y="138" width="1440" height="2" fill="url(#eg)"/>
      <rect x="82" y="88" width="84" height="52" rx="6" fill="#100C05"/>
      <ellipse cx="124" cy="88" rx="42" ry="9" fill="#1B1309"/>
      <ellipse cx="124" cy="140" rx="42" ry="9" fill="#090604"/>
      <rect x="80" y="84" width="88" height="4" rx="2" fill="rgba(200,145,58,0.18)"/>
      <rect x="294" y="112" width="58" height="10" rx="2" fill="#1B1309"/>
      <rect x="296" y="102" width="52" height="10" rx="2" fill="#140F07"/>
      <rect x="290" y="90" width="60" height="2" rx="1" fill="rgba(200,145,58,0.22)"/>
      <rect x="700" y="100" width="40" height="40" rx="6" fill="#100C05"/>
      <ellipse cx="720" cy="100" rx="20" ry="6" fill="#1B1309"/>
      <rect x="698" y="96" width="44" height="4" rx="2" fill="rgba(200,145,58,0.26)"/>
      <rect x="452" y="106" width="13" height="34" rx="2" fill="#1C1410"/>
      <ellipse cx="458" cy="101" rx="3" ry="5.5" fill="rgba(225,172,82,0.68)"/>
      <ellipse cx="458" cy="100" rx="1.6" ry="3.2" fill="rgba(255,218,100,0.88)"/>
      <rect x="1292" y="110" width="13" height="30" rx="2" fill="#1C1410"/>
      <ellipse cx="1298" cy="105" rx="3" ry="5.5" fill="rgba(225,172,82,0.62)"/>
      <ellipse cx="1298" cy="104" rx="1.6" ry="3.2" fill="rgba(255,218,100,0.82)"/>
    </svg>
  );
}

/* ─── Floating cookbook artifact ─────────── */
function CookbookArtifact({ visible }: { visible: boolean }) {
  const rm = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const chips = ["LangChain","PyTorch","RAG","OpenAI","FAISS"];
  const chipPositions = [
    { top: "6%",  left: "-16%", delay: 0.6 },
    { top: "28%", left: "104%", delay: 0.8 },
    { top: "62%", left: "100%", delay: 1.0 },
    { top: "78%", left: "-14%", delay: 0.7 },
    { top: "46%", left: "-18%", delay: 0.9 },
  ];

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (rm || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * -12, y: dx * 14 });
  }, [rm]);

  const handleMouseLeave = useCallback(() => setTilt({ x: 0, y: 0 }), []);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, x: 40 }}
      animate={visible ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
      transition={{ duration: DUR.slow, ease: EASE, delay: 0.6 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ position: "relative", width: "100%", maxWidth: 340, margin: "0 auto", perspective: 900 }}
    >
      {/* Ambient glow */}
      <motion.div
        animate={rm ? {} : { opacity: [0.4, 0.75, 0.4], scale: [1, 1.08, 1] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", inset: -50, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,145,58,0.14), transparent 68%)", filter: "blur(28px)", pointerEvents: "none" }}
      />

      {/* 3D Book wrapper */}
      <motion.div
        animate={rm ? {} : {
          rotateY: tilt.y !== 0 ? tilt.y : [-4, 4, -4],
          rotateX: tilt.x !== 0 ? tilt.x : [1, -1, 1],
          rotateZ: [-0.6, 0.6, -0.6],
          y: [0, -8, 0],
        }}
        transition={tilt.x !== 0 || tilt.y !== 0
          ? { type: "spring", stiffness: 180, damping: 22 }
          : { duration: 6, repeat: Infinity, ease: "easeInOut" }
        }
        style={{ transformStyle: "preserve-3d", position: "relative", transformOrigin: "center center" }}
      >
        {/* Floor shadow */}
        <motion.div
          animate={rm ? {} : { scaleX: [1, 1.06, 1], opacity: [0.55, 0.35, 0.55] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", bottom: -28, left: "50%", transform: "translateX(-50%)", width: "88%", height: 22, background: "radial-gradient(ellipse, rgba(0,0,0,0.65), transparent 72%)", filter: "blur(10px)", pointerEvents: "none" }}
        />

        {/* SPINE — 3D left face */}
        <div style={{
          position: "absolute", top: "2%", left: 0, bottom: "2%", width: 22,
          background: "linear-gradient(90deg, #090604, #1A1008, #0C0805)",
          transform: "translateX(-20px) rotateY(-90deg)",
          transformOrigin: "right center",
          borderRadius: "4px 0 0 4px",
          boxShadow: "inset -3px 0 8px rgba(0,0,0,0.6)",
        }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontFamily: "var(--f-mono)", fontSize: 8, color: "rgba(200,145,58,0.55)", letterSpacing: "0.2em", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>AK · 2026</p>
          </div>
        </div>

        {/* PAGE BLOCK — 3D right edge */}
        <div style={{
          position: "absolute", top: "3%", right: -6, bottom: "3%", width: 10,
          background: "repeating-linear-gradient(to bottom, rgba(240,228,200,0.18) 0px, rgba(240,228,200,0.18) 1px, rgba(200,180,140,0.06) 1px, rgba(200,180,140,0.06) 4px)",
          transform: "rotateY(90deg)",
          transformOrigin: "left center",
          borderRadius: "0 2px 2px 0",
        }} />

        {/* FRONT COVER */}
        <div style={{
          width: "100%", aspectRatio: "3/4",
          background: "linear-gradient(148deg, #1E1509 0%, #0E0906 55%, #080503 100%)",
          borderRadius: "4px 14px 14px 4px",
          boxShadow: "18px 22px 60px rgba(0,0,0,0.82), -2px 0 6px rgba(0,0,0,0.5), inset 20px 0 0 rgba(0,0,0,0.4), inset 0 0 40px rgba(200,145,58,0.04)",
          border: "1px solid rgba(200,145,58,0.5)",
          position: "relative", overflow: "hidden",
          transformStyle: "preserve-3d",
        }}>
          {/* Light catch — specular highlight */}
          <div style={{ position: "absolute", top: 0, left: 0, width: "55%", height: "45%", background: "radial-gradient(ellipse at 25% 20%, rgba(255,240,200,0.05), transparent 65%)", pointerEvents: "none" }} />

          {/* Embossed border frames */}
          <div style={{ position: "absolute", inset: 10, border: "1px solid rgba(200,145,58,0.22)", borderRadius: 8, pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 13, border: "1px solid rgba(200,145,58,0.1)", borderRadius: 6, pointerEvents: "none" }} />

          {/* Gold rules */}
          <div style={{ position: "absolute", top: "13%", left: "9%", right: "9%", height: 1, background: "linear-gradient(90deg, transparent, rgba(200,145,58,0.6), transparent)" }} />
          <div style={{ position: "absolute", bottom: "15%", left: "9%", right: "9%", height: 1, background: "linear-gradient(90deg, transparent, rgba(200,145,58,0.35), transparent)" }} />

          {/* Cover text */}
          <div style={{ position: "absolute", inset: 0, padding: "18% 12% 20%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 6 }}>
            <p style={{ fontFamily: "var(--f-mono)", fontSize: "clamp(7px,1.1vw,9px)", color: "rgba(200,145,58,0.55)", letterSpacing: "0.22em" }}>THE</p>
            <p style={{ fontFamily: "var(--f-display)", fontSize: "clamp(15px,2.4vw,22px)", color: "var(--cream)", lineHeight: 1.1, textAlign: "center", fontWeight: 600, textShadow: "0 2px 12px rgba(200,145,58,0.2)" }}>ALGORITHMIC</p>
            <p style={{ fontFamily: "var(--f-display)", fontSize: "clamp(15px,2.4vw,22px)", color: "var(--cream)", lineHeight: 1.1, textAlign: "center", fontWeight: 600, textShadow: "0 2px 12px rgba(200,145,58,0.2)" }}>KITCHEN</p>
            <div style={{ width: 32, height: 1, background: "rgba(200,145,58,0.35)", margin: "4px 0" }} />
            <p style={{ fontFamily: "var(--f-mono)", fontSize: "clamp(6px,0.9vw,8px)", color: "rgba(200,145,58,0.4)", letterSpacing: "0.14em", textAlign: "center" }}>Intelligence · Craft · Systems</p>
            <motion.div
              animate={rm ? {} : { boxShadow: ["0 0 8px rgba(200,145,58,0.2)", "0 0 18px rgba(200,145,58,0.45)", "0 0 8px rgba(200,145,58,0.2)"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{ marginTop: 14, width: 52, height: 52, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,145,58,0.1), rgba(200,145,58,0.03))", border: "1.5px solid rgba(200,145,58,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <AKMark size="sm" />
            </motion.div>
            <p style={{ fontFamily: "var(--f-mono)", fontSize: "clamp(5px,0.8vw,7px)", color: "rgba(200,145,58,0.28)", letterSpacing: "0.18em", marginTop: 8 }}>KARTHIK MANNEM · 2026</p>
          </div>

          {/* Spine-edge inner shadow */}
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "14%", background: "linear-gradient(90deg, rgba(0,0,0,0.6), transparent)", pointerEvents: "none" }} />
        </div>
      </motion.div>

      {/* Floating tech chips */}
      {chips.map((chip, i) => (
        <motion.div
          key={chip}
          initial={{ opacity: 0, scale: 0.65, y: 10 }}
          animate={visible ? { opacity: 1, scale: 1, y: rm ? 0 : [0, -(4 + i * 1.5), 0] } : { opacity: 0 }}
          transition={{
            delay: chipPositions[i].delay, duration: DUR.moderate, ease: EASE,
            y: { duration: 2.8 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }
          }}
          style={{
            position: "absolute",
            top: chipPositions[i].top, left: chipPositions[i].left,
            padding: "5px 13px", borderRadius: 22,
            background: "rgba(8,5,2,0.92)",
            border: "1px solid rgba(200,145,58,0.45)",
            fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--gold)",
            whiteSpace: "nowrap", backdropFilter: "blur(12px)",
            boxShadow: "0 6px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,145,58,0.08)",
          }}
        >
          {chip}
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ─── Curtain ────────────────────────────── */
function Curtain() {
  return (
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 120, pointerEvents: "none" }}>
      <motion.div initial={{ x: 0 }} animate={{ x: "-100%" }} transition={{ duration: 1.45, ease: EASE }}
        style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "50%", background: "linear-gradient(180deg, #1b1208, #070402)", boxShadow: "inset -24px 0 50px rgba(255,210,130,0.08)" }} />
      <motion.div initial={{ x: 0 }} animate={{ x: "100%" }} transition={{ duration: 1.45, ease: EASE }}
        style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: "50%", background: "linear-gradient(180deg, #1b1208, #070402)", boxShadow: "inset 24px 0 50px rgba(255,210,130,0.08)" }} />
      <motion.div initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 1.2 }}
        style={{ position: "absolute", left: "50%", top: 0, height: "100%", width: 1, background: "linear-gradient(to bottom, transparent, rgba(255,220,160,0.55), transparent)" }} />
    </div>
  );
}

/* ─── Stage types ────────────────────────── */
type Stage = 0 | 1 | 2 | 3 | 3.5 | 4;

export default function Hero() {
  const [stage, setStage]       = useState<Stage>(0);
  const [showCurtain, setShowCurtain] = useState(false);
  const { play, loop }          = useSoundFx();

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 380);
    const t2 = setTimeout(() => setStage(2), 1700);
    const t3 = setTimeout(() => setStage(3), 3100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleOpen = useCallback(() => {
    play("/sounds/success.mp3", 0.45);
    play("/sounds/click.mp3", 0.25);
    loop("/sounds/ambient-kitchen.mp3", 0.06);
    setStage(3.5);
    setTimeout(() => { setShowCurtain(true); setStage(4); }, 600);
  }, [play, loop]);

  const open = stage >= 4;

  return (
    <section id="hero"
      style={{ minHeight: "calc(100svh + 120px)", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "120px 0 160px", position: "relative", overflow: "hidden" }}
    >
      <Particles active={open} />

      {/* Depth atmosphere */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 120% 65% at 50% 110%, rgba(200,145,58,0.09) 0%, transparent 55%)", pointerEvents: "none", zIndex: 0, opacity: open ? 1 : 0, transition: "opacity 1.2s ease" }} />
      <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: "30%", background: "linear-gradient(to bottom,rgba(6,4,2,0.55),transparent)", pointerEvents: "none", zIndex: 0 }} />

      {/* Environment */}
      <motion.div initial={false} animate={{ opacity: open ? 1 : 0 }} transition={{ duration: 1.3 }}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <Counter />
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
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 55% 55% at 50% 50%, transparent 0%, rgba(6,4,2,0.82) 100%)", pointerEvents: "none" }} />

            <AnimatePresence>
              {stage >= 1 && (
                <motion.div key="ak" initial={{ opacity: 0, scale: 0.45, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.85, ease: EASE }} style={{ position: "relative", zIndex: 1 }}>
                  <motion.div animate={{ scale: [1,1.15,1], opacity: [0.25,0.55,0.25] }} transition={{ duration: 3.2, repeat: Infinity }}
                    style={{ position: "absolute", inset: -18, borderRadius: 26, background: "radial-gradient(circle, rgba(200,145,58,0.2), transparent 70%)", filter: "blur(12px)" }} />
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
                  whileHover={{ scale: 1.04, boxShadow: "0 0 32px rgba(200,145,58,0.4)" }}
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
                {/* Label */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: DUR.moderate, ease: EASE }}
                  style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "var(--space-3)" }}>
                  <AKMark size="sm" />
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 32, height: 1, background: "var(--gold)", display: "block", opacity: 0.5 }} />
                    <span className="label c-gold" style={{ letterSpacing: "0.2em" }}>MICHELIN-GRADE AI ENGINEERING</span>
                  </div>
                </motion.div>

                {/* Stacked brand title */}
                <div style={{ marginBottom: "var(--space-3)", lineHeight: 1 }}>
                  {[
                    { word: "The", cls: "hero-word-the", delay: 0.58 },
                    { word: "Algorithmic", cls: "hero-word-algorithmic", delay: 0.70 },
                    { word: "Kitchen", cls: "hero-word-kitchen", delay: 0.82 },
                  ].map(({ word, cls, delay }) => (
                    <motion.div key={word}
                      initial={{ opacity: 0, x: -28 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay, duration: DUR.moderate, ease: EASE }}
                    >
                      <span className={cls}>{word}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Subtitle */}
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.96, duration: DUR.moderate }}
                  className="body-xl c-muted" style={{ fontStyle: "italic", maxWidth: 500, lineHeight: 1.7, marginBottom: "var(--space-3)" }}>
                  Cooking intelligent systems from raw data, creativity, and machine learning.
                </motion.p>

                {/* Mono tagline typewriter */}
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.5 }}
                  className="mono c-gold" style={{ maxWidth: 480, minHeight: 36, letterSpacing: "0.03em", lineHeight: 1.65, marginBottom: "var(--space-4)", fontSize: 12 }}>
                  <Typewriter text={`"${resume.tagline}"`} startDelay={1200} />
                </motion.p>

                {/* CTAs */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.22, duration: DUR.moderate, ease: EASE }}
                  style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                  <Btn href="#projects" variant="primary">View the Menu</Btn>
                  <Btn href="#contact" variant="secondary">Reserve a Table</Btn>
                  <Btn href={resume.github} variant="secondary" target="_blank" rel="noopener noreferrer">GitHub ↗</Btn>
                </motion.div>

                {/* Terminal hint */}
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.22 }} transition={{ delay: 3.5, duration: 1.5 }}
                  className="label c-muted" style={{ marginTop: "var(--space-3)" }}>
                  PRESS ⌃` FOR DEVELOPER MODE
                </motion.p>
              </div>

              {/* RIGHT — floating cookbook artifact */}
              <CookbookArtifact visible={open} />
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
