"use client";
import { StatusChip } from "../StatusChip";
import Disclosure from "./Disclosure";
import CaseLink from "./CaseLink";
import ForecastPreview from "./ForecastPreview";
import { Details, getProject } from "./shared";
import { retail } from "../case/retail-data";

const LIMITS = [
  "The dataset is synthetic, generated to mirror a retail chain. Nothing here was measured on real sales.",
  "The AWS infrastructure is written in Terraform and tested against mocked AWS calls. It has not been applied to a live account.",
  "The 80% prediction intervals covered 74.2% of held-out values, below target. That gap is reported, not fixed.",
  "The agent evaluation uses a deterministic keyword router. No real LLM backend has been benchmarked.",
];

export default function RetailShowcase() {
  const { p } = getProject("retail-intel");
  const lb = Object.fromEntries(retail.leaderboard.map((r) => [r.model, r]));
  const gbm = lb.global_gbm, sn = lb.seasonal_naive, hw = lb.holt_winters;
  return (
    <article id="work-retail" className="sw sw-retail" aria-labelledby="sw-retail-title">
      <div className="sw-retail__side">
        <header className="sw-head">
          <span className="sw-head__no" aria-hidden="true">2/3</span>
          <p className="sw-eyebrow">Prediction, uncertainty, measured performance <StatusChip status={p.status} size="sm" /></p>
        </header>
        <h3 id="sw-retail-title" className="sw-title">Retail Demand Intelligence: forecasts that are <em>honest</em> about their own accuracy.</h3>
        <p className="sw-lead sw-lead--sm">A model chosen per series, an interval whose coverage was actually measured, and monitoring that acts on what it finds.</p>

        <dl className="sw-metrics">
          <div>
            <dt>Mean WAPE, best model</dt>
            <dd>{gbm.meanWape.toFixed(1)}<small>%</small></dd>
            <span>Gradient boosting. Seasonal-naive {sn.meanWape.toFixed(1)}%, Holt-Winters {hw.meanWape.toFixed(1)}%.</span>
          </div>
          <div>
            <dt>Series won</dt>
            <dd>{gbm.wins}<small> / {retail.fleet.length}</small></dd>
            <span>Seasonal-naive won {sn.wins}, so the platform picks per series.</span>
          </div>
          <div>
            <dt>Interval coverage</dt>
            <dd>{(retail.coverage.overall * 100).toFixed(1)}<small>%</small></dd>
            <span>Against an 80% target. Too narrow, and reported that way.</span>
          </div>
        </dl>

        <p className="sw-note"><b>Synthetic data.</b> {retail.events.n_stores} stores × {retail.events.n_depts} departments × {retail.events.n_weeks} weeks, generated for the project because real sources were unreachable.</p>

        <div className="sw-actions">
          <CaseLink href="/work/retail-demand-intelligence" className="pill-cta">Open the full explorer →</CaseLink>
          {p.demo && <a className="fw-ghost" href={p.demo} target="_blank" rel="noopener noreferrer">Live demo ↗</a>}
          {p.github && <a className="fw-ghost" href={p.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>}
        </div>
      </div>

      <div className="sw-retail__main">
        <div className="sw-fp-panel">
          <div className="sw-fp-panel__head">
            <h4>Forecasting laboratory</h4>
            <span>Real repository data, synthetic sales</span>
          </div>
          <ForecastPreview />
        </div>
        <Disclosure label="Technical details">
          <Details slug="retail-intel" limits={LIMITS} />
        </Disclosure>
      </div>
    </article>
  );
}
