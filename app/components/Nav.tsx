"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AKMark } from "./ui";

const NAV = [
  { label: "story",      href: "#about"     },
  { label: "recipes",    href: "#projects"  },
  { label: "expertise",  href: "#expertise" },
  { label: "journey",    href: "#timeline"  },
  { label: "library",    href: "#reading"   },
  { label: "reserve",    href: "#contact"   },
];

const SECTIONS = ["about","projects","skills","experience","reading","contact"];

export default function Nav() {
  const [scrolled, setScrolled]   = useState(false);
  const [open, setOpen]           = useState(false);
  const [active, setActive]       = useState<string>("");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
      // Determine active section via intersection
      let found = "";
      for (const id of SECTIONS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 120 && rect.bottom > 120) { found = id; break; }
      }
      setActive(found);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, delay: 3.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        padding: "1rem var(--space-4)",
        background: scrolled ? "rgba(6,4,2,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(28px) saturate(1.6)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(28px) saturate(1.6)" : "none",
        borderBottom: scrolled ? "1px solid rgba(200,145,58,0.14)" : "none",
        boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(200,145,58,0.08)" : "none",
        transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
      }}
    >
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 0 }}>
        {/* Brand */}
        <motion.a href="#hero" whileHover={{ opacity: 0.75 }}
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <AKMark size="sm" />
          <span className="mono c-gold" style={{ letterSpacing: "0.04em" }}>The Algorithmic Kitchen</span>
        </motion.a>

        {/* Desktop nav */}
        <div className="hidden md:flex" style={{ alignItems: "center", gap: "var(--space-4)" }}>
          {NAV.map((n) => {
            const isActive = active === n.href.replace("#", "");
            return (
              <div key={n.label} style={{ position: "relative" }}>
                <motion.a
                  href={n.href}
                  className="label"
                  style={{
                    textDecoration: "none",
                    color: isActive ? "var(--gold)" : "var(--muted)",
                    transition: "color 0.2s",
                  }}
                  whileHover={{ color: "var(--gold)" } as Parameters<typeof motion.a>[0]["whileHover"]}
                >
                  {n.label}
                </motion.a>
                {/* Active underline dot */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      key="dot"
                      layoutId="nav-active"
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0 }}
                      style={{
                        position: "absolute", bottom: -4, left: 0, right: 0,
                        height: 1,
                        background: "var(--gold)",
                        borderRadius: 1,
                        transformOrigin: "center",
                      }}
                    />
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          <motion.a
            href="/Karthik_Mannem_Resume.pdf"
            target="_blank" rel="noopener noreferrer"
            className="label c-gold"
            style={{ textDecoration: "none", padding: "7px 16px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", transition: "border-color 0.2s, background 0.2s" }}
            whileHover={{ borderColor: "var(--border-active)", background: "rgba(200,145,58,0.06)" } as Parameters<typeof motion.a>[0]["whileHover"]}
          >
            résumé ↗
          </motion.a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden"
          style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontSize: 20, lineHeight: 1 }}
          aria-label="Toggle menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
            style={{ overflow: "hidden", background: "rgba(8,5,2,0.97)", borderTop: "1px solid var(--border)", padding: "var(--space-1) var(--space-4) var(--space-2)" }}
          >
            {NAV.map((n) => (
              <a key={n.label} href={n.href} onClick={() => setOpen(false)}
                className="label c-muted"
                style={{ display: "block", padding: "0.7rem 0", textDecoration: "none" }}>
                {n.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
