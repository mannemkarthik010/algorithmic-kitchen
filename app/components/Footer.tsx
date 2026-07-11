"use client";
import { motion } from "framer-motion";
import { resume } from "../data/resume";
import { AKMark } from "./ui";

const NAV = [
  { l: "story",       h: "#about"      },
  { l: "recipes",     h: "#projects"   },
  { l: "ingredients", h: "#skills"     },
  { l: "experience",  h: "#experience" },
  { l: "library",     h: "#reading"    },
  { l: "reserve",     h: "#contact"    },
];

const SOCIAL = [
  { l: "GitHub",   h: resume.github,              external: true  },
  { l: "LinkedIn", h: resume.linkedin,             external: true  },
  { l: "Email",    h: `mailto:${resume.email}`,    external: false },
  { l: "Résumé",   h: "/Karthik_Mannem_Resume.pdf",external: true  },
];

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", background: "linear-gradient(180deg, transparent, rgba(6,4,2,0.6))" }}>
      {/* Main footer body */}
      <div className="container" style={{ padding: "var(--space-6) 0 var(--space-4)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-5)" }}>

        {/* Brand column */}
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "var(--space-2)" }}>
            <AKMark size="sm" />
            <span className="mono c-gold" style={{ letterSpacing: "0.04em", fontSize: 11 }}>The Algorithmic Kitchen</span>
          </div>
          <p className="body-sm c-muted" style={{ fontStyle: "italic", lineHeight: 1.7, maxWidth: 260 }}>
            Cooking intelligent systems from raw data, creativity, and machine learning.
          </p>
          <p className="label c-muted" style={{ marginTop: "var(--space-2)", opacity: 0.45 }}>
            Los Angeles, CA · {new Date().getFullYear()}
          </p>
        </motion.div>

        {/* Navigation column */}
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}>
          <p className="label c-gold" style={{ marginBottom: "var(--space-2)", letterSpacing: "0.18em" }}>Menu</p>
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
                  style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }}
                />
                <span className="body-sm" style={{ color: "#4ade80" }}>Open to ML/AI roles</span>
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

      {/* Bottom bar — branded kitchen closing */}
      <div style={{ borderTop: "1px solid rgba(200,145,58,0.08)", padding: "var(--space-3) 0" }}>
        <div className="container" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          {/* Steam curls above the closing line */}
          <div aria-hidden="true" style={{ display: "flex", gap: 20, alignItems: "flex-end", height: 28, opacity: 0.35 }}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -14, 0], opacity: [0.6, 0.2, 0.6], scaleX: [1, 1.3, 0.8, 1] }}
                transition={{ duration: 2.2 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
                style={{ width: 2, height: 22, background: "linear-gradient(to top, var(--gold), transparent)", borderRadius: 2 }}
              />
            ))}
          </div>

          {/* AK mark centered */}
          <motion.div whileHover={{ scale: 1.08 }} transition={{ duration: 0.2 }}
            style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(200,145,58,0.06)", border: "1px solid rgba(200,145,58,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--gold)", letterSpacing: "0.05em" }}>AK</span>
          </motion.div>

          <p className="label c-muted" style={{ fontSize: 9, letterSpacing: "0.18em", opacity: 0.4 }}>
            KITCHEN CLOSES WHEN THE WORK IS DONE
          </p>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: 8 }}>
            <p className="label c-muted" style={{ opacity: 0.35, fontSize: 9 }}>
              © {new Date().getFullYear()} {resume.name} · The Algorithmic Kitchen
            </p>
            <p className="label" style={{ color: "rgba(200,145,58,0.18)", fontSize: 9 }}>
              PRESS ⌃` FOR DEVELOPER MODE
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
