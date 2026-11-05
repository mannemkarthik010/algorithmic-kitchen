"use client";
import { useEffect, useState } from "react";
import TaxProofShowcase from "./TaxProofShowcase";
import RetailShowcase from "./RetailShowcase";
import PreventiveShowcase from "./PreventiveShowcase";

const ITEMS = [
  { id: "work-taxproof", n: "1/3", t: "TaxProof" },
  { id: "work-retail", n: "2/3", t: "Retail" },
  { id: "work-preventive", n: "3/3", t: "Preventive" },
] as const;

/** The three flagship projects, each with its own composition. A slim index follows the scroll on wide screens. */
export default function Showcase() {
  const [active, setActive] = useState<string>(ITEMS[0].id);

  useEffect(() => {
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
  }, []);

  return (
    <div className="sw-wrap">
      <nav className="sw-index" aria-label="Selected work">
        <ol>
          {ITEMS.map((i) => (
            <li key={i.id}>
              <a href={`#${i.id}`} className={active === i.id ? "is-on" : ""} aria-current={active === i.id ? "true" : undefined}>
                <span>{i.n}</span><b>{i.t}</b>
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <TaxProofShowcase />
      <RetailShowcase />
      <PreventiveShowcase />
    </div>
  );
}
