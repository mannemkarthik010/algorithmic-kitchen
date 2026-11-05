"use client";
import { useState } from "react";
import { preventive, simulateLoop } from "./preventive-data";

/** The router's real logic, driven by verdicts the visitor chooses. No model is called. */
export default function LoopSim() {
  const max = preventive.pipeline.maxRevisions;
  const [v, setV] = useState<boolean[]>([false, false, false]);
  const res = simulateLoop(v, max);
  const reached = (i: number) => i < res.rounds.length;
  const set = (i: number, pass: boolean) => setV((prev) => prev.map((x, j) => (j === i ? pass : x)));

  return (
    <div className="pc-sim">
      <div className="pc-sim__ctl">
        {[0, 1, 2].map((i) => (
          <fieldset key={i} className={`pc-sim__f${reached(i) ? "" : " is-off"}`} disabled={!reached(i)}>
            <legend>Critic verdict on draft {i + 1}</legend>
            <div className="cs-seg" role="group">
              <button type="button" className={!v[i] ? "is-on" : ""} aria-pressed={!v[i]} onClick={() => set(i, false)}>Fail</button>
              <button type="button" className={v[i] ? "is-on" : ""} aria-pressed={v[i]} onClick={() => set(i, true)}>Pass</button>
            </div>
            {!reached(i) && <span className="pc-sim__na">not reached</span>}
          </fieldset>
        ))}
      </div>

      <ol className="pc-sim__rounds">
        {res.rounds.map((r) => (
          <li key={r.draft} className={r.routed === "end" ? "is-end" : ""}>
            <span className="pc-sim__n">Draft {r.draft}</span>
            <span>Critic {r.pass ? "passes" : "fails"}. Router: <b>{r.routed === "end" ? "stop" : "revise"}</b>, because {r.reason}.</span>
          </li>
        ))}
      </ol>

      <dl className="pc-sim__out">
        <div><dt>Drafts written</dt><dd>{res.rounds.length}</dd></div>
        <div><dt>Revisions run</dt><dd>{res.revisionsRun}</dd></div>
        <div><dt>Counter at the end</dt><dd>{res.revisionCount}</dd></div>
        <div className="pc-sim__cap"><dt>Caption the app shows</dt><dd>{res.caption}</dd></div>
      </dl>
      {!res.passed && (
        <p className="pc-sim__note">
          Reading the code, two things here are worth knowing. The counter counts failed critiques, so after the cap it reads {res.revisionCount} although {res.revisionsRun} revisions ran. And the app labels the result &quot;best draft&quot;, but the graph simply returns the last draft it wrote.
        </p>
      )}
      <p className="cs-small cs-small--light">A port of <code>_route_after_critique</code> and the revision counter in <code>critique_plan</code>, with verdicts you choose. It does not call a model and does not predict how often the real critic fails.</p>
    </div>
  );
}
