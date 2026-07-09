"use client";
import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useSoundFx } from "../hooks/useSoundFx";

type Dataset  = "Healthcare" | "E-Commerce" | "Finance" | "Vision" | "NLP";
type ModelType = "RAG Pipeline" | "CNN" | "Transformer" | "Recommender" | "LSTM";
type Deploy   = "Docker + Flask" | "Vercel Edge" | "AWS Lambda";

interface Choice { dataset: Dataset | null; model: ModelType | null; deploy: Deploy | null }

const DATASETS: Dataset[]   = ["Healthcare", "E-Commerce", "Finance", "Vision", "NLP"];
const MODELS: ModelType[]   = ["RAG Pipeline", "CNN", "Transformer", "Recommender", "LSTM"];
const DEPLOYS: Deploy[]     = ["Docker + Flask", "Vercel Edge", "AWS Lambda"];

function getResult(c: Choice): { dish: string; desc: string; time: string } {
  if (c.model === "RAG Pipeline") return {
    dish: "Semantic Health Soup",
    desc: "Documents chunked, embedded, and retrieved. LLM seasons with context. Served hot with zero hallucinations.",
    time: "~2.5s per query",
  };
  if (c.model === "CNN") return {
    dish: "Deep-Fried Vision Platter",
    desc: "Image pixels through 5 convolutional layers, batch-normalized, dropout-seasoned. Crispy 97% accuracy.",
    time: "~48ms inference",
  };
  if (c.model === "Transformer") return {
    dish: "Attention Layer Cake",
    desc: "Multi-head attention stacked 12 layers deep. Positional encoding adds structure. Fine-tuned to perfection.",
    time: "~40min training",
  };
  if (c.model === "Recommender") return {
    dish: "Latent Factor Bento",
    desc: "SVD decomposes the user-item matrix into 50 latent flavours. Served with Precision@10 of 0.74.",
    time: "Batch inference",
  };
  if (c.model === "LSTM") return {
    dish: "Sequential Memory Pasta",
    desc: "Gates control what the network remembers and forgets. Temporal patterns cooked over 50 epochs.",
    time: "~25ms per sequence",
  };
  return {
    dish: "Experimental AI Fusion",
    desc: "An unusual combination. Experimental. Could be brilliant. Deploy and see.",
    time: "Unknown",
  };
}

/* ── Per-model cooking animations ─────────────────────────── */

// RAG: soup bowl with rising bubbles
function RagAnimation({ rm }: { rm: boolean }) {
  return (
    <div style={{ position: "relative", width: 120, height: 100, margin: "0 auto" }}>
      {/* Bowl */}
      <svg viewBox="0 0 120 100" width="120" height="100">
        <ellipse cx="60" cy="75" rx="48" ry="14" fill="rgba(200,145,58,0.15)" stroke="rgba(200,145,58,0.4)" strokeWidth="1.5"/>
        <path d="M12 60 Q20 88 60 92 Q100 88 108 60 Z" fill="rgba(27,19,9,0.9)" stroke="rgba(200,145,58,0.3)" strokeWidth="1.5"/>
        <ellipse cx="60" cy="60" rx="48" ry="10" fill="rgba(200,145,58,0.22)"/>
      </svg>
      {/* Bubbles */}
      {[0,1,2,3].map((i) => (
        <motion.div key={i}
          style={{ position: "absolute", bottom: 30, left: 30 + i * 16, width: 6, height: 6, borderRadius: "50%", background: "rgba(200,145,58,0.7)" }}
          animate={rm ? {} : { y: [0, -28, -28], opacity: [0, 0.9, 0], scale: [0.5, 1, 0.3] }}
          transition={{ duration: 1.4, delay: i * 0.35, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
      {/* Steam */}
      {[0,1].map((i) => (
        <motion.div key={i}
          style={{ position: "absolute", bottom: 60, left: 44 + i * 24, width: 8, height: 8, borderRadius: "50%", background: "rgba(240,230,206,0.18)", filter: "blur(4px)" }}
          animate={rm ? {} : { y: [0, -40], opacity: [0, 0.5, 0], x: [0, Math.sin(i) * 8] }}
          transition={{ duration: 2.2, delay: i * 0.9, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

// CNN: frying pan with sizzle sparks
function CnnAnimation({ rm }: { rm: boolean }) {
  return (
    <div style={{ position: "relative", width: 140, height: 100, margin: "0 auto" }}>
      <svg viewBox="0 0 140 100" width="140" height="100">
        {/* Handle */}
        <rect x="5" y="52" width="40" height="8" rx="4" fill="rgba(60,40,15,0.9)" stroke="rgba(200,145,58,0.2)" strokeWidth="1"/>
        {/* Pan */}
        <ellipse cx="90" cy="68" rx="44" ry="12" fill="rgba(20,14,6,0.95)" stroke="rgba(200,145,58,0.4)" strokeWidth="1.5"/>
        <path d="M46 56 Q60 72 90 74 Q120 72 134 56 L134 62 Q120 78 90 80 Q60 78 46 62 Z" fill="rgba(15,10,4,0.95)" stroke="rgba(200,145,58,0.25)" strokeWidth="1"/>
        <ellipse cx="90" cy="56" rx="44" ry="10" fill="rgba(200,93,20,0.35)"/>
        {/* Flame */}
        <motion.ellipse cx="90" cy="82" rx="16" ry="5" fill="rgba(255,120,20,0.4)"
          animate={rm ? {} : { ry: [5,7,5], opacity: [0.4,0.7,0.4] }}
          transition={{ duration: 0.5, repeat: Infinity }}/>
      </svg>
      {/* Sparks */}
      {[0,1,2,3,4].map((i) => (
        <motion.div key={i}
          style={{ position: "absolute", bottom: 30, left: 58 + i * 7, width: 4, height: 4, borderRadius: "50%", background: `rgba(255,${140 + i * 20},30,0.9)` }}
          animate={rm ? {} : {
            y:       [0, -(20 + i * 8), -(20 + i * 8)],
            x:       [0, (i % 2 === 0 ? 1 : -1) * (8 + i * 4), (i % 2 === 0 ? 1 : -1) * (8 + i * 4)],
            opacity: [0, 1, 0],
            scale:   [0, 1, 0],
          }}
          transition={{ duration: 0.7, delay: i * 0.18, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

// Transformer: layered cake building up
function TransformerAnimation({ rm }: { rm: boolean }) {
  const layers = ["#8B5CF6","#7C3AED","#6D28D9","#5B21B6","#4C1D95","#3B0764"];
  return (
    <div style={{ position: "relative", width: 120, height: 110, margin: "0 auto" }}>
      <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column-reverse", gap: 3 }}>
        {layers.map((color, i) => (
          <motion.div key={i}
            style={{ width: 90 - i * 4, height: 12, borderRadius: 4, background: color, border: "1px solid rgba(255,255,255,0.1)", margin: "0 auto" }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={rm ? { scaleX: 1, opacity: 1 } : { scaleX: [0, 1], opacity: [0, 1] }}
            transition={{ duration: 0.35, delay: i * 0.22, repeat: Infinity, repeatDelay: 2 }}
          />
        ))}
      </div>
      {/* Top cream */}
      <motion.div
        style={{ position: "absolute", top: 4, left: "50%", transform: "translateX(-50%)", width: 68, height: 8, borderRadius: 4, background: "rgba(200,145,58,0.7)" }}
        animate={rm ? {} : { opacity: [0, 1, 1, 0], scaleX: [0, 1, 1, 1] }}
        transition={{ duration: 0.4, delay: 1.3, repeat: Infinity, repeatDelay: 1.8 }}
      />
    </div>
  );
}

// Recommender: bento boxes sliding in
function RecommenderAnimation({ rm }: { rm: boolean }) {
  const boxes = [
    { color: "rgba(200,145,58,0.7)", label: "User" },
    { color: "rgba(100,180,255,0.6)", label: "Item" },
    { color: "rgba(120,220,120,0.6)", label: "Score" },
    { color: "rgba(255,140,80,0.6)",  label: "Top-K" },
  ];
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "flex-end", height: 90, padding: "8px 0" }}>
      {boxes.map(({ color, label }, i) => (
        <motion.div key={i}
          style={{ width: 32, borderRadius: 6, background: color, border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4 }}
          animate={rm ? { height: 40 + i * 10 } : { height: [4, 40 + i * 14, 40 + i * 10] }}
          transition={{ duration: 0.6, delay: i * 0.18, repeat: Infinity, repeatDelay: 1.5, ease: "easeOut" }}
        >
          <span style={{ fontSize: 7, color: "rgba(255,255,255,0.7)", fontFamily: "monospace", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>{label}</span>
        </motion.div>
      ))}
    </div>
  );
}

// LSTM: pasta strands flowing with memory gates
function LstmAnimation({ rm }: { rm: boolean }) {
  return (
    <div style={{ position: "relative", width: 140, height: 90, margin: "0 auto", overflow: "hidden" }}>
      {[0,1,2,3,4].map((i) => {
        const yBase = 15 + i * 14;
        const amp   = 10 + i * 3;
        const freq  = 0.04 + i * 0.008;
        const color = `rgba(200,${100 + i * 20},58,${0.5 + i * 0.08})`;
        return (
          <motion.svg key={i} viewBox="0 0 140 30" width="140" height="30"
            style={{ position: "absolute", top: yBase - 15, left: 0 }}>
            <motion.path
              d={`M 0 15 Q 35 ${15 - amp} 70 15 Q 105 ${15 + amp} 140 15`}
              stroke={color} strokeWidth={2} fill="none" strokeLinecap="round"
              animate={rm ? {} : {
                d: [
                  `M 0 15 Q 35 ${15 - amp} 70 15 Q 105 ${15 + amp} 140 15`,
                  `M 0 15 Q 35 ${15 + amp} 70 15 Q 105 ${15 - amp} 140 15`,
                  `M 0 15 Q 35 ${15 - amp} 70 15 Q 105 ${15 + amp} 140 15`,
                ]
              }}
              transition={{ duration: 1.8 + i * freq * 10, delay: i * 0.3, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.svg>
        );
      })}
      {/* Gate dots */}
      {[28, 70, 112].map((x, gi) => (
        <motion.div key={gi}
          style={{ position: "absolute", top: "50%", left: x, width: 10, height: 10, borderRadius: "50%", background: "rgba(200,145,58,0.9)", transform: "translate(-50%,-50%)", border: "1px solid rgba(255,255,255,0.2)" }}
          animate={rm ? {} : { scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.8, delay: gi * 0.6, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

function CookingVisual({ model, rm }: { model: ModelType | null; rm: boolean }) {
  if (!model) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{ padding: "var(--space-2) 0 var(--space-1)", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-1)" }}
    >
      {model === "RAG Pipeline"  && <RagAnimation rm={rm} />}
      {model === "CNN"           && <CnnAnimation rm={rm} />}
      {model === "Transformer"   && <TransformerAnimation rm={rm} />}
      {model === "Recommender"   && <RecommenderAnimation rm={rm} />}
      {model === "LSTM"          && <LstmAnimation rm={rm} />}
      <p className="mono c-gold" style={{ fontSize: 10, letterSpacing: "0.12em", opacity: 0.7 }}>COOKING {model.toUpperCase()}…</p>
    </motion.div>
  );
}

function SelectRow<T extends string>({
  label, options, value, onSelect,
}: { label: string; options: T[]; value: T | null; onSelect: (v: T) => void }) {
  return (
    <div style={{ marginBottom: "var(--space-2)" }}>
      <p className="label mb-1">{label}</p>
      <div className="flex-row flex-wrap gap-1">
        {options.map((opt) => (
          <motion.button key={opt}
            onClick={() => onSelect(opt)}
            whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
            className={value === opt ? "btn btn-primary" : "btn btn-secondary"}
            style={{ padding: "7px 14px", fontSize: 11 }}>
            {opt}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default function CookAnAI() {
  const [choice, setChoice]     = useState<Choice>({ dataset: null, model: null, deploy: null });
  const [cooking, setCooking]   = useState(false);
  const [result, setResult]     = useState<ReturnType<typeof getResult> | null>(null);
  const { play }                = useSoundFx();
  const rm                      = useReducedMotion() ?? false;

  const allChosen = choice.dataset && choice.model && choice.deploy;

  const handleCook = () => {
    if (!allChosen) return;
    play("/sounds/click.mp3", 0.2);
    setCooking(true);
    setResult(null);
    setTimeout(() => {
      setCooking(false);
      setResult(getResult(choice));
      play("/sounds/success.mp3", 0.3);
    }, rm ? 200 : 2600);
  };

  const reset = () => {
    setChoice({ dataset: null, model: null, deploy: null });
    setResult(null);
  };

  return (
    <div
      className="card"
      style={{
        background: "linear-gradient(135deg, rgba(27,19,8,0.9), rgba(10,7,4,0.95))",
        border: "1px solid var(--border)",
        padding: "var(--space-4)",
        maxWidth: 620,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div className="flex-row gap-2 mb-3">
        <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: "rgba(200,145,58,0.1)", border: "1px solid var(--border-hover)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span className="mono c-gold" style={{ fontSize: 16 }}>◈</span>
        </div>
        <div>
          <p className="heading-md c-cream">Cook an AI Model</p>
          <p className="label c-muted" style={{ fontSize: 9 }}>Pick your ingredients and we&apos;ll cook it live</p>
        </div>
      </div>

      {/* Choices */}
      <SelectRow label="01 — Dataset" options={DATASETS} value={choice.dataset} onSelect={(v) => setChoice(p => ({ ...p, dataset: v }))} />
      <SelectRow label="02 — Model Architecture" options={MODELS} value={choice.model} onSelect={(v) => setChoice(p => ({ ...p, model: v }))} />
      <SelectRow label="03 — Deployment" options={DEPLOYS} value={choice.deploy} onSelect={(v) => setChoice(p => ({ ...p, deploy: v }))} />

      {/* Cook button */}
      <div className="flex-row gap-2 mt-3">
        <motion.button
          onClick={handleCook}
          disabled={!allChosen || cooking}
          className="btn btn-primary"
          style={{ opacity: allChosen && !cooking ? 1 : 0.45, flex: 1, justifyContent: "center" }}
          whileHover={allChosen && !cooking ? { y: -2 } : {}}
          whileTap={allChosen && !cooking ? { scale: 0.97 } : {}}
        >
          {cooking ? "Cooking…" : "Fire up the Kitchen"}
        </motion.button>
        {result && (
          <motion.button onClick={reset} className="btn btn-secondary"
            style={{ padding: "12px 18px" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            Reset
          </motion.button>
        )}
      </div>

      {/* Visual cooking animation */}
      <AnimatePresence>
        {cooking && (
          <motion.div key="cooking-anim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ marginTop: "var(--space-2)", padding: "var(--space-2)", background: "rgba(200,145,58,0.04)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
            <CookingVisual model={choice.model} rm={rm} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{
              marginTop: "var(--space-3)",
              padding: "var(--space-3)",
              background: "rgba(200,145,58,0.07)",
              border: "1px solid rgba(200,145,58,0.28)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <p className="label mb-1">Dish Served</p>
            <p className="heading-lg c-cream mb-1" style={{ fontFamily: "var(--f-display)" }}>{result.dish}</p>
            <p className="body-sm c-2 mb-2" style={{ fontStyle: "italic" }}>{result.desc}</p>
            <div className="flex-row gap-3">
              <div>
                <p className="label" style={{ fontSize: 9 }}>Inference</p>
                <p className="mono c-gold" style={{ fontSize: 11 }}>{result.time}</p>
              </div>
              <div>
                <p className="label" style={{ fontSize: 9 }}>Stack</p>
                <p className="mono c-gold" style={{ fontSize: 11 }}>{choice.model} · {choice.deploy}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
