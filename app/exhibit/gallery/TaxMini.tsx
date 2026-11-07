"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createDrawable, createTimeline, stagger } from "animejs";
import { useReducedMotion } from "motion/react";
import { taxproof, type TNode } from "../../components/case/taxproof-data";

/**
 * TaxProof as a miniature workpaper. Pick a return line and Anime.js draws the path behind it: the original document
 * pages, the values read from them, the rule, and the result. Built from the mileage lineage in taxproof-case.json,
 * so it follows selected lineages only, never every line of the return.
 */
const LINES = ["SchC.44a", "SchC.9", "SchC.28", "SchC.29"];
const fmt = (n: number | null | undefined, unit?: string) => (n == null ? "" : unit === "usd" ? `$${n.toLocaleString("en-US")}` : `${n.toLocaleString("en-US")} ${unit === "mi" ? "mi" : ""}`.trim());

function lineage(id: string) {
  const trace = taxproof.traces.find((t) => t.id === "mileage")!;
  const byId: Record<string, TNode> = Object.fromEntries(trace.nodes.map((n) => [n.id, n]));
  const seen = new Set<string>();
  const q = [id];
  while (q.length) {
    const c = q.shift()!;
    for (const e of trace.edges) if (e.to === c && !seen.has(e.from)) { seen.add(e.from); q.push(e.from); }
  }
  const up = [...seen].map((i) => byId[i]).filter(Boolean);
  const node = byId[id];
  return {
    trace, node,
    docs: up.filter((n) => n.kind === "doc").sort((a, b) => (a.page ?? 0) - (b.page ?? 0)),
    ev: up.filter((n) => n.kind === "evidence").sort((a, b) => (a.page ?? 0) - (b.page ?? 0)),
    inputs: up.filter((n) => n.kind === "line" && node.inputs?.includes(n.id)),
    params: (node.sources ?? []).filter((s) => s.startsWith("ref:")).map((s) => s.replace("ref:param.", "").replace(/_/g, " ")),
  };
}

export default function TaxMini({ onExpand, active }: { onExpand: () => void; active: boolean }) {
  const rm = useReducedMotion();
  const [sel, setSel] = useState(LINES[0]);
  const L = useMemo(() => lineage(sel), [sel]);
  const wire = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (rm || !active || !wire.current) return;
    const root = wire.current.parentElement!;
    const paths = root.querySelectorAll<SVGPathElement>(".tm-path");
    const nodes = root.querySelectorAll<HTMLElement>(".tm-row");
    const rows = nodes;
    const tl = createTimeline({ defaults: { ease: "outQuad" } });
    tl.add(rows, { opacity: [0.25, 1], translateX: [-10, 0], duration: 360, delay: stagger(240) }, 0);
    tl.add(createDrawable(paths), { draw: ["0 0", "0 1"], duration: 420, delay: stagger(240) }, 0);
    return () => { tl.revert(); };
  }, [sel, rm, active]);

  const flag = (id: string) => L.trace.flags[id];
  const dup = L.docs.find((d) => flag(d.id)?.type === "duplicate");

  return (
    <div className="tm">
      <header className="tm__bar">
        <span className="tm__title">Okafor-Lindqvist household · Schedule C workpaper</span>
        <span className="tm__chip">Sample packet · v3</span>
      </header>
      <div className="tm__body">
        <ul className="tm__lines" aria-label="Return lines with a traced lineage">
          {LINES.map((id) => {
            const n = L.trace.nodes.find((x) => x.id === id)!;
            return (
              <li key={id}>
                <button type="button" className={`tm__line${sel === id ? " is-on" : ""}`} aria-pressed={sel === id} onClick={() => setSel(id)} tabIndex={active ? 0 : -1}>
                  <span className="tm__id">{id.replace("SchC.", "Line ")}</span>
                  <span className="tm__lab">{n.label}</span>
                  <b className={`tm__val${flag(id) ? " is-flag" : ""}`}>{fmt(n.value, n.unit)}</b>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="tm__chain" data-tm={sel} aria-live="polite">
          <span ref={wire as unknown as React.RefObject<HTMLSpanElement>} hidden />
          <div className="tm-row"><svg className="tm__seg" viewBox="0 0 2 100" preserveAspectRatio="none" aria-hidden="true"><path className="tm-path" d="M1 0 V100" /></svg>
            <p className="tm__k tm__k--orig">Original</p>
            {L.docs.length ? (
              <>
                <p className="tm__t">{L.docs[0].label}</p>
                <p className="tm__c">{L.docs.map((d) => (<span key={d.id} className={flag(d.id) ? "is-flag" : ""}>p{d.page}</span>))}</p>
              </>
            ) : <p className="tm__t">No page is read for this line. It is calculated from other lines.</p>}
            {dup && <p className="tm__warn">Page {dup.page}: {flag(dup.id)!.title.toLowerCase()}</p>}
          </div>
          <div className="tm-row"><svg className="tm__seg" viewBox="0 0 2 100" preserveAspectRatio="none" aria-hidden="true"><path className="tm-path" d="M1 0 V100" /></svg>
            <p className="tm__k tm__k--ext">Extracted</p>
            {L.ev.length ? (
              <p className="tm__c tm__c--big">{L.ev.map((e) => (<span key={e.id} className={flag(e.id) ? "is-flag" : ""}>{fmt(e.value, e.unit)}</span>))}</p>
            ) : (
              <p className="tm__t">{L.inputs.length ? `Inputs: ${L.inputs.map((i) => `${i.label} ${fmt(i.value, i.unit)}`).join(" · ")}` : L.params.length ? `Parameter: ${L.params.join(", ")}` : "Inputs are other return lines."}</p>
            )}
            {!!L.ev.length && !!L.params.length && <p className="tm__t">Parameter: {L.params.join(", ")}</p>}
          </div>
          <div className="tm-row"><svg className="tm__seg" viewBox="0 0 2 100" preserveAspectRatio="none" aria-hidden="true"><path className="tm-path" d="M1 0 V100" /></svg>
            <p className="tm__k tm__k--calc">Rule</p>
            <p className="tm__t"><b>{L.node.rule}</b></p>
            <p className="tm__c2">{L.node.ruleText}</p>
          </div>
          <div className="tm-row">
            <p className="tm__k tm__k--ver">Result</p>
            <p className="tm__res">{fmt(L.node.value, L.node.unit)}</p>
            <p className="tm__c2">{L.node.label}{flag(sel) ? `. ${flag(sel)!.title}.` : ""}</p>
          </div>
        </div>
      </div>
      <footer className="tm__foot">
        <p>Three lineages are traced (mileage, receipts, wages), not every line of the return.</p>
        <button type="button" className="mw-open" onClick={onExpand} tabIndex={active ? 0 : -1}>Open the dossier <span aria-hidden="true">↗</span></button>
      </footer>
    </div>
  );
}
