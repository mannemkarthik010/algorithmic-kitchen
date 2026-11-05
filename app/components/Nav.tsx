"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { AKMark } from "./ui";
import { openPalette } from "../lib/events";
import { resume, featuredWork } from "../data/resume";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "./ui/navigation-menu";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "./ui/sheet";

const LINKS = [
  { label: "Open source", href: "/#contributions", id: "contributions" },
  { label: "About", href: "/#about", id: "about" },
  { label: "Lab", href: "/lab", id: "lab" },
  { label: "Contact", href: "/#contact", id: "contact" },
];
const SECTIONS = ["projects", "contributions", "about", "contact"];

const flagship = featuredWork.map((f) => {
  const p = resume.projects.find((x) => x.slug === f.slug)!;
  const cs = (f as { caseStudy?: string }).caseStudy ?? "/#projects";
  const short = f.slug === "retail-intel" ? "Retail Demand Intelligence" : f.slug === "preventive-care" ? "Preventive Care Agent" : "TaxProof";
  return { slug: f.slug, name: short, line: f.headline, href: cs, status: p.status };
});

/**
 * Navigation built from shadcn/ui: NavigationMenu for desktop (Work opens a panel of the three flagships) and a Sheet
 * for small screens. Both are Radix underneath, so focus handling, Escape and arrow keys come for free.
 */
export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const [sheet, setSheet] = useState(false);
  const onLab = usePathname() === "/lab";

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
      let found = "";
      for (const id of SECTIONS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= 120 && r.bottom > 120) { found = id; break; }
      }
      setActive(found);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cur = (id: string) => (id === "lab" ? onLab : !onLab && active === id);

  return (
    <motion.nav
      className={`site-nav${scrolled ? " is-scrolled" : ""}`}
      aria-label="Main"
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="container site-nav__row">
        <Link href="/" className="site-nav__brand">
          <AKMark size="sm" />
          <span>Karthik Mannem</span>
        </Link>

        <NavigationMenu className="site-nav__menu hidden md:flex" delayDuration={80}>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className={`nav-trigger${cur("projects") ? " is-cur" : ""}`}>Work</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="nav-work">
                  {flagship.map((f, i) => (
                    <li key={f.slug}>
                      <NavigationMenuLink asChild>
                        <Link href={f.href}>
                          <span className="nav-work__n">0{i + 1}</span>
                          <b>{f.name}</b>
                          <span>{f.line}</span>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                  <li className="nav-work__all">
                    <NavigationMenuLink asChild><Link href="/#projects">All work on the page →</Link></NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            {LINKS.map((n) => (
              <NavigationMenuItem key={n.label}>
                <NavigationMenuLink asChild>
                  <Link href={n.href} className={`nav-link${cur(n.id) ? " is-cur" : ""}`} aria-current={cur(n.id) ? "page" : undefined}>{n.label}</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="site-nav__actions hidden md:flex">
          <button type="button" onClick={openPalette} aria-label="Open search" className="site-nav__search">
            <span aria-hidden="true">⌕</span> Search <kbd>⌘K</kbd>
          </button>
          <a href="/Karthik_Mannem_Resume.pdf" target="_blank" rel="noopener noreferrer" className="pill-cta site-nav__cv">Résumé ↗</a>
        </div>

        <Sheet open={sheet} onOpenChange={setSheet}>
          <SheetTrigger asChild>
            <button type="button" className="site-nav__burger md:hidden" aria-label="Open menu"><Menu size={22} /></button>
          </SheetTrigger>
          <SheetContent side="right" className="nav-sheet">
            <SheetTitle className="nav-sheet__title">Karthik Mannem</SheetTitle>
            <SheetDescription className="nav-sheet__desc">Machine Learning &amp; AI Engineer</SheetDescription>
            <p className="nav-sheet__h">Work</p>
            <ul className="nav-sheet__work">
              {flagship.map((f, i) => (
                <li key={f.slug}><SheetClose asChild><Link href={f.href}><span>0{i + 1}</span><b>{f.name}</b></Link></SheetClose></li>
              ))}
            </ul>
            <p className="nav-sheet__h">Site</p>
            <ul className="nav-sheet__links">
              <li><SheetClose asChild><Link href="/#projects">All work</Link></SheetClose></li>
              {LINKS.map((n) => (<li key={n.label}><SheetClose asChild><Link href={n.href}>{n.label}</Link></SheetClose></li>))}
            </ul>
            <div className="nav-sheet__foot">
              <button type="button" className="fw-ghost" onClick={() => { setSheet(false); setTimeout(openPalette, 200); }}>⌕ Search</button>
              <a className="pill-cta" href="/Karthik_Mannem_Resume.pdf" target="_blank" rel="noopener noreferrer">Résumé ↗</a>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </motion.nav>
  );
}
