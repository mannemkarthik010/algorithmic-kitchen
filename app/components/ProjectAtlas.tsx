"use client";
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { EASE } from "../lib/motion";

type Kind = "project" | "theme";
type N = { id: string; kind: Kind; label: string; x: number; y: number; line: string; href?: string; cta?: string };

const NODES: N[] = [
  { id: "tax", kind: "project", label: "TaxProof", x: 16, y: 50, line: "A tax workpaper where every number links to its rule, extracted value and document page.", href: "/work/taxproof", cta: "Case study" },
  { id: "retail", kind: "project", label: "Retail Demand Intelligence", x: 50, y: 50, line: "Per-series forecasts with measured interval coverage, monitoring that acts, and an auditable agent. Synthetic data.", href: "/work/retail-demand-intelligence", cta: "Case study" },
  { id: "care", kind: "project", label: "Preventive Care Agent", x: 84, y: 50, line: "A LangGraph agent that keeps the risk arithmetic in code and sends drafts through a critic. Educational prototype.", href: "/work/preventive-care", cta: "Case study" },
  { id: "oss", kind: "project", label: "Open source", x: 92, y: 90, line: "Pull requests to pandera and PyTorch, with real status: one merged, three not.", href: "/#contributions", cta: "Code evolution" },

  { id: "prov", kind: "theme", label: "Provenance", x: 8, y: 11, line: "Every figure points back to where it came from." },
  { id: "evid", kind: "theme", label: "Evidence graphs", x: 25, y: 11, line: "Lineage from a result to a document page." },
  { id: "fore", kind: "theme", label: "Forecasting", x: 42, y: 11, line: "Rolling-origin backtests and a model chosen per series." },
  { id: "agent", kind: "theme", label: "Agentic workflows", x: 59, y: 11, line: "Tool-calling and critic loops, with the limits stated." },
  { id: "rag", kind: "theme", label: "Retrieval (RAG)", x: 76, y: 11, line: "Retrieve guideline passages, then draft from them." },
  { id: "risk", kind: "theme", label: "Risk models", x: 92, y: 11, line: "Published equations implemented in plain code and checked against a worked example." },
  { id: "full", kind: "theme", label: "Full-stack", x: 8, y: 89, line: "Schema, API, roles and a web app in one system." },
  { id: "trust", kind: "theme", label: "Trustworthy AI", x: 25, y: 89, line: "AI that investigates but does not calculate, with claims checked against evidence." },
  { id: "eval", kind: "theme", label: "Evaluation", x: 42, y: 89, line: "Measured error and coverage, reported even when unflattering." },
  { id: "deploy", kind: "theme", label: "Deployment", x: 59, y: 89, line: "Live demos on Vercel and Streamlit. AWS Terraform is written and mock-tested, not applied." },
  { id: "tools", kind: "theme", label: "Libraries and tooling", x: 76, y: 89, line: "Fixes to widely used Python libraries." },
];
const EDGES: [string, string][] = [
  ["tax", "prov"], ["tax", "evid"], ["tax", "full"], ["tax", "trust"],
  ["retail", "fore"], ["retail", "agent"], ["retail", "eval"], ["retail", "deploy"],
  ["care", "agent"], ["care", "rag"], ["care", "risk"],
  ["oss", "tools"],
];
const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));
const related = (id: string) => new Set([id, ...EDGES.filter(([a, b]) => a === id || b === id).flatMap(([a, b]) => [a, b])]);

/**
 * An optional map of the work. Projects connect to the technical themes they actually involve, and you can enter from
 * either side. Wide screens get the graph; phones get the same relationships as a list, because the graph needs room.
 * It never moves on its own.
 */
export default function ProjectAtlas() {
  const rm = useReducedMotion();
  const [sel, setSel] = useState<string>("retail");
  const rel = related(sel);
  const cur = byId[sel];
  const links = NODES.filter((n) => n.id !== sel && rel.has(n.id));

  return (
    <div className="atlas">
      <div className="atlas__map" role="group" aria-label="Map of projects and the themes they involve">
        <svg className="atlas__edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {EDGES.map(([a, b]) => {
            const A = byId[a], B = byId[b];
            const on = a === sel || b === sel;
            return (
              <motion.line key={a + b} x1={A.x} y1={A.y} x2={B.x} y2={B.y} className={`atlas__edge${on ? " is-on" : ""}`} vectorEffect="non-scaling-stroke"
                initial={false} animate={{ opacity: sel ? (on ? 1 : 0.14) : 0.5 }} transition={rm ? { duration: 0 } : { duration: 0.4, ease: EASE }} />
            );
          })}
        </svg>
        {NODES.map((n) => {
          const on = rel.has(n.id);
          return (
            <motion.button
              key={n.id} type="button" aria-pressed={sel === n.id}
              className={`atlas__node atlas__node--${n.kind}${sel === n.id ? " is-sel" : ""}`}
              style={{ left: `${n.x}%`, top: `${n.y}%` }}
              initial={false} animate={{ opacity: on ? 1 : 0.35 }} transition={rm ? { duration: 0 } : { duration: 0.35, ease: EASE }}
              onClick={() => setSel(n.id)}
            >
              {n.label}
            </motion.button>
          );
        })}
      </div>

      <ul className="atlas__list" aria-label="Projects and their themes">
        {NODES.filter((n) => n.kind === "project").map((p) => (
          <li key={p.id} className={sel === p.id ? "is-sel" : ""}>
            <button type="button" aria-pressed={sel === p.id} onClick={() => setSel(p.id)}>{p.label}</button>
            <span>{EDGES.filter(([a]) => a === p.id).map(([, b]) => byId[b].label).join(" · ")}</span>
          </li>
        ))}
      </ul>

      <div className="atlas__detail" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={sel} initial={rm ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={rm ? { opacity: 0 } : { opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: EASE }}>
            <p className="atlas__kind">{cur.kind === "project" ? "Project" : "Theme"}</p>
            <h4>{cur.label}</h4>
            <p>{cur.line}</p>
            <p className="atlas__links">
              {links.map((n) => (<button key={n.id} type="button" onClick={() => setSel(n.id)}>{n.label}</button>))}
              {cur.href && <Link href={cur.href}>{cur.cta} →</Link>}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
