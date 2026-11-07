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
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const hid = useRef(false); // mirrors `hidden` so the scroll handler and the focus handler agree
  const show = (v: boolean) => { hid.current = v; setHidden(v); };
  useEffect(() => {
    // difference-blending turns amber over saturated blue, so use plain white while the blue case-study opening is behind the bar
    const hero = document.querySelector<HTMLElement>(".cs--prev .cs-hero");
    let last = window.scrollY;
    // Control strips the bar must never sit on: the gallery selector and the controls inside each miniature. Windows that are
    // not the active one are aria-hidden and ignored.
    const CLEAR = ".gx__index, .rm__bar, .rm__ctl, .pm__ctl, .tm__lines";
    const BAND = 72; // the bar's capsules occupy roughly the top 14 to 58 px
    const controlUnderBar = () => {
      for (const el of document.querySelectorAll<HTMLElement>(CLEAR)) {
        if (el.closest('[aria-hidden="true"]')) continue;
        const r = el.getBoundingClientRect();
        if (r.bottom > 0 && r.top < BAND) return true;
      }
      return false;
    };
    const on = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setOnBlue(!!hero && hero.getBoundingClientRect().bottom > 64);
      // On phones and tablets the capsules would sit on top of controls scrolled up beneath them (the gallery selector, chart
      // ranges, series strips). So the bar steps away while reading downward and returns on upward scroll, at the top, or when it
      // holds keyboard focus, but it stays away while one of those control strips is under it and returns once the strip has passed.
      let next = hid.current;
      if (window.innerWidth > 960 || y < 140 || header.current?.contains(document.activeElement)) next = false;
      else if (y - last > 4) next = true;
      else if (last - y > 4) next = controlUnderBar();
      else if (!hid.current && controlUnderBar()) next = true;
      last = y;
      if (next !== hid.current) show(next);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); };
  }, []);

  return (
    <motion.header
      ref={header}
      className={`exnav${scrolled ? " is-split" : ""}${onBlue ? " is-blue" : ""}${hidden ? " is-hidden" : ""}`}
      onFocusCapture={() => show(false)}
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
