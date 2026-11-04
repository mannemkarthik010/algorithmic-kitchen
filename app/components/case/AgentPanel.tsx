"use client";
import { retail } from "./retail-data";

const TOOLS = [
  ["get_forecast", "Next 8 weeks for a series, with its model and error"],
  ["get_anomalies", "Flagged weeks, with the reason each was flagged"],
  ["explain_change", "Why the latest week moved: trend, season, promo, holiday"],
  ["top_movers", "Biggest gainers and decliners across the fleet"],
  ["simulate_scenario", "A what-if (markdown, holiday) recomputed live"],
  ["explain_forecast_drivers", "Which inputs drove a gradient-boosted forecast"],
] as const;

const LABEL: Record<string, string> = { forecast: "Forecast", anomalies: "Anomalies", explain_change: "Explain a change", top_movers: "Top movers", what_if: "What-if", drivers: "Drivers", known_limitation: "Known limitations" };

/** A real audit trail from the repo, and an evaluation result stated at its true strength. */
export default function AgentPanel() {
  const t = retail.trace;
  const a = retail.agent;
  return (
    <div className="cs-agent">
      <div>
        <h4 className="cs-h4 cs-h4--light">Six read-only tools, one audit trail</h4>
        <ul className="cs-tools">
          {TOOLS.map(([n, d]) => (<li key={n}><code>{n}</code><span>{d}</span></li>))}
        </ul>
        <div className="cs-trace" aria-label="A real agent trace from the repository">
          <p className="cs-trace__k">trace · {t.backend} backend</p>
          <p><span>question</span> {t.question}</p>
          <p><span>reasoning</span> {t.step.reasoning}</p>
          <p><span>tool call</span> <code>{t.step.tool}({Object.entries(t.step.args).map(([k, v]) => `${k}=${v}`).join(", ")})</code></p>
          <p><span>read from</span> <code>reports/current_forecasts.csv</code> for {t.result.series}, model {t.result.model_used}</p>
          <p><span>answer</span> {t.answer[0].split(" (")[0]}, followed by the eight weekly values.</p>
        </div>
        <p className="cs-small cs-small--light">Every answer carries the tool, arguments and reasoning behind it, so nothing is &quot;trust the AI&quot;.</p>
      </div>

      <div>
        <h4 className="cs-h4 cs-h4--light">Evaluation: {a.passed} of {a.cases} routing cases pass</h4>
        <div className="cs-eval">
          {Object.entries(a.byCategory).map(([k, v]) => (
            <div key={k} className="cs-eval__row">
              <span>{LABEL[k] ?? k}</span>
              <span className="cs-eval__bar"><i style={{ width: `${(v.passed / v.n) * 100}%` }} /></span>
              <b>{v.passed}/{v.n}</b>
            </div>
          ))}
        </div>
        <div className="cs-note-box cs-note-box--dark">
          <b>Read this at its true strength.</b>{" "}These {a.cases} cases run against a deterministic keyword router, not an LLM. Real Anthropic, OpenAI and Bedrock backends are implemented, but none has been benchmarked here. {a.knownLimitations} of the cases are known limitations that the suite asserts as limitations, for example a request to compare two stores is answered with a single-store forecast.
        </div>
      </div>
    </div>
  );
}
