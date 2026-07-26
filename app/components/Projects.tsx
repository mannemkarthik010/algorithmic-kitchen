"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { resume, Project } from "../data/resume";
import { SectionHeader, Badge, Btn } from "./ui";
import ProjectModal from "./ProjectModal";
import { useSoundFx } from "../hooks/useSoundFx";
import { EASE, DUR } from "../lib/motion";

function ComplexityBar({ value }: { value: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ display: "flex", gap: 3 }}>
        {[1,2,3,4].map((n) => (
          <div key={n} style={{
            width: 20, height: 4, borderRadius: 2,
            background: n <= value
              ? `rgba(200,145,58,${0.3 + n * 0.18})`
              : "rgba(200,145,58,0.1)",
          }} />
        ))}
      </div>
      <span className="label c-muted" style={{ fontSize: 9 }}>
        {value >= 4 ? "ADVANCED" : "INTERMEDIATE"}
      </span>
    </div>
  );
}

// Mini pipeline — 3 steps extracted from architecture
function MiniPipeline({ steps }: { steps: { step: string }[] }) {
  const show = steps.slice(0, 3);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: "var(--space-2)" }}>
      {show.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span className="label" style={{
            fontSize: 8, padding: "2px 6px", borderRadius: 4,
            background: "rgba(200,145,58,0.08)",
            border: "1px solid rgba(200,145,58,0.18)",
            color: "var(--gold)", whiteSpace: "nowrap",
          }}>{s.step}</span>
          {i < show.length - 1 && (
            <span className="mono c-muted" style={{ fontSize: 9, opacity: 0.4 }}>→</span>
          )}
        </div>
      ))}
      {steps.length > 3 && (
        <span className="label c-muted" style={{ fontSize: 8, opacity: 0.5 }}>+{steps.length - 3}</span>
      )}
    </div>
  );
}

function RecipeCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const [flipped, setFlipped] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const { play } = useSoundFx();
  const rm = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (rm || flipped) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setTilt({ x: ((e.clientY - cy) / (rect.height / 2)) * -5, y: ((e.clientX - cx) / (rect.width / 2)) * 7 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: DUR.moderate, ease: EASE }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{ perspective: 1000, cursor: "pointer" }}
      onClick={() => { play("/sounds/click.mp3", 0.25); onClick(); }}
    >
      <motion.div
        animate={rm ? {} : {
          rotateX: flipped ? 0 : tilt.x,
          rotateY: flipped ? 180 : tilt.y,
          y: flipped ? 0 : (tilt.x !== 0 || tilt.y !== 0 ? -4 : 0),
        }}
        transition={tilt.x !== 0 || tilt.y !== 0
          ? { type: "spring", stiffness: 200, damping: 25 }
          : { duration: 0.55, ease: EASE }
        }
        style={{ transformStyle: "preserve-3d", position: "relative", minHeight: 320 }}
      >
        {/* ── FRONT FACE ── */}
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          padding: "var(--space-3)",
          background: "linear-gradient(135deg, rgba(27,19,8,0.95), rgba(10,7,4,0.98))",
          border: "1px solid rgba(200,145,58,0.22)",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
          display: "flex", flexDirection: "column",
        }}>
          {/* Top gold accent */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(200,145,58,0.35), transparent)" }} />

          {/* Flip hint badge */}
          <div
            onClick={(e) => { e.stopPropagation(); play("/sounds/click.mp3", 0.08); setFlipped(f => !f); }}
            style={{ position: "absolute", top: 12, right: 12, padding: "3px 9px", background: "rgba(200,145,58,0.08)", border: "1px solid rgba(200,145,58,0.2)", borderRadius: 12, fontFamily: "var(--f-mono)", fontSize: 9, color: "rgba(200,145,58,0.55)", cursor: "pointer", zIndex: 2 }}
          >flip ↺</div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-1)", zIndex: 1 }}>
            <Badge>{project.category}</Badge>
            <span className="label c-muted" style={{ fontSize: 8, opacity: 0.45 }}>{project.dishName}</span>
          </div>
          <h3 className="heading-lg c-cream" style={{ marginBottom: "var(--space-1)", lineHeight: 1.2 }}>{project.title}</h3>
          <div><MiniPipeline steps={project.architecture} /></div>
          <p className="body-sm c-muted" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.65, marginBottom: "var(--space-2)" }}>{project.description}</p>
          <div style={{ marginBottom: "var(--space-2)" }}><ComplexityBar value={project.complexity} /></div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: "var(--space-2)" }}>
            {project.ingredients.slice(0, 4).map((ing) => (
              <Badge key={ing} style={{ fontSize: 9 }}>{ing}</Badge>
            ))}
            {project.ingredients.length > 4 && <Badge style={{ fontSize: 9, opacity: 0.45 }}>+{project.ingredients.length - 4}</Badge>}
          </div>

          {/* CTA row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
            <span className="label c-muted" style={{ fontSize: 9, opacity: 0.45 }}>{project.ingredients.length} ingredients</span>
            <span className="label c-gold" style={{ fontSize: 10 }}>Open Recipe →</span>
          </div>
        </div>

        {/* ── BACK FACE ── */}
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          padding: "var(--space-3)",
          background: "linear-gradient(145deg, rgba(30,20,8,0.98), rgba(8,5,2,0.99))",
          border: "1px solid rgba(200,145,58,0.4)",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(200,145,58,0.6), transparent)" }} />

          {/* Back flip button */}
          <div
            onClick={(e) => { e.stopPropagation(); setFlipped(false); }}
            style={{ alignSelf: "flex-end", padding: "3px 9px", background: "rgba(200,145,58,0.08)", border: "1px solid rgba(200,145,58,0.25)", borderRadius: 12, fontFamily: "var(--f-mono)", fontSize: 9, color: "rgba(200,145,58,0.6)", cursor: "pointer" }}
          >← back</div>

          <div>
            <p className="label c-gold" style={{ marginBottom: 6, letterSpacing: "0.12em" }}>TECH STACK</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {project.ingredients.map((ing) => (
                <span key={ing} style={{ padding: "4px 10px", borderRadius: 16, background: "rgba(200,145,58,0.08)", border: "1px solid rgba(200,145,58,0.25)", fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--gold)" }}>{ing}</span>
              ))}
            </div>
          </div>

          <div>
            <p className="label c-gold" style={{ marginBottom: 4, letterSpacing: "0.12em" }}>KEY RESULT</p>
            <p className="body-sm c-cream" style={{ lineHeight: 1.5, fontSize: 12 }}>{project.finalTaste}</p>
          </div>

          {project.results && (
            <div>
              <p className="label c-gold" style={{ marginBottom: 4, letterSpacing: "0.12em" }}>METRICS</p>
              {project.results.slice(0, 2).map((r, i) => (
                <p key={i} className="body-sm c-muted" style={{ fontSize: 11, lineHeight: 1.5 }}>◈ {r}</p>
              ))}
            </div>
          )}

          <div style={{ marginTop: "auto" }}>
            <a href={project.github} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "rgba(200,145,58,0.1)", border: "1px solid rgba(200,145,58,0.3)", borderRadius: 10, fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--gold)", textDecoration: "none" }}
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Projects() {
  const [active, setActive] = useState<Project | null>(null);

  return (
    <>
      <section id="projects" style={{ position: "relative", paddingTop: "var(--space-6)", paddingBottom: "var(--space-6)" }}>
        <div aria-hidden="true" style={{ position: "absolute", top: "50%", right: -100, width: 500, height: 500, borderRadius: "50%", background: "rgba(212,93,32,0.04)", filter: "blur(90px)", transform: "translateY(-50%)", pointerEvents: "none" }} />

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <SectionHeader
            index="§ 03"
            label="Signature Recipes"
            title={<>Tonight&apos;s <span className="t-grad">Menu</span></>}
            subtitle="Six production-grade AI systems — crafted from raw data, seasoned with algorithms, served ready to ship."
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: "var(--space-3)" }}>
            {resume.projects.map((p, i) => (
              <RecipeCard key={i} project={p} onClick={() => setActive(p)} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: DUR.moderate, delay: 0.3, ease: EASE }}
            style={{ textAlign: "center", marginTop: "var(--space-4)" }}
          >
            <Btn href="https://github.com/mannemkarthik010" variant="secondary" target="_blank" rel="noopener noreferrer">
              Full Kitchen on GitHub ↗
            </Btn>
          </motion.div>
        </div>
      </section>

      <ProjectModal project={active} onClose={() => setActive(null)} />
    </>
  );
}
