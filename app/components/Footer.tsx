"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { resume } from "../data/resume";
import { AKMark } from "./ui";

const NAV = [
  { l: "work",        h: "/#projects"      },
  { l: "open source", h: "/#contributions" },
  { l: "experience",  h: "/#experience"    },
  { l: "about",       h: "/#about"         },
  { l: "lab",         h: "/lab"            },
  { l: "contact",     h: "/#contact"       },
];

const SOCIAL = [
  { l: "GitHub",   h: resume.github,              external: true  },
  { l: "LinkedIn", h: resume.linkedin,             external: true  },
  { l: "Email",    h: `mailto:${resume.email}`,    external: false },
  { l: "Résumé",   h: "/Karthik_Mannem_Resume.pdf",external: true  },
];

export default function Footer() {
  const nameRef = useRef<HTMLDivElement>(null);
  const rm = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: nameRef, offset: ["start end", "end 0.85"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [55, 0]);
  const lift = useTransform(scrollYProgress, [0, 1], [90, 0]);
  return (
    <footer style={{ borderTop: "1px solid var(--border)", background: "linear-gradient(180deg, transparent, rgba(10,13,16,0.6))" }}>
      {/* Chunky sign-off */}
      <div className="container footer-persp" ref={nameRef} style={{ paddingTop: "var(--space-5)" }}>
        <motion.a
          href="/#contact"
          className="footer-mega"
          aria-label="Karthik Mannem, get in touch"
          style={rm ? undefined : { rotateX, y: lift, transformOrigin: "50% 100%" }}
        >
          <span>KARTHIK</span>
          <span className="footer-mega__fill">MANNEM</span>
        </motion.a>
      </div>

      {/* Main footer body */}
      <div className="container" style={{ padding: "var(--space-6) 0 var(--space-4)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-5)" }}>

        {/* Brand column */}
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "var(--space-2)" }}>
            <AKMark size="sm" />
            <span style={{ fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 14, letterSpacing: "-0.02em", color: "var(--cream)" }}>Karthik Mannem</span>
          </div>
          <p className="body-sm c-muted" style={{ fontStyle: "italic", lineHeight: 1.7, maxWidth: 260 }}>
            I build AI systems you can inspect, test, and trust.
          </p>
          
        </motion.div>

        {/* Navigation column */}
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}>
          <p className="label c-gold" style={{ marginBottom: "var(--space-2)", letterSpacing: "0.18em" }}>Navigate</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {NAV.map((n) => (
              <motion.a key={n.l} href={n.h}
                className="body-sm c-muted"
                style={{ textDecoration: "none", transition: "color 0.2s" }}
                whileHover={{ color: "var(--gold)" } as Parameters<typeof motion.a>[0]["whileHover"]}
              >
                {n.l}
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Connect column */}
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.14 }}>
          <p className="label c-gold" style={{ marginBottom: "var(--space-2)", letterSpacing: "0.18em" }}>Connect</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SOCIAL.map(({ l, h, external }) => (
              <motion.a key={l} href={h}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="body-sm c-muted"
                style={{ textDecoration: "none", transition: "color 0.2s", display: "flex", alignItems: "center", gap: 5 }}
                whileHover={{ color: "var(--gold)" } as Parameters<typeof motion.a>[0]["whileHover"]}
              >
                {l}
                {external && <span style={{ fontSize: 9, opacity: 0.5 }}>↗</span>}
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Status column */}
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
          <p className="label c-gold" style={{ marginBottom: "var(--space-2)", letterSpacing: "0.18em" }}>Status</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <p className="label c-muted" style={{ marginBottom: 3 }}>Availability</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  style={{ width: 6, height: 6, borderRadius: "50%", background: "#70D5B3" }}
                />
                <span className="body-sm" style={{ color: "#70D5B3" }}>Open to ML/AI roles</span>
              </div>
            </div>
            <div>
              <p className="label c-muted" style={{ marginBottom: 3 }}>Location</p>
              <p className="body-sm c-muted">{resume.location}</p>
            </div>
            <div>
              <p className="label c-muted" style={{ marginBottom: 3 }}>Education</p>
              <p className="body-sm c-muted">M.S. CS · CSUN · 3.92 GPA</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "var(--space-3) 0" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <p className="label c-muted" style={{ fontSize: 11 }}>© {new Date().getFullYear()} {resume.name}</p>
          <p className="label c-muted" style={{ fontSize: 11 }}>Los Angeles, CA</p>
        </div>
      </div>
    </footer>
  );
}
