"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { StatusChip } from "../StatusChip";
import Disclosure from "./Disclosure";
import CaseLink from "./CaseLink";
import { Details, getProject } from "./shared";
import { preventive } from "../case/preventive-data";
import { EASE } from "../../lib/motion";

const LIMITS = [
  "An educational prototype, not a validated clinical tool. No clinician has reviewed its output, and nothing here is medical advice.",
  "The knowledge base is 12 mock one-page PDFs. Ten contain the same generic sentence and two are one-line stubs, so the plan cannot be better grounded than that.",
  "The retrieved sources are listed beside the plan, but individual recommendations are not linked to a source.",
  "The repository has no test suite and no plan-quality evaluation. The only verification is the risk function against its published worked example.",
];

const P = preventive.pipeline;
const STAGES = [
  { n: "01", t: "Risk", lane: "Code", stat: "4 / 4", statL: "worked-example cases reproduced", d: "The 2013 ACC/AHA Pooled Cohort Equations, written as plain Python. The language model never does this arithmetic; it receives the finished percentage and tier." },
  { n: "02", t: "Retrieve", lane: "Vector search", stat: `top ${P.k}`, statL: `chunks of ${P.chunkSize} ${P.chunkUnit}, ${P.embedding} embeddings`, d: "A query built from the patient's profile and risk tier searches a Chroma index. The page does not run the retriever, so it shows no retrieved passages." },
  { n: "03", t: "Draft", lane: "LLM", stat: "4 sections", statL: "screening, lifestyle, medication, follow-up", d: "The model writes a structured care plan, instructed to ground it only in the retrieved excerpts. The output has a fixed schema, so it cannot arrive as free text." },
  { n: "04", t: "Critique", lane: "LLM", stat: "4-point", statL: "rubric: complete, grounded, tailored, safe", d: "A second pass scores the draft against the rubric and returns a verdict with feedback. It is another model call, so it can miss what the drafter gets wrong." },
  { n: "05", t: "Route", lane: "Code", stat: `≤ ${P.maxRevisions}`, statL: "revisions, then the last draft is delivered", d: "Pass: stop. Fail: send back with the feedback, at most twice. After the cap, the last draft is delivered with a status line." },
] as const;

export default function PreventiveShowcase() {
  const { p } = getProject("preventive-care");
  const rm = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: "-25% 0px" });
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(false);
  const started = useRef(false);

  // One pass along the pipeline when it first scrolls into view. Any interaction stops it. No loop.
  useEffect(() => {
    if (!seen || rm || started.current) return;
    started.current = true;
    queueMicrotask(() => setAuto(true));
  }, [seen, rm]);
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setIdx((i) => { if (i >= STAGES.length - 1) { setAuto(false); return i; } return i + 1; }), 1100);
    return () => clearInterval(t);
  }, [auto]);

  const pick = (i: number) => { setAuto(false); setIdx(i); };
  const cur = STAGES[idx];

  return (
    <article id="work-preventive" className="sw sw-pc" aria-labelledby="sw-pc-title">
      <header className="sw-head sw-head--center">
        <span className="sw-head__no" aria-hidden="true">3/3</span>
        <p className="sw-eyebrow">Retrieval, evidence, decision process <StatusChip status={p.status} size="sm" /></p>
      </header>
      <h3 id="sw-pc-title" className="sw-title sw-title--center">Preventive Care Agent: an agent that keeps the <em>arithmetic</em> out of the model.</h3>

      <div className="sw-pc__rig" ref={ref}>
        <div className="sw-pc__ctl">
          <p>Select a stage, or replay the pass through the pipeline.</p>
          {!rm && <button type="button" className="cs-chip" onClick={() => { setIdx(0); setAuto(true); }}>Replay</button>}
        </div>

        <ol className="sw-pc__stages" aria-label="Pipeline stages">
          <motion.span className="sw-pc__fill" aria-hidden="true" initial={false} animate={{ width: `${(idx / (STAGES.length - 1)) * 80}%` }} transition={rm ? { duration: 0 } : { duration: 0.7, ease: EASE }} />
          {STAGES.map((s, i) => (
            <li key={s.n}>
              <button type="button" className={`sw-pc__stage${i === idx ? " is-on" : i < idx ? " is-done" : ""}`} aria-pressed={i === idx} onClick={() => pick(i)}>
                <span className="sw-pc__n">{s.n}</span>
                <b>{s.t}</b>
                <span className="sw-pc__lane">{s.lane}</span>
              </button>
            </li>
          ))}
          <span className="sw-pc__loop" aria-hidden="true"><i />revise, up to {P.maxRevisions}×</span>
        </ol>

        <div className="sw-pc__detail" role="status" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={cur.n} className="sw-pc__detail-in" initial={rm ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={rm ? { opacity: 0 } : { opacity: 0, y: -8 }} transition={{ duration: 0.28, ease: EASE }}>
              <div className="sw-pc__stat"><b>{cur.stat}</b><span>{cur.statL}</span></div>
              <p>{cur.d}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="sw-pc__foot">
        <div className="sw-pc__not">
          <h4>What this prototype is not</h4>
          <ul>
            <li>Not medical advice or a validated clinical tool.</li>
            <li>Built on a mock corpus: 12 one-page PDFs, ten of them the same sentence.</li>
            <li>Untested beyond its risk function. No plan-quality evaluation yet.</li>
          </ul>
        </div>
        <div className="sw-pc__act">
          <p className="sw-lead sw-lead--sm">The case study steps through a run for three invented patients and simulates the revision loop. It shows no retrieved passages or generated plans, because none were captured.</p>
          <div className="sw-actions">
            <CaseLink href="/work/preventive-care" className="pill-cta">Read the case study →</CaseLink>
            {p.demo && <a className="fw-ghost" href={p.demo} target="_blank" rel="noopener noreferrer">Live demo ↗</a>}
            {p.github && <a className="fw-ghost" href={p.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>}
          </div>
        </div>
      </div>

      <Disclosure label="Technical details">
        <Details slug="preventive-care" limits={LIMITS} />
      </Disclosure>
    </article>
  );
}
