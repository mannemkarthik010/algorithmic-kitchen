"use client";
import { motion } from "framer-motion";
import { resume } from "../data/resume";
import { SectionHeader, Badge, Stagger, Item } from "./ui";

export default function Experience() {
  return (
    <section id="experience" className="s-deep" style={{ position: "relative" }}>
      <div className="section-glow" aria-hidden="true" />
      <div className="section-top-glow" />
      <div className="section-bottom-glow" />
      <div aria-hidden="true" style={{ position: "absolute", top: "20%", right: -80, width: 380, height: 380, borderRadius: "50%", background: "rgba(200,145,58,0.04)", filter: "blur(90px)", pointerEvents: "none", zIndex: 0 }} />

      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        <SectionHeader index="§ 04" label="Kitchen Experience"
          title={<>Time in the <span className="t-grad">Kitchen</span></>}
        />

        <Stagger style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {resume.experience.map((exp, i) => (
            <Item key={i}>
              <motion.div whileHover={{ y: -3, borderColor: "var(--border-hover)" }}
                className="card"
                style={{ padding: "var(--space-3) var(--space-4)", transition: "border-color 0.22s" }}>
                <div className="exp-card-grid" style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "var(--space-3)", alignItems: "flex-start" }}>
                  <div style={{ width: 42, height: 42, borderRadius: "var(--radius-md)", background: "rgba(200,145,58,0.08)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span className="mono c-gold" style={{ fontSize: 14, opacity: 0.58 }}>{exp.icon}</span>
                  </div>

                  <div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: "0.2rem" }}>
                      <p className="body-lg c-cream" style={{ fontWeight: 500 }}>{exp.role}</p>
                      <Badge>{exp.kitchenRole}</Badge>
                    </div>
                    <p className="label c-gold" style={{ marginBottom: "var(--space-2)" }}>{exp.company}</p>
                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.38rem" }}>
                      {exp.bullets.map((b, j) => (
                        <li key={j} style={{ display: "flex", gap: "var(--space-1)", alignItems: "flex-start" }}>
                          <span className="mono c-gold" style={{ fontSize: 11, marginTop: 4, flexShrink: 0, opacity: 0.65 }}>▸</span>
                          <span className="body-sm c-muted">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <span className="mono c-muted exp-period" style={{ fontSize: 11, whiteSpace: "nowrap", textAlign: "right", flexShrink: 0 }}>{exp.period}</span>
                </div>
              </motion.div>
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
