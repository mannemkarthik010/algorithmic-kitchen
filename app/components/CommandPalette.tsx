"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { resume } from "../data/resume";
import { STATUS } from "../lib/status";
import { OPEN_PALETTE, openProject, scrollToId } from "../lib/events";

type Cmd = { id: string; group: string; label: string; hint?: string; keywords?: string; run: () => void };

const SECTIONS: [string, string, string][] = [
  ["projects", "Projects", "work portfolio featured"],
  ["experience", "Experience", "work jobs handshake"],
  ["contributions", "Open-source contributions", "pytorch pandera pr"],
  ["expertise", "Skills — focus areas", "skills stack expertise"],
  ["skills", "Skills — tech stack", "tools languages"],
  ["about", "About me", "bio story education"],
  ["timeline", "Journey", "career education"],
  ["playground", "Playground", "games fun extras"],
  ["play", "Games — Real or Fake? & build a plate", "game fun quiz"],
  ["live", "Now cooking — current projects", "status tickets woodlands"],
  ["reading", "Reading room", "books library"],
  ["contact", "Contact", "email hire"],
];

/** ⌘K / Ctrl+K — jump anywhere, open any project, grab links. */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => { setOpen(false); setQ(""); setIdx(0); }, []);

  const cmds = useMemo<Cmd[]>(() => {
    const go = (fn: () => void) => () => { close(); setTimeout(fn, 80); };
    return [
      ...SECTIONS.map(([id, label, keywords]): Cmd => ({
        id: `go-${id}`, group: "Go to", label, keywords, hint: `#${id}`, run: go(() => scrollToId(id)),
      })),
      ...resume.projects.map((p): Cmd => ({
        id: `p-${p.slug}`, group: "Projects", label: p.title.split(" — ")[0],
        hint: STATUS[p.status].label, keywords: `${p.category} ${p.title} ${p.slug}`,
        run: go(() => { scrollToId("projects"); setTimeout(() => openProject(p.slug), 350); }),
      })),
      { id: "l-resume", group: "Links", label: "Download résumé (PDF)", hint: "↓", keywords: "cv resume pdf",
        run: go(() => window.open("/Karthik_Mannem_Resume.pdf", "_blank", "noopener")) },
      { id: "l-gh", group: "Links", label: "GitHub — mannemkarthik010", hint: "↗", keywords: "code repos",
        run: go(() => window.open(resume.github, "_blank", "noopener")) },
      { id: "l-in", group: "Links", label: "LinkedIn", hint: "↗", keywords: "profile",
        run: go(() => window.open(resume.linkedin, "_blank", "noopener")) },
      { id: "l-mail", group: "Links", label: `Email ${resume.email}`, hint: "✉", keywords: "contact hire",
        run: go(() => window.open(`mailto:${resume.email}`, "_self")) },
    ];
  }, [close]);

  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return cmds;
    return cmds.filter((c) => {
      const hay = `${c.label} ${c.group} ${c.keywords ?? ""}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }, [cmds, q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName ?? "");
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); return; }
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setOpen(true); }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE, onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener(OPEN_PALETTE, onOpen); };
  }, []);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30); }, [open]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-i="${idx}"]`)?.scrollIntoView({ block: "nearest" });
  }, [idx]);

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); results[idx]?.run(); }
  };

  let lastGroup = "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="cmdk-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <motion.div
            className="cmdk"
            role="dialog" aria-modal="true" aria-label="Command palette"
            initial={{ opacity: 0, y: -14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            <div className="cmdk__top">
              <span aria-hidden="true">⌕</span>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => { setQ(e.target.value); setIdx(0); }}
                onKeyDown={onInputKey}
                placeholder="Jump to a section, open a recipe, grab a link…"
                aria-label="Search commands"
                spellCheck={false}
                autoComplete="off"
              />
              <kbd>esc</kbd>
            </div>
            <div className="cmdk__list" ref={listRef} role="listbox">
              {results.length === 0 && <p className="cmdk__empty">Nothing on the menu matches “{q}”.</p>}
              {results.map((c, i) => {
                const header = c.group !== lastGroup ? c.group : null;
                lastGroup = c.group;
                return (
                  <div key={c.id}>
                    {header && <p className="cmdk__group">{header}</p>}
                    <button
                      type="button" role="option" aria-selected={i === idx} data-i={i}
                      className={`cmdk__item${i === idx ? " is-sel" : ""}`}
                      onMouseMove={() => setIdx(i)}
                      onClick={c.run}
                    >
                      <span>{c.label}</span>
                      {c.hint && <em>{c.hint}</em>}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="cmdk__foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>⌘</kbd><kbd>K</kbd> toggle</span></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
