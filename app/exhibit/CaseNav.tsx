"use client";
import { useEffect, useState } from "react";
import { useReducedMotion } from "../lib/useReducedMotion";

interface Item { id: string; n: string; label: string }

/**
 * Sticky "on this page" navigation for the case studies. It reads the sections that are actually on the page (so it can
 * never list one that does not exist), marks the one being read, and shows how far down the page you are.
 */
export default function CaseNav() {
  const rm = useReducedMotion();
  const [items, setItems] = useState<Item[]>([]);
  const [cur, setCur] = useState("");
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const secs = [...document.querySelectorAll<HTMLElement>("main.cs section.cs-sec:not(.cs-sec--tight), main.cs section.cs-band, main.cs section.cs-end")];
    const list: Item[] = secs.map((el, i) => {
      if (!el.id) el.id = `cs-s${i + 1}`;
      const rail = el.querySelector(".cs-rail h2")?.textContent?.trim();
      const eb = el.querySelector(".cs-eyebrow")?.textContent?.replace(/^\s*\d+\s*·\s*/, "").trim();
      const label = el.classList.contains("cs-end") ? "Explore it" : rail ?? eb ?? `Section ${i + 1}`;
      return { id: el.id, n: String(i + 1).padStart(2, "0"), label: label.length > 30 ? `${label.slice(0, 28)}…` : label };
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the sections only exist in the DOM after mount
    setItems(list);
    const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) setCur(e.target.id); }, { rootMargin: "-35% 0px -60% 0px" });
    secs.forEach((s) => io.observe(s));
    const on = () => { const h = document.documentElement; setPct(Math.min(100, Math.max(0, (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100))); };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => { io.disconnect(); window.removeEventListener("scroll", on); };
  }, []);

  if (!items.length) return null;
  return (
    <nav className="cn" aria-label="On this page">
      <div className="cn__bar" style={{ width: `${pct}%` }} aria-hidden="true" />
      <ol className="cn__list">
        {items.map((it) => (
          <li key={it.id}>
            <a href={`#${it.id}`} className={cur === it.id ? "is-on" : ""} aria-current={cur === it.id ? "location" : undefined}
              onClick={(e) => { e.preventDefault(); document.getElementById(it.id)?.scrollIntoView({ behavior: rm ? "auto" : "smooth", block: "start" }); history.replaceState(null, "", `#${it.id}`); }}>
              <span>{it.n}</span>{it.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
