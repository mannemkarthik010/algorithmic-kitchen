"use client";
import { motion } from "motion/react";
import { resume } from "../data/resume";
import { SectionHeader } from "./ui";

export default function Experience() {
  return (
    <section id="experience" className="s-deep" style={{ position: "relative" }}>

      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        <SectionHeader index="04" label="Experience" align="split"
          title={<>Work <span className="t-grad">Experience</span></>}
          subtitle="Where I have worked, newest first."
        />

        <div className="exp-list">
          {resume.experience.map((exp, i) => (
            <motion.article
              key={exp.role + exp.company}
              className="exp-row"
              initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.55, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="exp-row__meta">
                <p className="exp-row__period">{exp.period}</p>
                <p className="exp-row__co">{exp.company}</p>
                {exp.location && <p className="exp-row__loc">{exp.location}</p>}
              </div>
              <div className="exp-row__body">
                <h3 className="exp-row__role">{exp.role}</h3>
                {exp.bullets.length > 0 && (
                  <ul className="exp-row__bullets">
                    {exp.bullets.map((b) => <li key={b}>{b}</li>)}
                  </ul>
                )}
                {resume.roleDetails[exp.company] && (
                  <details className="fw-eval" style={{ marginTop: "var(--space-2)" }}>
                    <summary>More about this role</summary>
                    <ul className="exp-more">
                      {resume.roleDetails[exp.company].summary.map((t) => <li key={t}>{t}</li>)}
                    </ul>
                    <ul className="fw-stack" aria-label="Tools" style={{ padding: "0 16px 16px" }}>
                      {resume.roleDetails[exp.company].tools.map((t) => <li key={t}>{t}</li>)}
                    </ul>
                  </details>
                )}
              </div>
            </motion.article>
          ))}
        </div>

        <h3 className="exp-sub">Leadership &amp; community</h3>
        <div className="exp-lead">
          {resume.leadership.map((l) => (
            <div key={l.role} className="exp-lead__card">
              <div className="exp-lead__top">
                <p className="body-lg c-cream" style={{ fontWeight: 500 }}>{l.role} <span className="c-gold">· {l.org}</span></p>
                <span className="mono c-muted" style={{ fontSize: 11 }}>{l.period}</span>
              </div>
              <ul>
                {l.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
