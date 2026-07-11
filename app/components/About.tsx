"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { resume } from "../data/resume";
import { SectionHeader, KitchenCard, Badge, FadeUp, Stagger, TimelineItem } from "./ui";

const TIMELINE = [
  { year: "2020", title: "The Apprenticeship Begins", desc: "B.Tech CS at Vel Tech, Chennai. First lines of Python — the building blocks of everything.", sym: "◎" },
  { year: "2022", title: "Community Chef",            desc: "GDSC Content Lead — organized workshops for 200+ students, led a team of 8.", sym: "◈" },
  { year: "2023", title: "First Production System",   desc: "Freelance ML Engineer — deep learning models, Docker pipelines, production APIs.", sym: "◇" },
  { year: "2024", title: "Crossed the Ocean",         desc: "B.Tech complete (9.21 GPA). Relocated to Los Angeles for M.S. CS at CSUN.", sym: "◆" },
  { year: "2025", title: "Generative AI Analyst",     desc: "Handshake AI — evaluated 1,000+ LLM outputs, reduced inconsistencies by 20%.", sym: "◉" },
  { year: "2026", title: "Kitchen is Open",           desc: "M.S. complete (3.92 GPA, May 2026). Ready to ship intelligent systems full-time.", sym: "▲" },
];

function ProfilePhoto() {
  const [imgError, setImgError] = useState(false);
  const hasPhoto = resume.photo && !imgError;
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.25 }}
      style={{ width: 56, height: 56, borderRadius: "50%", flexShrink: 0, background: hasPhoto ? "transparent" : "rgba(200,145,58,0.1)", border: "1.5px solid rgba(200,145,58,0.45)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}
    >
      {hasPhoto ? (
        <Image src={resume.photo} alt={`${resume.name} headshot`} fill sizes="56px" onError={() => setImgError(true)} style={{ objectFit: "cover", objectPosition: "top" }} />
      ) : (
        <span className="heading-lg c-gold" style={{ fontFamily: "var(--f-display)" }}>K</span>
      )}
    </motion.div>
  );
}

export default function About() {
  return (
    <section id="about" className="s-deep" style={{ position: "relative", paddingTop: "5rem", paddingBottom: "5rem" }}>

      {/* Ambient glow — inline, no absolute wrapper needed */}
      <div aria-hidden="true" style={{ position: "absolute", top: "20%", left: -120, width: 500, height: 500, borderRadius: "50%", background: "rgba(200,145,58,0.04)", filter: "blur(90px)", pointerEvents: "none", zIndex: 0 }} />

      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <SectionHeader
          index="§ 01"
          label="Chef's Story"
          title={<>A Recipe for <span className="t-grad">Curiosity</span></>}
          subtitle={resume.summary}
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: "var(--space-6)", alignItems: "start" }}>
          {/* Profile column */}
          <div>
            <KitchenCard delay={0.05} style={{ marginBottom: "var(--space-2)" }}>
              <div className="flex-row gap-3 mb-3">
                <ProfilePhoto />
                <div>
                  <p className="heading-lg c-cream">{resume.name}</p>
                  <p className="label c-gold" style={{ marginTop: 3 }}>Head Chef · AI Kitchen</p>
                </div>
              </div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "var(--space-2)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                {[
                  { sym: "◉", label: "Location",   val: resume.location },
                  { sym: "◎", label: "Education",  val: "M.S. Computer Science, CSUN" },
                  { sym: "◆", label: "GPA",        val: "3.92 / 4.0" },
                  { sym: "◈", label: "Experience", val: "3+ years ML Engineering" },
                  { sym: "▲", label: "Email",      val: resume.email },
                ].map(({ sym, label, val }) => (
                  <div key={label} className="flex-row gap-2">
                    <span className="mono c-gold" style={{ flexShrink: 0, marginTop: 2, opacity: 0.5, fontSize: 11 }}>{sym}</span>
                    <div>
                      <p className="label mb-1">{label}</p>
                      <p className="body-sm c-cream">{val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </KitchenCard>

            {resume.education.map((edu, i) => (
              <KitchenCard key={edu.degree} delay={0.1 + i * 0.07} style={{ marginBottom: "var(--space-1)", padding: "var(--space-2) var(--space-3)" }}>
                <div className="flex-between gap-2" style={{ flexWrap: "wrap" }}>
                  <div>
                    <p className="label mb-1">{edu.degree}</p>
                    <p className="body-sm c-cream">{edu.school}</p>
                    <p className="mono c-muted" style={{ fontSize: 11, marginTop: 3 }}>{edu.period}</p>
                  </div>
                  <Badge>{edu.gpa}</Badge>
                </div>
              </KitchenCard>
            ))}

            <KitchenCard delay={0.24} style={{ marginTop: "var(--space-1)" }}>
              <p className="label mb-2">Certifications</p>
              {resume.certifications.map((cert) => (
                <div key={cert} className="flex-row gap-1 mb-1">
                  <span className="mono c-gold" style={{ marginTop: 3, flexShrink: 0, opacity: 0.65, fontSize: 11 }}>▸</span>
                  <p className="body-sm c-muted">{cert}</p>
                </div>
              ))}
            </KitchenCard>
          </div>

          {/* Timeline column */}
          <FadeUp delay={0.1}>
            <div style={{ position: "relative" }}>
              <div aria-hidden="true" style={{ position: "absolute", left: 19, top: 0, bottom: 0, width: 1, background: "linear-gradient(to bottom,var(--gold),rgba(200,145,58,0.06))" }} />
              <Stagger>
                {TIMELINE.map((item) => <TimelineItem key={item.year} {...item} />)}
              </Stagger>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
