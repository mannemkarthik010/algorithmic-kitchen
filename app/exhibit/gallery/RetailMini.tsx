"use client";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "../../lib/useReducedMotion";
import { scaleLinear } from "d3-scale";
import { area, line } from "d3-shape";
import { retail, MODELS, MODEL_LABEL } from "../../components/case/retail-data";

/**
 * Retail as a miniature forecasting workstation. The chart is plain SVG (light enough to live in a gallery); the full
 * Bklit instrument opens from the button. Actuals, the deployed model's 8-week forecast and its 80% band are the
 * repository's output on synthetic sales. Nothing is invented: other models appear as error bars, never as curves.
 */
const IDS = ["S03_D05", "S01_D01", "S02_D03", "S04_D08", "S10_D03", "S13_D08", "S19_D07"];
const RANGES = [{ k: "26", label: "26 wk", n: 26 }, { k: "52", label: "1 yr", n: 52 }, { k: "all", label: "All", n: 9999 }] as const;
const PAD = { r: 12, t: 14, b: 24 };
const money = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;

export default function RetailMini({ onExpand, active }: { onExpand: () => void; active: boolean }) {
  const rm = useReducedMotion();
  const [sid, setSid] = useState(IDS[0]);
  const [range, setRange] = useState<(typeof RANGES)[number]["k"]>("52");
  const [band, setBand] = useState(true);
  const [hover, setHover] = useState<number | null>(null);
  const s = retail.series.find((x) => x.id === sid)!;

  // draw the chart at its real on-screen size so labels stay readable instead of scaling a fixed drawing down
  const plot = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ w: 720, h: 300 });
  useLayoutEffect(() => {
    const el = plot.current;
    if (!el) return;
    const measure = () => setDim({ w: Math.max(240, Math.round(el.clientWidth)), h: Math.max(170, Math.round(el.clientHeight)) });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const W = dim.w, H = dim.h, PADL = W < 520 ? 38 : 46;

  const g = useMemo(() => {
    const keep = RANGES.find((r) => r.k === range)!.n;
    const hist = s.history.slice(-keep);
    const fc = s.forecast;
    const n = hist.length + fc.length;
    const vals = [...hist.map((p) => p.v), ...fc.flatMap((f) => [f.v, f.lo, f.hi])];
    const x = scaleLinear().domain([0, n - 1]).range([PADL, W - PAD.r]);
    const y = scaleLinear().domain([Math.min(...vals) * 0.96, Math.max(...vals) * 1.04]).range([H - PAD.b, PAD.t]);
    const hl = hist.length - 1;
    const actual = line<number>().x((_, i) => x(i)).y((v) => y(v))(hist.map((p) => p.v))!;
    const fcPts: [number, number][] = [[hl, hist[hl].v], ...fc.map((f, i) => [hl + 1 + i, f.v] as [number, number])];
    const fcPath = line<[number, number]>().x((d) => x(d[0])).y((d) => y(d[1]))(fcPts)!;
    const bandPath = area<{ i: number; lo: number; hi: number }>().x((d) => x(d.i)).y0((d) => y(d.lo)).y1((d) => y(d.hi))([
      { i: hl, lo: hist[hl].v, hi: hist[hl].v }, ...fc.map((f, i) => ({ i: hl + 1 + i, lo: f.lo, hi: f.hi })),
    ])!;
    return { hist, fc, n, x, y, actual, fcPath, bandPath, hl, ticks: y.ticks(H < 230 ? 3 : 4) };
  }, [s, range, W, H, PADL]);

  const cur = hover ?? g.n - 1;
  const isFc = cur > g.hl;
  const readout = isFc
    ? { d: g.fc[cur - g.hl - 1].d, a: `forecast ${money(g.fc[cur - g.hl - 1].v)}`, b: `80% band ${money(g.fc[cur - g.hl - 1].lo)} to ${money(g.fc[cur - g.hl - 1].hi)}` }
    : { d: g.hist[cur].d, a: `actual ${money(g.hist[cur].v)}`, b: "" };
  const px = g.x(cur);
  const py = g.y(isFc ? g.fc[cur - g.hl - 1].v : g.hist[cur].v);
  const wapes = MODELS.map((m) => ({ m, v: s.wapeByModel[m].wape }));
  const maxW = Math.max(...wapes.map((w) => w.v));
  const gbm = retail.leaderboard.find((m) => m.model === "global_gbm")!;
  const draw = (delay: number, dur = 1) => (rm ? { duration: 0 } : { duration: dur, delay, ease: [0.65, 0, 0.35, 1] as const });

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const sx = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(g.n - 1, Math.round(g.x.invert(sx)))));
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); setHover(Math.max(0, cur - 1)); }
    else if (e.key === "ArrowRight") { e.preventDefault(); setHover(Math.min(g.n - 1, cur + 1)); }
    else if (e.key === "Home") { e.preventDefault(); setHover(0); }
    else if (e.key === "End") { e.preventDefault(); setHover(g.n - 1); }
    else if (e.key === "Escape") setHover(null);
  };

  return (
    <div className="rm">
      <header className="rm__bar">
        <span className="rm__title"><span className="rm__title-l">Retail Demand Intelligence · </span>forecasting workstation</span>
        <span className="rm__chip">Synthetic data</span>
        <button type="button" className="rm__expand" onClick={onExpand} tabIndex={active ? 0 : -1} aria-label="Open the forecasting observatory full screen">Expand <span aria-hidden="true">⤢</span></button>
      </header>
      <div className="rm__ctl">
        <div role="group" aria-label="Choose a store and department series" className="rm__series">
          {IDS.map((id) => {
            const x = retail.series.find((q) => q.id === id)!;
            return (<button key={id} type="button" className={sid === id ? "is-on" : ""} aria-pressed={sid === id} onClick={() => { setSid(id); setHover(null); }} tabIndex={active ? 0 : -1}>S{x.store}·D{x.dept}</button>);
          })}
        </div>
        <div role="group" aria-label="Visible range" className="rm__range">
          {RANGES.map((r) => (<button key={r.k} type="button" className={range === r.k ? "is-on" : ""} aria-pressed={range === r.k} onClick={() => { setRange(r.k); setHover(null); }} tabIndex={active ? 0 : -1}>{r.label}</button>))}
          <button type="button" className={band ? "is-on" : ""} aria-pressed={band} onClick={() => setBand((b) => !b)} tabIndex={active ? 0 : -1}>80% band</button>
        </div>
      </div>

      <div className="rm__chart">
        <div className="rm__plot" ref={plot}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" tabIndex={active ? 0 : -1} aria-label={`Weekly sales for store ${s.store}, department ${s.dept}. Left and right arrows read each week.`} onPointerMove={onMove} onPointerLeave={() => setHover(null)} onKeyDown={onKey} onBlur={() => setHover(null)}>
          {g.ticks.map((t) => (
            <g key={t}><line x1={PADL} x2={W - PAD.r} y1={g.y(t)} y2={g.y(t)} className="rm__grid" /><text x={PADL - 6} y={g.y(t) + 4} className="rm__tick" textAnchor="end">{t >= 1000 ? `${Math.round(t / 1000)}k` : t}</text></g>
          ))}
          <line x1={g.x(g.hl)} x2={g.x(g.hl)} y1={PAD.t} y2={H - PAD.b} className="rm__split" />
          {g.x(g.hl) + 70 < W ? <text x={g.x(g.hl) + 6} y={PAD.t + 10} className="rm__tick">forecast →</text> : <text x={g.x(g.hl) - 6} y={PAD.t + 10} className="rm__tick" textAnchor="end">forecast starts →|</text>}
          {band && <motion.path key={`b-${sid}-${range}`} d={g.bandPath} className="rm__band" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={draw(1.2, 0.6)} />}
          <motion.path key={`a-${sid}-${range}`} d={g.actual} className="rm__actual" fill="none" initial={{ pathLength: rm ? 1 : 0 }} animate={{ pathLength: 1 }} transition={draw(0, 1.1)} />
          <motion.path key={`f-${sid}-${range}`} d={g.fcPath} className="rm__fc" fill="none" initial={{ pathLength: rm ? 1 : 0 }} animate={{ pathLength: 1 }} transition={draw(1, 0.7)} />
          <line x1={px} x2={px} y1={PAD.t} y2={H - PAD.b} className="rm__cross" />
          <motion.circle r="6" className="rm__dot" initial={false} animate={{ cx: px, cy: py }} transition={rm ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 26 }} />
        </svg>
        </div>
        <p className="rm__read" role="status" aria-live="polite"><b>{readout.d}</b> · {readout.a}{readout.b && <> · {readout.b}</>}</p>
      </div>

      <div className="rm__foot">
        <div className="rm__wape" aria-label="Error by model on this series, lower is better">
          {wapes.map(({ m, v }) => (
            <div key={m} className={m === s.selected ? "is-sel" : ""}>
              <span>{MODEL_LABEL[m]}{m === s.selected ? " · deployed" : ""}</span>
              <i><motion.u initial={false} animate={{ width: `${(v / maxW) * 100}%` }} transition={rm ? { duration: 0 } : { duration: 0.5 }} /></i>
              <b>{v.toFixed(1)}%</b>
            </div>
          ))}
        </div>
        <dl className="rm__stats">
          <div><dt>Mean WAPE</dt><dd>{gbm.meanWape.toFixed(1)}%</dd></div>
          <div><dt>Interval coverage</dt><dd>{(retail.coverage.overall * 100).toFixed(1)}%<small> vs 80%</small></dd></div>
        </dl>
        <button type="button" className="mw-open" onClick={onExpand} tabIndex={active ? 0 : -1}>Open the observatory <span aria-hidden="true">↗</span></button>
      </div>
    </div>
  );
}
