"use client";
import { Fragment } from "react";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import MagneticSlideButton from "./MagneticSlideButton";
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
  const ref = useRef<HTMLElement>(null);
  // 0 at the top of the page, 1 when the hero has scrolled away. The visualization drifts and its layers separate with it.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const visY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const visOpacity = useTransform(scrollYProgress, [0, 0.8, 1], [1, 0.9, 0.35]);
  const fade = (delay: number) => ({
    initial: rm ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: EASE, delay },
  } as const);

  return (
    <section id="hero" className="hero2" ref={ref}>
      <div className="hero2__inner container">
        <motion.div className="hero2__copy" style={rm ? undefined : { y: copyY }}>
          <motion.div className="hero2__id" {...fade(0)}>
            <AKMark size="sm" />
            <div>
              <p className="hero2__name">Karthik Mannem</p>
              <p className="hero2__role">Machine Learning &amp; AI Engineer · Los Angeles</p>
            </div>
          </motion.div>

          <Headline />

          <p className="hero2__lede">
            I work on applied machine learning, LLM systems, evaluation, and the engineering that gets them into production. Each project below links to its code, and to a live demo where one exists.
          </p>

          <motion.div className="hero2__cta" {...fade(0.95)}>
            <MagneticSlideButton href="#projects" text="Explore work" hoverText="See the evidence" />
            <Btn href="/Karthik_Mannem_Resume.pdf" variant="secondary" target="_blank" rel="noopener noreferrer">Résumé ↗</Btn>
            <Btn href={resume.github} variant="secondary" target="_blank" rel="noopener noreferrer">GitHub ↗</Btn>
            <Btn href={resume.linkedin} variant="secondary" target="_blank" rel="noopener noreferrer">LinkedIn ↗</Btn>
          </motion.div>

          <motion.p className="hero-now" {...fade(1.05)}>
            <span className="status-dot status-dot--pulse" style={{ background: STATUS.live.color }} aria-hidden="true" />
            Open to full-time roles
          </motion.p>
        </motion.div>

        {/* CSS 3D instrument: four layers (data, model, evaluation, deployment). WebGL deferred by decision. */}
        <motion.div style={rm ? undefined : { y: visY, opacity: visOpacity }}>
          <HeroPipeline progress={scrollYProgress} />
        </motion.div>
      </div>
    </section>
  );
}
