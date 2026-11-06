"use client";
import { useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { resume } from "../data/resume";
import { EASE } from "../lib/motion";

/** Portrait on stacked plates: tilts toward the cursor, with the layers separated in depth. */
function TiltPortrait() {
  const ref = useRef<HTMLDivElement>(null);
  const rm = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), { stiffness: 140, damping: 16 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 140, damping: 16 });
  const glareX = useTransform(mx, [-0.5, 0.5], ["20%", "80%"]);
  const glareY = useTransform(my, [-0.5, 0.5], ["15%", "85%"]);

  const onMove = (e: React.PointerEvent) => {
    if (rm || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  return (
    <div className="about-stage" onPointerMove={onMove} onPointerLeave={onLeave} ref={ref}>
      <motion.div className="about-tilt" style={rm ? undefined : { rotateX: rx, rotateY: ry }}>
        <div className="about-plate about-plate--back" aria-hidden="true" />
        <div className="about-plate about-plate--mid" aria-hidden="true" />
        <div className="about-photo">
          <Image src={resume.photo} alt={`${resume.name}, headshot`} fill sizes="(max-width: 860px) 80vw, 380px" priority={false} style={{ objectFit: "cover", objectPosition: "top" }} />
          {!rm && <motion.span className="about-glare" aria-hidden="true" style={{ left: glareX, top: glareY }} />}
        </div>
        <div className="about-chip">{resume.location}</div>
      </motion.div>
    </div>
  );
}

const TIMELINE: [string, string, string][] = [
  ["2020", "Started B.Tech in CS", "Vel Tech, Chennai. First lines of Python."],
  ["2022", "GDSC Content Lead", "Workshops for 200+ students; led a team of 8."],
  ["2023", "First freelance ML work", "Deep learning models, Docker pipelines, production APIs."],
  ["2024", "Moved to Los Angeles", "Finished the B.Tech (9.21 CGPA) and started the M.S. at CSUN."],
  ["2025", "AI Model Evaluation Analyst", "Handshake AI. Scored 1,000+ LLM responses against rubrics."],
  ["2026", "Graduated, now an AI Engineer", "M.S. complete (3.92 GPA). AI Engineer at SLN Solutions."],
];

const FACTS: [string, string][] = [
  ["Based in", resume.location],
  ["Studied", "M.S. Computer Science, CSUN"],
  ["GPA", "3.92 / 4.0"],
  ["Focus", "LLM systems, RAG, applied ML"],
  ["Email", resume.email],
];

export default function About() {
  return (
    <section id="about" style={{ position: "relative", padding: "var(--space-6) 0 var(--space-5)" }}>
      <div className="container about-grid">
        <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }}>
          <TiltPortrait />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.08, ease: EASE }}>
          <p className="sh-label">05 / About</p>
          <h2 className="about-statement">I build AI systems, and I like knowing why they work.</h2>
          <p className="about-summary">{resume.summary}</p>

          <dl className="about-facts">
            {FACTS.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
          </dl>

          <details className="fw-eval stack-toggle about-more">
            <summary>Education, certifications and timeline</summary>
          <div className="about-cols" style={{ padding: "var(--space-3) 16px 0" }}>
            <div>
              <p className="sh-label">Education</p>
              {resume.education.map((e) => (
                <div key={e.degree} className="about-edu">
                  <p className="about-edu__d">{e.degree}</p>
                  <p className="about-edu__s">{e.school}</p>
                  <p className="about-edu__m">{e.period} · {e.gpa}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="sh-label">Certifications</p>
              <ul className="about-certs">
                {resume.certifications.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </div>
          </div>

          <p className="sh-label" style={{ margin: "var(--space-4) 16px 0" }}>Timeline</p>
          <ol className="about-time" style={{ padding: "0 16px var(--space-2)" }}>
            {TIMELINE.map(([y, t, d]) => (
              <li key={y}><span className="about-time__y">{y}</span><span className="about-time__t">{t}</span><span className="about-time__d">{d}</span></li>
            ))}
          </ol>
          </details>
        </motion.div>
      </div>
    </section>
  );
}
