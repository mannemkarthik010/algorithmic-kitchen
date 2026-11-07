"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
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
  const [open, setOpen] = useState(false);
  useEffect(() => {
    // difference-blending turns amber over saturated blue, so use plain white while the blue case-study opening is behind the bar
    const hero = document.querySelector<HTMLElement>(".cs--prev .cs-hero");
    const on = () => { setScrolled(window.scrollY > 40); setOnBlue(!!hero && hero.getBoundingClientRect().bottom > 64); };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <motion.header
      className={`exnav${scrolled ? " is-split" : ""}${onBlue ? " is-blue" : ""}`}
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
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
