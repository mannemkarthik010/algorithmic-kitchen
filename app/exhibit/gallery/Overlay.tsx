"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { animate, motion, useReducedMotion } from "motion/react";
import ForecastStudio from "../../components/showcase/ForecastStudio";
import LoopSim from "../../components/case/LoopSim";
import { retail } from "../../components/case/retail-data";
import { preventive, simulateLoop } from "../../components/case/preventive-data";
import DossierExhibit from "../DossierExhibit";
import { LIMITS, SCENARIOS, STAGES } from "./data";

const META = [
  { t: "TaxProof dossier", href: "/work/taxproof", tone: "tax" },
  { t: "Forecasting observatory", href: "/work/retail-demand-intelligence", tone: "retail" },
  { t: "Agent theatre", href: "/work/preventive-care", tone: "prev" },
] as const;

/* ───────── Retail: the forecast is the page ───────── */
function Observatory() {
  const gbm = retail.leaderboard.find((m) => m.model === "global_gbm")!;
  const total = retail.leaderboard.reduce((a, m) => a + m.wins, 0);
  const cov = retail.coverage;
  return (
    <div className="obs">
      <div className="obs__head">
        <p className="ex-mono">Forecasting observatory · synthetic sales, real repository output</p>
        <div className="obs__nums">
          <div><b>{gbm.meanWape.toFixed(1)}<small>%</small></b><span>mean WAPE, gradient boosting, best of three models</span></div>
          <div><b>{gbm.wins}<small> / {total}</small></b><span>series won; seasonal-naive won {retail.leaderboard.find((m) => m.model === "seasonal_naive")!.wins}</span></div>
          <div><b className="is-gap">{(cov.overall * 100).toFixed(1)}<small>%</small></b><span>of held-out values fell inside the 80% interval. The target was 80. That gap is reported, not hidden.</span></div>
        </div>
      </div>
      <ForecastStudio variant="observatory" />
    </div>
  );
}

/* ───────── Preventive Care: the agent theatre ───────── */
function Theatre() {
  const [sel, setSel] = useState(0);
  const [patient, setPatient] = useState(preventive.patients[1].id);
  const [scn, setScn] = useState<(typeof SCENARIOS)[number]["id"]>("once");
  const [step, setStep] = useState(-1);
  const rm = useReducedMotion();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = () => { if (timer.current) clearInterval(timer.current); timer.current = null; };
  useEffect(() => () => stop(), []);
  const sim = simulateLoop(SCENARIOS.find((s) => s.id === scn)!.verdicts as unknown as boolean[], preventive.pipeline.maxRevisions);
  const path = [0, 1, ...sim.rounds.flatMap(() => [2, 3, 4])];
  const here = step >= 0 ? path[step] : sel;
  const st = STAGES[here];
  const p = preventive.patients.find((x) => x.id === patient)!;
  const round = step >= 2 ? Math.floor((step - 2) / 3) : -1;
  const go = (d: number) => { stop(); setStep(-1); setSel((s) => Math.max(0, Math.min(4, s + d))); };
  const replay = () => {
    stop();
    if (rm) { setStep(path.length - 1); return; }
    setStep(0);
    let i = 0;
    timer.current = setInterval(() => { i += 1; if (i >= path.length) { stop(); return; } setStep(i); }, 900);
  };

  return (
    <div className="th">
      <div className="th__head">
        <p className="ex-mono">Agent theatre · educational prototype · strictly sequential</p>
        <h3>Five stages. One loop. <em>Nothing here is generated.</em></h3>
        <p className="th__sub">Select a stage or replay one pass through the agent. The page runs the risk arithmetic and the router, the two parts that are plain code. It does not run the retriever, the drafter or the critic, so it shows no retrieved passages, plans or critic text.</p>
      </div>

      <ol className="th__mods" aria-label="The five stages">
        {STAGES.map((s, i) => {
          const live = step >= 0 && path[step] === i;
          const seen = step >= 0 && path.slice(0, step + 1).includes(i);
          return (
            <li key={s.n}>
              <button type="button" className={`th__mod${here === i ? " is-on" : ""}${seen ? " is-seen" : ""}${live ? " is-live" : ""}`} aria-pressed={here === i} onClick={() => { stop(); setStep(-1); setSel(i); }}>
                <span className="th__no">{s.n}</span>
                <b>{s.t}</b>
                <span className="th__lane">{s.lane}</span>
                <span className="th__runs">{i === 0 || i === 4 ? "runs on this page" : "not run on this page"}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="th__loop" aria-hidden="true"><span>↺ Route can send a failed draft back to Draft, at most {preventive.pipeline.maxRevisions} times</span></p>

      <div className="th__bar">
        <div className="th__btns">
          <button type="button" onClick={() => go(-1)} disabled={here === 0 && step < 0} aria-label="Previous stage">←</button>
          <button type="button" onClick={() => go(1)} disabled={here === 4 && step < 0} aria-label="Next stage">→</button>
          <button type="button" className="th__play" onClick={replay}>▶ Replay one pass</button>
        </div>
        <div role="group" aria-label="Critic scenario for the replay" className="th__seg">
          {SCENARIOS.map((x) => (<button key={x.id} type="button" className={scn === x.id ? "is-on" : ""} aria-pressed={scn === x.id} onClick={() => { stop(); setStep(-1); setScn(x.id); }}>{x.label}</button>))}
        </div>
      </div>

      <div className="th__detail" aria-live="polite">
        <div>
          <p className="th__stat"><b>{st.stat}</b><span>{st.statL}</span></p>
          <p className="th__d">{st.d}</p>
          {step >= 0 && here === 4 && round >= 0 && <p className="th__now">Draft {round + 1}: the critic {sim.rounds[round].pass ? "passes" : "fails"}, so the router {sim.rounds[round].routed === "end" ? "stops" : "sends it back to revise"}, because {sim.rounds[round].reason}.</p>}
        </div>
        <div className="th__aside">
          {here === 0 ? (
            <>
              <div role="group" aria-label="Sample patient (invented)" className="th__seg">
                {preventive.patients.map((x) => (<button key={x.id} type="button" className={patient === x.id ? "is-on" : ""} aria-pressed={patient === x.id} onClick={() => setPatient(x.id)}>{x.label.replace("Sample patient ", "Patient ")}</button>))}
              </div>
              <p className="th__pt">Invented profile: {p.age} y, {p.sex}, total cholesterol {p.total_cholesterol}, HDL {p.hdl_cholesterol}, systolic {p.systolic_bp}{p.smoker ? ", smoker" : ""}{p.diabetes ? ", diabetes" : ""}{p.bp_meds ? ", on BP medication" : ""}.</p>
              <p className="th__risk"><b>{p.risk.risk_percentage}%</b> 10-year ASCVD risk · {p.risk.risk_tier}</p>
              <p className="th__pt">Computed by the repository&apos;s own function ({p.risk.method}).{p.risk.out_of_validated_age_range ? " Outside the validated age range." : ""}{p.risk.race_approximated_as_white ? " Race approximated as white." : ""}</p>
            </>
          ) : here === 4 ? (
            <LoopSim />
          ) : (
            <p className="th__pt">{here === 1 ? "No retrieved passage is shown. The retriever is not run here." : here === 2 ? "No plan is shown. The drafter is not run here." : "No critic verdict text is shown. The critic is not run here. The router below the rubric uses verdicts you choose."}</p>
          )}
        </div>
      </div>

      <section className="th__lim" aria-label="What this prototype is not">
        <p className="ex-mono">What this prototype is not</p>
        <ul>{LIMITS.map((l) => (<li key={l}>{l}</li>))}</ul>
      </section>
    </div>
  );
}

/**
 * A full-screen exhibit. It opens by growing from the on-screen rectangle of the window that launched it and closes by
 * shrinking back to wherever that window is now. Focus is trapped, the page behind is locked, Escape closes.
 */
export default function Overlay({ index, getRect, onClosed }: { index: number; getRect: () => DOMRect | null; onClosed: () => void }) {
  const rm = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const [shown, setShown] = useState(false);
  const opener = useRef<Element | null>(null);
  const start = useRef<DOMRect | null>(null);
  const closing = useRef(false);

  const full = { top: 0, left: 0, width: "100vw", height: "100dvh" };
  useEffect(() => {
    opener.current = document.activeElement;
    start.current = getRect();
    const el = root.current!;
    document.body.style.overflow = "hidden";
    const r = start.current;
    if (r && !rm) {
      el.style.cssText += `top:${r.top}px;left:${r.left}px;width:${r.width}px;height:${r.height}px;`;
      animate(el, full, { duration: 0.6, ease: [0.22, 1, 0.36, 1] }).then(() => setShown(true));
    } else { el.style.cssText += "top:0;left:0;width:100vw;height:100dvh;"; setShown(true); }
    closeBtn.current?.focus();
    return () => { document.body.style.overflow = ""; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(async () => {
    if (closing.current) return;
    closing.current = true;
    setShown(false);
    const el = root.current!;
    const r = getRect();
    if (r && !rm) await animate(el, { top: r.top, left: r.left, width: r.width, height: r.height }, { duration: 0.5, ease: [0.22, 1, 0.36, 1] });
    (opener.current as HTMLElement | null)?.focus?.();
    onClosed();
  }, [getRect, onClosed, rm]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;
      const f = [...root.current!.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,[tabindex]:not([tabindex="-1"])')].filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [close]);

  const m = META[index];
  return (
    <div ref={root} className={`gx-over gx-over--${m.tone}`} role="dialog" aria-modal="true" aria-label={m.t}>
      <motion.div className="gx-over__in" initial={false} animate={{ opacity: shown ? 1 : 0 }} transition={{ duration: 0.25 }}>
        <header className="gx-over__bar">
          <button ref={closeBtn} type="button" className="gx-over__close" onClick={close}>← Back to the gallery <kbd>Esc</kbd></button>
          <span className="gx-over__t">{m.t}</span>
          <Link className="gx-over__case" href={m.href}>Open the case study →</Link>
        </header>
        <div className="gx-over__body">
          {index === 0 && <DossierExhibit />}
          {index === 1 && <Observatory />}
          {index === 2 && <Theatre />}
        </div>
      </motion.div>
    </div>
  );
}
