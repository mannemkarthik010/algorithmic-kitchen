"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { EASE } from "../lib/motion";

const ITEMS: [string, string][] = [
  ["Reading room", "A 3D bookshelf of the books behind how I build."],
  ["Two small games", "Real or Fake, and a South Indian tiffin dunk."],
  ["In progress", "What I am building right now."],
  ["An illusion", "A hypnotic dosa. Stare for fifteen seconds."],
];

/** One quiet pointer to the optional side of the portfolio. */
export default function LabTeaser() {
  return (
    <section aria-label="The Lab" style={{ padding: "var(--space-5) 0" }}>
      <div className="container">
        <motion.div className="lab-teaser" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: EASE }}>
          <div>
            <p className="sh-label">Beyond the work</p>
            <h2 className="lab-teaser__t">The Lab</h2>
            <p className="lab-teaser__p">The playful side of this site lives on its own page, so it never gets in the way of the projects above.</p>
            <Link className="pill-cta" href="/lab">Enter the lab →</Link>
          </div>
          <ul className="lab-teaser__list">
            {ITEMS.map(([k, v]) => (<li key={k}><b>{k}</b><span>{v}</span></li>))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
