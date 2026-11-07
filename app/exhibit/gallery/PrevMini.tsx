"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { preventive, simulateLoop } from "../../components/case/preventive-data";
import { LIMITS, SCENARIOS, STAGES } from "./data";

/**
 * Preventive Care as a miniature agent-workflow editor. The stages and the router are the repository's real ones and
 * strictly sequential. The replay walks Risk, Retrieve, then Draft, Critique and Route once per draft the chosen critic
 * scenario produces, using the real simulateLoop router. No retrieved passage, draft or critic text is shown: those
 * need a live model, and this page does not run one.
 */
export default function PrevMini({ onExpand, active }: { onExpand: () => void; active: boolean }) {
  const rm = useReducedMotion();
  const [sel, setSel] = useState(0);
  const [scn, setScn] = useState<(typeof SCENARIOS)[number]["id"]>("once");
  const [patient, setPatient] = useState(preventive.patients[1].id);
  const [step, setStep] = useState(-1);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const sim = useMemo(() => simulateLoop(SCENARIOS.find((s) => s.id === scn)!.verdicts as unknown as boolean[], preventive.pipeline.maxRevisions), [scn]);
  // the visiting order of stages: 0,1 then [2,3,4] per draft
  const path = useMemo(() => [0, 1, ...sim.rounds.flatMap(() => [2, 3, 4])], [sim]);
  const p = preventive.patients.find((x) => x.id === patient)!;
  const here = step >= 0 ? path[step] : sel;
  const st = STAGES[here];

  const stop = () => { if (timer.current) clearInterval(timer.current); timer.current = null; };
  useEffect(() => () => stop(), []);
  const replay = () => {
    stop();
    if (rm) { setStep(path.length - 1); return; }
    setStep(0);
    let i = 0;
    timer.current = setInterval(() => { i += 1; if (i >= path.length) { stop(); return; } setStep(i); }, 650);
  };
  const round = step >= 2 ? Math.floor((step - 2) / 3) : -1;
  const xs = [8, 28, 48, 68, 88];

  return (
    <div className="pm">
      <header className="pm__bar">
        <span className="pm__title">Preventive Care agent · workflow</span>
        <span className="pm__chip">Prototype · sequential, not parallel</span>
      </header>

      <div className="pm__canvas">
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="pm__wires" aria-hidden="true">
          <path d="M8 16 H88" className="pm__w" />
          <motion.path d="M8 16 H88" className="pm__w pm__w--on" initial={false} animate={{ pathLength: step < 0 ? 0 : Math.min(1, (Math.min(path[step], 4)) / 4) }} transition={rm ? { duration: 0 } : { duration: 0.5 }} />
          <path d="M88 24 C88 38, 48 38, 48 24" className="pm__loop" />
        </svg>
        <p className="pm__looplab">revise · at most {preventive.pipeline.maxRevisions}×</p>
        {STAGES.map((s, i) => {
          const live = step >= 0 && path[step] === i;
          const visited = step >= 0 && path.slice(0, step + 1).includes(i);
          return (
            <button key={s.n} type="button" style={{ left: `${xs[i]}%` }} tabIndex={active ? 0 : -1}
              className={`pm__node pm__node--${s.lane === "Code" ? "code" : s.lane === "LLM" ? "llm" : "vec"}${here === i ? " is-on" : ""}${visited ? " is-seen" : ""}${live ? " is-live" : ""}`}
              aria-pressed={here === i} aria-label={`Stage ${s.n}, ${s.t}, ${s.lane}`}
              onClick={() => { stop(); setStep(-1); setSel(i); }}>
              <span className="pm__n">{s.n}</span><b>{s.t}</b><small>{s.lane}</small>
            </button>
          );
        })}
      </div>

      <div className="pm__ins" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={here} initial={rm ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <p className="pm__stat"><b>{st.stat}</b> {st.statL}</p>
            <p className="pm__d">{st.d}</p>
            <p className="pm__runs"><span>{st.runs}</span>
              {here === 0 && <> · sample patient <b>{p.risk.risk_percentage}%</b>, {p.risk.risk_tier}</>}
              {here === 4 && step >= 0 && round >= 0 && <> · draft {round + 1}: critic {sim.rounds[round].pass ? "passes" : "fails"}, router {sim.rounds[round].routed === "end" ? "stops" : "revises"}</>}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pm__ctl">
        <div role="group" aria-label="Sample patient (invented, for the risk calculation)" className="pm__seg">
          {preventive.patients.map((x) => (<button key={x.id} type="button" className={patient === x.id ? "is-on" : ""} aria-pressed={patient === x.id} onClick={() => setPatient(x.id)} tabIndex={active ? 0 : -1}>{x.label.replace("Sample patient ", "Patient ")}</button>))}
        </div>
        <div role="group" aria-label="Critic scenario" className="pm__seg">
          {SCENARIOS.map((x) => (<button key={x.id} type="button" className={scn === x.id ? "is-on" : ""} aria-pressed={scn === x.id} onClick={() => { stop(); setStep(-1); setScn(x.id); }} tabIndex={active ? 0 : -1}>{x.label}</button>))}
        </div>
        <button type="button" className="pm__play" onClick={replay} tabIndex={active ? 0 : -1}>▶ Replay</button>
      </div>

      <footer className="pm__foot">
        <p>{LIMITS[0]} The page runs no retriever, drafter or critic, so it shows no retrieved passages or generated plans.</p>
        <button type="button" className="mw-open" onClick={onExpand} tabIndex={active ? 0 : -1}>Open the theatre <span aria-hidden="true">↗</span></button>
      </footer>
    </div>
  );
}
