"use client";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { resume, bookArchive } from "../data/resume";

type Line = { text: string; type: "output" | "input" | "system" | "gold" };

const CMD: Record<string, () => Line[]> = {
  help: () => [
    { text: "Available commands:", type: "system" },
    { text: "  load projects          — list all signature recipes", type: "output" },
    { text: "  inspect <slug>         — deep dive a project", type: "output" },
    { text: "    slugs: rag-agent  splitwise  cnn  recommender  bert  retail", type: "gold" },
    { text: "  inspect skills         — ingredient shelf", type: "output" },
    { text: "  show bookshelf         — the reading archive", type: "output" },
    { text: "  open currently-reading — current book spotlight", type: "output" },
    { text: "  why ai                 — the origin story", type: "output" },
    { text: "  open resume            — chef credentials", type: "output" },
    { text: "  why hire karthik       — the answer you need", type: "output" },
    { text: "  download resume        — opens resume PDF", type: "output" },
    { text: "  contact chef           — reservation info", type: "output" },
    { text: "  whoami / ls / date     — classic shell", type: "output" },
    { text: "  clear / exit           — housekeeping", type: "output" },
  ],

  "load projects": () => [
    { text: "Loading signature recipes…", type: "system" },
    { text: "", type: "output" },
    ...resume.projects.map((p, i) => ({ text: `  [${i+1}]  ${p.title}`, type: "output" as const })),
    { text: "", type: "output" },
    { text: "  Type 'inspect <slug>' for deep-dive.", type: "system" },
  ],

  "inspect rag-agent": () => {
    const p = resume.projects[0];
    return [
      { text: `◈  ${p.title}`, type: "gold" },
      { text: `   Category   : ${p.category}`, type: "output" },
      { text: `   Stack      : ${p.ingredients.join(" · ")}`, type: "output" },
      { text: `   Result     : ${p.finalTaste}`, type: "output" },
      { text: `   Key lesson : ${p.learned}`, type: "output" },
      { text: `   GitHub     : ${p.github}`, type: "gold" },
    ];
  },
  "inspect splitwise": () => {
    const p = resume.projects[1];
    return [
      { text: `◈  ${p.title}`, type: "gold" },
      { text: `   Category   : ${p.category}`, type: "output" },
      { text: `   Stack      : ${p.ingredients.join(" · ")}`, type: "output" },
      { text: `   Result     : ${p.finalTaste}`, type: "output" },
      { text: `   GitHub     : ${p.github}`, type: "gold" },
    ];
  },
  "inspect cnn": () => {
    const p = resume.projects[2];
    return [
      { text: `◈  ${p.title}`, type: "gold" },
      { text: `   Accuracy   : 97.3% validation`, type: "output" },
      { text: `   Stack      : ${p.ingredients.join(" · ")}`, type: "output" },
      { text: `   Key lesson : ${p.learned}`, type: "output" },
    ];
  },
  "inspect recommender": () => {
    const p = resume.projects[3];
    return [
      { text: `◈  ${p.title}`, type: "gold" },
      { text: `   RMSE       : 0.89 on test set`, type: "output" },
      { text: `   Precision@10 : 0.74`, type: "output" },
      { text: `   Stack      : ${p.ingredients.join(" · ")}`, type: "output" },
    ];
  },
  "inspect bert": () => {
    const p = resume.projects[4];
    return [
      { text: `◈  ${p.title}`, type: "gold" },
      { text: `   R²         : 0.81 on test set`, type: "output" },
      { text: `   Stack      : ${p.ingredients.join(" · ")}`, type: "output" },
      { text: `   Key lesson : ${p.learned}`, type: "output" },
    ];
  },
  "inspect retail": () => {
    const p = resume.projects[5];
    return [
      { text: `◈  ${p.title}`, type: "gold" },
      { text: `   WAPE       : 7.9% (won 154/240 series)`, type: "output" },
      { text: `   Coverage   : 74.2% measured vs. 80% nominal`, type: "output" },
      { text: `   Stack      : ${p.ingredients.join(" · ")}`, type: "output" },
      { text: `   Key lesson : ${p.learned}`, type: "output" },
      { text: `   GitHub     : ${p.github}`, type: "gold" },
    ];
  },

  "inspect skills": () => {
    const lines: Line[] = [{ text: "Scanning ingredient shelf…", type: "system" }, { text: "", type: "output" }];
    Object.entries(resume.skills).forEach(([cat, skills]) => {
      lines.push({ text: `  ${cat}`, type: "gold" });
      lines.push({ text: `    ${skills.join(" · ")}`, type: "output" });
    });
    return lines;
  },

  "show bookshelf": () => {
    const lines: Line[] = [{ text: "The Archive — all shelves:", type: "system" }, { text: "", type: "output" }];
    lines.push({ text: "  Engineering Shelf", type: "gold" });
    bookArchive.engineering.forEach(b => lines.push({ text: `    · ${b.title} — ${b.author}`, type: "output" }));
    lines.push({ text: "", type: "output" });
    lines.push({ text: "  Thinking Shelf", type: "gold" });
    bookArchive.thinking.forEach(b => lines.push({ text: `    · ${b.title} — ${b.author}`, type: "output" }));
    lines.push({ text: "", type: "output" });
    lines.push({ text: "  Philosophy Shelf", type: "gold" });
    bookArchive.philosophy.forEach(b => lines.push({ text: `    · ${b.title} — ${b.author}`, type: "output" }));
    return lines;
  },

  "open currently-reading": () => [
    { text: "◎  Currently on the stovetop:", type: "gold" },
    { text: `   ${resume.currentlyReading}`, type: "output" },
    { text: `   by ${resume.currentlyReadingAuthor}`, type: "output" },
    { text: "", type: "output" },
    { text: `   ${resume.currentlyReadingNote}`, type: "output" },
  ],

  "why ai": () => [
    { text: "", type: "output" },
    { text: "  The honest answer:", type: "gold" },
    { text: "  I became an AI engineer because I realized that the most", type: "output" },
    { text: "  interesting problems — healthcare, language, vision — are", type: "output" },
    { text: "  exactly where machine learning is making real impact.", type: "output" },
    { text: "", type: "output" },
    { text: "  The RAG agent I built for preventive care recommendations", type: "output" },
    { text: "  was the moment I understood this wasn't just cool tech —", type: "output" },
    { text: "  it was something genuinely useful. That's what I build for.", type: "output" },
    { text: "", type: "output" },
    { text: "  ML Engineer, AI Systems Architect, CSUN M.S. CS (2026)", type: "gold" },
  ],

  "open resume": () => [
    { text: "╔═══════════════════════════════════════════╗", type: "gold" },
    { text: "║        KARTHIK MANNEM · HEAD CHEF         ║", type: "gold" },
    { text: "╚═══════════════════════════════════════════╝", type: "gold" },
    { text: "", type: "output" },
    { text: `  Name       : ${resume.name}`, type: "output" },
    { text: `  Location   : ${resume.location}`, type: "output" },
    { text: `  Email      : ${resume.email}`, type: "output" },
    { text: `  GitHub     : github.com/mannemkarthik010`, type: "output" },
    { text: `  M.S. GPA   : 3.92 / 4.0 — CSUN`, type: "output" },
    { text: `  B.Tech GPA : 9.21 / 10.0 — Vel Tech`, type: "output" },
    { text: `  Status     : Open to full-time ML/AI roles · Immediate`, type: "output" },
  ],

  "why hire karthik": () => [
    { text: "", type: "output" },
    { text: "  End-to-end ML: data → model → production. Not just notebooks.", type: "gold" },
    { text: "  RAG pipelines that actually reduce hallucinations in production.", type: "output" },
    { text: "  CNN, NLP, Recommenders, full-stack AI — complete menu.", type: "output" },
    { text: "  1,000+ LLM outputs graded as Generative AI Analyst @ Handshake AI.", type: "output" },
    { text: "  Docker + Flask + AWS: ships real systems, not demos.", type: "output" },
    { text: "  3.92 GPA M.S. CS — rigorous academic foundation.", type: "output" },
    { text: "", type: "output" },
    { text: `  Contact: ${resume.email}`, type: "gold" },
  ],

  "download resume": () => {
    if (typeof window !== "undefined") window.open(resume.resumePdf, "_blank");
    return [{ text: "Opening resume PDF…", type: "system" }];
  },

  "contact chef": () => [
    { text: `  ◉  ${resume.location}`, type: "output" },
    { text: `  ▲  ${resume.email}`, type: "output" },
    { text: `  ◈  linkedin.com/in/karthik-mannem-2008b4225`, type: "output" },
    { text: `  ◎  github.com/mannemkarthik010`, type: "output" },
    { text: "", type: "output" },
    { text: "  Scroll to § 07 to reserve a table.", type: "system" },
  ],

  whoami: () => [{ text: `${resume.name} — ML Engineer · AI Systems Architect`, type: "gold" }],
  ls: () => [{ text: "hero  about  projects  skills  experience  live  reading  contact", type: "output" }],
  date: () => [{ text: new Date().toLocaleString(), type: "output" }],
};

const MOTD: Line[] = [
  { text: "The Algorithmic Kitchen — Terminal v3.0", type: "system" },
  { text: `Type 'help' for commands.`, type: "output" },
  { text: "", type: "output" },
];

const lineColor = (t: Line["type"]) =>
  t === "input" ? "var(--gold)" :
  t === "system" ? "rgba(200,145,58,0.52)" :
  t === "gold"   ? "rgba(228,174,82,0.88)" :
  "rgba(240,230,206,0.66)";

export default function Terminal() {
  const [open, setOpen]       = useState(false);
  const [lines, setLines]     = useState<Line[]>(MOTD);
  const [input, setInput]     = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "`") { e.preventDefault(); setOpen(o => !o); }
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open]);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 80); }, [open]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lines]);

  const run = (cmd: string) => {
    const t = cmd.trim().toLowerCase();
    const next: Line[] = [...lines, { text: `❯ ${cmd}`, type: "input" }];
    if (t === "clear") { setLines(MOTD); }
    else if (t === "exit") { setOpen(false); }
    else if (CMD[t]) { setLines([...next, ...CMD[t]()]); }
    else if (t === "") { setLines(next); }
    else { setLines([...next, { text: `command not found: '${cmd}'. Try 'help'.`, type: "output" }]); }
    setHistory(h => [cmd, ...h].slice(0, 80));
    setHistIdx(-1);
    setInput("");
  };

  return (
    <>
      {/* Hint badge */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }} transition={{ delay: 5, duration: 0.5 }}
            onClick={() => setOpen(true)}
            style={{ position: "fixed", bottom: 24, right: 24, zIndex: 200, display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", background: "rgba(10,8,3,0.88)", border: "1px solid rgba(200,145,58,0.25)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--muted)", backdropFilter: "blur(10px)", transition: "all 0.2s ease" }}
            whileHover={{ borderColor: "rgba(200,145,58,0.6)", color: "var(--gold)" } as Parameters<typeof motion.button>[0]["whileHover"]}
            aria-label="Open developer terminal"
          >
            <span style={{ color: "var(--gold)" }}>⌃`</span> Terminal
          </motion.button>
        )}
      </AnimatePresence>

      {/* Terminal window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 36, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 36, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "fixed", bottom: 24, right: 24, width: "min(600px,calc(100vw - 48px))", height: 400, zIndex: 500, background: "rgba(5,3,1,0.97)", border: "1px solid rgba(200,145,58,0.3)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", overflow: "hidden", backdropFilter: "blur(20px)", boxShadow: "0 28px 64px rgba(0,0,0,0.7)" }}
            onClick={() => inputRef.current?.focus()}
          >
            {/* Title bar */}
            <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(200,145,58,0.12)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: "rgba(0,0,0,0.18)" }}>
              <div className="flex-row gap-1">
                {["#D45D20","#C8913A","rgba(200,145,58,0.25)"].map((c, i) => (
                  <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                ))}
              </div>
              <span className="mono c-muted" style={{ fontSize: 11, opacity: 0.5 }}>algorithmic-kitchen — bash</span>
              <button onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 13 }} aria-label="Close">✕</button>
            </div>

            {/* Output */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", fontFamily: "var(--f-mono)", fontSize: 12, lineHeight: 1.75 }}>
              {lines.map((l, i) => (
                <div key={i} style={{ color: lineColor(l.type), whiteSpace: "pre" }}>{l.text}</div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "8px 14px", borderTop: "1px solid rgba(200,145,58,0.1)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span className="mono c-gold">❯</span>
              <input ref={inputRef} value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") run(input);
                  if (e.key === "ArrowUp") { const idx = Math.min(histIdx+1, history.length-1); setHistIdx(idx); setInput(history[idx] ?? ""); }
                  if (e.key === "ArrowDown") { const idx = Math.max(histIdx-1, -1); setHistIdx(idx); setInput(idx === -1 ? "" : history[idx]); }
                }}
                placeholder="type a command…"
                style={{ flex: 1, background: "none", border: "none", outline: "none", fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--cream)", caretColor: "var(--gold)" }}
                autoComplete="off" spellCheck={false}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
