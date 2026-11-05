"use client";
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { LineChart } from "@/components/charts/line-chart";
import { Line } from "@/components/charts/line";
import { Band } from "@/components/charts/band";
import { ProjectionLine } from "@/components/charts/projection-line";
import { ReferenceArea } from "@/components/charts/reference-area";
import { Grid } from "@/components/charts/grid";
import { XAxis } from "@/components/charts/x-axis";
import { YAxis } from "@/components/charts/y-axis";
import { ChartTooltip } from "@/components/charts/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Slider } from "@/app/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/app/components/ui/collapsible";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/app/components/ui/hover-card";
import { retail, MODELS, MODEL_LABEL } from "../case/retail-data";
import { moneyFull, dateLabel } from "../case/useWidth";
import { EASE } from "../../lib/motion";

const IDS = ["S03_D05", "S01_D01", "S02_D03", "S04_D08", "S10_D03", "S13_D08", "S19_D07"];
const PRESETS = [
  { k: "fc", label: "Forecast", weeks: 26 },
  { k: "1y", label: "1 year", weeks: 52 },
  { k: "2y", label: "2 years", weeks: 104 },
  { k: "all", label: "All", weeks: Infinity },
] as const;

type Row = { date: Date; actual?: number; hi?: number; lo?: number };
const iso = (s: string) => new Date(`${s}T00:00:00Z`);

/**
 * Retail Forecasting Studio. Bklit renders the actuals, the deployed model's forecast segment and its 80% band from
 * the repository data. Only that model's forecast exists in the data, so other models appear by error, never as curves.
 * The week scrubber and the data table are the keyboard and screen-reader routes into the same numbers.
 */
export default function ForecastStudio() {
  const rm = useReducedMotion();
  const [sid, setSid] = useState(IDS[0]);
  const [preset, setPreset] = useState<(typeof PRESETS)[number]["k"]>("2y");
  const s = retail.series.find((x) => x.id === sid)!;
  const nh = s.history.length, nf = s.forecast.length, N = nh + nf;

  const rows: Row[] = useMemo(() => {
    const hist: Row[] = s.history.map((p) => ({ date: iso(p.d), actual: p.v }));
    const last = hist[hist.length - 1];
    hist[hist.length - 1] = { ...last, hi: last.actual, lo: last.actual }; // the band starts exactly where the actuals end
    const fc: Row[] = s.forecast.map((f) => ({ date: iso(f.d), hi: f.hi, lo: f.lo }));
    return [...hist, ...fc];
  }, [s]);
  const projection = useMemo(() => [{ date: iso(s.history[nh - 1].d), value: s.history[nh - 1].v }, ...s.forecast.map((f) => ({ date: iso(f.d), value: f.v }))], [s, nh]);

  const [range, setRange] = useState<[number, number]>([N - 1 - 104 - nf, N - 1]);
  const [lo, hi] = [Math.max(0, Math.min(range[0], N - 13)), Math.min(N - 1, Math.max(range[1], range[0] + 12))];
  const [wkRaw, setWk] = useState<number>(N - nf);
  const wk = Math.min(Math.max(wkRaw, lo), hi);

  const applyPreset = (k: (typeof PRESETS)[number]["k"]) => {
    setPreset(k);
    const w = PRESETS.find((p) => p.k === k)!.weeks;
    setRange([w === Infinity ? 0 : Math.max(0, N - 1 - nf - w), N - 1]);
  };
  const pickSeries = (id: string) => {
    const t = retail.series.find((x) => x.id === id)!;
    const n = t.history.length + t.forecast.length;
    setSid(id);
    const w = PRESETS.find((p) => p.k === preset)!.weeks;
    setRange([w === Infinity ? 0 : Math.max(0, n - 1 - t.forecast.length - w), n - 1]);
    setWk(n - t.forecast.length);
  };

  const rowAt = (i: number) => {
    const r = rows[i];
    const isFc = i >= nh;
    const f = isFc ? s.forecast[i - nh] : null;
    return { date: r.date.toISOString().slice(0, 10), actual: r.actual, fc: f?.v, lo: f?.lo, hi: f?.hi, isFc };
  };
  const cur = rowAt(wk);

  const ev = retail.events;
  const covid = { a: iso(ev.covid_start), b: iso(ev.covid_recover_end) };
  const showDisruption = s.id === `S${String(ev.disruption_store).padStart(2, "0")}_D${String(ev.disruption_dept).padStart(2, "0")}`;
  const dStart = iso(ev.disruption_start);
  const dEnd = new Date(dStart.getTime() + ev.disruption_weeks * 7 * 864e5);

  const wapes = MODELS.map((m) => ({ m, v: s.wapeByModel[m].wape }));
  const maxW = Math.max(...wapes.map((x) => x.v));
  const trans = rm ? { duration: 0 } : { duration: 0.6, ease: EASE };

  return (
    <div className="fs">
      <div className="fs__head">
        <div>
          <h4>Forecasting studio</h4>
          <p>Weekly sales, the deployed model&apos;s 8-week forecast and its 80% band. Real repository output on synthetic sales.</p>
        </div>
      </div>

      <Tabs value={sid} onValueChange={pickSeries} className="fs__tabs">
        <TabsList className="fs__tablist" aria-label="Choose a store and department series">
          {IDS.map((id) => {
            const x = retail.series.find((q) => q.id === id)!;
            return (<TabsTrigger key={id} value={id} className="fs__tab">Store {x.store} · Dept {x.dept}</TabsTrigger>);
          })}
        </TabsList>
      </Tabs>

      <div className="fs__chartbar">
        <div className="fs__presets" role="group" aria-label="Zoom to a date range">
          {PRESETS.map((p) => (<button key={p.k} type="button" aria-pressed={preset === p.k} className={preset === p.k ? "is-on" : ""} onClick={() => applyPreset(p.k)}>{p.label}</button>))}
        </div>
        <ul className="fs__legend" aria-label="Legend">
          <li><i className="is-actual" />Actual</li>
          <li><i className="is-fc" />Forecast ({MODEL_LABEL[s.modelUsed]})</li>
          <li><i className="is-band" />
            <HoverCard openDelay={80}>
              <HoverCardTrigger asChild><button type="button" className="fs__help">80% band ⓘ</button></HoverCardTrigger>
              <HoverCardContent className="fs__card">
                The interval the model reports for each forecast week. Measured on held-out data it covered <b>{(retail.coverage.overall * 100).toFixed(1)}%</b> of actual values, against an 80% target, so it is somewhat too narrow.
              </HoverCardContent>
            </HoverCard>
          </li>
        </ul>
      </div>

      <div className="fs__chart" role="group" aria-label={`Weekly sales for store ${s.store}, department ${s.dept}. A text table of the same values follows the chart.`}>
        <LineChart
          data={rows}
          xDomain={[rows[lo].date, rows[hi].date]}
          xDomainSlotCount={N}
          tweenYDomainOnXDomainChange
          style={{ height: "100%" }}
          margin={{ top: 14, right: 14, bottom: 26, left: 52 }}
        >
          <Grid horizontal numTicksRows={4} />
          <ReferenceArea x1={covid.a} x2={covid.b} fill="var(--chart-2)" fillOpacity={0.1} showMarkers={false} />
          {showDisruption && <ReferenceArea x1={dStart} x2={dEnd} fill="var(--chart-1)" fillOpacity={0.14} showMarkers={false} />}
          <Band upperKey="hi" lowerKey="lo" fill="var(--chart-1)" fillOpacity={0.5} upperStroke={{ stroke: "var(--chart-1)", strokeWidth: 1, strokeOpacity: 0.7 }} lowerStroke={{ stroke: "var(--chart-1)", strokeWidth: 1, strokeOpacity: 0.7 }} showInTooltip={false} />
          <Line dataKey="actual" stroke="var(--chart-line-primary)" strokeWidth={1.6} />
          <ProjectionLine data={projection} stroke="var(--chart-1)" strokeWidth={2.4} showEndMarker />
          <XAxis numTicks={5} />
          <YAxis formatLargeNumbers />
          <ChartTooltip
            showDatePill
            content={({ point }) => {
              const d = point.date as Date;
              const i = rows.findIndex((r) => r.date.getTime() === d.getTime());
              const r = i >= 0 ? rowAt(i) : null;
              return (
                <div className="fs__tip">
                  <span>{dateLabel(d.toISOString().slice(0, 10))}</span>
                  {r && !r.isFc && r.actual != null && <b>{moneyFull(r.actual)} <small>actual</small></b>}
                  {r && r.isFc && r.fc != null && (<><b>{moneyFull(r.fc)} <small>forecast</small></b><em>80% band {moneyFull(r.lo!)} to {moneyFull(r.hi!)}</em></>)}
                </div>
              );
            }}
          />
        </LineChart>
      </div>

      <div className="fs__zoom">
        <label className="fs__label" htmlFor="fs-range">Zoom: {dateLabel(rows[lo].date.toISOString().slice(0, 10))} to {dateLabel(rows[hi].date.toISOString().slice(0, 10))}</label>
        <Slider id="fs-range" value={[lo, hi]} min={0} max={N - 1} step={1} minStepsBetweenThumbs={12} thumbLabels={["Start of visible range", "End of visible range"]}
          onValueChange={(v) => { setPreset("2y"); setRange([v[0], v[1]]); }} />
      </div>

      <div className="fs__scrub">
        <label className="fs__label" htmlFor="fs-week">Read a week</label>
        <Slider id="fs-week" value={[wk]} min={lo} max={hi} step={1} thumbLabels={["Selected week"]} onValueChange={(v) => setWk(v[0])} />
        <p className="fs__read" role="status" aria-live="polite">
          <b>{dateLabel(cur.date)}</b> ·{" "}
          {cur.isFc ? <>forecast <b>{moneyFull(cur.fc!)}</b>, 80% band {moneyFull(cur.lo!)} to {moneyFull(cur.hi!)}</> : <>actual <b>{moneyFull(cur.actual!)}</b></>}
        </p>
      </div>

      <div className="fs__bars">
        <p className="fs__bars-h">WAPE by model on this series <span>lower is better</span></p>
        {wapes.map(({ m, v }) => (
          <div key={m} className={`fs__row${m === s.selected ? " is-sel" : ""}`}>
            <span>{MODEL_LABEL[m]}{m === s.selected && <em>deployed</em>}</span>
            <span className="fs__track"><motion.i initial={false} animate={{ width: `${(v / maxW) * 100}%` }} transition={trans} /></span>
            <b>{v.toFixed(1)}%</b>
          </div>
        ))}
        <p className="fs__why">{s.why}.</p>
      </div>

      <Collapsible className="fs__table">
        <CollapsibleTrigger className="fs__table-btn">Data table: the 8 forecast weeks</CollapsibleTrigger>
        <CollapsibleContent>
          <table>
            <thead><tr><th>Week</th><th>Forecast</th><th>80% low</th><th>80% high</th></tr></thead>
            <tbody>{s.forecast.map((f) => (<tr key={f.d}><td>{dateLabel(f.d)}</td><td>{moneyFull(f.v)}</td><td>{moneyFull(f.lo)}</td><td>{moneyFull(f.hi)}</td></tr>))}</tbody>
          </table>
          <p className="fs__why">Shaded bands: grey is the COVID-like demand shock the generator injects{showDisruption ? "; copper is the injected 5-week supply disruption" : ""}. Both come from the generator&apos;s own event log.</p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
