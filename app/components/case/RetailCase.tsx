"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import Nav from "../Nav";
import ExFooter from "../../exhibit/ExFooter";
import CaseNav from "../../exhibit/CaseNav";
import CaseNext from "../../exhibit/CaseNext";
import CommandPalette from "../CommandPalette";
import ForecastExplorer from "./ForecastExplorer";
import FleetPanel from "./FleetPanel";
import CalibrationPlot from "./CalibrationPlot";
import MonitoringPanel from "./MonitoringPanel";
import AgentPanel from "./AgentPanel";
import PipelineDiagram from "./PipelineDiagram";
import { retail, SOURCE_URL } from "./retail-data";
import { EASE } from "../../lib/motion";

const reveal = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-60px" }, transition: { duration: 0.6, ease: EASE } } as const;

const DECISIONS: [string, string][] = [
  ["Pick a model per series, not one for everyone", "Seasonal-naive wins 77 of 240 series. Deploying gradient boosting everywhere would be quietly worse on nearly a third of them."],
  ["Score offline, serve by reading", "Online latency never depends on modelling cost, and every answer traces back to a versioned batch of predictions you can audit later."],
  ["Measure the intervals instead of asserting them", "Coverage came out at 74.2% against an 80% target. A claim of 'calibrated' would have been wrong."],
  ["Monitor each series against its own history", "The fleet average stayed flat while four series degraded. Averages hide exactly the failures worth catching."],
  ["Disclose every substitution", "Holt-Winters uses fixed smoothing constants. Occlusion and permutation importance stand in for SHAP, which could not be installed. Each is documented as a cost."],
];

const LIMITS = [
  "The dataset is synthetic, generated to mirror a retail chain. Nothing here was measured on real sales.",
  "The AWS infrastructure (SageMaker, Lambda, API Gateway, Bedrock) is written in Terraform and tested against mocked AWS calls. It has not been applied to a live AWS account.",
  "The live demo runs on Vercel as a serverless function. It has no authentication or rate limiting.",
  "The monitoring is a simulation that replays backtest cutoffs. It is not watching new weekly data arrive.",
  "The agent evaluation uses a deterministic keyword router. No real LLM backend has been benchmarked.",
  "Feature importance is computed in-sample, and the explanations are approximations, not SHAP.",
  "Prediction intervals are too narrow (74.2% against an 80% target). Fixing that is future work, not done.",
];

export default function RetailCase() {
  return (
    <main className="cs cs--retail">
      <Nav />

      {/* HERO: split, asymmetric */}
      <header className="cs-hero">
        <div className="container">
          <Link className="cs-back" href="/#work">← The exhibition</Link>
          <p className="cs-eyebrow">Case study 01 · Forecasting, anomaly detection, an auditable agent</p>
          <motion.h1 className="cs-h1" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
            Demand forecasts that are <em>honest</em> about their own accuracy.
          </motion.h1>

          <div className="cs-hero__grid">
            <dl className="cs-meta">
              <div><dt>Role</dt><dd>Sole engineer, from data generator to dashboard</dd></div>
              <div><dt>Built with</dt><dd>Python, scikit-learn, Flask, hand-rolled SVG, Terraform, Docker, GitHub Actions</dd></div>
              <div><dt>Status</dt><dd>Live demo on Vercel. CI passing on every push.</dd></div>
              <div><dt>Links</dt><dd className="cs-links"><a href="https://retail-intel-platform.vercel.app" target="_blank" rel="noopener noreferrer">Live demo ↗</a><a href="https://github.com/mannemkarthik010/retail-intel-platform" target="_blank" rel="noopener noreferrer">GitHub ↗</a></dd></div>
            </dl>
            <div className="cs-notice" role="note">
              <b>All data on this page is synthetic.</b> The repository generates a Walmart-style dataset (20 stores × 12 departments × 260 weeks) because the build environment could not reach real sources. The repo says so in its README and data-provenance note, and so does this page. Every figure below is read from the repo at one pinned commit.
            </div>
          </div>

          <a className="cs-shot" href="https://retail-intel-platform.vercel.app" target="_blank" rel="noopener noreferrer" aria-label="Open the live demo">
            <div className="cs-shot__bar" aria-hidden="true"><i /><i /><i /><span>retail-intel-platform.vercel.app</span></div>
            <Image src="/images/projects/retail-intel.jpg" alt="The live dashboard: an eight-week forecast with a prediction interval, a model backtest comparison and flagged anomalies" width={1200} height={750} sizes="(max-width: 1200px) 94vw, 1180px" priority />
          </a>

          <div className="cs-keys">
            {[
              ["7.9%", "mean WAPE, gradient boosting, the best of three models"],
              ["154 / 240", "series won by gradient boosting; seasonal-naive won 77"],
              ["74.2%", "measured coverage of the 80% prediction intervals"],
              ["37 / 37", "agent routing cases pass, against a deterministic router"],
            ].map(([n, l]) => (<div key={n}><b>{n}</b><span>{l}</span></div>))}
          </div>
        </div>
      </header>
      <CaseNav />

      {/* PROBLEM: sticky rail */}
      <section id="problem" className="cs-sec cs-paper">
        <div className="container cs-split">
          <div className="cs-rail"><span>01</span><h2>The problem</h2></div>
          <div>
            <p className="cs-lead">A retailer needs the next eight weeks of demand for hundreds of store and department combinations. No single model wins everywhere, and most forecasting systems state their confidence instead of measuring it.</p>
            <p className="cs-p cs-p--wide">I wanted a system that chooses the right model for each series, says how sure it is, flags what looks wrong, watches itself, and can be questioned in plain English with an audit trail behind every answer. And I wanted its write-up to say where it falls short.</p>
          </div>
        </div>
      </section>

      {/* EXPLORER: ivory panel */}
      <section className="cs-sec cs-sec--tight">
        <div className="container">
          <motion.div {...reveal}><ForecastExplorer /></motion.div>
        </div>
      </section>

      {/* FLEET: darker band */}
      <section id="model-selection" className="cs-band">
        <div className="container">
          <motion.div {...reveal} className="cs-band__head">
            <p className="cs-eyebrow">02 · Model selection</p>
            <h2 className="cs-h2">No universal winner.</h2>
            <p className="cs-p cs-p--light">Three models compete on every series in a rolling-origin backtest. Gradient boosting has the best average, but the humble &quot;same week last year&quot; beats it on nearly a third of the fleet, so the platform selects per series.</p>
          </motion.div>
          <FleetPanel />
        </div>
      </section>

      {/* CALIBRATION: what went wrong */}
      <section id="evaluation" className="cs-sec">
        <div className="container cs-split">
          <div className="cs-rail"><span>03</span><h2>What the model got wrong</h2></div>
          <div>
            <p className="cs-lead">Every forecast ships with an 80% interval. The honest question is whether it really is 80%. On held-out data it is {(retail.coverage.overall * 100).toFixed(1)}%.</p>
            <CalibrationPlot />
            <p className="cs-p cs-p--wide">The bands are too narrow, and the likely cause differs by method. The normal-approximation band assumes constant error across all eight weeks, when error really grows with the horizon. The quantile band is queried along one recursive path and understates how uncertainty compounds. The next step would be a calibration multiplier or conformal prediction. I have not built it, so the gap stays on the page.</p>
            <div className="cs-note-box cs-note-box--wide">
              <b>A second finding: exact numbers belong to an environment.</b>{" "}Re-running the pipeline on another machine moved the gradient-boosting win count from 140 to 154 series, with byte-identical data and a fixed seed. scikit-learn&apos;s boosted trees are repeatable within one version and platform, not across them. The conclusions held; the exact figures did not. The figures on this page come from one pinned commit.
            </div>
          </div>
        </div>
      </section>

      {/* SYSTEM */}
      <section id="system-design" className="cs-band cs-band--soft">
        <div className="container">
          <motion.div {...reveal} className="cs-band__head">
            <p className="cs-eyebrow">04 · System design</p>
            <h2 className="cs-h2">Score in batch. Serve by reading.</h2>
            <p className="cs-p cs-p--light">The load-bearing decision: training and scoring happen offline and write versioned artifacts. The online layer only reads them, so latency never depends on modelling cost and every answer is auditable after the fact. Click a stage.</p>
          </motion.div>
          <PipelineDiagram />
        </div>
      </section>

      {/* MONITORING */}
      <section className="cs-sec">
        <div className="container">
          <motion.div {...reveal} className="cs-band__head">
            <p className="cs-eyebrow">05 · Monitoring that acts</p>
            <h2 className="cs-h2">The average looked fine. Four series did not.</h2>
          </motion.div>
          <MonitoringPanel />
        </div>
      </section>

      {/* AGENT */}
      <section className="cs-band">
        <div className="container">
          <motion.div {...reveal} className="cs-band__head">
            <p className="cs-eyebrow">06 · The agent</p>
            <h2 className="cs-h2">An assistant whose answers you can audit.</h2>
          </motion.div>
          <AgentPanel />
        </div>
      </section>

      {/* DECISIONS + LIMITS */}
      <section className="cs-sec cs-paper">
        <div className="container cs-two">
          <motion.div {...reveal}>
            <p className="cs-eyebrow">07 · Decisions</p>
            <h2 className="cs-h2">Trade-offs I would defend.</h2>
            <ol className="cs-dec">
              {DECISIONS.map(([t, d], i) => (<li key={t}><span>{String(i + 1).padStart(2, "0")}</span><div><b>{t}</b><p>{d}</p></div></li>))}
            </ol>
          </motion.div>
          <motion.div {...reveal}>
            <p className="cs-eyebrow">08 · Limitations</p>
            <h2 className="cs-h2">What this is not.</h2>
            <ul className="cs-lim">
              {LIMITS.map((l) => (<li key={l}>{l}</li>))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* CLOSE */}
      <section className="cs-end">
        <div className="container">
          <p className="cs-eyebrow">Explore it yourself</p>
          <h2 className="cs-h2">See it run, or read the code.</h2>
          <div className="cs-end__links">
            <a className="pill-cta" href="https://retail-intel-platform.vercel.app" target="_blank" rel="noopener noreferrer">Open the live demo ↗</a>
            <a className="fw-ghost" href="https://github.com/mannemkarthik010/retail-intel-platform" target="_blank" rel="noopener noreferrer">GitHub repository ↗</a>
            <Link className="fw-ghost" href="/#work">← Back to the exhibition</Link>
          </div>
          <p className="cs-src">Figures on this page are read from <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">{retail.source.repo} @ {retail.source.commit.slice(0, 7)}</a> by <code>scripts/build-retail-data.py</code>, which asserts them against the repo&apos;s own evaluation report.</p>
        </div>
      </section>

      <CaseNext current="retail" />
      <ExFooter />
      <CommandPalette />
    </main>
  );
}
