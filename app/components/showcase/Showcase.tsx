"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import TaxProofShowcase from "./TaxProofShowcase";
import RetailShowcase from "./RetailShowcase";
import PreventiveShowcase from "./PreventiveShowcase";
import { EASE } from "../../lib/motion";

const ITEMS = [
  { id: "work-taxproof", key: "tax", n: "1/3", t: "TaxProof", c: TaxProofShowcase },
  { id: "work-retail", key: "retail", n: "2/3", t: "Retail", c: RetailShowcase },
  { id: "work-preventive", key: "care", n: "3/3", t: "Preventive Care", c: PreventiveShowcase },
] as const;

const MQ = "(max-width: 760px)";
function useIsPhone() {
  return useSyncExternalStore(
    (cb) => { const m = window.matchMedia(MQ); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); },
    () => window.matchMedia(MQ).matches,
    () => false,
  );
}

/**
 * Desktop: the three showcases run as chapters with a slim index. Phone: a project selector (shadcn Tabs) shows
 * one full-width showcase at a time, with Motion handling the swap, so the section is one project tall instead of three.
 */
export default function Showcase() {
  const phone = useIsPhone();
  const rm = useReducedMotion();
  const [active, setActive] = useState<string>(ITEMS[0].id);
  const [pick, setPick] = useState<string>(ITEMS[0].key);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phone) return;
    const els = ITEMS.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis) setActive(vis.target.id);
      },
      { rootMargin: "-35% 0px -45% 0px", threshold: [0, 0.1, 0.5] },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [phone]);

  if (phone) {
    const Cur = ITEMS.find((i) => i.key === pick)!.c;
    return (
      <div className="sw-wrap sw-wrap--phone" ref={top}>
        <Tabs value={pick} onValueChange={(v) => { setPick(v); const r = top.current?.getBoundingClientRect(); if (r && r.top < 0) window.scrollTo({ top: window.scrollY + r.top - 70, behavior: rm ? "auto" : "smooth" }); }} className="sw-select">
          <LayoutGroup id="sw-select">
            <TabsList className="sw-select__list" aria-label="Choose a project">
              {ITEMS.map((i) => (
                <TabsTrigger key={i.key} value={i.key} className="sw-select__tab">
                  {pick === i.key && <motion.span layoutId="sw-select-pill" className="sw-select__pill" transition={rm ? { duration: 0 } : { duration: 0.35, ease: EASE }} />}
                  <span className="sw-select__n">{i.n}</span>
                  <span className="sw-select__t">{i.t}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </LayoutGroup>
        </Tabs>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={pick} initial={rm ? false : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={rm ? { opacity: 0 } : { opacity: 0, x: -24 }} transition={{ duration: 0.3, ease: EASE }}>
            <Cur />
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="sw-wrap">
      <nav className="sw-index" aria-label="Selected work">
        <ol>
          {ITEMS.map((i) => (
            <li key={i.id}>
              <a href={`#${i.id}`} className={active === i.id ? "is-on" : ""} aria-current={active === i.id ? "true" : undefined}>
                <span>{i.n}</span><b>{i.t === "Preventive Care" ? "Preventive" : i.t}</b>
              </a>
            </li>
          ))}
        </ol>
      </nav>
      {ITEMS.map((i) => (<i.c key={i.id} />))}
    </div>
  );
}
