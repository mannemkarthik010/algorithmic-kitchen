"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { openPalette } from "../lib/events";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "../components/ui/sheet";
import { resume } from "../data/resume";

const LINKS = [
  { label: "Work", href: "/#work" },
  { label: "About", href: "/#about" },
  { label: "Lab", href: "/lab" },
  { label: "Contact", href: "/#contact" },
];

/**
 * A split navigation: the wordmark and the links sit in two separate capsules and the gap between them opens as the page
 * scrolls. White text with mix-blend-mode: difference reads on both the ink and paper scenes, so no background is needed.
 * shadcn Sheet carries the phone menu (focus trap, Escape, scroll lock).
 */
export default function ExNav() {
  const [scrolled, setScrolled] = useState(false);
  const [onBlue, setOnBlue] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [yielded, setYielded] = useState(""); // wide screens: which capsule is stepping aside, "b" brand and/or "r" right-hand capsule
  const yld = useRef("");
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const hid = useRef(false); // mirrors `hidden` so the scroll handler and the focus handler agree
  const show = (v: boolean) => { hid.current = v; setHidden(v); };
  const yieldTo = (v: string) => { yld.current = v; setYielded(v); };
  const evaluate = useRef<() => void>(() => {}); // the scroll handler, so focus leaving the bar can re-check the overlap
  useEffect(() => {
    // difference-blending turns amber over saturated blue, so use plain white while the blue case-study opening is behind the bar
    const hero = document.querySelector<HTMLElement>(".cs--prev .cs-hero");
    let last = window.scrollY;
    // Controls the bar must never sit on: the gallery selector and the buttons and links inside the active exhibit (windows that are
    // not the active one are aria-hidden and ignored). Only a real overlap counts: a control whose box meets the horizontal extent
    // of one of the capsules, inside the band the capsules occupy. The extents come from layout, so they do not move when the bar
    // slides away, which keeps the decision stable (no flicker between hidden and shown).
    const CONTROLS = ".gx__index [role=tab], .gx__stage [role=tabpanel] button, .gx__stage [role=tabpanel] a[href]";
    const BAND = 66; // the capsules occupy roughly the top 14 to 58 px
    // which capsules (b = brand, r = the right-hand one) have a control under them right now
    const overlap = () => {
      const caps = [...(header.current?.querySelectorAll<HTMLElement>(".exnav__cap") ?? [])]
        .map((c) => ({ k: c.classList.contains("exnav__brand") ? "b" : "r", r: c.getBoundingClientRect() })).filter((c) => c.r.width > 0);
      const hit = new Set<string>();
      if (!caps.length) return hit;
      for (const el of document.querySelectorAll<HTMLElement>(CONTROLS)) {
        if (el.closest('[aria-hidden="true"]')) continue;
        const r = el.getBoundingClientRect();
        if (r.bottom <= 0 || r.top >= BAND || r.width === 0) continue;
        for (const c of caps) if (r.right > c.r.left - 6 && r.left < c.r.right + 6) hit.add(c.k);
      }
      return hit;
    };
    const controlUnderBar = () => overlap().size > 0;
    const on = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setOnBlue(!!hero && hero.getBoundingClientRect().bottom > 64);
      // Every width: the bar yields while one of those controls is under a capsule, and returns once it has passed. Keyboard focus on
      // the bar always shows it. Above 960 px only the overlapped capsule steps aside. On phones and tablets (960 px and below) the whole
      // bar steps away while reading downward and returns on upward scroll or at the top, so it does not sit on chart ranges, series
      // strips or the selector; on the way back up it still waits while one of those controls is under it.
      let next = hid.current;
      let yl = "";
      if (header.current?.contains(document.activeElement)) next = false;
      else if (window.innerWidth > 960) { next = false; const o = overlap(); yl = (o.has("b") ? "b" : "") + (o.has("r") ? "r" : ""); } // only the overlapped capsule steps aside
      else if (y < 140) next = false;
      else if (y - last > 4) next = true;
      else if (last - y > 4) next = controlUnderBar();
      else if (!hid.current && controlUnderBar()) next = true;
      last = y;
      if (next !== hid.current) show(next);
      if (yl !== yld.current) yieldTo(yl);
    };
    evaluate.current = on;
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    // choosing another exhibit moves controls without any scroll, so look again once its animation has settled
    const afterClick = () => { window.setTimeout(on, 800); };
    window.addEventListener("click", afterClick);
    return () => { evaluate.current = () => {}; window.removeEventListener("scroll", on); window.removeEventListener("resize", on); window.removeEventListener("click", afterClick); };
  }, []);

  return (
    <motion.header
      ref={header}
      className={`exnav${scrolled ? " is-split" : ""}${onBlue ? " is-blue" : ""}${hidden ? " is-hidden" : ""}${yielded.includes("b") ? " is-yield-b" : ""}${yielded.includes("r") ? " is-yield-r" : ""}`}
      onFocusCapture={() => { show(false); yieldTo(""); }}
      onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) window.requestAnimationFrame(() => evaluate.current()); }}
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      <a href="#main-content" className="exnav__skip" onClick={(e) => { const m = document.getElementById("main-content"); if (m) { e.preventDefault(); m.focus({ preventScroll: true }); m.scrollIntoView({ block: "start" }); } }}>Skip to content</a>
      <nav aria-label="Main" className="exnav__row">
        <Link href="/" className="exnav__cap exnav__brand" aria-label="Karthik Mannem, home">
          <span className="exnav__mark" aria-hidden="true">KM</span>
          <span className="exnav__name">Karthik Mannem</span>
        </Link>

        <div className="exnav__cap exnav__links">
          <ul>
            {LINKS.map((l) => (<li key={l.label}><Link href={l.href}>{l.label}</Link></li>))}
          </ul>
          <span className="exnav__sep" aria-hidden="true" />
          <a href="/Karthik_Mannem_Resume.pdf" target="_blank" rel="noopener noreferrer">Résumé ↗</a>
          <a href={resume.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          <button type="button" onClick={openPalette} aria-label="Search the site (Command or Control K)" className="exnav__k">⌘K</button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button type="button" className="exnav__cap exnav__menu" aria-label="Open menu">Menu <span aria-hidden="true">+</span></button>
          </SheetTrigger>
          <SheetContent side="right" className="exmenu">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SheetDescription className="sr-only">Site navigation</SheetDescription>
            <ol className="exmenu__list">
              {LINKS.map((l, i) => (
                <li key={l.label}>
                  <SheetClose asChild><Link href={l.href}><span>0{i + 1}</span>{l.label}</Link></SheetClose>
                </li>
              ))}
              <li><SheetClose asChild><Link href="/play"><span>05</span>Play</Link></SheetClose></li>
            </ol>
            <div className="exmenu__foot">
              <a href="/Karthik_Mannem_Resume.pdf" target="_blank" rel="noopener noreferrer">Résumé ↗</a>
              <a href={resume.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
              <a href={resume.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
              <button type="button" onClick={() => { setOpen(false); setTimeout(openPalette, 220); }}>Search ⌘K</button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </motion.header>
  );
}
