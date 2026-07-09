"use client";
import { useRef, useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { resume } from "../data/resume";
import { SectionHeader } from "./ui";

const META: Record<string, { sym: string; color: string; accent: string }> = {
  "Base Ingredients":    { sym: "◎", color: "rgba(200,145,58,0.85)",  accent: "rgba(200,145,58,0.15)" },
  "Cooking Tools":       { sym: "◇", color: "rgba(80,180,240,0.85)",  accent: "rgba(80,180,240,0.12)" },
  "AI Spices":           { sym: "◈", color: "rgba(212,93,32,0.9)",    accent: "rgba(212,93,32,0.14)" },
  "Data Prep":           { sym: "◉", color: "rgba(200,145,58,0.75)",  accent: "rgba(200,145,58,0.1)"  },
  "Serving & Deployment":{ sym: "▲", color: "rgba(80,210,140,0.85)",  accent: "rgba(80,210,140,0.12)" },
  "Cloud & DB":          { sym: "◆", color: "rgba(150,130,230,0.85)", accent: "rgba(150,130,230,0.12)"},
  "Frontend":            { sym: "▷", color: "rgba(220,160,60,0.85)",  accent: "rgba(220,160,60,0.12)" },
};

function SkillCard({ cat, skills, index }: { cat: string; skills: string[]; index: number }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const rm = useReducedMotion();
  const m = META[cat] ?? { sym: "◎", color: "rgba(200,145,58,0.8)", accent: "rgba(200,145,58,0.12)" };

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (rm || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
    const dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
    setTilt({ x: dy * -8, y: dx * 10 });
  }, [rm]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: index * 0.07 }}
      style={{ perspective: 800 }}
      onMouseMove={onMove}
      onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setHovered(false); }}
      onMouseEnter={() => setHovered(true)}
      ref={ref}
    >
      <motion.div
        animate={rm ? {} : { rotateX: tilt.x, rotateY: tilt.y, y: hovered ? -8 : 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        style={{
          transformStyle: "preserve-3d",
          padding: "var(--space-3)",
          background: hovered
            ? `linear-gradient(145deg, ${m.accent}, rgba(14,10,5,0.98))`
            : "linear-gradient(135deg, rgba(22,15,7,0.92), rgba(8,5,2,0.97))",
          border: `1px solid ${hovered ? m.color.replace("0.85", "0.45").replace("0.9","0.5") : "rgba(200,145,58,0.15)"}`,
          borderRadius: "var(--radius-xl)",
          height: "100%",
          transition: "background 0.35s ease, border-color 0.3s ease",
          boxShadow: hovered
            ? `0 20px 50px rgba(0,0,0,0.6), 0 0 30px ${m.accent}`
            : "0 4px 20px rgba(0,0,0,0.4)",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Top accent line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: hovered
            ? `linear-gradient(90deg, transparent, ${m.color}, transparent)`
            : "linear-gradient(90deg, transparent, rgba(200,145,58,0.18), transparent)",
          transition: "background 0.35s ease",
        }} />

        {/* 3D floating sym orb */}
        <motion.div
          animate={rm || !hovered ? {} : { rotateY: [0, 20, 0], y: [0, -4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d", display: "inline-flex", marginBottom: "var(--space-2)" }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: `radial-gradient(circle at 35% 35%, ${m.accent}, transparent 70%)`,
            border: `1px solid ${m.color.replace("0.85", "0.3")}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: hovered ? `0 8px 24px ${m.accent}, inset 0 1px 0 rgba(255,255,255,0.05)` : "none",
            transition: "box-shadow 0.3s ease",
          }}>
            <span style={{ fontFamily: "var(--f-mono)", fontSize: 14, color: m.color }}>{m.sym}</span>
          </div>
        </motion.div>

        <p className="label" style={{ marginBottom: 3, opacity: 0.5 }}>Category</p>
        <p style={{ fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 14, color: m.color, marginBottom: "var(--space-2)" }}>{cat}</p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {skills.map((s) => (
            <motion.span
              key={s}
              whileHover={rm ? {} : { scale: 1.06, y: -2 }}
              style={{
                padding: "4px 10px", borderRadius: 14,
                background: `${m.accent}`,
                border: `1px solid ${m.color.replace("0.85","0.22").replace("0.9","0.25")}`,
                fontFamily: "var(--f-mono)", fontSize: 10,
                color: m.color.replace("0.85","1").replace("0.9","1"),
                display: "inline-block", cursor: "default",
              }}
            >{s}</motion.span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Skills() {
  return (
    <section id="skills" className="s-warm" style={{ position: "relative" }}>
      <div aria-hidden="true" style={{ position: "absolute", bottom: 0, left: "50%", width: 500, height: 500, borderRadius: "50%", background: "rgba(200,145,58,0.04)", filter: "blur(90px)", transform: "translateX(-50%)", pointerEvents: "none", zIndex: 0 }} />

      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        <SectionHeader index="§ 04" label="Ingredients Shelf"
          title={<>The <span className="t-grad">Pantry</span></>}
          subtitle="Every great dish starts with quality ingredients. Hover to explore the depth."
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "var(--space-2)" }}>
          {Object.entries(resume.skills).map(([cat, skills], i) => (
            <SkillCard key={cat} cat={cat} skills={skills} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
