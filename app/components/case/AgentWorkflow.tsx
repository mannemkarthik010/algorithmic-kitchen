"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { preventive, BOUNDS, type Patient } from "./preventive-data";

type Prov = "run" | "template" | "source" | "absent";
const PROV: Record<Prov, string> = {
  run: "Computed here by the repo's code",
  template: "Filled from the repo's template",
  source: "Read from the repo",
  absent: "Not shown on this page",
};

type NodeDef = { id: string; n: string; t: string; lane: "code" | "llm" | "store"; file: string; blurb: string };
const NODES: NodeDef[] = [
  { id: "intake", n: "01", t: "Intake", lane: "code", file: "schemas.py · PatientProfile", blurb: "Validates the nine inputs." },
  { id: "risk", n: "02", t: "Risk", lane: "code", file: "utils.py · calculate_ascvd_10yr_risk", blurb: "Pooled Cohort Equations in plain Python." },
  { id: "retrieve", n: "03", t: "Retrieve", lane: "store", file: "agent.py · retrieve_guidelines", blurb: "Top 5 chunks from a Chroma index." },
  { id: "draft", n: "04", t: "Draft", lane: "llm", file: "agent.py · synthesize_plan", blurb: "Structured care plan from those excerpts." },
  { id: "critique", n: "05", t: "Critique", lane: "llm", file: "agent.py · critique_plan", blurb: "Scores the draft against a rubric." },
  { id: "route", n: "06", t: "Route", lane: "code", file: "agent.py · _route_after_critique", blurb: "Pass, revise, or stop at the cap." },
  { id: "deliver", n: "07", t: "Deliver", lane: "code", file: "app.py", blurb: "Plan, risk, caption and sources." },
];
const LANE_LABEL = { code: "Deterministic code", llm: "LLM step", store: "Vector store" } as const;

function Tag({ p }: { p: Prov }) {
  return <span className={`pc-prov pc-prov--${p}`}>{PROV[p]}</span>;
}

function Row({ k, children, p }: { k: string; children: React.ReactNode; p?: Prov }) {
  return (
    <div className="tp-dl__row">
      <dt>{k}{p && <Tag p={p} />}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Detail({ id, pt }: { id: string; pt: Patient }) {
  const P = preventive.pipeline;
  const inRange = (v: number, [lo, hi]: readonly [number, number]) => v >= lo && v <= hi;
  const checks = [
    ["age", pt.age, BOUNDS.age], ["total_cholesterol", pt.total_cholesterol, BOUNDS.total_cholesterol],
    ["hdl_cholesterol", pt.hdl_cholesterol, BOUNDS.hdl_cholesterol], ["systolic_bp", pt.systolic_bp, BOUNDS.systolic_bp],
  ] as const;

  if (id === "intake") return (
    <dl className="tp-dl">
      <Row k="Sample input" p="source">
        <code>{`{ age: ${pt.age}, sex: "${pt.sex}", race: "${pt.race}", total_cholesterol: ${pt.total_cholesterol}, hdl_cholesterol: ${pt.hdl_cholesterol}, systolic_bp: ${pt.systolic_bp}, smoker: ${pt.smoker}, diabetes: ${pt.diabetes}, bp_meds: ${pt.bp_meds} }`}</code>
        <span className="tp-dim"> Fictional values chosen for this page.</span>
      </Row>
      <Row k="Bounds checked" p="source">
        {checks.map(([name, v, b]) => (
          <span key={name} className="tp-member"><code>{name}</code> {v} in {b[0]} to {b[1]}: {inRange(v, b) ? "valid" : "rejected"}</span>
        ))}
      </Row>
      <Row k="Why it matters">Pydantic rejects out-of-range input before anything else runs, so the risk code and the prompt only ever see valid numbers.</Row>
    </dl>
  );

  if (id === "risk") return (
    <dl className="tp-dl">
      <Row k="Result" p="run"><b>{pt.risk.risk_percentage}%</b> 10-year ASCVD risk, tier <b>{pt.risk.risk_tier}</b></Row>
      <Row k="Method" p="source">{pt.risk.method}. Plain arithmetic: logs, sex and race specific coefficients, a baseline survival term. No model call.</Row>
      <Row k="Flags" p="run">
        Outside validated age range (40 to 79): {String(pt.risk.out_of_validated_age_range)}. Race approximated as White: {String(pt.risk.race_approximated_as_white)}.
      </Row>
      <Row k="Checked against" p="run">
        The documented worked example (55 y, total cholesterol 213, HDL 50, systolic 120, untreated, non-smoker, no diabetes):{" "}
        {preventive.worked.map((w) => `${w.race} ${w.sex} ${w.risk.toFixed(1)}%`).join(" · ")}. All four match the published values.
      </Row>
      <Row k="Downstream">The LLM never sees the inputs to this formula as a task. It receives the finished percentage and tier.</Row>
    </dl>
  );

  if (id === "retrieve") return (
    <dl className="tp-dl">
      <Row k="Query sent to the index" p="template"><code>{pt.query}</code></Row>
      <Row k="Settings" p="source">Top {P.k} similarity search. Embeddings: <code>{P.embedding}</code>. Chunks of {P.chunkSize} {P.chunkUnit} with {P.chunkOverlap} overlap.</Row>
      <Row k="Which five come back" p="absent">That depends on the embeddings, which this page does not run, so no ranking is shown.</Row>
      <Row k="What is in the index" p="source">
        {preventive.stats.documents} mock one-page PDFs. {preventive.stats.boilerplateDocs} of them hold the same generic sentence under different titles, and two are one-line stubs.
        <details className="cs-details"><summary>Read the whole corpus</summary>
          <ul className="pc-corpus">
            {preventive.corpus.map((c) => (<li key={c.file}><code>{c.file}</code> {c.text}</li>))}
          </ul>
        </details>
      </Row>
    </dl>
  );

  if (id === "draft") return (
    <dl className="tp-dl">
      <Row k="Model" p="source">Llama-3.1-8B-Instruct through an OpenAI-compatible endpoint, temperature {P.temperature}, structured output.</Row>
      <Row k="Prompt skeleton" p="template">
        <code className="pc-block">{`Build a structured 10-year preventive cardiovascular care plan for this patient, grounded ONLY in the guideline excerpts below.\n\nPatient: ${pt.age}-year-old ${pt.sex}, 10-year ASCVD risk ${pt.risk.risk_percentage}% (${pt.risk.risk_tier} tier).\nSmoker: ${pt.smoker}. Diabetes: ${pt.diabetes}. On BP medication: ${pt.bp_meds}.\n\nGuideline excerpts:\n[the five retrieved chunks]\n[on a revision: the critic's feedback]`}</code>
        Abridged from the repo&apos;s prompt; the excerpts are not reproduced here.
      </Row>
      <Row k="Output shape" p="source"><code>CarePlan</code> with four lists: screening, lifestyle, pharmacological, follow_up.</Row>
      <Row k="The draft itself" p="absent">Generated by a model in the live app. This page does not show or imitate it.</Row>
    </dl>
  );

  if (id === "critique") return (
    <dl className="tp-dl">
      <Row k="Rubric" p="source">
        <ol className="tp-textlist">
          <li>All four sections present with substantive content.</li>
          <li>Grounded in and consistent with the retrieved excerpts.</li>
          <li>Tailored to the patient&apos;s {pt.risk.risk_tier} risk tier, not generic.</li>
          <li>No contraindicated suggestions.</li>
        </ol>
      </Row>
      <Row k="Output shape" p="source"><code>CritiqueResult</code>: <code>passes</code> (bool) and <code>feedback</code> (a string, empty when it passes).</Row>
      <Row k="The verdict" p="absent">Produced by a model in the live app. Use the loop simulator below to see how either verdict is routed.</Row>
      <Row k="Limit">The critic is a second LLM call. It can be wrong in the same ways the drafter can.</Row>
    </dl>
  );

  if (id === "route") return (
    <dl className="tp-dl">
      <Row k="Rule" p="source">Pass: stop. Fail: count it, then revise while the count is at most {P.maxRevisions}. Once it exceeds {P.maxRevisions}, stop and deliver the last draft.</Row>
      <Row k="So" p="run">At most {P.maxRevisions} revisions, which is up to {P.maxRevisions + 1} drafts and {P.maxRevisions + 1} critiques.</Row>
      <Row k="Try it">The loop simulator further down lets you choose each critic verdict and see the routing.</Row>
    </dl>
  );

  return (
    <dl className="tp-dl">
      <Row k="Shown to the user" p="source">The risk percentage and tier, a one-line method note, warnings for out-of-range age or approximated race, a self-critique status line, the four plan sections, and an expandable list of the five retrieved sources with file and page.</Row>
      <Row k="Sources" p="source">The list is the five retrieved chunks. It is not a per-recommendation citation, so a single recommendation is not linked to a single source.</Row>
      <Row k="Plan text" p="absent">Model output. Not reproduced on this page.</Row>
      <Row k="Reminder">The app labels itself an educational demo and not a validated clinical tool.</Row>
    </dl>
  );
}

export default function AgentWorkflow() {
  const rm = useReducedMotion();
  const [pid, setPid] = useState(preventive.patients[0].id);
  const [active, setActive] = useState(1);
  const [playing, setPlaying] = useState(false);
  const pt = preventive.patients.find((p) => p.id === pid)!;
  const cur = NODES[active];

  const boxRef = useRef<HTMLOListElement>(null);
  const els = useRef<Record<string, HTMLElement | null>>({});
  const [arc, setArc] = useState<{ d: string; w: number; h: number; lx: number; ly: number } | null>(null);
  const measure = useCallback(() => {
    const box = boxRef.current, a = els.current.route, b = els.current.draft;
    if (!box || !a || !b) return;
    const bb = box.getBoundingClientRect(), ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    const x1 = ra.right - bb.left, y1 = ra.top + ra.height / 2 - bb.top;
    const x2 = rb.right - bb.left, y2 = rb.top + rb.height / 2 - bb.top;
    const out = bb.width - 24;
    setArc({ d: `M ${x1} ${y1} H ${out} V ${y2} H ${x2 + 7}`, w: bb.width, h: bb.height, lx: out, ly: (y1 + y2) / 2 });
  }, []);
  useLayoutEffect(() => {
    measure();
    const box = boxRef.current;
    if (!box) return;
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setActive((a) => {
        if (a >= NODES.length - 1) { setPlaying(false); return a; }
        return a + 1;
      });
    }, 1700);
    return () => clearInterval(t);
  }, [playing]);

  const loopOn = ["draft", "critique", "route"].includes(cur.id);

  return (
    <div className="cs-panel pc-panel">
      <div className="cs-panel__top">
        <h3 className="cs-panel__title">Step through one run</h3>
        <div className="cs-chips" role="group" aria-label="Choose a sample patient">
          {preventive.patients.map((p) => (
            <button key={p.id} type="button" className={`cs-chip${p.id === pid ? " is-on" : ""}`} aria-pressed={p.id === pid} onClick={() => setPid(p.id)}>
              {p.age}{p.sex === "female" ? "F" : "M"} · {p.risk.risk_tier}
            </button>
          ))}
        </div>
      </div>
      <p className="cs-panel__why">
        <b>Three fictional patients.</b> Each step is tagged with where its content comes from. The risk values are real outputs of the repository&apos;s code. The retrieval ranking, the draft and the critic&apos;s verdict come from models and a vector index that this page does not run, so they are not shown.
      </p>

      <div className="pc-controls" role="group" aria-label="Walkthrough controls">
        <button type="button" className="cs-chip" onClick={() => { setPlaying(false); setActive((a) => Math.max(0, a - 1)); }} disabled={active === 0}>← Previous</button>
        <button type="button" className="cs-chip" onClick={() => { setPlaying(false); setActive((a) => Math.min(NODES.length - 1, a + 1)); }} disabled={active === NODES.length - 1}>Next →</button>
        {!rm && (
          <button type="button" className="cs-chip" onClick={() => { if (!playing && active >= NODES.length - 1) setActive(0); setPlaying((v) => !v); }} aria-pressed={playing}>
            {playing ? "Pause" : "Play through"}
          </button>
        )}
        <span className="pc-stepcount" aria-live="polite">Step {active + 1} of {NODES.length}</span>
      </div>

      <div className="tp-explorer pc-explorer">
        <div className="pc-lane">
          <ol className="pc-nodes" ref={boxRef}>
            {arc && (
              <svg className="tp-wires" width={arc.w} height={arc.h} aria-hidden="true" focusable="false">
                <defs><marker id="pc-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L8 4 L0 8 z" className={`pc-arrow${loopOn ? " is-on" : ""}`} /></marker></defs>
                <motion.path d={arc.d} className={`pc-loop${loopOn ? " is-on" : ""}`} markerEnd="url(#pc-arrow)" initial={rm ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9 }} />
                <text transform={`translate(${arc.w - 8} ${arc.ly}) rotate(-90)`} textAnchor="middle" className="tp-wire__lbl tp-wire__lbl--duplicate">revise, up to 2×</text>
              </svg>
            )}
            {NODES.map((n, i) => (
              <li key={n.id} className={`pc-node-li${i < active ? " is-done" : ""}`}>
                <button
                  type="button"
                  ref={(el) => { els.current[n.id] = el; }}
                  className={`tp-node pc-node pc-node--${n.lane}${i === active ? " is-sel" : i < active ? " is-up" : " is-dim"}`}
                  onClick={() => { setPlaying(false); setActive(i); }}
                  aria-pressed={i === active}
                  aria-label={`Step ${n.n}: ${n.t}. ${LANE_LABEL[n.lane]}. ${n.blurb}`}
                >
                  <span className="tp-node__tag">{n.n} · {LANE_LABEL[n.lane]}</span>
                  <span className="tp-node__t">{n.t}</span>
                  <span className="tp-node__s">{n.blurb}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <aside className="tp-detail" aria-live="polite">
          <p className="tp-detail__kind">{cur.n} · {LANE_LABEL[cur.lane]} · <code>{cur.file}</code></p>
          <h4 className="tp-detail__t">{cur.t}</h4>
          <Detail id={cur.id} pt={pt} />
        </aside>
      </div>
      <p className="cs-small">Sample patients are invented for this page. Not medical advice.</p>
    </div>
  );
}
