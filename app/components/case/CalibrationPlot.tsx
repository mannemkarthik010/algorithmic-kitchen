"use client";
import { motion, useReducedMotion } from "motion/react";
import { MODELS, MODEL_LABEL, retail } from "./retail-data";
import { useWidth } from "./useWidth";

/** Nominal 80% versus measured coverage, with the gap drawn rather than hidden. */
export default function CalibrationPlot() {
  const rm = useReducedMotion();
  const [ref, w] = useWidth<HTMLDivElement>();
  const c = retail.coverage;
  const lo = 0.6, hi = 0.9;
  const H = 230, m = { l: 150, r: 28, t: 28, b: 38 };
  const iw = Math.max(w - m.l - m.r, 160);
  const x = (v: number) => m.l + ((v - lo) / (hi - lo)) * iw;
  const rowsData = [
    { label: "All series", v: c.overall, big: true },
    ...MODELS.map((k) => ({ label: MODEL_LABEL[k], v: c.byModel[k], big: false })),
  ];
  const gap = (c.nominal - c.overall) * 100;

  return (
    <div ref={ref} className="cs-cal">
      {w > 0 && (
        <svg width={w} height={H} role="img" aria-label={`The 80% prediction intervals covered ${(c.overall * 100).toFixed(1)}% of held-out values overall, ${gap.toFixed(1)} points short of the target.`}>
          {[0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9].map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={m.t} y2={H - m.b} stroke="rgba(237, 235, 228,0.08)" />
              <text x={x(t)} y={H - 16} textAnchor="middle" className="cs-ax cs-ax--light">{Math.round(t * 100)}%</text>
            </g>
          ))}
          <rect x={x(c.overall)} y={m.t} width={x(c.nominal) - x(c.overall)} height={H - m.t - m.b} fill="rgba(244, 81, 50,0.14)" />
          <line x1={x(c.nominal)} x2={x(c.nominal)} y1={m.t - 8} y2={H - m.b} stroke="#F45132" strokeDasharray="5 4" strokeWidth={1.6} />
          <text x={x(c.nominal)} y={m.t - 12} textAnchor="middle" className="cs-note cs-note--copper">nominal target 80%</text>
          {rowsData.map((r, i) => {
            const yy = m.t + 22 + i * ((H - m.t - m.b - 30) / (rowsData.length - 1));
            return (
              <g key={r.label}>
                <text x={m.l - 14} y={yy + 4} textAnchor="end" className={`cs-ax cs-ax--light${r.big ? " is-strong" : ""}`}>{r.label}</text>
                <line x1={x(lo)} x2={x(r.v)} y1={yy} y2={yy} stroke="rgba(237, 235, 228,0.18)" />
                <motion.circle cx={x(r.v)} cy={yy} r={r.big ? 9 : 6} fill={r.big ? "#EDEBE4" : "#A3A29E"} initial={rm ? false : { scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 * i, type: "spring", stiffness: 200, damping: 16 }} style={{ transformBox: "fill-box", transformOrigin: "center" }} />
                <text x={x(r.v) - (r.big ? 16 : 12)} y={yy + 4} textAnchor="end" className={`cs-ax cs-ax--light${r.big ? " is-strong" : ""}`}>{(r.v * 100).toFixed(1)}%</text>
              </g>
            );
          })}
        </svg>
      )}
      <p className="cs-cal__gap"><b>{gap.toFixed(1)} points short.</b> {c.n.toLocaleString("en-US")} held-out values (240 series × 8 weeks): about {Math.round((1 - c.overall) * 100)} in 100 fell outside the band, where the method implied 20.</p>
    </div>
  );
}
