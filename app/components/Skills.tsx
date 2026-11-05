"use client";
import { motion } from "motion/react";
import { resume } from "../data/resume";
import { EASE } from "../lib/motion";

/** Plain names for the groups (the data keys keep the older vocabulary). */
const LABEL: Record<string, string> = {
  "Base Ingredients": "Languages",
  "Cooking Tools": "ML & Deep Learning",
  "AI Spices": "LLMs & Agents",
  "Data Prep": "Data & Features",
  "Serving & Deployment": "Serving & MLOps",
  "Cloud & DB": "Cloud & Databases",
  "Frontend": "Frontend",
};

/** The full tech stack as a compact specimen sheet. */
export function StackSheet() {
  return (
    <div className="skill-sheet">
      {Object.entries(resume.skills).map(([cat, skills], i) => (
        <motion.div
          key={cat}
          className="skill-row"
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-30px" }} transition={{ duration: 0.4, delay: i * 0.03, ease: EASE }}
        >
          <p className="skill-row__k"><span>{String(i + 1).padStart(2, "0")}</span>{LABEL[cat] ?? cat}</p>
          <ul className="skill-row__v">
            {skills.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </motion.div>
      ))}
    </div>
  );
}
