"use client";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useScroll, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { resume, featuredWork } from "../data/resume";
import { StatusChip } from "./StatusChip";
import { openProject } from "../lib/events";

/** Product screenshot in a browser frame: slow parallax while scrolling, zoom on hover. Links to the live demo. */
function Shot({ shot, href, label }: { shot: { src: string; width: number; height: number; alt: string; host: string }; href: string | null; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rm = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotX = useSpring(useTransform(py, [-0.5, 0.5], [5, -5]), { stiffness: 130, damping: 16 });
  const rotY = useSpring(useTransform(px, [-0.5, 0.5], [-7, 7]), { stiffness: 130, damping: 16 });
  const shiftX = useTransform(px, [-0.5, 0.5], ["1.5%", "-1.5%"]);

  const onMove = (e: React.PointerEvent) => {
    if (rm || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { px.set(0); py.set(0); };

  const frame = (
    <motion.div className="fw-shot__frame" ref={ref} style={rm ? undefined : { rotateX: rotX, rotateY: rotY }}>
      <div className="fw-shot__bar" aria-hidden="true">
        <i /><i /><i /><span>{shot.host}</span>
      </div>
      <div className="fw-shot__view" style={{ aspectRatio: `${shot.width} / ${shot.height}` }}>
        <motion.div className="fw-shot__img" style={rm ? undefined : { y, x: shiftX }}>
          <Image src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} sizes="(max-width: 1100px) 92vw, 1000px" />
        </motion.div>
        {href && <span className="fw-shot__cta" aria-hidden="true">{label} ↗</span>}
      </div>
    </motion.div>
  );

  return href ? (
    <a className="fw-shot" href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label}: ${shot.host}`} onPointerMove={onMove} onPointerLeave={onLeave}>{frame}</a>
  ) : (
    <div className="fw-shot" onPointerMove={onMove} onPointerLeave={onLeave}>{frame}</div>
  );
}

/** One project card: tips into place in 3D as it scrolls into view. */
function Card({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const rm = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.45"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [10, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [70, 0]);
  return (
    <div className="fw-persp">
      <motion.article ref={ref} className="fw-card" style={rm ? undefined : { rotateX, scale, y, transformOrigin: "50% 0%" }}>
        {children}
      </motion.article>
    </div>
  );
}

const firstSentence = (t: string) => t.split(/(?<=[.!?])\s/)[0];

/** The three projects that carry the portfolio: problem → approach → result → evidence, with live and code links. */
export default function FeaturedWork() {
  return (
    <div className="fw">
      {featuredWork.map((fw, i) => {
        const p = resume.projects.find((x) => x.slug === fw.slug)!;
        return (
          <Card key={fw.slug}>
            <header className="fw-card__head">
              <span className="fw-card__no" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <div className="fw-card__meta"><StatusChip status={p.status} /><span>{p.category}</span></div>
                <h3 className="fw-card__title">{p.title.split(" — ")[0]}</h3>
                <p className="fw-card__headline">{fw.headline}</p>
              </div>
            </header>

            <Shot shot={fw.shot} href={p.demo} label={p.status === "beta" ? "Try the beta" : "Open live demo"} />

            <div className="fw-card__body">
              <div>
                <p className="fw-label">The problem</p>
                <p className="fw-text">{firstSentence(p.problem)}</p>

                <p className="fw-label">How it works</p>
                <ol className="fw-flow">
                  {p.architecture.map((a) => (
                    <li key={a.step}><b>{a.step}</b><span>{a.desc}</span></li>
                  ))}
                </ol>
              </div>

              <div>
                <p className="fw-label">Results</p>
                <ul className="fw-results">
                  {p.results.map((r) => <li key={r}>{r}</li>)}
                </ul>

                <details className="fw-eval">
                  <summary>How it was evaluated</summary>
                  <dl>
                    {fw.evalRows.map(([k, v]) => (
                      <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                    ))}
                  </dl>
                </details>
              </div>
            </div>

            <footer className="fw-card__foot">
              <ul className="fw-stack" aria-label="Tech stack">
                {p.ingredients.slice(0, 7).map((t) => <li key={t}>{t}</li>)}
              </ul>
              <div className="fw-actions">
                {p.demo && <a className="pill-cta" href={p.demo} target="_blank" rel="noopener noreferrer">{p.status === "beta" ? "Try the beta" : "Live demo"} ↗</a>}
                {p.github && <a className="fw-ghost" href={p.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>}
                {"caseStudy" in fw && fw.caseStudy
                  ? <Link className="fw-ghost" href={fw.caseStudy}>Read the case study →</Link>
                  : <button type="button" className="fw-ghost" onClick={() => openProject(p.slug)}>Full write-up →</button>}
              </div>
            </footer>
          </Card>
        );
      })}
    </div>
  );
}
