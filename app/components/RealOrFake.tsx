"use client";
import { useState } from "react";
import { motion, useMotionValue, useTransform, useReducedMotion } from "framer-motion";

const CLAIMS: { text: string; real: boolean; why: string }[] = [
  { text: "TaxProof ships with 225 backend tests.", real: true, why: "Real — every figure in it traces back to evidence, and the tests keep that honest." },
  { text: "PyTorch PR #191439 was merged.", real: false, why: "Fake — it was closed as a duplicate. The site shows the real status of every PR, closed ones included." },
  { text: "Karthik has a merged pull request in pandera (#2437).", real: true, why: "Real — merged into the open-source data-validation library." },
  { text: "In Woodlands IMS, the AI edits stock balances directly.", real: false, why: "Fake — the AI only proposes. A person confirms, and balances come from an append-only ledger." },
  { text: "His M.S. in Computer Science at CSUN finished with a 3.92 GPA.", real: true, why: "Real — graduated May 2026." },
  { text: "He has 10+ years of professional ML experience.", real: false, why: "Fake — a fresh M.S. grad (May 2026) with Handshake AI analyst work and freelance ML projects before that." },
  { text: "The Preventive Care agent has a critic loop that checks its own recommendations.", real: true, why: "Real — LangGraph + Chroma RAG with a critic pass." },
  { text: "This portfolio blasts a beep the second you open it.", real: false, why: "Fake — it used to. Now the sound is a quiet ambient loop with a mute button." },
  { text: "Right now he's building an AI project for The Woodlands restaurants.", real: true, why: "Real — it's the dish currently On the Line." },
];

type Phase = "play" | "reveal" | "done";

/** Drag the card right for REAL, left for FAKE — or use the buttons / arrow keys. */
export default function RealOrFake() {
  const rm = useReducedMotion();
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<Phase>("play");
  const [last, setLast] = useState<{ ok: boolean; why: string } | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-14, 14]);
  const realOp = useTransform(x, [20, 120], [0, 1]);
  const fakeOp = useTransform(x, [-120, -20], [1, 0]);

  const claim = CLAIMS[i];

  const answer = (guessReal: boolean) => {
    if (phase !== "play") return;
    const ok = guessReal === claim.real;
    if (ok) setScore((s) => s + 1);
    setLast({ ok, why: claim.why });
    setPhase("reveal");
    x.set(0);
  };

  const next = () => {
    if (i + 1 >= CLAIMS.length) { setPhase("done"); return; }
    setI(i + 1); setLast(null); setPhase("play");
  };
  const restart = () => { setI(0); setScore(0); setLast(null); setPhase("play"); };

  return (
    <div
      className="rof"
      tabIndex={0}
      onKeyDown={(e) => {
        if (phase === "play") { if (e.key === "ArrowRight") answer(true); if (e.key === "ArrowLeft") answer(false); }
        else if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) { if (phase === "reveal") next(); else restart(); }
      }}
      aria-label="Real or Fake game. Use the left and right arrow keys or the buttons to answer."
    >
      <div className="rof__top">
        <span className="sticker sticker--gold" style={{ transform: "rotate(-4deg)" }}>REAL OR FAKE?!</span>
        <span className="rof__score">{phase === "done" ? CLAIMS.length : i + (phase === "reveal" ? 1 : 0)}/{CLAIMS.length} · <b>{score}</b> right</span>
      </div>

      {phase === "done" ? (
        <div className="rof__card rof__card--done">
          <p className="rof__big">{score}/{CLAIMS.length}</p>
          <p>{score === CLAIMS.length ? "Perfect plate — you read the menu closely." : score >= 6 ? "Solid. You know this kitchen." : "Tricky, right? Every answer is on the menu above."}</p>
          <button type="button" className="pill-cta" onClick={restart}>Play again ↻</button>
        </div>
      ) : (
        <div className="rof__stage">
          {/* the card behind */}
          {i + 1 < CLAIMS.length && <div className="rof__card rof__card--behind" aria-hidden="true" />}

          {phase === "play" ? (
            <motion.div
              key={i}
              className="rof__card"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.9}
              style={{ x, rotate: rm ? 0 : rotate }}
              onDragEnd={(_, info) => { if (Math.abs(info.offset.x) > 110) answer(info.offset.x > 0); }}
              initial={rm ? false : { scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              <motion.span className="rof__stamp rof__stamp--real" style={{ opacity: realOp }}>REAL</motion.span>
              <motion.span className="rof__stamp rof__stamp--fake" style={{ opacity: fakeOp }}>FAKE</motion.span>
              <p className="rof__q">{claim.text}</p>
              <p className="rof__hint">drag ← FAKE · REAL →</p>
            </motion.div>
          ) : (
            <div className={`rof__card rof__reveal ${last?.ok ? "is-ok" : "is-bad"}`} role="status">
              <p className="rof__verdict">{last?.ok ? "YEP, YOU GOT IT!" : "NOPE — TRICKY ONE!"}</p>
              <p className="rof__q rof__q--small">{claim.text}</p>
              <p className="rof__why">{last?.why}</p>
              <button type="button" className="pill-cta" onClick={next}>{i + 1 >= CLAIMS.length ? "See my score" : "Next one →"}</button>
            </div>
          )}
        </div>
      )}

      {phase === "play" && (
        <div className="rof__btns">
          <button type="button" className="rof__btn rof__btn--fake" onClick={() => answer(false)}>✕ FAKE</button>
          <button type="button" className="rof__btn rof__btn--real" onClick={() => answer(true)}>REAL ✓</button>
        </div>
      )}
    </div>
  );
}
