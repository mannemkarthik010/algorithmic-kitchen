"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { createDrawable, createTimeline, stagger } from "animejs";
import { taxproof, fmt, type TNode, type TEdge, type Trace, type TFlag } from "./taxproof-data";

type Rect = { x: number; y: number; w: number; h: number };
type DrawEdge = TEdge & { hidden?: number };

const KIND_LABEL = { doc: "Document page", evidence: "Extracted value", line: "Return line" } as const;
const FLAG_TAG: Record<TFlag["type"], string> = { duplicate: "Duplicate", wrong: "Check this", ok: "Checks out", note: "Note" };

function nodeValue(n: TNode) {
  return n.value == null ? null : fmt(n.value, n.unit ?? "usd");
}

/** Edges that actually get drawn: collapsed chains become one connector carrying a "+N steps" count. */
function buildDrawEdges(trace: Trace, visible: Set<string>): DrawEdge[] {
  const lines = trace.nodes.filter((n) => n.kind === "line");
  const out: DrawEdge[] = trace.edges.filter((e) => e.kind !== "feeds" || !(trace.nodes.find((n) => n.id === e.from)?.kind === "line")).filter((e) => visible.has(e.from) && visible.has(e.to));
  let prev: number | null = null;
  lines.forEach((n, i) => {
    if (!visible.has(n.id)) return;
    if (prev !== null) out.push({ from: lines[prev].id, to: n.id, kind: "feeds", hidden: i - prev - 1 });
    prev = i;
  });
  return out;
}

function reach(start: string, edges: DrawEdge[], dir: "up" | "down") {
  const seen = new Set<string>();
  const stack = [start];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const e of edges) {
      if (e.kind === "duplicate") continue;
      const next = dir === "up" ? (e.to === cur ? e.from : null) : e.from === cur ? e.to : null;
      if (next && !seen.has(next)) {
        seen.add(next);
        stack.push(next);
      }
    }
  }
  return seen;
}

function wire(a: Rect, b: Rect, kind: TEdge["kind"], bus?: number) {
  const acx = a.x + a.w / 2, bcx = b.x + b.w / 2;
  if (bus !== undefined) {
    // narrow layout: leave the value on its right edge, drop down a shared side bus, enter the line from above
    const x1 = a.x + a.w, y1 = a.y + a.h / 2, y2 = b.y - 13;
    return { d: `M ${x1} ${y1} H ${bus} V ${y2} H ${bcx} V ${b.y}`, mx: bus, my: y1 };
  }
  const sameRow = Math.abs(a.y + a.h / 2 - (b.y + b.h / 2)) < 14;
  if (kind === "duplicate") {
    const ay = a.y, by = b.y, lift = 34;
    return { d: `M ${acx} ${ay} C ${acx} ${ay - lift}, ${bcx} ${by - lift}, ${bcx} ${by}`, mx: (acx + bcx) / 2, my: Math.min(ay, by) - lift * 0.72 };
  }
  if (sameRow) {
    const goingRight = acx < bcx;
    const x1 = goingRight ? a.x + a.w : a.x, x2 = goingRight ? b.x : b.x + b.w;
    const y1 = a.y + a.h / 2, y2 = b.y + b.h / 2, mx = (x1 + x2) / 2;
    return { d: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`, mx, my: y1 };
  }
  const down = a.y < b.y;
  const x1 = acx, y1 = down ? a.y + a.h : a.y, x2 = bcx, y2 = down ? b.y : b.y + b.h;
  const dy = Math.max(22, Math.abs(y2 - y1) / 2);
  const s = down ? 1 : -1;
  return { d: `M ${x1} ${y1} C ${x1} ${y1 + s * dy}, ${x2} ${y2 - s * dy}, ${x2} ${y2}`, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 };
}

function TraceView({ trace }: { trace: Trace }) {
  const reduce = useReducedMotion();
  const [showAll, setShowAll] = useState(false);
  const firstFlag = Object.keys(trace.flags)[0] ?? trace.nodes[0].id;
  const [sel, setSel] = useState<string>(firstFlag);

  const nodes = useMemo(() => trace.nodes.filter((n) => n.kind !== "line" || showAll || n.core), [trace, showAll]);
  const visible = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes]);
  const drawEdges = useMemo(() => buildDrawEdges(trace, visible), [trace, visible]);
  const byId = useMemo(() => Object.fromEntries(trace.nodes.map((n) => [n.id, n])), [trace]);
  const up = useMemo(() => reach(sel, drawEdges, "up"), [sel, drawEdges]);
  const down = useMemo(() => reach(sel, drawEdges, "down"), [sel, drawEdges]);

  const boxRef = useRef<HTMLDivElement>(null);
  const els = useRef<Record<string, HTMLElement | null>>({});
  const [geo, setGeo] = useState<{ w: number; h: number; r: Record<string, Rect> }>({ w: 0, h: 0, r: {} });
  const measure = useCallback(() => {
    const box = boxRef.current;
    if (!box) return;
    const b = box.getBoundingClientRect();
    const r: Record<string, Rect> = {};
    for (const [id, el] of Object.entries(els.current)) {
      if (!el) continue;
      const q = el.getBoundingClientRect();
      r[id] = { x: q.left - b.left, y: q.top - b.top, w: q.width, h: q.height };
    }
    setGeo({ w: b.width, h: b.height, r });
  }, []);
  useLayoutEffect(() => {
    measure();
    const box = boxRef.current;
    if (!box) return;
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [measure, showAll]);

  // Stage of each node along the lineage: document, value read, then each calculation step to the result.
  const tierOf = (id: string) => {
    const n = byId[id];
    if (!n) return 0;
    if (n.kind === "doc") return 0;
    if (n.kind === "evidence") return 1;
    return 2 + nodes.filter((x) => x.kind === "line").findIndex((x) => x.id === id);
  };
  const rank = (from: string) => tierOf(from);

  // Anime.js sequences the connections: on first view the whole lineage draws from document to result; on selection,
  // unrelated wires dim and the related ones redraw in lineage order, so the eye follows the evidence.
  const svgRef = useRef<SVGSVGElement>(null);
  const seen = useRef(false);
  const ready = geo.w > 0 && Object.keys(geo.r).length > 0;
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !ready) return;
    const all = [...svg.querySelectorAll<SVGPathElement>("path.tp-wire")].filter((el) => !el.classList.contains("tp-wire--duplicate") && !el.classList.contains("tp-wire--excluded"));
    if (!all.length || reduce) { seen.current = true; return; }
    const byRank = (a: SVGPathElement, b: SVGPathElement) => Number(a.dataset.rank) - Number(b.dataset.rank);
    const first = !seen.current;
    seen.current = true;
    const related = first ? all : all.filter((el) => el.dataset.state !== "rest");
    const rest = first ? [] : all.filter((el) => el.dataset.state === "rest");
    const ordered = related.slice().sort(byRank);
    const tl = createTimeline({ defaults: { ease: "outQuad" } });
    if (rest.length) tl.add(rest, { opacity: 0.12, duration: 220 }, 0);
    if (ordered.length) {
      ordered.forEach((el) => { el.style.opacity = "1"; });
      tl.add(createDrawable(ordered), { draw: ["0 0", "0 1"], duration: 460, delay: stagger(first ? 70 : 120) }, 0);
    }
    const chips = document.querySelectorAll(".tp-detail .tp-ref, .tp-detail .tp-member, .tp-detail .tp-callout");
    if (chips.length) tl.add(chips, { opacity: [0, 1], translateY: [8, 0], duration: 320, delay: stagger(45) }, 160);
    return () => { tl.revert(); all.forEach((el) => { el.style.opacity = ""; }); };
  }, [sel, showAll, ready, reduce]);

  const docs = nodes.filter((n) => n.kind === "doc");
  const evs = nodes.filter((n) => n.kind === "evidence");
  const chain = nodes.filter((n) => n.kind === "line");
  const pairs = docs.map((d) => ({ doc: d, ev: evs.find((e) => trace.edges.some((x) => x.kind === "read" && x.from === d.id && x.to === e.id)) }));
  const y0 = pairs[0]?.ev && geo.r[pairs[0].ev.id]?.y, y1 = pairs[1]?.ev && geo.r[pairs[1].ev.id]?.y;
  const stacked = y0 !== undefined && y1 !== undefined && Math.abs(y1 - y0) > 30;
  const gapAfter = (i: number) => drawEdges.find((e) => e.from === chain[i]?.id && e.to === chain[i + 1]?.id)?.hidden ?? 0;

  const state = (id: string) => (id === sel ? "is-sel" : up.has(id) ? "is-up" : down.has(id) ? "is-down" : "is-dim");
  const cur = byId[sel];
  const curFlag = trace.flags[sel];
  const delta = trace.independent.value - trace.engine.value;
  const agree = delta === 0;

  const card = (n: TNode) => {
    const f = trace.flags[n.id];
    const v = nodeValue(n);
    return (
      <button
        key={n.id}
        type="button"
        ref={(el) => { els.current[n.id] = el; }}
        className={`tp-node tp-node--${n.kind} ${state(n.id)}${f ? ` has-flag flag-${f.type}` : ""}`}
        onClick={() => setSel(n.id)}
        aria-pressed={sel === n.id}
        aria-label={`${KIND_LABEL[n.kind]} ${n.kind === "doc" ? `${n.doc}${n.page ? ` page ${n.page}` : ""}` : n.id}: ${n.label}${v ? `, ${v}` : ""}${f ? `. ${FLAG_TAG[f.type]}: ${f.title}` : ""}`}
      >
        <span className="tp-node__tag">
          {n.kind === "doc" ? `${n.doc}${n.page ? ` · p${n.page}` : ""}` : n.kind === "evidence" ? n.id : n.id}
        </span>
        {n.kind === "doc" ? (
          <>
            <span className="tp-node__t">{(n.docType ?? "").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())}{n.heading ? ` · ${n.heading.replace(/^Mileage log\s*/i, "")}` : ""}</span>
            <span className="tp-node__s">{n.label}</span>
          </>
        ) : (
          <>
            <span className="tp-node__v">{v}</span>
            <span className="tp-node__s">{n.label}</span>
          </>
        )}
        {f && <span className={`tp-node__flag flag-${f.type}`}>{FLAG_TAG[f.type]}</span>}
      </button>
    );
  };

  const unresolved = cur.kind === "line" ? Math.max(0, (cur.inputs?.length ?? 0) - (cur.inputs ?? []).filter((i) => byId[i]).length) : 0;
  const carry = trace.carry[sel];
  const sources = cur.kind === "line" ? cur.sources ?? [] : [];

  return (
    <div className="tp-trace">
      <div className="tp-compare" role="group" aria-label="Engine value compared with the independent check">
        <div className="tp-compare__side">
          <span className="tp-compare__k">Engine says</span>
          <b>{fmt(trace.engine.value, trace.engine.unit)}</b>
          <span className="tp-compare__l">{trace.engine.label}</span>
        </div>
        <div className="tp-compare__mid" aria-hidden="true">{agree ? "=" : "→"}</div>
        <div className="tp-compare__side">
          <span className="tp-compare__k">{agree ? "Independent check agrees" : "Independent check"}</span>
          <b className={agree ? "" : "is-diff"}>{fmt(trace.independent.value, trace.independent.unit)}</b>
          <span className="tp-compare__l">{trace.independent.label}: {trace.independent.how}</span>
        </div>
        <p className="tp-compare__note">
          {trace.effect.text}. <span>{trace.effect.source}.</span>
        </p>
      </div>

      <div className="tp-explorer">
        <div>
          <div className="tp-graph" ref={boxRef}>
            <svg className="tp-wires" ref={svgRef} width={geo.w} height={geo.h} aria-hidden="true" focusable="false">
              {drawEdges.map((e, i) => {
                const a = geo.r[e.from], b = geo.r[e.to];
                if (!a || !b) return null;
                const toBus = stacked && byId[e.from]?.kind === "evidence" && byId[e.to]?.kind === "line";
                const w = wire(a, b, e.kind, toBus ? geo.w + 8 : undefined);
                const on = e.kind !== "duplicate" && ((up.has(e.from) || e.from === sel) && (up.has(e.to) || e.to === sel) ? "up" : (down.has(e.from) || e.from === sel) && (down.has(e.to) || e.to === sel) ? "down" : "");
                return (
                  <g key={`${e.from}>${e.to}`}>
                    <path
                      d={w.d}
                      className={`tp-wire tp-wire--${e.kind}${on ? ` is-${on}` : ""}`}
                      data-rank={rank(e.from)}
                      data-state={on || "rest"}
                    />
                    {(e.hidden || (e.label && !(stacked && e.kind === "duplicate"))) && !toBus && (
                      <text x={w.mx} y={w.my - 7} textAnchor="middle" className={`tp-wire__lbl tp-wire__lbl--${e.kind}`}>
                        {e.label ?? `+${e.hidden} step${e.hidden === 1 ? "" : "s"}`}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            <p className="tp-tier__lbl tp-tier__lbl--first">1 · Source pages and the values read from them</p>
            <div className="tp-pairs" style={{ ["--n" as string]: pairs.length }}>
              {pairs.map((p) => (<div className="tp-pair" key={p.doc.id}>{card(p.doc)}{p.ev && card(p.ev)}</div>))}
            </div>
            <p className="tp-tier__lbl">2 · The calculation path to the amount owed</p>
            <div className="tp-tier tp-tier--chain">
              {chain.map((n, i) => (
                <div className="tp-chainitem" key={n.id}>
                  {card(n)}
                  {i < chain.length - 1 && gapAfter(i) > 0 && <span className="tp-gap" aria-hidden="true" />}
                </div>
              ))}
            </div>
          </div>

          <div className="tp-graphbar">
            <label className="cs-check">
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
              Show every step on the path
            </label>
            <p className="cs-small">One path through a larger calculation graph. Each line also depends on other lines that are not drawn here.</p>
          </div>

          <details className="cs-details">
            <summary>Read this lineage as text</summary>
            <ol className="tp-textlist">
              {trace.nodes.filter((n) => n.kind !== "doc").map((n) => (
                <li key={n.id}><code>{n.id}</code> {n.label}{nodeValue(n) ? `: ${nodeValue(n)}` : ""}{n.kind === "evidence" ? ` (${n.doc}, page ${n.page})` : ""}{n.rule ? ` · rule ${n.rule}` : ""}</li>
              ))}
            </ol>
          </details>
        </div>

        <aside className="tp-detail" aria-live="polite">
          <p className="tp-detail__kind">{KIND_LABEL[cur.kind]} · <code>{cur.kind === "doc" ? `${cur.doc}${cur.page ? `#${cur.page}` : ""}` : cur.id}</code></p>
          <h4 className="tp-detail__t">{cur.label}</h4>
          {nodeValue(cur) && <p className="tp-detail__v">{nodeValue(cur)}</p>}

          {curFlag && (
            <div className={`tp-callout flag-${curFlag.type}`}>
              <b>{curFlag.title}</b>
              <p>{curFlag.text}</p>
            </div>
          )}

          {cur.kind === "line" && (
            <>
              <dl className="tp-dl">
                <div><dt>Rule</dt><dd><code>{cur.rule}</code><br />{cur.ruleText}</dd></div>
                {cur.inputs && cur.inputs.length > 0 && (
                  <div>
                    <dt>Computed from</dt>
                    <dd>
                      {cur.inputs.filter((i) => byId[i]).map((i) => (
                        <button key={i} type="button" className="tp-ref" onClick={() => setSel(i)}>{i}</button>
                      ))}
                      {unresolved > 0 && <span className="tp-dim"> {unresolved} other line{unresolved === 1 ? "" : "s"} not drawn</span>}
                    </dd>
                  </div>
                )}
                {sources.length > 0 && (
                  <div>
                    <dt>Sources</dt>
                    <dd>
                      {sources.map((s) => {
                        const home = byId[s] ? s : trace.nodes.find((n) => n.members?.some((m) => m.id === s))?.id;
                        return home
                          ? <button key={s} type="button" className="tp-ref" onClick={() => setSel(home)}>{s}</button>
                          : <code key={s} className="tp-ref tp-ref--plain">{s}</code>;
                      })}
                    </dd>
                  </div>
                )}
                {cur.note && <div><dt>Engine note</dt><dd>{cur.note}</dd></div>}
                {carry && (
                  <div><dt>Independent</dt><dd><b>{fmt(carry.independent)}</b> instead of {fmt(carry.engine)} ({carry.how}).</dd></div>
                )}
              </dl>
            </>
          )}

          {cur.kind === "evidence" && (
            <dl className="tp-dl">
              <div><dt>Found in</dt><dd>{cur.docTitle}<br /><span className="tp-dim"><code>{cur.doc}</code>, page {cur.page}, field <code>{cur.field}</code></span></dd></div>
              {cur.members && <div><dt>Includes</dt><dd>{cur.members.map((m) => (<span key={m.id} className="tp-member"><code>{m.id}</code> {m.doc} {fmt(m.value)}</span>))}</dd></div>}
              <div><dt>Read as</dt><dd><code>{cur.textAsRead}</code> <span className="tp-dim">· extraction confidence {cur.confidence?.toFixed(2)}</span></dd></div>
              <div><dt>Feeds</dt><dd>{drawEdges.filter((e) => e.from === cur.id && e.kind !== "duplicate").map((e) => (
                <button key={e.to} type="button" className="tp-ref" onClick={() => setSel(e.to)}>{e.to}</button>
              ))}{drawEdges.some((e) => e.from === cur.id && e.kind === "excluded") && <span className="tp-dim"> Not added to a line (matched to another document).</span>}</dd></div>
            </dl>
          )}

          {cur.kind === "doc" && (
            <dl className="tp-dl">
              <div><dt>File</dt><dd><code>{cur.fileName}</code> <span className="tp-dim">· {cur.pageCount} page{cur.pageCount === 1 ? "" : "s"} · received {cur.received}</span></dd></div>
              <div><dt>Read into</dt><dd>{drawEdges.filter((e) => e.from === cur.id && e.kind === "read").map((e) => (
                <button key={e.to} type="button" className="tp-ref" onClick={() => setSel(e.to)}>{e.to}</button>
              ))}</dd></div>
            </dl>
          )}

          <p className="tp-detail__reach">
            <span><b>{up.size}</b> upstream</span>
            <span><b>{down.size}</b> downstream</span>
          </p>
        </aside>
      </div>
    </div>
  );
}

/** Interactive lineage explorer. Every node is packet data read at one pinned commit; the graph is a slice, and says so. */
export default function EvidenceGraph() {
  const [id, setId] = useState(taxproof.traces[0].id);
  const trace = taxproof.traces.find((t) => t.id === id)!;
  return (
    <div className="cs-panel tp-panel">
      <div className="cs-panel__top">
        <h3 className="cs-panel__title">Follow a number to its proof</h3>
        <div className="cs-chips" role="group" aria-label="Choose a lineage">
          {taxproof.traces.map((t) => (
            <button key={t.id} type="button" aria-pressed={t.id === id} className={`cs-chip${t.id === id ? " is-on" : ""}`} onClick={() => setId(t.id)}>{t.tab}</button>
          ))}
        </div>
      </div>
      <p className="cs-panel__why"><b>{trace.question}</b> {trace.summary}</p>
      <TraceView key={trace.id} trace={trace} />
      <p className="cs-small">The household, documents and numbers are a fictional packet supplied with the case study (<code>{taxproof.meta.packetName}</code>). Each value is read from it at one pinned commit. Identifiers such as SSNs and account numbers are not included.</p>
    </div>
  );
}
