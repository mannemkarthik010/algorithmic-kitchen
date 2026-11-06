"use client";
import { useState } from "react";
import ShapeHero from "@/components/kokonutui/shape-hero";
import { resume } from "../data/resume";

const PILL = "h-14 px-7 text-base font-semibold tracking-tight sm:h-16 sm:px-9 sm:text-lg";
const SOLID = "ex-pill ex-pill--paper";
const ORANGE = "ex-pill ex-pill--orange";
const BLUE = "ex-pill ex-pill--blue";
const LINE = "ex-pill ex-pill--line";

/**
 * Contact: Kokonut's Shape Hero physics (a small rigid-body solver, MIT) carrying the four ways to reach me as pills that
 * drop in, pile up and can be thrown. The pile is decoration (aria-hidden by the component); the real links sit in the
 * action row beneath the heading, as ordinary anchors.
 */
export default function ExContact() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(resume.email); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* the mailto link still works */ }
  };
  return (
    <div id="contact">
      <ShapeHero
        className="ex-contact"
        as="h2"
        eyebrow={<span className="ex-mono">(05) &nbsp;Contact</span>}
        title={<>Say hello.<br /><em>I read everything.</em></>}
        description="Open to full-time machine learning and AI engineering roles. A short note with what you are building is the best start."
        fill={0.34}
        actions={
          <>
            <a className="ex-cta ex-cta--orange" href={`mailto:${resume.email}`}>{resume.email}</a>
            <button type="button" className="ex-cta ex-cta--line" onClick={copy} aria-live="polite">{copied ? "Copied" : "Copy email"}</button>
            <a className="ex-cta ex-cta--line" href={resume.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
            <a className="ex-cta ex-cta--line" href={resume.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
            <a className="ex-cta ex-cta--line" href="/Karthik_Mannem_Resume.pdf" target="_blank" rel="noopener noreferrer">Résumé ↗</a>
          </>
        }
        shapes={[
          { id: "mail", content: "Email", className: `${PILL} ${ORANGE}` },
          { id: "li", content: "LinkedIn", className: `${PILL} ${SOLID}` },
          { id: "gh", content: "GitHub", className: `${PILL} ${LINE}` },
          { id: "cv", content: "Résumé", className: `${PILL} ${BLUE}` },
          { id: "d1", className: `size-16 ${ORANGE}` },
          { id: "open", content: "Open to full-time roles", className: `${PILL} ${LINE}` },
          { id: "la", content: "Los Angeles", className: `${PILL} ${SOLID}` },
          { id: "d2", className: `size-12 ${BLUE}` },
          { id: "ev", content: "Evidence first", className: `${PILL} ${LINE}` },
          { id: "d3", className: `size-20 ${SOLID}` },
          { id: "play", content: "Play ECHO//SHIFT", className: `${PILL} ${ORANGE}` },
          { id: "d4", className: `size-14 ${LINE}` },
        ]}
      />
    </div>
  );
}
