"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { StatusChip } from "../StatusChip";
import Shot from "./Shot";
import Disclosure from "./Disclosure";
import CaseLink from "./CaseLink";
import { Details, getProject, nameOf } from "./shared";
import { taxproof, fmt } from "../case/taxproof-data";
import { EASE } from "../../lib/motion";

const LIMITS = [
  "Built for a case study on a fictional household packet. No real taxpayer data, and nothing here is tax advice.",
  "Sign-in is simulated with a request header. Permissions are enforced on the server, but this is not production authentication.",
  "The return is computed by the supplied engine. TaxProof's corrected values are independent checks and estimates that need a CPA's approval.",
];

/** One real lineage from the supplied packet: a repeated page in a scanned mileage log, traced to the amount owed. */
function useTrail() {
  const t = taxproof.traces.find((x) => x.id === "mileage")!;
  const get = (id: string) => t.nodes.find((n) => n.id === id)!;
  const ids: [string, string, boolean][] = [
    ["D23#3", "Source page", true],
    ["ev-0404", "Value read", true],
    ["SchC.44a", "Business miles", true],
    ["SchC.9", "Car expense", false],
    ["SchC.31", "Net profit", false],
    ["F1040.37", "Amount owed", false],
  ];
  return ids.map(([id, kicker, flag]) => {
    const n = get(id);
    const value = n.kind === "doc" ? "page 3" : fmt(n.value, n.unit);
    const sub = n.kind === "doc" ? `${n.doc} · scanned mileage log` : n.kind === "evidence" ? `${n.id} · ${n.doc} p${n.page}` : n.id;
    return { id, kicker, value, sub, flag };
  });
}

export default function TaxProofShowcase() {
  const { p, fw } = getProject("taxproof");
  const trail = useTrail();
  const rm = useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const draw = (i: number) => rm ? {} : ({ initial: { scaleX: 0, scaleY: 0 }, whileInView: { scaleX: 1, scaleY: 1 }, viewport: { once: true, margin: "-80px" }, transition: { duration: 0.45, ease: EASE, delay: 0.12 * i } } as const);

  return (
    <article id="work-taxproof" className={`sw sw-tax${leaving ? " is-leaving" : ""}`} aria-labelledby="sw-tax-title">
      <header className="sw-head">
        <span className="sw-head__no" aria-hidden="true">1/3</span>
        <div>
          <p className="sw-eyebrow">Evidence, transparency, trust <StatusChip status={p.status} size="sm" /></p>
          <h3 id="sw-tax-title" className="sw-title">{nameOf(p.title)}: a tax workpaper where every number carries its <em>proof</em>.</h3>
        </div>
      </header>

      <div className="sw-tax__stage">
        <Shot shot={fw.shot} href={p.demo} label="Open live demo" priority sizes="(max-width: 1100px) 94vw, 1240px" />
      </div>

      <section className="sw-trail" aria-labelledby="sw-trail-h">
        <div className="sw-trail__head">
          <h4 id="sw-trail-h">Follow one number</h4>
          <p>A repeated page in a scanned mileage log, traced to the amount owed. Values are from the supplied packet, a fictional household. <span className="sw-hint">Swipe →</span></p>
        </div>
        <ol className="sw-trail__list">
          {trail.map((n, i) => (
            <li key={n.id} className={n.flag ? "is-flag" : ""}>
              {i > 0 && <motion.span className="sw-trail__wire" aria-hidden="true" {...draw(i)} />}
              <span className="sw-trail__k">{n.kicker}</span>
              <b>{n.value}</b>
              <span className="sw-trail__s">{n.sub}</span>
              {n.id === "D23#3" && <em>repeat of page 2</em>}
              {n.id === "SchC.44a" && <em>11,800 includes it</em>}
            </li>
          ))}
        </ol>
      </section>

      <div className="sw-tax__copy">
        <p className="sw-lead">Tax software hands a reviewer a number. TaxProof also shows the rule that produced it, the value it was read from, and the page of the document, so a reviewer can check instead of trust.</p>
        <div className="sw-tax__side">
          <dl className="sw-facts">
            <div><dt>230 + 36</dt><dd>backend and frontend tests</dd></div>
            <div><dt>14 of 61</dt><dd>assurance checks the supplied return failed</dd></div>
          </dl>
          <div className="sw-actions">
            <CaseLink href="/work/taxproof" className="pill-cta" onLeave={() => setLeaving(true)}>Read the case study →</CaseLink>
            {p.demo && <a className="fw-ghost" href={p.demo} target="_blank" rel="noopener noreferrer">Live demo ↗</a>}
            {p.github && <a className="fw-ghost" href={p.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>}
          </div>
        </div>
      </div>

      <Disclosure label="Technical details">
        <Details slug="taxproof" limits={LIMITS} />
      </Disclosure>
    </article>
  );
}
