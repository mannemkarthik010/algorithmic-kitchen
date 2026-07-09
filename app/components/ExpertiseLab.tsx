"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { expertiseLab } from "../data/resume";
import { SectionHeader, GlowBlob, FadeUp } from "./ui";
import { EASE, DUR } from "../lib/motion";

export default function ExpertiseLab() {
  const [active, setActive] = useState<number | null>(null);
  const rm = useReducedMotion();

  return (
    <section id="expertise" style={{ position: "relative", paddingTop: "var(--space-6)", paddingBottom: "var(--space-6)" }}>
      <GlowBlob size={500} color="rgba(200,145,58,0.04)" style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />

      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        <SectionHeader
          index="§ 04"
          label="Expertise Lab"
          title={<>What I <span className="t-grad">Actually Build</span></>}
          subtitle="Six specialisations. Each one proven by shipped work, not just listed skills."
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: "var(--space-3)" }}>
          {expertiseLab.map((area, i) => {
            const isActive = active === i;
            return (
              <FadeUp key={area.id} delay={i * 0.07}>
                <motion.div
                  onClick={() => setActive(isActive ? null : i)}
                  whileHover={rm ? {} : { y: -4 }}
                  style={{
                    padding: "var(--space-3) var(--space-3)",
                    background: isActive
                      ? `linear-gradient(135deg, ${area.color}55, rgba(10,7,4,0.97))`
                      : "linear-gradient(135deg, rgba(27,19,8,0.82), rgba(10,7,4,0.96))",
                    border: "1px solid",
                    borderColor: isActive ? area.accent + "88" : "var(--border)",
                    borderRadius: "var(--radius-xl)",
                    cursor: "pointer",
                    transition: "all 0.35s ease",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Accent top line */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: isActive ? area.accent : "transparent", transition: "background 0.35s", borderRadius: "var(--radius-xl) var(--radius-xl) 0 0" }} />

                  {/* Background glow when active */}
                  {isActive && !rm && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${area.accent}18, transparent 70%)`, pointerEvents: "none" }}
                    />
                  )}

                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "var(--space-2)", position: "relative", zIndex: 1 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: `${area.color}88`, border: `1px solid ${area.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span className="mono" style={{ fontSize: 16, color: area.accent }}>{area.icon}</span>
                    </div>
                    <div>
                      <p className="body-md c-cream" style={{ fontWeight: 600, marginBottom: 2 }}>{area.title}</p>
                      <p className="label c-muted" style={{ fontSize: 9 }}>{area.tagline}</p>
                    </div>
                    <motion.span
                      animate={rm ? {} : { rotate: isActive ? 180 : 0 }}
                      transition={{ duration: DUR.fast, ease: EASE }}
                      className="mono c-muted"
                      style={{ marginLeft: "auto", fontSize: 10, opacity: 0.5, flexShrink: 0 }}
                    >▾</motion.span>
                  </div>

                  {/* Mastery flame bars */}
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 22, marginBottom: "var(--space-2)", position: "relative", zIndex: 1 }}>
                    {[1,2,3,4,5].map((bar) => (
                      <motion.div
                        key={bar}
                        initial={rm ? false : { scaleY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 + bar * 0.07, duration: 0.45, ease: [0.22,1,0.36,1] }}
                        style={{
                          width: 5, borderRadius: 3,
                          height: `${Math.min(100, 40 + bar * 12)}%`,
                          background: bar <= 4
                            ? `linear-gradient(to top, ${area.accent}, ${area.color})`
                            : `linear-gradient(to top, ${area.accent}60, ${area.accent}22)`,
                          transformOrigin: "bottom",
                          opacity: bar <= 4 ? 0.9 : 0.3,
                        }}
                      />
                    ))}
                    <span className="label" style={{ fontSize: 8, color: area.accent, opacity: 0.65, marginLeft: 6, lineHeight: 1, alignSelf: "center" }}>EXPERT</span>
                  </div>

                  {/* Expandable content */}
                  <motion.div
                    initial={false}
                    animate={{ height: isActive ? "auto" : 0, opacity: isActive ? 1 : 0 }}
                    transition={{ duration: DUR.moderate, ease: EASE }}
                    style={{ overflow: "hidden", position: "relative", zIndex: 1 }}
                  >
                    <p className="body-sm c-muted" style={{ lineHeight: 1.7, marginBottom: "var(--space-2)" }}>{area.what}</p>

                    {/* Tools */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: "var(--space-2)" }}>
                      {area.tools.map((t) => (
                        <span key={t} style={{ fontFamily: "var(--f-mono)", fontSize: 9, padding: "3px 8px", borderRadius: 20, background: `${area.accent}15`, border: `1px solid ${area.accent}30`, color: area.accent }}>{t}</span>
                      ))}
                    </div>

                    {/* Proof */}
                    <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "rgba(0,0,0,0.3)", borderLeft: `2px solid ${area.accent}` }}>
                      <p className="label" style={{ marginBottom: 4, color: area.accent, opacity: 0.7 }}>Proven by</p>
                      <p className="body-sm c-cream" style={{ fontSize: 12, lineHeight: 1.6 }}>{area.proof}</p>
                    </div>
                  </motion.div>

                  {/* Collapsed preview — tool pills */}
                  {!isActive && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, position: "relative", zIndex: 1 }}>
                      {area.tools.slice(0, 4).map((t) => (
                        <span key={t} className="label c-muted" style={{ fontSize: 9, padding: "2px 7px", borderRadius: 12, border: "1px solid var(--border)" }}>{t}</span>
                      ))}
                      {area.tools.length > 4 && <span className="label c-muted" style={{ fontSize: 9 }}>+{area.tools.length - 4}</span>}
                    </div>
                  )}
                </motion.div>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}
