"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Nav from "../Nav";
import Footer from "../Footer";
import CommandPalette from "../CommandPalette";
import AgentWorkflow from "./AgentWorkflow";
import LoopSim from "./LoopSim";
import { preventive, SOURCE_URL } from "./preventive-data";
import { EASE } from "../../lib/motion";

const reveal = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-60px" }, transition: { duration: 0.6, ease: EASE } } as const;

const DECISIONS: [string, string][] = [
  ["Keep arithmetic out of the model", "Risk is the published Pooled Cohort Equations in plain Python, checked against the guideline's worked example. The LLM receives the finished number and cannot get the maths wrong."],
  ["Constrain the draft to retrieved text", "The prompt says to ground the plan only in the retrieved excerpts, and the output is a typed schema with four sections, so a free-form answer cannot slip through."],
  ["Make a second pass argue with the first", "A rubric critic can send the plan back with specific feedback. A cap of two revisions keeps the loop from running forever."],
  ["Flag what the equations do not cover", "Ages outside 40 to 79 and groups beyond White and African American adults are flagged on screen instead of silently scored."],
];

const LIMITS = [
  "This is an educational prototype, not a validated clinical tool. No clinician has reviewed its output, and nothing here is medical advice.",
  "The knowledge base is a set of 12 mock one-page PDFs. Ten contain the same generic sentence under different titles and two are one-line stubs. The retrieval and source list show how the pipeline works, not that it is clinically grounded. Ingesting real guideline text is the obvious next step.",
  "The five retrieved sources are listed beside the plan, but individual recommendations are not linked to a source. \"Grounded\" is instructed in the prompt and checked by a critic, not verified claim by claim.",
  "The critic is another LLM call, so it can miss what the drafter gets wrong. The repository has no test suite and no evaluation of plan quality. The only verification is the risk function against its published worked example.",
  "After the revision cap the last draft is delivered. The app calls it the best draft, and the revision count in its status line counts failed critiques, so it can read one higher than the revisions that ran.",
  "The Pooled Cohort Equations were derived for White and African American adults aged 40 to 79. Other inputs are flagged or approximated, and this page makes no claim about accuracy beyond that range.",
  "This page does not run retrieval, the drafter or the critic. Those outputs are not shown, and nothing on the page is a recording of a live run.",
];

export default function PreventiveCase() {
  const m = preventive.meta;
  return (
    <main className="cs">
      <Nav />

      <header className="cs-hero">
        <div className="container">
          <Link className="cs-back" href="/#projects">← All work</Link>
          <p className="cs-eyebrow">Case study 03 · Agentic RAG, deterministic risk, critic loop</p>
          <motion.h1 className="cs-h1" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
            An agent that keeps the <em>arithmetic</em> out of the model.
          </motion.h1>

          <div className="cs-hero__grid">
            <dl className="cs-meta">
              <div><dt>Role</dt><dd>Sole engineer: risk code, retrieval, LangGraph agent, Streamlit app</dd></div>
              <div><dt>Built with</dt><dd>Python, LangGraph, LangChain, ChromaDB, sentence-transformers, Pydantic, Streamlit</dd></div>
              <div><dt>Status</dt><dd>Educational prototype, deployed on Streamlit</dd></div>
              <div><dt>Links</dt><dd className="cs-links"><a href={m.demoUrl} target="_blank" rel="noopener noreferrer">Live demo ↗</a><a href={m.repoUrl} target="_blank" rel="noopener noreferrer">GitHub ↗</a></dd></div>
            </dl>
            <div className="cs-notice" role="note">
              <b>Educational prototype. Not medical advice.</b> The knowledge base is 12 mock PDFs and the sample patients on this page are invented. Risk numbers below are real outputs of the repository&apos;s code. This page does not run the retriever or the language models, so it shows no retrieved passages or generated plans.
            </div>
          </div>

          <a className="cs-shot" href={m.demoUrl} target="_blank" rel="noopener noreferrer" aria-label="Open the live demo">
            <div className="cs-shot__bar" aria-hidden="true"><i /><i /><i /><span>preventive-care-recommendation.streamlit.app</span></div>
            <Image src="/images/projects/preventive-care.jpg" alt="The Streamlit app: a patient data form and the educational-demo notice" width={1200} height={676} sizes="(max-width: 1200px) 94vw, 1180px" priority />
          </a>

          <div className="cs-keys">
            {[
              ["4 / 4", "published worked-example cases reproduced by the repo's risk code (2.1, 3.0, 5.4, 6.1%)"],
              [`top ${preventive.pipeline.k}`, `chunks retrieved per query, from ${preventive.stats.documents} mock one-page PDFs`],
              [`≤ ${preventive.pipeline.maxRevisions}`, "revisions before the router stops and delivers the last draft"],
              ["0", "tests or plan-quality evaluations in the repository"],
            ].map(([n, l]) => (<div key={n}><b>{n}</b><span>{l}</span></div>))}
          </div>
        </div>
      </header>

      <section className="cs-sec">
        <div className="container cs-split">
          <div className="cs-rail"><span>01</span><h2>The problem</h2></div>
          <div>
            <p className="cs-lead">A language model will happily write a confident care plan, and happily get the risk arithmetic wrong.</p>
            <p className="cs-p cs-p--wide">In a medical setting a fluent answer with no source is worse than no answer. So I split the work by what each part is good at: published equations in plain code, passages from an index, a typed draft from the model, and a second pass that can reject the draft.</p>
            <p className="cs-p cs-p--wide">The result is a small LangGraph agent. This page lets you step through it, with every part labelled by whether it is computed here, read from the repository, or not shown.</p>
          </div>
        </div>
      </section>

      <section className="cs-sec cs-sec--tight">
        <div className="container">
          <motion.div {...reveal}><AgentWorkflow /></motion.div>
        </div>
      </section>

      <section className="cs-band">
        <div className="container">
          <motion.div {...reveal} className="cs-band__head">
            <p className="cs-eyebrow">02 · What I could verify</p>
            <h2 className="cs-h2">The one thing with a ground truth.</h2>
            <p className="cs-p cs-p--light">The risk function has a published answer to check against. I ran the repository&apos;s <code>utils.py</code> on the guideline&apos;s worked example (55 years, total cholesterol 213, HDL 50, systolic 120, untreated, non-smoker, no diabetes).</p>
          </motion.div>
          <div className="tp-table-wrap">
            <table className="tp-findings">
              <thead><tr><th>Sex</th><th>Race group</th><th>Repo output</th><th>Published</th></tr></thead>
              <tbody>
                {preventive.worked.map((w) => (<tr key={w.sex + w.race}><td>{w.sex}</td><td>{w.race}</td><td>{w.risk.toFixed(1)}%</td><td>{w.risk.toFixed(1)}%</td></tr>))}
              </tbody>
            </table>
          </div>
          <p className="cs-small cs-small--light">Published values are the ones the repository&apos;s own code comment cites (2.1, 3.0, 5.4, 6.1%). All four match. This checks the arithmetic, not the care plans.</p>
        </div>
      </section>

      <section className="cs-sec">
        <div className="container cs-split">
          <div className="cs-rail"><span>03</span><h2>What the knowledge base really is</h2></div>
          <div>
            <p className="cs-lead">{preventive.stats.boilerplateDocs} of the {preventive.stats.documents} documents say exactly the same thing.</p>
            <p className="cs-p cs-p--wide">The index holds mock guideline PDFs created to test the pipeline. Each is one page. This is the sentence in ten of them, under ten different titles:</p>
            <blockquote className="pc-quote">{preventive.boilerplate}</blockquote>
            <p className="cs-p cs-p--wide">The other two, the AHA 2023 and ESC 2021 files, are one-line stubs. So retrieval and the source list demonstrate the mechanics, and the plan text cannot be more grounded than this. I would rather say so here than let the architecture diagram imply otherwise.</p>
            <ul className="pc-corpus pc-corpus--page">
              {preventive.corpus.map((c) => (<li key={c.file}><code>{c.file}</code><span>{c.boilerplate ? "generic sentence" : "stub"} · {c.chars} characters</span></li>))}
            </ul>
          </div>
        </div>
      </section>

      <section className="cs-band cs-band--soft">
        <div className="container">
          <motion.div {...reveal} className="cs-band__head">
            <p className="cs-eyebrow">04 · The revision loop</p>
            <h2 className="cs-h2">Choose the critic&apos;s verdicts. Watch the router.</h2>
            <p className="cs-p cs-p--light">The router is ordinary code, so it can be explored exactly. Pick pass or fail for each draft and see when the loop stops.</p>
          </motion.div>
          <LoopSim />
        </div>
      </section>

      <section className="cs-sec">
        <div className="container cs-two">
          <motion.div {...reveal}>
            <p className="cs-eyebrow">05 · Decisions</p>
            <h2 className="cs-h2">Trade-offs I would defend.</h2>
            <ol className="cs-dec">
              {DECISIONS.map(([t, d], i) => (<li key={t}><span>{String(i + 1).padStart(2, "0")}</span><div><b>{t}</b><p>{d}</p></div></li>))}
            </ol>
          </motion.div>
          <motion.div {...reveal}>
            <p className="cs-eyebrow">06 · Limitations</p>
            <h2 className="cs-h2">What this is not.</h2>
            <ul className="cs-lim">
              {LIMITS.map((l) => (<li key={l}>{l}</li>))}
            </ul>
          </motion.div>
        </div>
      </section>

      <section className="cs-end">
        <div className="container">
          <p className="cs-eyebrow">Explore it yourself</p>
          <h2 className="cs-h2">Run the real app, or read the code.</h2>
          <div className="cs-end__links">
            <a className="pill-cta" href={m.demoUrl} target="_blank" rel="noopener noreferrer">Open the live demo ↗</a>
            <a className="fw-ghost" href={m.repoUrl} target="_blank" rel="noopener noreferrer">GitHub repository ↗</a>
            <Link className="fw-ghost" href="/#projects">← Back to all work</Link>
          </div>
          <p className="cs-src">Values on this page are read from <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">{m.repo} @ {m.sha.slice(0, 7)}</a> by <code>scripts/build-preventive-data.py</code>, which executes the repository&apos;s risk function and asserts every statement about the pipeline against its source.</p>
        </div>
      </section>

      <Footer />
      <CommandPalette />
    </main>
  );
}
