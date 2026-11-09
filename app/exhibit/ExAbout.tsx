"use client";
import Image from "next/image";
import { motion } from "motion/react";
import { resume } from "../data/resume";
import live from "../data/contributions-live.json";

const merged = live.prs.filter((p) => p.state === "merged").length;

/** An editorial spread, not a timeline. Four facts, each checkable on this site; one engineering belief. */
const FACTS: { n: string; t: string }[] = [
  { n: "3.92", t: "GPA, M.S. in Computer Science at CSUN, finished May 2026." },
  { n: "1,000+", t: "LLM responses scored against rubrics as an AI Model Evaluation Analyst at Handshake AI." },
  { n: "230", t: "backend tests behind TaxProof, passing on SQLite and PostgreSQL." },
  { n: `${merged} of ${live.prs.length}`, t: "upstream pull requests merged so far, to PyTorch and Pandera. The rest are open or closed, and say so." },
];

export default function ExAbout() {
  return (
    <section id="about" className="ex-about" aria-labelledby="ex-about-h">
      <p className="ex-about__ghost" aria-hidden="true">About</p>
      <div className="ex-about__grid">
        <motion.figure className="ex-about__fig" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
          <div className="ex-about__photo">
            <Image src={resume.photo} alt={`${resume.name}, headshot`} fill sizes="(max-width: 860px) 80vw, 440px" style={{ objectFit: "cover", objectPosition: "top" }} />
          </div>
          <figcaption className="ex-mono">Karthik Mannem · Los Angeles</figcaption>
        </motion.figure>

        <div className="ex-about__text">
          <p className="ex-mono ex-about__eyebrow">(04) &nbsp;About</p>
          <h2 id="ex-about-h" className="ex-about__h">A claim is only as good as <em>the evidence you can open.</em></h2>
          <p className="ex-about__p">
            I am a machine learning and AI engineer. I like the part of the work after the demo: measuring what a model gets wrong, writing down what a system does not do, and making the proof easy to reach. Everything above was built that way, and every number on this site comes from a file you can read.
          </p>
          <dl className="ex-about__facts">
            {FACTS.map((f) => (<div key={f.n}><dt>{f.n}</dt><dd>{f.t}</dd></div>))}
          </dl>
          <p className="ex-about__links">
            <a href="/Karthik_Mannem_Resume.pdf" target="_blank" rel="noopener noreferrer">Résumé, with experience ↗</a>
            <a href={resume.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
            <a href={resume.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
          </p>
        </div>
      </div>
    </section>
  );
}
