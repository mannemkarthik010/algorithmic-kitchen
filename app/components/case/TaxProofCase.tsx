"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import Nav from "../Nav";
import ExFooter from "../../exhibit/ExFooter";
import CaseNav from "../../exhibit/CaseNav";
import CaseNext from "../../exhibit/CaseNext";
import CommandPalette from "../CommandPalette";
import EvidenceGraph from "./EvidenceGraph";
import HashChain from "./HashChain";
import { taxproof, SOURCE_URL, DEMO_URL } from "./taxproof-data";
import { EASE } from "../../lib/motion";

const reveal = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-60px" }, transition: { duration: 0.6, ease: EASE } } as const;

const PRINCIPLES: [string, string][] = [
  ["AI investigates", "It reads, compares and explains. It never produces a number that ends up on the return."],
  ["Code calculates", "The supplied engine computes every line. TaxProof does not replace it."],
  ["Evidence proves", "Each figure points to the rule, the extracted value and the page it came from."],
  ["CPAs decide", "Corrections are proposals. A person approves them, and the engine's value is never overwritten."],
];

const LAYERS = [
  { id: "packet", t: "Packet", f: "okafor_lindqvist_2025_packet.json", d: "The supplied data is loaded once, hashed with SHA-256 and deep-frozen in memory. Any attempt to change it raises an error, and it is never written back.", o: "74 documents · 3,012 extracted values · three return versions" },
  { id: "index", t: "Index and resolver", f: "backend/app/packet/", d: "Read-only indexes over the frozen packet, plus one resolver for every kind of reference it uses: extracted values (ev-0226), return lines, document pages, prior-year pointers and household facts.", o: "Every reference in the packet must resolve (test-enforced)" },
  { id: "workpaper", t: "Workpaper layer", f: "backend/app/models.py", d: "The only mutable state: notes, verifications, adjustments, judgments, sign-offs, client questions and filing events. Rows point into the packet by reference string instead of copying its values.", o: "PostgreSQL, or SQLite for tests and zero-dependency runs" },
  { id: "services", t: "Services", f: "backend/app/services/", d: "The audit chain, sensitive-data masking, permissions, assurance checks and the evidence graph. The graph is derived: rebuilt from the packet, cached by its hash, with workpaper rows overlaid per request.", o: "audit_events (hash-chained) · access_logs" },
  { id: "api", t: "API", f: "backend/app/api/", d: "FastAPI. Each request names an acting user, the server resolves that user and checks a permission matrix, and a denial returns 403 and is itself audited.", o: "X-TaxProof-User header (simulated sign-in)" },
  { id: "ui", t: "Web app", f: "frontend/", d: "Next.js App Router with Tailwind and shadcn/ui: overview, evidence, return, review, timeline, filing and firm views, and the dashboard that scores how well the return is proven.", o: "Deployed on Vercel" },
] as const;

// Source: backend/app/security/roles.py (MATRIX) at the pinned commit.
const ROLES: { role: string; perms: boolean[] }[] = [
  { role: "Preparer", perms: [true, true, false, false, false, false] },
  { role: "Reviewer", perms: [true, true, true, true, false, false] },
  { role: "Partner", perms: [true, true, true, true, true, true] },
  { role: "Quality reviewer", perms: [true, false, false, false, false, true] },
  { role: "Client", perms: [false, false, false, false, false, false] },
];
const PERM_COLS = ["Verify", "Adjust", "Review a judgment", "Sign as reviewer", "Sign as partner", "Read audit log"];

// Source: docs/ITERATIONS.md, "Results on v3" at the pinned commit. Effects are TaxProof's estimates.
const FINDINGS: [string, string, string, string][] = [
  ["Mileage log: page 3 repeats page 2", "11,800 mi", "8,100 mi", "+$919 federal, +$80 CA"],
  ["Card-processor receipts already in the books", "$163,700", "$151,300", "-$4,402 federal, -$384 CA"],
  ["California wages include pay after the move", "$218,400", "$129,569", "-$5,685 CA"],
  ["Federal Q4 estimate: memory vs IRS transcript", "$13,000", "$12,000", "balance due +$1,000"],
  ["Same bank interest counted twice", "$3,680", "$1,840", "-$640 federal, -$127 CA"],
  ["Foreign interest converted at last year's rate", "$1,747", "$1,871", "+$43 federal, +$9 CA"],
];

const DECISIONS: [string, string][] = [
  ["Point at the packet, never copy it", "Workpaper rows hold reference strings like ev-0226 or line:v3:SchC.44a. That is what lets a note, a verification or a sign-off attach to any node later."],
  ["Derive the graph, store only decisions", "Nodes and edges are rebuilt from the frozen packet. Only what people decide is persisted, so the graph can never drift from the source."],
  ["Show both numbers", "An adjustment records the engine's value, the workpaper's value and the reason. The engine still says 11,800 while the workpaper says 8,100, and both are visible."],
  ["Make rules about people real", "The role switcher selects an acting user, not a free-form role, so \"nobody reviews work they prepared\" is checked against actual identities."],
  ["Review my own work, then fix it", "After the last iteration I ran a full review and logged six issues: a tampered filed snapshot that left the trust report green, an amendment that could count one correction twice, and more. Each got a regression test."],
];

const LIMITS = [
  "The household, documents and returns are a fictional packet supplied with a case-study brief. No real taxpayer data is used, and nothing here is tax advice.",
  "Sign-in is simulated with a request header. Server-side permissions are real; authentication is not production-grade.",
  "The return itself is computed by the supplied engine. TaxProof's corrected values are independent checks and estimates that need CPA approval, not final tax figures.",
  "Without an API key the AI features write deterministic, evidence-grounded text and say \"no AI model\". This page does not report a benchmark of model-written output.",
  "A hash chain exposes partial edits. Someone who can rewrite every later row could still forge a consistent chain unless the latest hash is also kept somewhere they cannot write.",
  "Trust reports are regenerated on demand rather than stored; only their hash is recorded in the audit chain.",
  "The evidence graph above is a slice. Each line also depends on lines that are not drawn.",
];

export default function TaxProofCase() {
  const [layer, setLayer] = useState<string>("packet");
  const L = LAYERS.find((l) => l.id === layer)!;
  const m = taxproof.meta;

  return (
    <main className="cs cs--tax">
      <Nav />

      <header className="cs-hero">
        <div className="container">
          <Link className="cs-back" href="/#work">← The exhibition</Link>
          <p className="cs-eyebrow">Case study 02 · Evidence graph, audit chain, guarded AI</p>
          <motion.h1 className="cs-h1" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
            A tax return where every number can show its <em>proof</em>.
          </motion.h1>

          <div className="cs-hero__grid">
            <dl className="cs-meta">
              <div><dt>Role</dt><dd>Sole engineer: data model, API, web app, tests</dd></div>
              <div><dt>Built with</dt><dd>Python, FastAPI, SQLAlchemy, Alembic, PostgreSQL and SQLite, Next.js, TypeScript, Tailwind, shadcn/ui, pytest, Vitest</dd></div>
              <div><dt>Status</dt><dd>Prototype. Ten iterations complete, deployed on Vercel.</dd></div>
              <div><dt>Links</dt><dd className="cs-links"><a href={DEMO_URL} target="_blank" rel="noopener noreferrer">Live demo ↗</a><a href={m.repoUrl} target="_blank" rel="noopener noreferrer">GitHub ↗</a></dd></div>
            </dl>
            <div className="cs-notice" role="note">
              <b>Built for a case study, on fictional data.</b> The household, documents and returns come from a packet supplied with the brief. Nothing on this page is a real taxpayer, and the demo is a prototype, not tax software or advice. Every value shown is read from the repository at one pinned commit.
            </div>
          </div>

          <a className="cs-shot" href={DEMO_URL} target="_blank" rel="noopener noreferrer" aria-label="Open the live demo">
            <div className="cs-shot__bar" aria-hidden="true"><i /><i /><i /><span>taxproof-web.vercel.app</span></div>
            <Image src="/images/projects/taxproof.jpg" alt="TaxProof overview screen: return assurance score, evidence coverage, critical issues and the role switcher" width={1200} height={750} sizes="(max-width: 1200px) 94vw, 1180px" priority />
          </a>

          <div className="cs-keys">
            {[
              [m.counts.extractedValues.toLocaleString("en-US"), `values read from ${m.counts.documents} documents, each traceable to a page`],
              ["14 of 61", "assurance checks the supplied return failed when the challenge engine first ran"],
              ["230 + 36", "backend and frontend tests, backend run on SQLite and PostgreSQL"],
              ["10", "iterations shipped, from a frozen source layer to a trust report"],
            ].map(([n, l]) => (<div key={n}><b>{n}</b><span>{l}</span></div>))}
          </div>
        </div>
      </header>
      <CaseNav />

      <section className="cs-sec cs-paper">
        <div className="container cs-split">
          <div className="cs-rail"><span>01</span><h2>The problem</h2></div>
          <div>
            <p className="cs-lead">Tax software hands a reviewer a number. The proof for it is spread across scanned pages, engine output and an email thread.</p>
            <p className="cs-p cs-p--wide">The costly errors are the confident ones: a total that counts a repeated page twice, a deposit added on top of the books that already contain it. They sit inside figures that look fine. A reviewer asks one question, why should I trust this number, and answers it by hand.</p>
            <p className="cs-p cs-p--wide">I wanted every figure to explain itself: the rule that produced it, the values it was computed from, the document page those were read from, and a history of anything anyone changed.</p>
          </div>
        </div>
      </section>

      <section className="cs-sec cs-sec--tight">
        <div className="container">
          <motion.div {...reveal}><EvidenceGraph /></motion.div>
        </div>
      </section>

      <section id="challenge" className="cs-band">
        <div className="container">
          <motion.div {...reveal} className="cs-band__head">
            <p className="cs-eyebrow">02 · What the engine got confidently wrong</p>
            <h2 className="cs-h2">Challenge the return, don&apos;t just display it.</h2>
            <p className="cs-p cs-p--light">A separate assurance engine re-derives checks from the evidence. On the supplied return it failed 14 of 61 checks, flagged 8 for judgment and passed 39. These are the corrections it proposed. They are estimates that wait for reviewer approval.</p>
          </motion.div>
          <div className="tp-table-wrap">
            <table className="tp-findings">
              <thead><tr><th>Finding</th><th>Engine</th><th>TaxProof</th><th>Estimated effect</th></tr></thead>
              <tbody>
                {FINDINGS.map(([a, b, c, d]) => (<tr key={a}><td>{a}</td><td>{b}</td><td>{c}</td><td>{d}</td></tr>))}
              </tbody>
            </table>
          </div>
          <p className="cs-small cs-small--light">Source: the repository&apos;s iteration log, assurance results on return version 3. The first two rows are the lineages explored above.</p>
        </div>
      </section>

      <section className="cs-sec">
        <div className="container cs-split">
          <div className="cs-rail"><span>03</span><h2>Four rules for AI in a regulated workflow</h2></div>
          <div>
            <ol className="cs-dec tp-principles">
              {PRINCIPLES.map(([t, d], i) => (<li key={t}><span>{String(i + 1).padStart(2, "0")}</span><div><b>{t}.</b><p>{d}</p></div></li>))}
            </ol>
            <div className="tp-guard">
              <p className="cs-eyebrow">How a claim is checked</p>
              <p className="cs-p">When a model is configured, only masked context is sent. Every claim it returns must cite evidence, and a validator tests the claim against what it cites before anyone sees it. Two checks came out of the post-build review:</p>
              <ul className="cs-lim">
                <li><b>Negation.</b> A claim like &quot;page 3 does not duplicate page 2&quot; is rejected when the cited facts say the opposite.</li>
                <li><b>Swapped roles.</b> &quot;The engine has 8,100, TaxProof 11,800&quot; is rejected, because the engine&apos;s figure is the other one.</li>
              </ul>
              <p className="cs-small cs-small--light">Both are from the repository&apos;s review follow-ups, each with a regression test. With no model configured the app writes deterministic sentences and labels them &quot;no AI model&quot;.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="source" className="cs-band cs-band--soft">
        <div className="container">
          <motion.div {...reveal} className="cs-band__head">
            <p className="cs-eyebrow">04 · System design</p>
            <h2 className="cs-h2">An immutable source, with a workpaper beside it.</h2>
            <p className="cs-p cs-p--light">The supplied packet is treated as pipeline output nobody may edit. Everything people add lives in a separate layer that points back into it. Click a layer.</p>
          </motion.div>
          <div className="cs-pipe">
            <div className="cs-pipe__row">
              {LAYERS.map((l, i) => (
                <button key={l.id} type="button" className={`cs-node${layer === l.id ? " is-on" : ""}`} onClick={() => setLayer(l.id)} onMouseEnter={() => setLayer(l.id)} aria-pressed={layer === l.id}>
                  <span className="cs-node__n">{String(i + 1).padStart(2, "0")}</span>
                  <span className="cs-node__t">{l.t}</span>
                  {i < LAYERS.length - 1 && <span className="cs-node__arrow" aria-hidden="true">→</span>}
                </button>
              ))}
            </div>
            <div className="cs-pipe__detail" role="status">
              <p className="cs-pipe__file">{L.f}</p>
              <p className="cs-pipe__d">{L.d}</p>
              <p className="cs-pipe__o"><span>holds / serves</span> {L.o}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cs-sec">
        <div className="container">
          <motion.div {...reveal} className="cs-band__head">
            <p className="cs-eyebrow">05 · Tamper-evident history</p>
            <h2 className="cs-h2">Edit a row and the chain says so.</h2>
            <p className="cs-p cs-p--light">Every action is an event whose hash covers its contents and the previous event&apos;s hash. Try changing one in this sample.</p>
          </motion.div>
          <HashChain />
        </div>
      </section>

      <section id="permissions" className="cs-band">
        <div className="container">
          <motion.div {...reveal} className="cs-band__head">
            <p className="cs-eyebrow">06 · Access and identity</p>
            <h2 className="cs-h2">Permissions live on the server.</h2>
            <p className="cs-p cs-p--light">The role switcher picks a person, not a label. The API checks the permission matrix on every request, so the interface can hide a button but cannot grant a right.</p>
          </motion.div>
          <div className="tp-access">
            <div className="tp-table-wrap">
              <table className="tp-matrix">
                <thead><tr><th>Role</th>{PERM_COLS.map((c) => (<th key={c}>{c}</th>))}</tr></thead>
                <tbody>
                  {ROLES.map((r) => (
                    <tr key={r.role}><th scope="row">{r.role}</th>{r.perms.map((p, i) => (<td key={i} className={p ? "is-yes" : ""} aria-label={p ? "allowed" : "not allowed"}>{p ? "●" : "·"}</td>))}</tr>
                  ))}
                </tbody>
              </table>
              <p className="cs-small cs-small--light">A subset of the matrix in <code>backend/app/security/roles.py</code>. Clients can view their own return and evidence and answer questions. The firm administrator manages settings and cannot reveal sensitive values.</p>
            </div>
            <ul className="cs-lim">
              <li><b>Masked by default.</b> SSNs, bank and account numbers and PINs are masked for everyone. Cleared staff and the clients themselves can reveal one field at a time.</li>
              <li><b>Every reveal is logged.</b> Granted or denied, each attempt is written to the access log and the audit chain.</li>
              <li><b>Identity rules.</b> Nobody reviews or signs off work they prepared, and that is checked against the actual user.</li>
            </ul>
          </div>
        </div>
      </section>

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

      <section className="cs-end">
        <div className="container">
          <p className="cs-eyebrow">Explore it yourself</p>
          <h2 className="cs-h2">Switch roles, follow a number, read the code.</h2>
          <div className="cs-end__links">
            <a className="pill-cta" href={DEMO_URL} target="_blank" rel="noopener noreferrer">Open the live demo ↗</a>
            <a className="fw-ghost" href={m.repoUrl} target="_blank" rel="noopener noreferrer">GitHub repository ↗</a>
            <Link className="fw-ghost" href="/#work">← Back to the exhibition</Link>
          </div>
          <p className="cs-src">Values on this page are read from <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">{m.repo} @ {m.sha.slice(0, 7)}</a> by <code>scripts/build-taxproof-data.py</code>, which asserts them against the packet and its own documentation. Test counts and the finding table come from the repository&apos;s iteration log. Packet SHA-256: <code>{m.packetSha256.slice(0, 16)}…</code></p>
        </div>
      </section>

      <CaseNext current="taxproof" />
      <ExFooter />
      <CommandPalette />
    </main>
  );
}
