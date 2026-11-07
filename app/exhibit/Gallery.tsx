"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useReducedMotion } from "../lib/useReducedMotion";
import { EXHIBITS } from "./Opening";
import TaxMini from "./gallery/TaxMini";
import RetailMini from "./gallery/RetailMini";
import PrevMini from "./gallery/PrevMini";
import { PrevCover, RetailCover, TaxCover } from "./gallery/Covers";

const Overlay = dynamic(() => import("./gallery/Overlay"), { ssr: false });

const CASE = ["/work/taxproof", "/work/retail-demand-intelligence", "/work/preventive-care"];
const LINE = [
  "Pick a return line. The path behind it draws itself: page, value read, rule, result.",
  "Change the series, scrub the weeks, read the 80% band. It covered 74.2% where it promised 80.",
  "Five stages and one loop. Replay it, and see what the page does not run.",
];
const TONE = ["tax", "retail", "prev"] as const;

/**
 * The live gallery as a coverflow. Three working miniature applications stand in one space: the active one is large, sharp
 * and interactive; its neighbours turn away, recede, dim and soften, and a click on one brings it forward. Each opens into
 * a full-screen exhibit from its own on-screen rectangle. Keyboard: the index is a tablist (arrows, Home, End).
 */
export default function Gallery() {
  const [sel, setSel] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [taxLine, setTaxLine] = useState("SchC.44a");
  const rm = useReducedMotion();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const wins = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const on = (e: Event) => setSel((e as CustomEvent<number>).detail);
    window.addEventListener("ex:open", on);
    return () => window.removeEventListener("ex:open", on);
  }, []);

  const onKey = useCallback((e: React.KeyboardEvent) => {
    let n = sel;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (sel + 1) % 3;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (sel + 2) % 3;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = 2;
    else return;
    e.preventDefault();
    setSel(n);
    tabs.current[n]?.focus();
  }, [sel]);

  const rectOf = useCallback(() => wins.current[open ?? sel]?.getBoundingClientRect() ?? null, [open, sel]);
  const e = EXHIBITS[sel];
  const opener = useRef<Element | null>(null);
  const expand = (i: number) => (ev?: React.MouseEvent) => { opener.current = (ev?.currentTarget as Element | undefined) ?? document.activeElement; setOpen(i); };

  const spring = rm ? { duration: 0 } : { type: "spring" as const, stiffness: 120, damping: 20, mass: 0.9 };
  const offset = (i: number) => ((i - sel + 4) % 3) - 1; // -1, 0, 1

  return (
    <section id="work" className="gx" aria-labelledby="gx-h">
      <h2 id="gx-h" className="sr-only">Three working exhibits: TaxProof, Retail Intelligence and Preventive Care</h2>
      <div className="gx__bignum" aria-hidden="true">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={e.n} initial={rm ? false : { y: "35%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={rm ? { opacity: 0 } : { y: "-25%", opacity: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>{e.n}</motion.span>
        </AnimatePresence>
      </div>

      <div className="gx__top">
        <p className="ex-mono">(01) &nbsp;Three working exhibits · interact before you read</p>
        <LayoutGroup id="gx-index">
          <div role="tablist" aria-label="Projects" className="gx__index" onKeyDown={onKey}>
            {EXHIBITS.map((x, i) => (
              <button key={x.slug} ref={(el) => { tabs.current[i] = el; }} role="tab" id={`gx-tab-${i}`} aria-selected={sel === i} aria-controls={`gx-win-${i}`} tabIndex={sel === i ? 0 : -1}
                className={`gx__tab${sel === i ? " is-on" : ""}`} onClick={() => setSel(i)}>
                <span>{x.n}</span><b>{x.name}</b>
                {sel === i && <motion.i layoutId="gx-bar" className="gx__bar" transition={{ type: "spring", stiffness: 380, damping: 36 }} />}
              </button>
            ))}
          </div>
        </LayoutGroup>
      </div>

      <div className="gx__stage">
        {[0, 1, 2].map((i) => {
          const o = offset(i);
          const active = o === 0;
          return (
            <motion.div key={i} id={`gx-win-${i}`} className={`gx-win gx-win--${TONE[i]}${active ? " is-active" : ""}`} ref={(el) => { wins.current[i] = el; }}
              role="tabpanel" aria-labelledby={`gx-tab-${i}`} aria-hidden={!active}
              initial={false}
              animate={{ x: `${o * 56}%`, rotateY: o * -30, scale: active ? 1 : 0.76, opacity: active ? 1 : 0.82, filter: active ? "blur(0px)" : "blur(1.2px)", z: active ? 0 : -260 }}
              transition={spring} style={{ zIndex: active ? 3 : 1 }}>
              <div className="gx-win__in" inert={!active}>
                {i === 0 && <TaxMini onExpand={expand(0)} onSelect={setTaxLine} active={active} />}
                {i === 1 && <RetailMini onExpand={expand(1)} active={active} />}
                {i === 2 && <PrevMini onExpand={expand(2)} active={active} />}
              </div>
              {/* the cover sits over the live interface (still mounted, state kept) and fades away when the window comes forward */}
              <motion.div className="gx-cover" aria-hidden="true" initial={false} animate={{ opacity: active ? 0 : 1 }} transition={rm ? { duration: 0 } : { duration: 0.5, delay: active ? 0.15 : 0 }}>
                {i === 0 && <TaxCover />}{i === 1 && <RetailCover />}{i === 2 && <PrevCover />}
              </motion.div>
              {!active && <button type="button" className="gx-win__veil" onClick={() => setSel(i)} aria-label={`Bring forward: ${EXHIBITS[i].name}`} />}
            </motion.div>
          );
        })}
      </div>

      <div className="gx__foot">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={sel} className="gx__line" initial={rm ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>{LINE[sel]}</motion.p>
        </AnimatePresence>
        <div className="gx__links">
          <Link className="ex-link" href={CASE[sel]}>Open the full case study →</Link>
          <Link className="ex-link" href="/work/archive">Explore all projects →</Link>
        </div>
      </div>

      {open !== null && <Overlay index={open} line={taxLine} opener={opener} getRect={rectOf} onClosed={() => setOpen(null)} />}
    </section>
  );
}
