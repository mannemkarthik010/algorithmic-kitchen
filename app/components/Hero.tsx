"use client";
import { Fragment } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { resume } from "../data/resume";
import { AKMark, Btn } from "./ui";
import { EASE } from "../lib/motion";
import { STATUS } from "../lib/status";
import HeroPipeline from "./HeroPipeline";

const HEADLINE = ["I", "build", "AI", "systems", "you", "can", "inspect,", "test,", "and"];

/** Each word rises out of its own line mask. Plain text under reduced motion. */
function Headline() {
  const rm = useReducedMotion();
  return (
    <h1 className="hero2__h1" aria-label="I build AI systems you can inspect, test, and trust.">
      <span aria-hidden="true">
        {HEADLINE.map((w, i) => (
          <Fragment key={i}>
            <span className="hero2__mask">
            <motion.span
              className="hero2__word"
              initial={rm ? false : { y: "108%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.12 + i * 0.055 }}
            >
              {w}
            </motion.span>
            </span>{" "}
          </Fragment>
        ))}
        <span className="hero2__mask">
          <motion.em
            className="hero2__word hero2__em"
            initial={rm ? false : { y: "108%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.12 + HEADLINE.length * 0.055 }}
          >
            trust.
          </motion.em>
        </span>
      </span>
    </h1>
  );
}

export default function Hero() {
  const rm = useReducedMotion();
  const fade = (delay: number) => ({
    initial: rm ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: EASE, delay },
  } as const);

  return (
    <section id="hero" className="hero2">
      <div className="hero2__inner container">
        <div className="hero2__copy">
          <motion.div className="hero2__id" {...fade(0)}>
            <AKMark size="sm" />
            <div>
              <p className="hero2__name">Karthik Mannem</p>
              <p className="hero2__role">Machine Learning &amp; AI Engineer · Los Angeles</p>
            </div>
          </motion.div>

          <Headline />

          <motion.p className="hero2__lede" {...fade(0.85)}>
            I work on applied machine learning, LLM systems, evaluation, and the engineering that gets them into production. Each project below links to its code, and to a live demo where one exists.
          </motion.p>

          <motion.div className="hero2__cta" {...fade(0.95)}>
            <Btn href="#projects" variant="primary">Explore work</Btn>
            <Btn href="/Karthik_Mannem_Resume.pdf" variant="secondary" target="_blank" rel="noopener noreferrer">Résumé ↗</Btn>
            <Btn href={resume.github} variant="secondary" target="_blank" rel="noopener noreferrer">GitHub ↗</Btn>
            <Btn href={resume.linkedin} variant="secondary" target="_blank" rel="noopener noreferrer">LinkedIn ↗</Btn>
          </motion.div>

          <motion.p className="hero-now" {...fade(1.05)}>
            <span className="status-dot status-dot--pulse" style={{ background: STATUS.live.color }} aria-hidden="true" />
            Open to full-time roles
          </motion.p>
        </div>

        {/* Temporary CSS-3D pipeline. Replaced by the interactive data → model → evaluation → deployment scene in Phase 4. */}
        <HeroPipeline />
      </div>
    </section>
  );
}
