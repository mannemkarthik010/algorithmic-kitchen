"use client";
import { useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Contribution, ContentBlock } from "../data/contributions";
import { Badge, Btn } from "./ui";
import { useSoundFx } from "../hooks/useSoundFx";
import { EASE, DUR } from "../lib/motion";

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  return (
    <div className="code-block">
      <div className="code-block__bar">
        <span className="code-block__dot" />
        <span className="code-block__dot" />
        <span className="code-block__dot" />
        <span className="mono code-block__lang">{lang}</span>
      </div>
      <pre className="code-block__pre"><code>{code}</code></pre>
    </div>
  );
}

function TableBlock({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="article-table-wrap">
      <table className="article-table">
        <thead>
          <tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} data-result={/^(pass)$/i.test(cell) ? "pass" : /^FAIL$/.test(cell) ? "fail" : undefined}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "p":
      return <p className="body-md c-2 article-p">{block.text}</p>;
    case "h":
      return <h3 className="heading-md c-cream article-h">{block.text}</h3>;
    case "code":
      return <CodeBlock lang={block.lang} code={block.code} />;
    case "list":
      return (
        <ul className="modal-list article-list">
          {block.items.map((item, i) => <li key={i} className="modal-list-item">{item}</li>)}
        </ul>
      );
    case "table":
      return <TableBlock headers={block.headers} rows={block.rows} />;
    default:
      return null;
  }
}

export default function ContributionModal({ contribution, onClose }: {
  contribution: Contribution | null; onClose: () => void;
}) {
  const { play } = useSoundFx();
  const rm = useReducedMotion();

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") { play("/sounds/click.mp3", 0.18); onClose(); }
    };
    document.addEventListener("keydown", h);
    if (contribution) document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [contribution, onClose, play]);

  const handleClose = () => { play("/sounds/click.mp3", 0.18); onClose(); };

  return (
    <AnimatePresence>
      {contribution && (
        <motion.div
          className="modal-bg"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: DUR.normal }}
          onClick={handleClose}
        >
          <motion.div
            className="modal-panel article-modal-panel"
            initial={rm ? false : { opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: DUR.slow, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky header */}
            <div style={{
              padding: "var(--space-3) var(--space-4)",
              borderBottom: "1px solid var(--border)",
              position: "sticky", top: 0,
              background: "var(--bg-card)", zIndex: 10,
              borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-2)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    <Badge>{contribution.repo}</Badge>
                    <Badge style={{ opacity: 0.6 }}>★ {contribution.stars}</Badge>
                    <Badge style={{ opacity: 0.6 }}>{contribution.language}</Badge>
                  </div>
                  <h2 className="heading-lg c-cream" style={{ lineHeight: 1.2 }}>{contribution.title}</h2>
                </div>
                <button
                  onClick={handleClose} aria-label="Close modal"
                  style={{ background: "rgba(200,145,58,0.07)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--muted)", width: 34, height: 34, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.18s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--cream)"; e.currentTarget.style.borderColor = "var(--border-active)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                >✕</button>
              </div>
            </div>

            {/* Scrollable body */}
            <div style={{ padding: "var(--space-4)" }}>
              {/* Stats strip */}
              <div className="project-summary-strip" style={{ marginBottom: "var(--space-4)" }}>
                <div>
                  <p className="label">Pull Request</p>
                  <p className="body-sm c-cream">#{contribution.prNumber} — {contribution.diffStat}</p>
                </div>
                <div>
                  <p className="label">Status</p>
                  <p className="body-sm c-cream">{contribution.prStatus === "merged" ? "Merged" : "Approved, open"}</p>
                </div>
                <div>
                  <p className="label">Issue</p>
                  <p className="body-sm c-cream">#{contribution.issueNumber}</p>
                </div>
              </div>

              {contribution.body.map((block, i) => <Block key={i} block={block} />)}

              {/* Actions */}
              <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginTop: "var(--space-4)" }}>
                <Btn href={contribution.prUrl} variant="primary" target="_blank" rel="noopener noreferrer">View Pull Request ↗</Btn>
                <Btn href={contribution.issueUrl} variant="secondary" target="_blank" rel="noopener noreferrer">View Issue ↗</Btn>
                <Btn onClick={handleClose} variant="secondary">Back to Menu</Btn>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
