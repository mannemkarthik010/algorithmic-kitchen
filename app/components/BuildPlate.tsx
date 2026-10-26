"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { resume } from "../data/resume";
import { StatusChip } from "./StatusChip";
import { openProject } from "../lib/events";

type Base = "llm" | "ml" | "vision" | "product";
type Serve = "live" | "code" | "any";

const BASES: { id: Base; label: string; emoji: string }[] = [
  { id: "llm", label: "LLM agents & RAG", emoji: "🧠" },
  { id: "ml", label: "Forecasting & classic ML", emoji: "📈" },
  { id: "vision", label: "Vision & deep learning", emoji: "👁️" },
  { id: "product", label: "Full-stack product", emoji: "🧩" },
];
const SERVES: { id: Serve; label: string; emoji: string }[] = [
  { id: "live", label: "Live — let me click it", emoji: "🔥" },
  { id: "code", label: "Source — let me read it", emoji: "📖" },
  { id: "any", label: "Surprise me", emoji: "🎲" },
];

const TAGS: Record<string, Base[]> = {
  "woodlands-ims": ["llm", "product"],
  "taxproof": ["llm", "product"],
  "retail-intel": ["ml", "llm"],
  "preventive-care": ["llm"],
  "splitwise-pro": ["product"],
  "fake-currency": ["vision"],
  "netflix-recommender": ["ml"],
  "bert-length": ["ml"],
};

/** "Build your own plate": pick a base and how you'd like it served, get matching projects. */
export default function BuildPlate() {
  const [base, setBase] = useState<Base | null>(null);
  const [serve, setServe] = useState<Serve | null>(null);

  const { matches, relaxed } = useMemo(() => {
    if (!base) return { matches: [], relaxed: false };
    const byBase = resume.projects.filter((p) => TAGS[p.slug]?.includes(base));
    const fits = (p: (typeof byBase)[number]) =>
      serve === "live" ? !!p.demo : serve === "code" ? !!p.github : true;
    const strict = byBase.filter(fits);
    return strict.length ? { matches: strict, relaxed: false } : { matches: byBase, relaxed: true };
  }, [base, serve]);

  const ready = base && serve;

  return (
    <div className="plate">
      <div className="plate__head">
        <span className="sticker sticker--orange" style={{ transform: "rotate(3deg)" }}>BUILD YOUR PLATE</span>
        <p>Pick a base, pick how you want it served — I&apos;ll plate the projects that fit.</p>
      </div>

      <p className="plate__step">1 · The base</p>
      <div className="plate__opts" role="radiogroup" aria-label="Base">
        {BASES.map((b) => (
          <button key={b.id} type="button" role="radio" aria-checked={base === b.id}
            className={`plate__opt${base === b.id ? " is-on" : ""}`} onClick={() => setBase(b.id)}>
            <span aria-hidden="true">{b.emoji}</span> {b.label}
          </button>
        ))}
      </div>

      <p className="plate__step">2 · Served</p>
      <div className="plate__opts" role="radiogroup" aria-label="How to serve">
        {SERVES.map((s) => (
          <button key={s.id} type="button" role="radio" aria-checked={serve === s.id}
            className={`plate__opt${serve === s.id ? " is-on" : ""}`} onClick={() => setServe(s.id)}>
            <span aria-hidden="true">{s.emoji}</span> {s.label}
          </button>
        ))}
      </div>

      <div className="plate__result" aria-live="polite">
        <AnimatePresence mode="wait">
          {!ready ? (
            <motion.p key="empty" className="plate__empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              Your plate is empty. Choose a base and a serving style ↑
            </motion.p>
          ) : (
            <motion.div key={`${base}-${serve}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {relaxed && <p className="plate__note">Nothing on the menu matches that serving style exactly — here&apos;s the closest plate.</p>}
              <div className="plate__cards">
                {matches.map((p) => (
                  <button key={p.slug} type="button" className="plate__card" onClick={() => openProject(p.slug)}>
                    <span className="plate__card-top"><StatusChip status={p.status} size="sm" /><em>{p.category}</em></span>
                    <strong>{p.title.split(" — ")[0]}</strong>
                    <span>{p.finalTaste}</span>
                    <b>Read the recipe →</b>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
