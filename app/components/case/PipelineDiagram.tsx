"use client";
import { useState } from "react";

const STAGES = [
  { id: "data", lane: "offline", t: "Data", f: "data/generate_data.py", d: "20 stores × 12 departments × 260 weeks of synthetic weekly sales, with holidays, five markdown columns, a COVID-like shock and an injected supply disruption.", o: "retail_sales.csv · store_meta.csv · macro_features.csv" },
  { id: "backtest", lane: "offline", t: "Backtest", f: "src/backtest.py", d: "Six rolling-origin cutoffs, eight weeks ahead, for all 240 series. Seasonal-naive, Holt-Winters and a global gradient-boosted model compete, retrained at each cutoff on data strictly before it.", o: "series_summary.csv · per_cutoff_metrics.csv · selected_model.json" },
  { id: "forecast", lane: "offline", t: "Forecast + interval", f: "src/intervals.py", d: "Next-8-week forecasts from each series' selected model, each with an 80% band. Coverage is then measured on held-out data instead of assumed.", o: "current_forecasts.csv · interval_coverage.json" },
  { id: "anomaly", lane: "offline", t: "Anomalies", f: "src/anomaly.py", d: "A statistical test and an Isolation Forest, with holiday and promo cross-checks so explained spikes are not raised as incidents.", o: "anomaly_flags.csv" },
  { id: "monitor", lane: "offline", t: "Monitor + retrain", f: "scripts/retrain_flagged.py", d: "Per-series drift checks against each series' own history. Flagged series are re-evaluated and re-selected when a different model is better; every decision is logged.", o: "retraining_log.jsonl (append-only) · selected_model.json updated" },
  { id: "agent", lane: "online", t: "Agent", f: "src/agent.py", d: "A small tool-calling agent that only reads the batch artifacts (except the what-if tool). A swappable LLM backend: deterministic mock by default, Anthropic, OpenAI or Bedrock when configured.", o: "agent_traces.jsonl (audit trail)" },
  { id: "serve", lane: "online", t: "API + dashboard", f: "app/server.py", d: "A thin Flask layer and a dashboard with hand-rolled SVG charts and no external JavaScript. The live demo runs it as a serverless function on Vercel.", o: "retail-intel-platform.vercel.app" },
] as const;

/** The load-bearing decision: score offline in batch, serve online by reading. Click a stage. */
export default function PipelineDiagram() {
  const [active, setActive] = useState<string>("backtest");
  const cur = STAGES.find((s) => s.id === active)!;
  const lane = (l: "offline" | "online") => STAGES.filter((s) => s.lane === l);
  return (
    <div className="cs-pipe">
      {(["offline", "online"] as const).map((l) => (
        <div key={l} className="cs-pipe__lane">
          <p className="cs-pipe__lbl">{l === "offline" ? "Offline, batch scoring" : "Online, read-only"}</p>
          <div className="cs-pipe__row">
            {lane(l).map((s, i) => (
              <button key={s.id} type="button" className={`cs-node${active === s.id ? " is-on" : ""}`} onClick={() => setActive(s.id)} onMouseEnter={() => setActive(s.id)} aria-pressed={active === s.id}>
                <span className="cs-node__n">{String(STAGES.indexOf(s) + 1).padStart(2, "0")}</span>
                <span className="cs-node__t">{s.t}</span>
                {i < lane(l).length - 1 && <span className="cs-node__arrow" aria-hidden="true">→</span>}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="cs-pipe__detail" role="status">
        <p className="cs-pipe__file">{cur.f}</p>
        <p className="cs-pipe__d">{cur.d}</p>
        <p className="cs-pipe__o"><span>writes / serves</span> {cur.o}</p>
      </div>
    </div>
  );
}
