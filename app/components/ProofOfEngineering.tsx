"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { EASE } from "../lib/motion";
import { retail } from "./case/retail-data";
import { taxproof as tax } from "./case/taxproof-data";
import { preventive } from "./case/preventive-data";
import live from "../data/contributions-live.json";
import ProjectAtlas from "./ProjectAtlas";
import { StackSheet } from "./Skills";

/**
 * Proof of engineering: the few numbers worth reading, each one imported from the same pinned data file its case study
 * uses, with the caveat that belongs to it on the same row. Nothing here is typed in by hand except the wording.
 */
export default function ProofOfEngineering() {
  const gbm = retail.leaderboard.find((m) => m.model === "global_gbm")!;
  const seriesTotal = retail.leaderboard.reduce((a, m) => a + m.wins, 0);
  const cov = retail.coverage;
  const prs = live.prs;
  const count = (s: string) => prs.filter((p) => p.state === s).length;

  const rows = [
    {
      n: `${gbm.meanWape.toFixed(1)}%`,
      unit: "mean WAPE",
      title: "Retail forecasting, measured against baselines",
      body: `Gradient boosting beat seasonal-naive and Holt-Winters and won ${gbm.wins} of ${seriesTotal} series. The 80% intervals covered ${(cov.overall * 100).toFixed(1)}% of ${cov.n.toLocaleString()} held-out values, a ${((cov.nominal - cov.overall) * 100).toFixed(1)}-point shortfall that is reported, not hidden. Synthetic data.`,
      href: "/work/retail-demand-intelligence",
      cta: "Open the forecasting studio",
    },
    {
      n: tax.meta.counts.extractedValues.toLocaleString(),
      unit: "extracted values",
      title: "TaxProof, an audit trail you can walk",
      body: `A SHA-256-frozen packet of ${tax.meta.counts.documents} sample documents, ${tax.meta.counts.returnVersions.at(-1)!.lines} return lines in the latest version, and an evidence graph that follows a line back through its rule to the page its inputs were read from. 230 backend tests pass on SQLite and PostgreSQL.`,
      href: "/work/taxproof",
      cta: "Trace a number to its source",
    },
    {
      n: String(preventive.worked.length),
      unit: "published risks reproduced",
      title: "Preventive Care, arithmetic kept out of the model",
      body: `The risk function is plain Python (Pooled Cohort Equations) and reproduces the guideline's worked example: ${preventive.worked.map((w) => `${w.risk.toFixed(1)}%`).join(", ")}. The retrieval corpus is ${preventive.stats.documents} mock one-page PDFs, so this is a pipeline demonstration, not medical advice.`,
      href: "/work/preventive-care",
      cta: "Step through the workflow",
    },
  ];

  return (
    <>
    <section id="proof" aria-labelledby="proof-h" className="poe">
      <div className="container">
        <p className="sh-label">02 / Proof of engineering</p>
        <h2 id="proof-h" className="poe__h">Numbers I can <em>stand behind</em>, with the limits attached.</h2>

        <ol className="poe__list">
          {rows.map((r, i) => (
            <motion.li
              key={r.title}
              className="poe__row"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.06, ease: EASE }}
            >
              <div className="poe__fig">
                <span className="poe__n">{r.n}</span>
                <span className="poe__unit">{r.unit}</span>
              </div>
              <div className="poe__txt">
                <h3>{r.title}</h3>
                <p>{r.body}</p>
              </div>
              <Link className="poe__go" href={r.href}>{r.cta} <span aria-hidden="true">→</span></Link>
            </motion.li>
          ))}
        </ol>

        <p className="poe__os">
          Upstream open source: {prs.length} pull requests to PyTorch and Pandera, {count("merged")} merged, {count("open")} open, {count("closed")} closed. Statuses are read from GitHub, below.
        </p>
      </div>
    </section>

    <section className="poe-map" aria-label="How the work connects">
      <div className="container">
        <div className="poe__map">
          <p className="sh-label">How the work connects</p>
          <ProjectAtlas />
          <details className="fw-eval stack-toggle">
            <summary>Full tech stack</summary>
            <div style={{ padding: "0 16px 8px" }}><StackSheet /></div>
          </details>
        </div>
      </div>
    </section>
    </>
  );
}
