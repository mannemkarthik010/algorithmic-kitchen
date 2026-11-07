"use client";
import { useState } from "react";
import PageFlip from "@/components/kokonutui/page-flip";
import EvidenceGraph from "../components/case/EvidenceGraph";
import { taxproof } from "../components/case/taxproof-data";

/**
 * The TaxProof exhibit: a paper dossier you can flip through (Kokonut Page Flip, MIT) and the evidence explorer
 * beneath it (Anime.js draws the wires). Every page is built from the repository's own mileage lineage in
 * taxproof-case.json. The four kinds of material are kept visibly apart: original documents, extracted values,
 * calculated outputs, and verification.
 */
const fmt = (n: number) => n.toLocaleString("en-US");

function Tag({ k, children }: { k: "orig" | "ext" | "calc" | "ver"; children: React.ReactNode }) {
  return <span className={`dos-tag dos-tag--${k}`}>{children}</span>;
}

/** Which spread holds the evidence for a return line: the scanned pages for the mileage total, the calculated page for the lines built from it. */
const SPREAD_FOR: Record<string, number> = { "SchC.44a": 2, "SchC.9": 4, "SchC.28": 4, "SchC.29": 4 };
const WHERE: Record<string, string> = {
  "SchC.44a": "the original pages, with page 3 stamped as the duplicate",
  "SchC.9": "the calculated output and its verification",
  "SchC.28": "the calculated output and its verification",
  "SchC.29": "the calculated output and its verification",
};

export default function DossierExhibit({ line }: { line?: string }) {
  const [start, setStart] = useState(line ? (SPREAD_FOR[line] ?? 0) : 0);
  const [shown, setShown] = useState(0);
  const m = taxproof.traces.find((t) => t.id === "mileage")!;
  const picked = line ? m.nodes.find((n) => n.id === line) : null;
  const docs = m.nodes.filter((n) => n.kind === "doc");
  const ev = m.nodes.filter((n) => n.kind === "evidence");
  const total = m.nodes.find((n) => n.id === "SchC.44a")!;
  const cost = m.nodes.find((n) => n.id === "SchC.9")!;
  const dupDoc = Object.entries(m.flags).find(([, f]) => f.type === "duplicate" && f.title === "Duplicate page");
  const sha = taxproof.meta.packetSha256.slice(0, 16);

  const pages = [
    // 0 cover
    <div key="cover" className="dos-page dos-cover">
      <p className="dos-mono">Evidence dossier · sample packet</p>
      <h3>Tax<br />Proof</h3>
      <p className="dos-cover__who">Okafor-Lindqvist household<br />Tax year 2025</p>
      <p className="dos-mono dos-cover__sha">Packet SHA-256<br />{sha}…</p>
      <p className="dos-mono dos-cover__hint">Drag a corner or press the arrows →</p>
    </div>,
    // 1 legend
    <div key="legend" className="dos-page">
      <p className="dos-mono">How to read this dossier</p>
      <h4>Four kinds of material, never mixed.</h4>
      <ul className="dos-legend">
        <li><Tag k="orig">Original</Tag> A page exactly as the packet received it.</li>
        <li><Tag k="ext">Extracted</Tag> A value read off a page, with how sure the reader was.</li>
        <li><Tag k="calc">Calculated</Tag> A number the return engine produced, with the rule that produced it.</li>
        <li><Tag k="ver">Verification</Tag> An independent re-derivation, kept separate from the engine.</li>
      </ul>
      <p className="dos-note">This dossier follows one lineage, the mileage deduction. The explorer beside it traces three selected lineages (mileage, receipts, wages), not every return line.</p>
    </div>,
    // 2..5 original pages
    ...docs.map((d) => {
      const e = ev.find((x) => x.doc === d.doc && x.page === d.page);
      const dup = dupDoc && dupDoc[0] === d.id;
      return (
        <div key={d.id} className="dos-page">
          <Tag k="orig">Original · page {d.page} of {d.pageCount}</Tag>
          <h4>{d.heading}</h4>
          <p className="dos-mono">{d.fileName} · received {d.received}</p>
          <div className="dos-scan" aria-hidden="true"><i /><i /><i /><i /><i /><b /></div>
          {e && <p className="dos-read"><span>Page total, as read</span><b>{e.textAsRead} mi</b></p>}
          {dup && <p className="dos-stamp">Duplicate page</p>}
          {dup && dupDoc && <p className="dos-note">{dupDoc[1].text}</p>}
        </div>
      );
    }),
    // extracted
    <div key="ext" className="dos-page">
      <Tag k="ext">Extracted values</Tag>
      <h4>Four page totals, read from four scans.</h4>
      <table className="dos-table">
        <thead><tr><th>Page</th><th>As read</th><th>Confidence</th></tr></thead>
        <tbody>
          {ev.map((e) => (
            <tr key={e.id} className={e.page === 3 ? "is-flag" : ""}>
              <td>{e.page}</td><td>{fmt(e.value ?? 0)} mi</td><td>{Math.round((e.confidence ?? 0) * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="dos-note">Pages 2 and 3 carry the same total. Confidence is the reader&apos;s own, not a measure of whether the total is right.</p>
    </div>,
    // calculated
    <div key="calc" className="dos-page">
      <Tag k="calc">Calculated output</Tag>
      <h4>{fmt(total.value ?? 0)} business miles.</h4>
      <p className="dos-rule"><b>{total.rule}</b><br />{total.ruleText}</p>
      <p className="dos-line">Schedule C, line 9 · standard mileage<br /><b>${fmt(cost.value ?? 0)}</b></p>
      <p className="dos-note">The rule sums every page total without checking for repeated sheets. That is the finding.</p>
    </div>,
    // verification
    <div key="ver" className="dos-page">
      <Tag k="ver">Verification</Tag>
      <h4>{m.independent.label}: {fmt(m.independent.value)} miles.</h4>
      <p className="dos-rule">{m.independent.how}</p>
      <p className="dos-note"><b>Engine {fmt(m.engine.value)} vs independent {fmt(m.independent.value)}.</b></p>
      <p className="dos-note">{m.effect.text}.</p>
      <p className="dos-note dos-note--small">{m.effect.source}.</p>
    </div>,
  ];

  return (
    <div className="dos">
      <div className="dos-head">
        <p className="ex-mono">01 · The dossier</p>
        <h3>TaxProof: a tax workpaper where every number carries its <em>proof</em>.</h3>
      </div>
      <p className="dos-ctx" role="status">
        {picked && start > 0 ? (
          <>
            <span>Opened from the workpaper: <b>{picked.id.replace("SchC.", "Line ")} · {picked.label}</b>. The dossier is open at {WHERE[picked.id]}.</span>
            <button type="button" onClick={() => { setStart(0); setShown((n) => n + 1); }}>Start from the cover</button>
          </>
        ) : (
          <span>The dossier opens at its cover. Turn the pages, or pick a return line in the workpaper to open it at that line&apos;s evidence.</span>
        )}
      </p>
      <div className="dos-book" aria-label="TaxProof evidence dossier, a book of pages you can turn">
        <PageFlip key={`${start}-${shown}`} pages={pages} initialSpread={start} />
      </div>
      <p className="dos-keys ex-mono">Turn pages: drag a corner, click an edge, or use ← →</p>
      <div className="dos-head dos-head--2">
        <p className="ex-mono">02 · Follow a number</p>
        <p className="dos-explain">Select any value in the explorer. Anime.js redraws the path from the original document to the result and fades everything unrelated.</p>
      </div>
      <div className="dos-explorer"><EvidenceGraph /></div>
    </div>
  );
}
