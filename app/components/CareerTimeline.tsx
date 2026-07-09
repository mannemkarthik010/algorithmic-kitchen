"use client";
import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { careerTimeline } from "../data/resume";
import { SectionHeader, GlowBlob } from "./ui";
import { EASE, DUR } from "../lib/motion";

function TimelineNode({ entry, index, isLast }: {
  entry: typeof careerTimeline[number];
  index: number;
  isLast: boolean;
}) {
  const ref  = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const rm   = useReducedMotion();

  return (
    <div ref={ref} style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "var(--space-3)", position: "relative" }}>
      {/* Year + connector line */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
        {/* Year label */}
        <motion.p
          initial={rm ? false : { opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: index * 0.12, duration: DUR.moderate, ease: EASE }}
          className="mono c-gold"
          style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: "0.05em" }}
        >
          {entry.year}
        </motion.p>

        {/* Dot */}
        <motion.div
          initial={rm ? false : { scale: 0, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ delay: index * 0.12 + 0.1, duration: DUR.normal, ease: EASE }}
          style={{
            width: entry.milestone ? 16 : 10,
            height: entry.milestone ? 16 : 10,
            borderRadius: "50%",
            background: entry.milestone ? "var(--gold)" : "rgba(200,145,58,0.35)",
            border: entry.milestone ? "2px solid rgba(200,145,58,0.4)" : "1px solid rgba(200,145,58,0.3)",
            boxShadow: entry.milestone && !rm ? "0 0 16px rgba(200,145,58,0.4)" : "none",
            flexShrink: 0,
            zIndex: 2,
            position: "relative",
          }}
        />

        {/* Vertical line */}
        {!isLast && (
          <motion.div
            initial={rm ? false : { scaleY: 0 }}
            animate={inView ? { scaleY: 1 } : { scaleY: 0 }}
            transition={{ delay: index * 0.12 + 0.2, duration: DUR.slow, ease: EASE }}
            style={{
              width: 1,
              flex: 1,
              minHeight: 40,
              background: "linear-gradient(to bottom, rgba(200,145,58,0.35), rgba(200,145,58,0.08))",
              marginTop: 6,
              transformOrigin: "top",
            }}
          />
        )}
      </div>

      {/* Card */}
      <motion.div
        initial={rm ? false : { opacity: 0, x: 20 }}
        animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
        transition={{ delay: index * 0.12, duration: DUR.moderate, ease: EASE }}
        style={{
          padding: "var(--space-2) var(--space-3)",
          background: entry.milestone
            ? "linear-gradient(135deg, rgba(30,20,8,0.9), rgba(10,7,4,0.95))"
            : "linear-gradient(135deg, rgba(18,12,5,0.75), rgba(8,5,2,0.9))",
          border: "1px solid",
          borderColor: entry.milestone ? "rgba(200,145,58,0.28)" : "rgba(200,145,58,0.1)",
          borderRadius: "var(--radius-lg)",
          marginBottom: "var(--space-3)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Milestone glow */}
        {entry.milestone && !rm && (
          <div style={{ position: "absolute", top: -20, left: -20, width: 120, height: 80, background: "radial-gradient(circle, rgba(200,145,58,0.08), transparent 70%)", pointerEvents: "none" }} />
        )}

        <div style={{ position: "relative", zIndex: 1 }}>
          <p className="body-md c-cream" style={{ fontWeight: 600, marginBottom: 4 }}>{entry.title}</p>
          <p className="body-sm c-muted" style={{ lineHeight: 1.7, marginBottom: "var(--space-1)" }}>{entry.desc}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {entry.tags.map((tag) => (
              <span key={tag} className="label"
                style={{ fontSize: 9, padding: "2px 7px", borderRadius: 12,
                  background: tag === "Available Now" || tag === "Full-Time" ? "rgba(74,222,128,0.1)" : "rgba(200,145,58,0.08)",
                  border: `1px solid ${tag === "Available Now" || tag === "Full-Time" ? "rgba(74,222,128,0.3)" : "rgba(200,145,58,0.2)"}`,
                  color: tag === "Available Now" || tag === "Full-Time" ? "#4ade80" : "var(--gold)",
                }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function CareerTimeline() {
  return (
    <section id="timeline" style={{ position: "relative", paddingTop: "var(--space-6)", paddingBottom: "var(--space-6)" }}>
      <GlowBlob size={400} color="rgba(200,145,58,0.04)" style={{ top: "30%", right: -80 }} />

      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        <SectionHeader
          index="§ 05"
          label="Evolution"
          title={<>The <span className="t-grad">Journey</span></>}
          subtitle="Seven years. One direction. Every year a sharper focus on intelligent systems."
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: "0 var(--space-6)" }}>
          {/* Left column: years 0–3 */}
          <div>
            {careerTimeline.slice(0, 4).map((entry, i) => (
              <TimelineNode key={entry.year} entry={entry} index={i} isLast={i === 3} />
            ))}
          </div>
          {/* Right column: years 4–6 */}
          <div style={{ paddingTop: "var(--space-4)" }}>
            {careerTimeline.slice(4).map((entry, i) => (
              <TimelineNode key={entry.year} entry={entry} index={i + 4} isLast={i === 2} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
