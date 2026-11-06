"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { EXHIBITS } from "./Opening";

const TaxProofShowcase = dynamic(() => import("../components/showcase/TaxProofShowcase"));
const RetailShowcase = dynamic(() => import("../components/showcase/RetailShowcase"));
const PreventiveShowcase = dynamic(() => import("../components/showcase/PreventiveShowcase"));

const CASE = ["/work/taxproof", "/work/retail-demand-intelligence", "/work/preventive-care"];
const LINE = [
  "Every number on the return carries its source, its rule and a tamper-evident history.",
  "Forecasts that report how often their own intervals were right: 74.2% against a nominal 80%.",
  "Risk computed in code, sources listed, a critic loop with at most two revisions.",
];

/**
 * The live project gallery. A large editorial index on the left, one enormous working exhibit on the right.
 * Selection uses a shared layout underline; the exhibit changes with a short depth-of-field transition (the outgoing
 * piece softens and recedes, the incoming one sharpens and arrives). Fully keyboard-operable (arrow keys, Home/End).
 */
export default function Gallery() {
  const [sel, setSel] = useState(0);
  const rm = useReducedMotion();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const on = (e: Event) => setSel((e as CustomEvent<number>).detail);
    window.addEventListener("ex:open", on);
    return () => window.removeEventListener("ex:open", on);
  }, []);

  const onKey = useCallback((e: React.KeyboardEvent) => {
    const k = e.key;
    let n = sel;
    if (k === "ArrowRight" || k === "ArrowDown") n = (sel + 1) % 3;
    else if (k === "ArrowLeft" || k === "ArrowUp") n = (sel + 2) % 3;
    else if (k === "Home") n = 0;
    else if (k === "End") n = 2;
    else return;
    e.preventDefault();
    setSel(n);
    tabs.current[n]?.focus();
  }, [sel]);

  const Body = [TaxProofShowcase, RetailShowcase, PreventiveShowcase][sel];
  const e = EXHIBITS[sel];

  return (
    <section id="work" className="ex-gallery" aria-label="Live project exhibits">
      <div className="ex-gallery__bignum" aria-hidden="true">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={e.n} initial={rm ? false : { y: "40%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={rm ? { opacity: 0 } : { y: "-30%", opacity: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>{e.n}</motion.span>
        </AnimatePresence>
      </div>

      <div className="ex-gallery__grid">
        <div className="ex-gallery__side">
          <p className="ex-mono ex-gallery__eyebrow">(01) &nbsp;Three working exhibits</p>
          <LayoutGroup id="ex-index">
            <div role="tablist" aria-label="Projects" aria-orientation="vertical" className="ex-index" onKeyDown={onKey}>
              {EXHIBITS.map((x, i) => (
                <button
                  key={x.slug}
                  ref={(el) => { tabs.current[i] = el; }}
                  role="tab" id={`ex-tab-${i}`} aria-selected={sel === i} aria-controls="ex-panel" tabIndex={sel === i ? 0 : -1}
                  className={`ex-index__item${sel === i ? " is-on" : ""}`}
                  onClick={() => setSel(i)}
                >
                  <span className="ex-index__n">{x.n}</span>
                  <span className="ex-index__t">{x.name}</span>
                  <span className="ex-index__k">{x.kind}</span>
                  {sel === i && <motion.span layoutId="ex-index-bar" className="ex-index__bar" transition={{ type: "spring", stiffness: 380, damping: 36 }} />}
                </button>
              ))}
            </div>
          </LayoutGroup>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p key={sel} className="ex-gallery__line" initial={rm ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {LINE[sel]}
            </motion.p>
          </AnimatePresence>
          <Link className="ex-link ex-gallery__case" href={CASE[sel]}>Open the full case study →</Link>
        </div>

        <div className="ex-stage" id="ex-panel" role="tabpanel" aria-labelledby={`ex-tab-${sel}`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={sel}
              className="ex-stage__inner"
              initial={rm ? false : { opacity: 0, scale: 0.965, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={rm ? { opacity: 0 } : { opacity: 0, scale: 1.03, filter: "blur(8px)" }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            >
              <Body />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
