"use client";
import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { resume, featuredWork } from "../data/resume";
import { StatusChip } from "./StatusChip";
import { openProject } from "../lib/events";
import { EASE } from "../lib/motion";

/** Product screenshot in a browser frame: slow parallax while scrolling, zoom on hover. Links to the live demo. */
function Shot({ shot, href, label }: { shot: { src: string; width: number; height: number; alt: string; host: string }; href: string | null; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rm = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);

  const frame = (
    <div className="fw-shot__frame" ref={ref}>
      <div className="fw-shot__bar" aria-hidden="true">
        <i /><i /><i /><span>{shot.host}</span>
      </div>
      <div className="fw-shot__view" style={{ aspectRatio: `${shot.width} / ${shot.height}` }}>
        <motion.div className="fw-shot__img" style={rm ? undefined : { y }}>
          <Image src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} sizes="(max-width: 1100px) 92vw, 1000px" />
        </motion.div>
        {href && <span className="fw-shot__cta" aria-hidden="true">{label} ↗</span>}
      </div>
    </div>
  );

  return href ? (
    <a className="fw-shot" href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label}: ${shot.host}`}>{frame}</a>
  ) : (
    <div className="fw-shot">{frame}</div>
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
          <motion.article
            key={fw.slug}
            className="fw-card"
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, ease: EASE }}
          >
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
                <button type="button" className="fw-ghost" onClick={() => openProject(p.slug)}>Full write-up →</button>
              </div>
            </footer>
          </motion.article>
        );
      })}
    </div>
  );
}
