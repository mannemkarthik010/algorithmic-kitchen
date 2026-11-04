"use client";
import { MODEL_LABEL, retail } from "./retail-data";
import { useWidth } from "./useWidth";

/** The fleet average looks calm; four individual series did not. */
export default function MonitoringPanel() {
  const [ref, w] = useWidth<HTMLDivElement>();
  const mon = retail.monitoring;
  const H = 190, m = { l: 40, r: 14, t: 16, b: 30 };
  const iw = Math.max(w - m.l - m.r, 120);
  const maxY = 10;
  const x = (i: number) => m.l + (i / (mon.length - 1)) * iw;
  const y = (v: number) => m.t + (H - m.t - m.b) * (1 - v / maxY);
  const lo = Math.min(...mon.map((p) => p.wape)), hi = Math.max(...mon.map((p) => p.wape));

  return (
    <div className="cs-mon">
      <div>
        <h4 className="cs-h4 cs-h4--light">Fleet-wide error, six cutoffs</h4>
        <div ref={ref} className="cs-strip">
          {w > 0 && (
            <svg width={w} height={H} role="img" aria-label={`Fleet mean WAPE stayed between ${lo.toFixed(1)}% and ${hi.toFixed(1)}%, with no fleet-level drift flagged.`}>
              {[0, 5, 10].map((v) => <g key={v}><line x1={m.l} x2={w - m.r} y1={y(v)} y2={y(v)} stroke="rgba(242,239,232,0.09)" /><text x={m.l - 8} y={y(v) + 4} textAnchor="end" className="cs-ax cs-ax--light">{v}%</text></g>)}
              <path d={mon.map((p, i) => `${i ? "L" : "M"}${x(i)} ${y(p.wape)}`).join("")} fill="none" stroke="#F2EFE8" strokeWidth={2} />
              {mon.map((p, i) => (
                <g key={p.cutoff}>
                  <circle cx={x(i)} cy={y(p.wape)} r={4} fill="#101317" stroke="#F2EFE8" strokeWidth={2} />
                  <text x={x(i)} y={y(p.wape) - 10} textAnchor="middle" className="cs-ax cs-ax--light">{p.wape.toFixed(1)}</text>
                  <text x={x(i)} y={H - 8} textAnchor="middle" className="cs-ax cs-ax--light">{p.cutoff.slice(5, 7)}/{p.cutoff.slice(2, 4)}</text>
                </g>
              ))}
            </svg>
          )}
        </div>
        <p className="cs-small cs-small--light">No fleet-level drift was flagged. The average hides individual series going stale, so each series is also checked against its own history.</p>
      </div>

      <div>
        <h4 className="cs-h4 cs-h4--light">Four series flagged, and what the loop did</h4>
        <div className="cs-alerts">
          {retail.alerts.map((a) => {
            const r = retail.retraining.find((x) => x.series === a.series)!;
            const re = r.action === "reselected";
            const was = r.latest_cutoff_wape_by_candidate[r.deployed_model] * 100;
            const now = r.latest_cutoff_wape_by_candidate[r.best_model_at_latest_cutoff] * 100;
            return (
              <div key={a.series} className="cs-alert">
                <div className="cs-alert__h"><b>{`Store ${Number(a.series.slice(1, 3))}, Dept ${Number(a.series.slice(5, 7))}`}</b><span>{MODEL_LABEL[a.model]}</span></div>
                <div className="cs-alert__n">{(Number(a.prior_avg_wape) * 100).toFixed(1)}% <i>→</i> {(Number(a.latest_wape) * 100).toFixed(1)}%<em> +{(Number(a.delta) * 100).toFixed(1)} pts</em></div>
                <div className={`cs-alert__d${re ? " is-re" : ""}`}>{re ? `Re-selected ${MODEL_LABEL[r.best_model_at_latest_cutoff]}: ${was.toFixed(1)}% → ${now.toFixed(1)}% at the latest cutoff` : `Kept ${MODEL_LABEL[r.deployed_model]}: still the best candidate`}</div>
              </div>
            );
          })}
        </div>
        <p className="cs-small cs-small--light">Three of four alerts were a rough stretch, not a better model waiting to be found. Confirming and logging that is a useful outcome, and every decision is written to an append-only log.</p>
      </div>
    </div>
  );
}
