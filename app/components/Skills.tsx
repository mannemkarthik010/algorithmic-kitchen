"use client";
import { motion } from "framer-motion";
import { resume } from "../data/resume";
import { SectionHeader } from "./ui";
import { EASE } from "../lib/motion";

/** Plain names for the groups (the data keys keep the kitchen vocabulary). */
const LABEL: Record<string, string> = {
  "Base Ingredients": "Languages",
  "Cooking Tools": "ML & Deep Learning",
  "AI Spices": "LLMs & Agents",
  "Data Prep": "Data & Features",
  "Serving & Deployment": "Serving & MLOps",
  "Cloud & DB": "Cloud & Databases",
  "Frontend": "Frontend",
};

export default function Skills() {
  const rows = Object.entries(resume.skills);
  return (
    <section id="skills" style={{ position: "relative", paddingTop: "var(--space-5)", paddingBottom: "var(--space-6)" }}>
      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        <SectionHeader index="04" label="Skills · Tech stack" align="split"
          title={<>Technical <span className="t-grad">Stack</span></>}
          subtitle="The tools I reach for, grouped by what they are for."
        />

        <div className="skill-sheet">
          {rows.map(([cat, skills], i) => (
            <motion.div
              key={cat}
              className="skill-row"
              initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5, delay: i * 0.04, ease: EASE }}
            >
              <p className="skill-row__k"><span>{String(i + 1).padStart(2, "0")}</span>{LABEL[cat] ?? cat}</p>
              <ul className="skill-row__v">
                {skills.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
