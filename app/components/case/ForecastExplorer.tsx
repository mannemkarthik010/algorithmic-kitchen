"use client";
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MODELS, MODEL_LABEL, retail, type Model, type Series } from "./retail-data";
import { dateLabel, money, moneyFull, monthIdx, niceStep, useWidth } from "./useWidth";

type Range = "1y" | "2y" | "all";
const RANGES: { k: Range; label: string; n: number }[] = [
  { k: "1y", label: "1 year", n: 52 },
  { k: "2y", label: "2 years", n: 104 },
  { k: "all", label: "All 5 years", n: 260 },
];

const COLOR = { ink: "#101317", slate: "#6B7780", copper: "#D9532B", copperSoft: "rgba(217,83,43,0.16)", grid: "rgba(16,19,23,0.09)" };
const MODEL_COLOR: Record<Model, string> = { seasonal_naive: "#6B7780", holt_winters: "#101317", global_gbm: "#D9532B" };

interface Row { d: string; v: number; lo?: number; hi?: number; h: boolean; p: boolean; kind: "actual" | "forecast" }

function lowestModel(s: Series): Model {
  return [...MODELS].sort((a, b) => s.wapeByModel[a].wape - s.wapeByModel[b].wape)[0];
}

/** Why was this model selected? Pulled from the monitoring/retraining log when one exists for the series. */
function selectionNote(s: Series): string {
  const low = lowestModel(s);
  const r = retail.retraining.find((x) => x.series === s.id);
  if (r && r.action === "reselected") {
    const was = r.latest_cutoff_wape_by_candidate[r.deployed_model] * 100;
    const now = r.latest_cutoff_wape_by_candidate[r.best_model_at_latest_cutoff] * 100;
    return `Monitoring flagged this series: its error rose to ${was.toFixed(1)}% at the latest cutoff. The retraining step re-checked all three candidates on that cutoff and re-selected ${MODEL_LABEL[r.best_model_at_latest_cutoff]} (${now.toFixed(1)}%), even though ${MODEL_LABEL[low]} has the lower error averaged over all six backtest cutoffs.`;
  }
  if (r) {
    return `Monitoring flagged this series (error ${(r.trigger.latest_wape * 100).toFixed(1)}% at the latest cutoff, against ${(r.trigger.prior_avg_wape * 100).toFixed(1)}% before). The retraining step checked all three candidates again and kept ${MODEL_LABEL[r.deployed_model]}, which was still the best choice.`;
  }
  return `${MODEL_LABEL[s.selected]} has the lowest backtest error for this series (${s.wapeByModel[s.selected].wape.toFixed(1)}%), so it is the one the platform serves.`;
}

export default function ForecastExplorer() {
  const rm = useReducedMotion();
  const [sid, setSid] = useState(retail.series[0].id);
  const [range, setRange] = useState<Range>("2y");
  const [band, setBand] = useState(true);
  const [flags, setFlags] = useState(true);
  const [hover, setHover] = useState<number | null>(null);
  const [ref, w] = useWidth<HTMLDivElement>();

  const s = retail.series.find((x) => x.id === sid)!;
  const n = RANGES.find((r) => r.k === range)!.n;

  const rows = useMemo<Row[]>(() => [
    ...s.history.slice(-n).map((p): Row => ({ d: p.d, v: p.v, h: p.h, p: p.p, kind: "actual" })),
    ...s.forecast.map((f): Row => ({ d: f.d, v: f.v, lo: f.lo, hi: f.hi, h: false, p: false, kind: "forecast" })),
  ], [s, n]);

  const H = 360;
  const m = { l: 52, r: 14, t: 18, b: 36 };
  const iw = Math.max(w - m.l - m.r, 120);
  const ih = H - m.t - m.b;
  const N = rows.length;
  const x = (i: number) => m.l + (i / (N - 1)) * iw;
  const maxV = Math.max(...rows.map((r) => (r.kind === "forecast" ? r.hi! : r.v))) * 1.06;
  const y = (v: number) => m.t + ih - (v / maxV) * ih;
  const firstF = rows.findIndex((r) => r.kind === "forecast");

  const step = niceStep(maxV / 4);
  const yTicks: number[] = [];
  for (let t = 0; t <= maxV; t += step) yTicks.push(t);

  // x labels: months for 1y, quarters for 2y, years for all
  const xLabels: { i: number; t: string }[] = [];
  rows.forEach((r, i) => {
    const mi = monthIdx(r.d);
    const first = i === 0 || monthIdx(rows[i - 1].d) !== mi;
    if (!first) return;
    const narrow = w < 560;
    if (range === "all" ? mi === 0 && (!narrow || Number(r.d.slice(0, 4)) % 2 === 1) : range === "2y" ? mi % (narrow ? 6 : 3) === 0 : mi % (narrow ? 3 : 2) === 0) {
      xLabels.push({ i, t: range === "all" ? r.d.slice(0, 4) : `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][mi]}${mi === 0 ? " " + r.d.slice(2, 4) : ""}` });
    }
  });

  const span = (from: string, toExclusive: string) => {
    const a = rows.findIndex((r) => r.d >= from);
    const bIdx = rows.findIndex((r) => r.d >= toExclusive);
    if (a < 0) return null;
    const b = bIdx < 0 ? N - 1 : bIdx;
    return { x0: x(a), x1: x(Math.max(b, a)) };
  };
  const ev = retail.events;
  const covid = span(ev.covid_start, ev.covid_recover_end);
  const disrupt = s.store === ev.disruption_store && s.dept === ev.disruption_dept
    ? span(ev.disruption_start, new Date(new Date(ev.disruption_start + "T00:00:00Z").getTime() + ev.disruption_weeks * 7 * 86400000).toISOString().slice(0, 10))
    : null;

  const line = (idx: number[]) => idx.map((i, k) => `${k ? "L" : "M"}${x(i).toFixed(1)} ${y(rows[i].v).toFixed(1)}`).join("");
  const actualIdx = rows.map((_, i) => i).filter((i) => rows[i].kind === "actual");
  const forecastIdx = [firstF - 1, ...rows.map((_, i) => i).filter((i) => rows[i].kind === "forecast")];
  const bandPath = rows.map((_, i) => i).filter((i) => rows[i].kind === "forecast");
  const bandD = bandPath.length
    ? `M${x(firstF - 1).toFixed(1)} ${y(rows[firstF - 1].v).toFixed(1)}` +
      bandPath.map((i) => `L${x(i).toFixed(1)} ${y(rows[i].hi!).toFixed(1)}`).join("") +
      [...bandPath].reverse().map((i) => `L${x(i).toFixed(1)} ${y(rows[i].lo!).toFixed(1)}`).join("") + "Z"
    : "";

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left - m.l) / iw) * (N - 1));
    setHover(Math.min(Math.max(i, 0), N - 1));
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); setHover((h) => Math.max((h ?? N - 1) - 1, 0)); }
    if (e.key === "ArrowRight") { e.preventDefault(); setHover((h) => Math.min((h ?? 0) + 1, N - 1)); }
    if (e.key === "Escape") setHover(null);
  };

  const hv = hover !== null ? rows[hover] : null;
  const low = lowestModel(s);
  const maxWape = Math.max(...MODELS.map((k) => s.wapeByModel[k].wape));

  // mini chart: WAPE by cutoff and model
  const cutMax = Math.max(...s.cutoffs.flatMap((c) => MODELS.map((k) => c[k])));
  const [cref, cw] = useWidth<HTMLDivElement>();
  const CH = 150, cm = { l: 34, r: 8, t: 10, b: 24 };
  const cx = (i: number) => cm.l + (i / Math.max(s.cutoffs.length - 1, 1)) * Math.max(cw - cm.l - cm.r, 60);
  const cy = (v: number) => cm.t + (CH - cm.t - cm.b) * (1 - v / (cutMax * 1.1));

  return (
    <div className="cs-panel" id="explorer">
      <div className="cs-panel__top">
        <div>
          <p className="cs-eyebrow cs-eyebrow--ink">Interactive</p>
          <h3 className="cs-panel__title">Explore a forecast</h3>
        </div>
        <div className="cs-chips" role="tablist" aria-label="Series">
          {retail.series.map((x) => (
            <button key={x.id} role="tab" aria-selected={x.id === sid} className={`cs-chip${x.id === sid ? " is-on" : ""}`} onClick={() => { setSid(x.id); setHover(null); }}>
              Store {x.store} · Dept {x.dept}
            </button>
          ))}
        </div>
      </div>

      <p className="cs-panel__why"><b>{`Store ${s.store}, Dept ${s.dept}.`}</b> {s.why}.</p>

      <div className="cs-controls">
        <div className="cs-seg" role="group" aria-label="Time range">
          {RANGES.map((r) => (
            <button key={r.k} className={range === r.k ? "is-on" : ""} onClick={() => { setRange(r.k); setHover(null); }}>{r.label}</button>
          ))}
        </div>
        <label className="cs-check"><input type="checkbox" checked={band} onChange={(e) => setBand(e.target.checked)} /> 80% interval</label>
        <label className="cs-check"><input type="checkbox" checked={flags} onChange={(e) => setFlags(e.target.checked)} /> Holidays and promos</label>
      </div>

      <div className="cs-chart" ref={ref}>
        {w > 0 && (
          <svg
            width={w} height={H} tabIndex={0} role="img"
            aria-label={`Weekly sales for store ${s.store}, department ${s.dept}, with an 8-week forecast and 80% interval. Use left and right arrow keys to read values.`}
            onPointerMove={onMove} onPointerLeave={() => setHover(null)} onKeyDown={onKey} onFocus={() => hover === null && setHover(N - 1)} onBlur={() => setHover(null)}
          >
            {yTicks.map((t) => (
              <g key={t}>
                <line x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} stroke={COLOR.grid} />
                <text x={m.l - 8} y={y(t) + 4} textAnchor="end" className="cs-ax">{money(t)}</text>
              </g>
            ))}
            {xLabels.map((l) => (
              <text key={l.i} x={x(l.i)} y={H - 12} textAnchor="middle" className="cs-ax">{l.t}</text>
            ))}

            {covid && (
              <g>
                <rect x={covid.x0} y={m.t} width={Math.max(covid.x1 - covid.x0, 1)} height={ih} fill="rgba(16,19,23,0.05)" />
                <text x={covid.x0 + 6} y={m.t + 12} className="cs-note">COVID-like shock (synthetic)</text>
              </g>
            )}
            {disrupt && (
              <g>
                <rect x={disrupt.x0} y={m.t} width={Math.max(disrupt.x1 - disrupt.x0, 3)} height={ih} fill="rgba(217,83,43,0.16)" />
                <text x={disrupt.x0 + 6} y={m.t + 26} className="cs-note cs-note--copper">Injected 5-week disruption</text>
              </g>
            )}

            {band && bandD && <path d={bandD} fill={COLOR.copperSoft} />}
            <motion.path key={`a-${sid}-${range}`} d={line(actualIdx)} fill="none" stroke={COLOR.ink} strokeWidth={1.6} strokeLinejoin="round"
              initial={rm ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: "easeOut" }} />
            <motion.path key={`f-${sid}-${range}`} d={line(forecastIdx)} fill="none" stroke={COLOR.copper} strokeWidth={2.4} strokeLinejoin="round"
              initial={rm ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: rm ? 0 : 0.7, ease: "easeOut" }} />

            <line x1={x(firstF - 0.5)} x2={x(firstF - 0.5)} y1={m.t} y2={m.t + ih} stroke={COLOR.slate} strokeDasharray="3 4" />
            <text x={x(firstF - 0.5) + 6} y={m.t + ih - 8} className="cs-note">forecast →</text>

            {flags && rows.map((r, i) => (
              <g key={i}>
                {r.h && <path d={`M${x(i) - 3.5} ${m.t + ih + 1} h7 l-3.5 -6 z`} fill={COLOR.ink} opacity={0.75} />}
                {r.p && <circle cx={x(i)} cy={m.t + ih - 3} r={2.2} fill={COLOR.copper} opacity={0.8} />}
              </g>
            ))}

            {hv && hover !== null && (
              <g pointerEvents="none">
                <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={m.t + ih} stroke={COLOR.ink} strokeOpacity={0.35} />
                <circle cx={x(hover)} cy={y(hv.v)} r={4.5} fill={hv.kind === "forecast" ? COLOR.copper : COLOR.ink} stroke="#F2EFE8" strokeWidth={2} />
              </g>
            )}
          </svg>
        )}

        {hv && hover !== null && w > 0 && (
          <div className="cs-tip" style={{ left: Math.min(Math.max(x(hover) - 80, 6), w - 176), top: 6 }} role="status">
            <span className="cs-tip__d">{dateLabel(hv.d)}</span>
            <span className="cs-tip__v">{moneyFull(hv.v)}</span>
            <span className="cs-tip__m">
              {hv.kind === "forecast" ? `forecast · 80% interval ${money(hv.lo!)} to ${money(hv.hi!)}` : `actual${hv.h ? " · holiday week" : ""}${hv.p ? " · promo active" : ""}`}
            </span>
          </div>
        )}
      </div>

      <div className="cs-legend" aria-hidden="true">
        <span><i style={{ background: COLOR.ink }} /> Actual weekly sales (synthetic)</span>
        <span><i style={{ background: COLOR.copper }} /> Platform forecast, next 8 weeks</span>
        <span><i style={{ background: COLOR.copperSoft, border: "1px solid rgba(217,83,43,.4)" }} /> 80% prediction interval</span>
        {flags && <span><i className="cs-legend__tri" /> holiday week · <i className="cs-legend__dot" /> promo active</span>}
      </div>

      <div className="cs-panel__grid">
        <div>
          <h4 className="cs-h4">Model comparison for this series</h4>
          <p className="cs-small">Backtest WAPE averaged over six rolling cutoffs. Lower is better.</p>
          <div className="cs-mbars">
            {MODELS.map((k) => (
              <div key={k} className={`cs-mrow${k === s.selected ? " is-sel" : ""}`}>
                <span className="cs-mrow__n">{MODEL_LABEL[k]}</span>
                <span className="cs-mrow__bar"><motion.i key={`${sid}-${k}`} style={{ background: MODEL_COLOR[k] }} initial={rm ? false : { width: 0 }} animate={{ width: `${(s.wapeByModel[k].wape / maxWape) * 100}%` }} transition={{ duration: 0.6 }} /></span>
                <span className="cs-mrow__v">{s.wapeByModel[k].wape.toFixed(1)}%</span>
                <span className="cs-mrow__t">{k === s.selected ? "serving" : k === low ? "lowest avg" : ""}</span>
              </div>
            ))}
          </div>

          <h4 className="cs-h4" style={{ marginTop: 22 }}>Error at each cutoff</h4>
          <div ref={cref} className="cs-cut">
            {cw > 0 && (
              <svg width={cw} height={CH} role="img" aria-label="Backtest error by cutoff for each model">
                {[0, 0.5, 1].map((f) => { const v = cutMax * 1.1 * f; return <g key={f}><line x1={cm.l} x2={cw - cm.r} y1={cy(v)} y2={cy(v)} stroke={COLOR.grid} /><text x={cm.l - 6} y={cy(v) + 4} textAnchor="end" className="cs-ax">{v.toFixed(0)}%</text></g>; })}
                {s.cutoffs.map((c, i) => <text key={c.cutoff} x={cx(i)} y={CH - 6} textAnchor="middle" className="cs-ax">{c.cutoff.slice(5, 7)}/{c.cutoff.slice(2, 4)}</text>)}
                {MODELS.map((k) => (
                  <g key={k}>
                    <path d={s.cutoffs.map((c, i) => `${i ? "L" : "M"}${cx(i)} ${cy(c[k])}`).join("")} fill="none" stroke={MODEL_COLOR[k]} strokeWidth={k === s.selected ? 2.2 : 1.3} opacity={k === s.selected ? 1 : 0.7} />
                    {s.cutoffs.map((c, i) => <circle key={i} cx={cx(i)} cy={cy(c[k])} r={k === s.selected ? 3 : 2} fill={MODEL_COLOR[k]} />)}
                  </g>
                ))}
              </svg>
            )}
          </div>
        </div>

        <div>
          <h4 className="cs-h4">Why this model is serving</h4>
          <p className="cs-p">{selectionNote(s)}</p>
          <div className="cs-note-box">
            <b>What you are looking at.</b> The sales history is synthetic. The copper line and band are the platform&apos;s real 8-week output for this series, read from <code>reports/current_forecasts.csv</code>. The repo does not store the other two models&apos; forecast curves, so only their backtest error is shown, never an invented line.
          </div>
          <details className="cs-details">
            <summary>Forecast values as a table</summary>
            <table className="cs-table">
              <thead><tr><th>Week of</th><th>Forecast</th><th>80% low</th><th>80% high</th></tr></thead>
              <tbody>
                {s.forecast.map((f) => (<tr key={f.d}><td>{dateLabel(f.d)}</td><td>{moneyFull(f.v)}</td><td>{moneyFull(f.lo)}</td><td>{moneyFull(f.hi)}</td></tr>))}
              </tbody>
            </table>
          </details>
        </div>
      </div>
    </div>
  );
}
