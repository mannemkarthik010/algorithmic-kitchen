"use client";
import { useMemo } from "react";
import { line, area } from "d3-shape";
import { scaleLinear } from "d3-scale";
import { retail } from "../../components/case/retail-data";

/**
 * Simplified graphic covers for the windows that are not in front. Each is built from its project's own identity and its
 * real data; none carries interaction. The working interface stays mounted underneath, so its state survives a visit
 * to another exhibit. Everything here is decoration over a button that already has an accessible name.
 */
export function TaxCover() {
  return (
    <div className="cv cv--tax">
      <div className="cv__sheets" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (<i key={i} style={{ transform: `translate(${i * 38}px, ${i * -26}px) rotate(${-5 + i * 3}deg)` }}><u /><u /><u /></i>))}
        <svg viewBox="0 0 400 300"><path d="M30 250 C 110 230, 150 200, 200 170 S 300 90, 372 40" /><circle cx="30" cy="250" r="8" /><circle cx="200" cy="170" r="8" /><circle cx="372" cy="40" r="8" /></svg>
      </div>
      <p className="cv__k">01 · Evidence dossier</p>
      <p className="cv__t">TaxProof</p>
      <p className="cv__s">Every number carries its proof.</p>
    </div>
  );
}

export function RetailCover() {
  const g = useMemo(() => {
    const s = retail.series[0];
    const hist = s.history.slice(-52).map((p) => p.v), fc = s.forecast;
    const all = [...hist, ...fc.flatMap((f) => [f.v, f.lo, f.hi])];
    const n = hist.length + fc.length, W = 900, H = 360;
    const x = scaleLinear().domain([0, n - 1]).range([0, W]);
    const y = scaleLinear().domain([Math.min(...all), Math.max(...all)]).range([H - 20, 20]);
    const hl = hist.length - 1;
    return {
      W, H,
      actual: line<number>().x((_, i) => x(i)).y((v) => y(v))(hist)!,
      fc: line<[number, number]>().x((d) => x(d[0])).y((d) => y(d[1]))([[hl, hist[hl]], ...fc.map((f, i) => [hl + 1 + i, f.v] as [number, number])])!,
      band: area<{ i: number; lo: number; hi: number }>().x((d) => x(d.i)).y0((d) => y(d.lo)).y1((d) => y(d.hi))([{ i: hl, lo: hist[hl], hi: hist[hl] }, ...fc.map((f, i) => ({ i: hl + 1 + i, lo: f.lo, hi: f.hi }))])!,
    };
  }, []);
  const gbm = retail.leaderboard.find((m) => m.model === "global_gbm")!;
  return (
    <div className="cv cv--retail">
      <svg viewBox={`0 0 ${g.W} ${g.H}`} preserveAspectRatio="none" aria-hidden="true"><path d={g.band} className="cv__band" /><path d={g.actual} className="cv__actual" fill="none" /><path d={g.fc} className="cv__fc" fill="none" /></svg>
      <p className="cv__k">02 · Forecasting instrument</p>
      <p className="cv__big">{gbm.meanWape.toFixed(1)}<small>%</small></p>
      <p className="cv__t">Retail Intelligence</p>
      <p className="cv__s">Mean WAPE, best of three models. Synthetic data.</p>
    </div>
  );
}

export function PrevCover() {
  const xs = [10, 30, 50, 70, 90];
  return (
    <div className="cv cv--prev">
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
        <path d="M10 18 H90" className="cv__rail" /><path d="M90 24 C90 40, 50 40, 50 24" className="cv__loop" />
      </svg>
      <div className="cv__nodes" aria-hidden="true">{xs.map((x, i) => (<i key={x} style={{ left: `${x}%` }} className={i === 3 ? "is-llm" : i === 1 ? "is-vec" : ""}>{i + 1}</i>))}</div>
      <p className="cv__k">03 · Agent theatre</p>
      <p className="cv__t">Preventive Care</p>
      <p className="cv__s">Five stages, one loop. Prototype, sequential.</p>
    </div>
  );
}
