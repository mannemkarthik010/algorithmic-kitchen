"use client";
import { motion } from "motion/react";
import { resume } from "../data/resume";
import { SectionHeader, Stagger, Item } from "./ui";
import CookAnAI from "./CookAnAI";
import KitchenPass from "./KitchenPass";

/* ── Live status ─────────────────────────────── */
const LIVE = [
  { label: "Current Project", value: resume.currentProject,      sym: "◈" },
  { label: "Reading",         value: resume.currentlyReading,    sym: "◎" },
  { label: "Current Paper",   value: resume.currentPaper,        sym: "◇" },
  { label: "Location",        value: resume.location,             sym: "◉" },
  { label: "Available",       value: "Full-time ML/AI · Immediate", sym: "◆" },
  { label: "GitHub",          value: "@mannemkarthik010",         sym: "▲" },
];

export default function LiveKitchen() {
  return (
    <>
      {/* ── Live Kitchen §05 ── */}
      <section id="live" className="s-deep" style={{ position: "relative" }}>
        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <SectionHeader index="LAB" label="In progress"
            title={<>What I&apos;m <span className="t-grad">working on</span></>}
          />
          <KitchenPass />

          <Stagger style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "var(--space-2)" }}>
            {LIVE.map(({ label, value, sym }) => (
              <Item key={label}>
                <motion.div whileHover={{ y: -3, borderColor: "var(--border-hover)" }}
                  className="card card--sm"
                  style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start", transition: "border-color 0.2s" }}>
                  <span className="mono c-gold" style={{ flexShrink: 0, marginTop: 2, opacity: 0.5, fontSize: 12 }}>{sym}</span>
                  <div>
                    <p className="label mb-1">{label}</p>
                    <p className="body-sm c-cream">{value}</p>
                  </div>
                </motion.div>
              </Item>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Cook an AI game ── */}
      <section id="cook" className="s-warm" style={{ position: "relative" }}>
        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <div style={{ textAlign: "center", marginBottom: "var(--space-4)" }}>
            <span className="label c-gold" style={{ display: "block", marginBottom: "var(--space-1)" }}>The Experiment Lab</span>
            <h2 className="heading-xl c-cream" style={{ marginBottom: "var(--space-1)" }}>
              Cook an <span className="t-grad">AI Model</span>
            </h2>
            <span className="gold-line" style={{ display: "block" }} />
            <p className="body-md c-muted" style={{ maxWidth: 480, margin: "var(--space-2) auto 0" }}>
              Choose your dataset, model architecture, and deployment. We&apos;ll cook it live.
            </p>
          </div>
          <CookAnAI />
        </div>
      </section>
    </>
  );
}
