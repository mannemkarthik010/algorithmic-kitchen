"use client";
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useWidth, niceStep, moneyFull, money, dateLabel } from "../case/useWidth";
import { retail, MODELS, MODEL_LABEL } from "../case/retail-data";
import { EASE } from "../../lib/motion";

const IDS = ["S03_D05", "S02_D03", "S04_D08", "S10_D03"];
const RANGES = [{ n: 52, label: "1 year" }, { n: 104, label: "2 years" }] as const;

/**
 * A compact forecasting instrument on the real repository data: weekly actuals, the deployed model's 8-week forecast with its
 * 80% interval, and that series' WAPE for each model. Switching series or range morphs the lines instead of redrawing them.
 * Only the deployed model's forecast exists in the data, so other models are shown by error, never by an invented curve.
 */
export default function ForecastPreview() {
  const rm = useReducedMotion();
  const [ref, w] = useWidth<HTMLDivElement>();
  const [sid, setSid] = useState(IDS[0]);
  const [rangeIdx, setRangeIdx] = useState(0);
  const [pt, setPt] = useState<number | null>(null);
  const s = retail.series.find((x) => x.id === sid)!;
  const n = RANGES[rangeIdx].n;
  const hist = useMemo(() => s.history.slice(-n), [s, n]);
  const fc = s.forecast;
  const total = hist.length + fc.length;

  const H = w && w < 520 ? 250 : 330;
  const m = { l: 46, r: 12, t: 14, b: 26 };
  const iw = Math.max(0, w - m.l - m.r), ih = H - m.t - m.b;

  const { lo, hi } = useMemo(() => {
    const vals = [...hist.map((p) => p.v), ...fc.flatMap((f) => [f.lo, f.hi, f.v])];
    return { lo: Math.min(...vals), hi: Math.max(...vals) };
  }, [hist, fc]);
  const step = niceStep((hi - lo) / 4);
  const y0 = Math.max(0, Math.floor((lo * 0.92) / step) * step), y1 = Math.ceil((hi * 1.04) / step) * step;
  const X = (i: number) => m.l + (i / (total - 1)) * iw;
  const Y = (v: number) => m.t + (1 - (v - y0) / (y1 - y0)) * ih;
  const ticks: number[] = [];
  for (let v = y0; v <= y1 + 1e-6; v += step) ticks.push(v);

  const L = hist.length - 1;
  const histD = hist.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(p.v).toFixed(1)}`).join(" ");
  const fcD = `M${X(L).toFixed(1)} ${Y(hist[L].v).toFixed(1)} ` + fc.map((f, i) => `L${X(L + 1 + i).toFixed(1)} ${Y(f.v).toFixed(1)}`).join(" ");
  const bandD = `M${X(L).toFixed(1)} ${Y(hist[L].v).toFixed(1)} ` + fc.map((f, i) => `L${X(L + 1 + i).toFixed(1)} ${Y(f.hi).toFixed(1)}`).join(" ") + " " + [...fc].reverse().map((f, i) => `L${X(L + fc.length - i).toFixed(1)} ${Y(f.lo).toFixed(1)}`).join(" ") + " Z";

  const at = (i: number) => (i <= L ? { d: hist[i].d, v: hist[i].v, fc: false as const } : { d: fc[i - L - 1].d, v: fc[i - L - 1].v, lo: fc[i - L - 1].lo, hi: fc[i - L - 1].hi, fc: true as const });
  const cur = pt === null ? null : at(pt);
  const idxFrom = (clientX: number, el: Element) => {
    const r = el.getBoundingClientRect();
    return Math.max(0, Math.min(total - 1, Math.round(((clientX - r.left - m.l) / iw) * (total - 1))));
  };
  const trans = rm ? { duration: 0 } : { duration: 0.65, ease: EASE };
  const wapes = MODELS.map((mm) => ({ mm, v: s.wapeByModel[mm].wape }));
  const maxW = Math.max(...wapes.map((x) => x.v));

  return (
    <div className="sw-fp" ref={ref}>
      <div className="sw-fp__top">
        <div className="cs-chips" role="group" aria-label="Choose a series">
          {IDS.map((id) => {
            const x = retail.series.find((q) => q.id === id)!;
            return (<button key={id} type="button" className={`cs-chip${id === sid ? " is-on" : ""}`} aria-pressed={id === sid} onClick={() => { setSid(id); setPt(null); }}>Store {x.store} · Dept {x.dept}</button>);
          })}
        </div>
        <div className="cs-seg" role="group" aria-label="History shown">
          {RANGES.map((r, i) => (<button key={r.label} type="button" className={i === rangeIdx ? "is-on" : ""} aria-pressed={i === rangeIdx} onClick={() => setRangeIdx(i)}>{r.label}</button>))}
        </div>
      </div>

      {w > 0 && (
        <svg
          width={w} height={H} tabIndex={0} role="img" className="sw-fp__svg"
          aria-label={`Weekly sales for store ${s.store}, department ${s.dept}, with an 8-week forecast and 80 percent interval from ${MODEL_LABEL[s.modelUsed]}. Use the left and right arrow keys to read each week.`}
          onPointerMove={(e) => setPt(idxFrom(e.clientX, e.currentTarget))}
          onPointerDown={(e) => setPt(idxFrom(e.clientX, e.currentTarget))}
          onPointerLeave={(e) => { if (e.pointerType === "mouse") setPt(null); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") { e.preventDefault(); setPt((p) => Math.max(0, (p ?? total) - 1)); }
            if (e.key === "ArrowRight") { e.preventDefault(); setPt((p) => Math.min(total - 1, (p ?? -1) + 1)); }
            if (e.key === "Escape") setPt(null);
          }}
          onBlur={() => setPt(null)}
        >
          {ticks.map((v) => (
            <g key={v}>
              <line x1={m.l} x2={w - m.r} y1={Y(v)} y2={Y(v)} className="sw-fp__grid" />
              <text x={m.l - 8} y={Y(v) + 4} textAnchor="end" className="cs-ax">{money(v)}</text>
            </g>
          ))}
          <line x1={X(L)} x2={X(L)} y1={m.t} y2={H - m.b} className="sw-fp__split" />
          <text x={X(L) - 6} y={m.t + 10} textAnchor="end" className="cs-note">forecast →</text>
          <text x={m.l} y={H - 6} className="cs-ax">{dateLabel(hist[0].d)}</text>
          <text x={w - m.r} y={H - 6} textAnchor="end" className="cs-ax">{dateLabel(fc[fc.length - 1].d)}</text>
          <motion.path initial={false} animate={{ d: bandD }} transition={trans} className="sw-fp__band" />
          <motion.path initial={false} animate={{ d: histD }} transition={trans} className="sw-fp__hist" />
          <motion.path initial={false} animate={{ d: fcD }} transition={trans} className="sw-fp__fc" />
          {pt !== null && cur && (
            <g pointerEvents="none">
              <line x1={X(pt)} x2={X(pt)} y1={m.t} y2={H - m.b} className="sw-fp__cross" />
              <circle cx={X(pt)} cy={Y(cur.v)} r={4.5} className={cur.fc ? "sw-fp__dot sw-fp__dot--fc" : "sw-fp__dot"} />
            </g>
          )}
        </svg>
      )}

      <p className="sw-fp__read" role="status" aria-live="polite">
        {cur
          ? (cur.fc ? <><b>{dateLabel(cur.d)}</b> · forecast <b>{moneyFull(cur.v)}</b> · 80% band {moneyFull(cur.lo)} to {moneyFull(cur.hi)}</> : <><b>{dateLabel(cur.d)}</b> · actual <b>{moneyFull(cur.v)}</b></>)
          : <>Hover, touch or use the arrow keys to read a week. Deployed model: <b>{MODEL_LABEL[s.modelUsed]}</b>.</>}
      </p>

      <div className="sw-fp__bars" aria-label={`Error by model for this series, lower is better`}>
        <p className="sw-fp__bars-h">WAPE by model on this series <span>lower is better</span></p>
        {wapes.map(({ mm, v }) => (
          <div key={mm} className={`sw-fp__row${mm === s.selected ? " is-sel" : ""}`}>
            <span>{MODEL_LABEL[mm]}{mm === s.selected && <em>deployed</em>}</span>
            <span className="sw-fp__track"><motion.i initial={false} animate={{ width: `${(v / maxW) * 100}%` }} transition={trans} /></span>
            <b>{v.toFixed(1)}%</b>
          </div>
        ))}
      </div>
      <p className="sw-fp__why">{s.why}.</p>
    </div>
  );
}
