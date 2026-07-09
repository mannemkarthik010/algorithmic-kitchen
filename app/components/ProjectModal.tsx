"use client";
import { useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Project } from "../data/resume";
import { Badge, Btn } from "./ui";
import { useSoundFx } from "../hooks/useSoundFx";
import { EASE, DUR } from "../lib/motion";

/* ── Complexity meter ───────────────────────────── */
function ComplexityMeter({ value }: { value: number }) {
  const rm = useReducedMotion();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", gap: 4 }}>
        {[1,2,3,4].map((n) => (
          <motion.div key={n}
            initial={rm ? false : { scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: n * 0.06, duration: DUR.normal, ease: EASE }}
            style={{ width: 20, height: 6, borderRadius: 3, transformOrigin: "bottom",
              background: n <= value ? `rgba(200,145,58,${0.42 + n * 0.13})` : "rgba(200,145,58,0.1)" }}
          />
        ))}
      </div>
      <span className="label c-muted">{value >= 4 ? "ADVANCED" : "INTERMEDIATE"}</span>
    </div>
  );
}

/* ── Section rule ───────────────────────────────── */
function Rule() {
  return <div style={{ height: 1, background: "var(--border)", margin: "var(--space-3) 0" }} />;
}

/* ── Pipeline visualisation ─────────────────────── */
function PipelineFlow({ steps }: { steps: { step: string; desc: string }[] }) {
  const rm = useReducedMotion();
  return (
    <div style={{
      padding: "var(--space-2) var(--space-3)",
      borderRadius: "var(--radius-lg)",
      background: "rgba(200,145,58,0.04)",
      border: "1px solid var(--border)",
      overflowX: "auto",
    }}>
      <div style={{ display: "flex", alignItems: "stretch", gap: 0, minWidth: "max-content" }}>
        {steps.map((node, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <motion.div
              initial={rm ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: DUR.normal, ease: EASE }}
              style={{
                padding: "10px 14px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                minWidth: 88,
                position: "relative",
              }}
            >
              <p className="label c-gold" style={{ marginBottom: 4 }}>{node.step}</p>
              <p className="body-sm c-muted" style={{ fontSize: 11, lineHeight: 1.5 }}>{node.desc}</p>
              {/* Active glow on first node */}
              {i === 0 && (
                <div style={{ position: "absolute", inset: 0, borderRadius: "var(--radius-md)", border: "1px solid rgba(200,145,58,0.35)", pointerEvents: "none" }} />
              )}
            </motion.div>
            {i < steps.length - 1 && (
              <motion.span
                initial={rm ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.08 + 0.12, duration: DUR.fast }}
                className="mono c-gold"
                style={{ padding: "0 8px", opacity: 0.45, fontSize: 13, flexShrink: 0 }}
              >→</motion.span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Recruiter snapshot ─────────────────────────── */
function RecruiterSnapshot({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: DUR.moderate, ease: EASE }}
      style={{
        padding: "var(--space-2) var(--space-3)",
        background: "linear-gradient(135deg, rgba(200,145,58,0.08), rgba(212,93,32,0.05))",
        border: "1px solid rgba(200,145,58,0.3)",
        borderRadius: "var(--radius-md)",
        borderLeft: "3px solid var(--gold)",
        marginBottom: "var(--space-3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span className="mono c-gold" style={{ fontSize: 10, opacity: 0.7 }}>◈</span>
        <p className="label c-gold">Recruiter Snapshot</p>
      </div>
      <p className="body-sm c-cream" style={{ lineHeight: 1.7 }}>{text}</p>
    </motion.div>
  );
}

/* ── Main modal ─────────────────────────────────── */
export default function ProjectModal({ project, onClose }: {
  project: Project | null; onClose: () => void;
}) {
  const { play }     = useSoundFx();
  const rm           = useReducedMotion();

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") { play("/sounds/click.mp3", 0.18); onClose(); }
    };
    document.addEventListener("keydown", h);
    if (project) document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [project, onClose, play]);

  const handleClose = () => { play("/sounds/click.mp3", 0.18); onClose(); };

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className="modal-bg"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: DUR.normal }}
          onClick={handleClose}
        >
          <motion.div
            className="modal-panel"
            initial={rm ? false : { opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: DUR.slow, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Sticky header ── */}
            <div style={{
              padding: "var(--space-3) var(--space-4)",
              borderBottom: "1px solid var(--border)",
              position: "sticky", top: 0,
              background: "var(--bg-card)", zIndex: 10,
              borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-2)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    <Badge>{project.category}</Badge>
                    <span className="mono c-muted" style={{ fontSize: 11, alignSelf: "center" }}>{project.dishName}</span>
                  </div>
                  <h2 className="heading-lg c-cream" style={{ marginBottom: 8, lineHeight: 1.2 }}>{project.title}</h2>
                  <ComplexityMeter value={project.complexity} />
                </div>
                <button
                  onClick={handleClose} aria-label="Close modal"
                  style={{ background: "rgba(200,145,58,0.07)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--muted)", width: 34, height: 34, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.18s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--cream)"; e.currentTarget.style.borderColor = "var(--border-active)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                >✕</button>
              </div>
            </div>

            {/* ── Scrollable body ── */}
            <div style={{ padding: "var(--space-3) var(--space-4) var(--space-4)" }}>

              {/* Recruiter snapshot — top of body, highest visibility */}
              {"recruiterSnapshot" in project && (project as Project & { recruiterSnapshot: string }).recruiterSnapshot && (
                <RecruiterSnapshot text={(project as Project & { recruiterSnapshot: string }).recruiterSnapshot} />
              )}

              {/* Stats strip */}
              <div className="project-summary-strip" style={{ marginBottom: "var(--space-3)" }}>
                <div>
                  <p className="label">Focus</p>
                  <p className="body-sm c-cream">{project.category}</p>
                </div>
                <div>
                  <p className="label">Complexity</p>
                  <p className="body-sm c-cream">{project.complexity >= 4 ? "Advanced" : "Intermediate"}</p>
                </div>
                <div>
                  <p className="label">Core Stack</p>
                  <p className="body-sm c-cream">{project.ingredients.slice(0, 3).join(" · ")}</p>
                </div>
              </div>

              {/* Problem / Solution */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
                <div style={{ padding: "var(--space-2) var(--space-3)", background: "rgba(0,0,0,0.2)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                  <p className="label" style={{ marginBottom: 6 }}>The Problem</p>
                  <p className="body-sm c-2">{project.problem}</p>
                </div>
                <div style={{ padding: "var(--space-2) var(--space-3)", background: "rgba(200,145,58,0.04)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                  <p className="label" style={{ marginBottom: 6 }}>The Solution</p>
                  <p className="body-sm c-2">{project.solution}</p>
                </div>
              </div>

              <Rule />

              {/* Architecture pipeline */}
              <div style={{ marginBottom: "var(--space-3)" }}>
                <p className="label" style={{ marginBottom: "var(--space-1)" }}>Architecture Pipeline</p>
                <PipelineFlow steps={project.architecture} />
              </div>

              <Rule />

              {/* Tech stack */}
              <div style={{ marginBottom: "var(--space-3)" }}>
                <p className="label" style={{ marginBottom: "var(--space-1)" }}>Tech Stack</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {project.ingredients.map((ing) => <Badge key={ing}>{ing}</Badge>)}
                </div>
              </div>

              <Rule />

              {/* Engineering decisions */}
              <div style={{ marginBottom: "var(--space-3)" }}>
                <p className="label" style={{ marginBottom: "var(--space-1)" }}>Engineering Decisions</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {project.decisions.map((d, i) => (
                    <motion.div
                      key={i} className="decision-block"
                      initial={rm ? false : { opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 + i * 0.06, duration: DUR.normal, ease: EASE }}
                    >
                      <p>{d}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <Rule />

              {/* Evaluation + Results side by side */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
                <div>
                  <p className="label" style={{ marginBottom: "var(--space-1)" }}>Evaluation</p>
                  <ul className="modal-list">
                    {project.evaluation.map((e) => <li key={e} className="modal-list-item">{e}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="label" style={{ marginBottom: "var(--space-1)" }}>Results</p>
                  <ul className="modal-list">
                    {project.results.map((r) => <li key={r} className="modal-list-item">{r}</li>)}
                  </ul>
                </div>
              </div>

              <Rule />

              {/* Deployment */}
              <div style={{ marginBottom: "var(--space-3)" }}>
                <p className="label" style={{ marginBottom: "var(--space-1)" }}>Deployment</p>
                <div className="decision-block"><p>{project.deployment}</p></div>
              </div>

              {/* Lessons learned */}
              <div style={{
                padding: "var(--space-2) var(--space-3)",
                background: "rgba(200,145,58,0.05)",
                borderRadius: "var(--radius-md)",
                borderLeft: "2px solid var(--gold)",
                marginBottom: "var(--space-3)",
              }}>
                <p className="label" style={{ marginBottom: 6 }}>Lessons Learned</p>
                <p className="body-sm c-2" style={{ fontStyle: "italic" }}>&ldquo;{project.learned}&rdquo;</p>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                <Btn href={project.github} variant="primary" target="_blank" rel="noopener noreferrer">GitHub ↗</Btn>
                {project.demo && (
                  <Btn href={project.demo} variant="primary" target="_blank" rel="noopener noreferrer">Live Demo ↗</Btn>
                )}
                <Btn onClick={handleClose} variant="secondary">Back to Menu</Btn>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
