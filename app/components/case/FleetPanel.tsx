"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { MODELS, MODEL_LABEL, retail, type Model } from "./retail-data";
import { useWidth } from "./useWidth";

const COLOR: Record<Model, string> = { seasonal_naive: "#8C9CA7", holt_winters: "#F2EFE8", global_gbm: "#D87B55" };
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; };
const FEATURED = new Set(retail.series.map((s) => s.id));

/** Three models, 240 series: who wins how often, and how every individual series actually scored. */
export default function FleetPanel() {
  const rm = useReducedMotion();
  const [hover, setHover] = useState<string | null>(null);
  const [ref, w] = useWidth<HTMLDivElement>();
  const lb = [...retail.leaderboard].sort((a, b) => a.meanWape - b.meanWape);
  const maxMean = Math.max(...lb.map((r) => r.meanWape));
  const H = 340, m = { l: 44, r: 12, t: 14, b: 40 };
  const lane = (k: Model) => MODELS.indexOf(k);
  const iw = Math.max(w - m.l - m.r, 150);
  const laneW = iw / 3;
  const maxW = Math.ceil(Math.max(...retail.fleet.map((f) => f.wape)) / 5) * 5;
  const y = (v: number) => m.t + (H - m.t - m.b) * (1 - v / maxW);
  const hv = hover ? retail.fleet.find((f) => f.series === hover) : null;
  const total = lb.reduce((a, r) => a + r.wins, 0);

  return (
    <div className="cs-fleet">
      <div>
        <h4 className="cs-h4 cs-h4--light">Leaderboard across all 240 series</h4>
        <div className="cs-lb">
          {lb.map((r, i) => (
            <div key={r.model} className="cs-lb__row">
              <span className="cs-lb__n">{MODEL_LABEL[r.model]}</span>
              <span className="cs-lb__bar"><motion.i initial={rm ? false : { width: 0 }} whileInView={{ width: `${(r.meanWape / maxMean) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.7, delay: i * 0.1 }} style={{ background: COLOR[r.model] }} /></span>
              <span className="cs-lb__v">{r.meanWape.toFixed(2)}%</span>
              <span className="cs-lb__s">median {r.medianWape.toFixed(2)}% · std {r.stdWape.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <p className="cs-small cs-small--light">Mean WAPE over a rolling-origin backtest (6 cutoffs, 8 weeks ahead). Gradient boosting wins on average, but by under a point over seasonal-naive.</p>

        <h4 className="cs-h4 cs-h4--light" style={{ marginTop: 28 }}>Which model won each series</h4>
        <div className="cs-wins" role="img" aria-label={lb.map((r) => `${MODEL_LABEL[r.model]} won ${r.wins} of ${total} series`).join(", ")}>
          {lb.map((r) => (
            <div key={r.model} className="cs-wins__seg" style={{ flexGrow: r.wins, background: COLOR[r.model], color: r.model === "holt_winters" || r.model === "global_gbm" ? "#101317" : "#101317" }}>
              <b>{r.wins}</b><span>{MODEL_LABEL[r.model]}</span>
            </div>
          ))}
        </div>
        <p className="cs-small cs-small--light">Seasonal-naive, the baseline of &quot;same week last year&quot;, still wins on {retail.leaderboard.find((r) => r.model === "seasonal_naive")!.wins} series ({Math.round((retail.leaderboard.find((r) => r.model === "seasonal_naive")!.wins / total) * 100)}%). That is why the platform selects per series instead of deploying one model everywhere.</p>
      </div>

      <div>
        <h4 className="cs-h4 cs-h4--light">Every series, plotted</h4>
        <p className="cs-small cs-small--light" style={{ marginBottom: 6 }}>Each dot is one series, placed under the model that was selected for it, at that model&apos;s backtest error. Hover a dot.</p>
        <div ref={ref} className="cs-strip">
          {w > 0 && (
            <svg width={w} height={H} role="img" aria-label="Backtest error of the selected model for each of 240 series, grouped by model">
              {Array.from({ length: maxW / 5 + 1 }).map((_, i) => {
                const v = i * 5;
                return <g key={v}><line x1={m.l} x2={w - m.r} y1={y(v)} y2={y(v)} stroke="rgba(242,239,232,0.09)" /><text x={m.l - 8} y={y(v) + 4} textAnchor="end" className="cs-ax cs-ax--light">{v}%</text></g>;
              })}
              {MODELS.map((k) => (
                <text key={k} x={m.l + lane(k) * laneW + laneW / 2} y={H - 14} textAnchor="middle" className="cs-ax cs-ax--light">{MODEL_LABEL[k]}</text>
              ))}
              {retail.fleet.map((f) => {
                const cx = m.l + lane(f.model) * laneW + 18 + hash(f.series) * (laneW - 36);
                const feat = FEATURED.has(f.series);
                return (
                  <circle key={f.series} cx={cx} cy={y(f.wape)} r={feat ? 5 : 3.2} fill={COLOR[f.model]} fillOpacity={hover === f.series ? 1 : feat ? 0.95 : 0.55}
                    stroke={feat || hover === f.series ? "#F2EFE8" : "none"} strokeWidth={feat ? 1.5 : 1}
                    onPointerEnter={() => setHover(f.series)} onPointerLeave={() => setHover(null)} />
                );
              })}
            </svg>
          )}
          <div className="cs-strip__read" role="status">
            {hv ? <><b>{`Store ${Number(hv.series.slice(1, 3))}, Dept ${Number(hv.series.slice(5, 7))}`}</b> · {MODEL_LABEL[hv.model]} · WAPE {hv.wape.toFixed(1)}%</> : <>Ringed dots are the seven series in the explorer above.</>}
          </div>
        </div>
      </div>
    </div>
  );
}
