"use client";
/**
 * ui.tsx — Shared component library for The Algorithmic Kitchen.
 *
 * Components:
 *   AKMark          — brand monogram (sizes: sm | md | lg)
 *   SectionDivider  — gold hairline between sections
 *   SectionHeader   — standard section title block
 *   KitchenCard     — animated card wrapper
 *   Badge           — mono pill
 *   GlowBlob        — ambient background blob
 *   Btn             — primary / secondary button (replaces CTAButton)
 *   FadeUp          — viewport-triggered fade-up
 *   Stagger / Item  — staggered list reveal
 *   SkillPill       — hoverable skill badge
 *   TimelineItem    — timeline row with connector dot
 */

import { ReactNode } from "react";
import { motion, Variants, useReducedMotion } from "framer-motion";
import { EASE, DUR } from "../lib/motion";

// EASE imported from ../lib/motion

/* ── AK brand mark ───────────────────────────────── */
const AK_SIZES = { sm: 28, md: 44, lg: 68 } as const;
export function AKMark({ size = "md" }: { size?: keyof typeof AK_SIZES }) {
  const px = AK_SIZES[size];
  const r  = Math.round(px * 0.22);
  const sw = size === "lg" ? 1.7 : 1.5;
  return (
    <div className="ak" style={{ width: px, height: px, borderRadius: r }}>
      <svg width={px * 0.6} height={px * 0.6} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M3 24 L9.5 8 L16 24 M6 18 L13 18"
          stroke="var(--gold)" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18 8 L18 24 M18 16 L28 8 M18 16 L28 24"
          stroke="var(--gold)" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

/* ── Section divider ─────────────────────────────── */
export function SectionDivider() {
  return <div aria-hidden="true" className="s-divider" />;
}

/* ── Section header ──────────────────────────────── */
export function SectionHeader({
  index, label, title, subtitle,
}: {
  index: string; label: string;
  title: ReactNode; subtitle?: string;
}) {
  return (
    <div
      className="section-header"
      style={{ textAlign: "center", marginBottom: "var(--space-6)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.42 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: "var(--space-2)" }}
      >
        <span style={{ width: 28, height: 1, background: "linear-gradient(90deg,transparent,var(--gold))", display: "block" }} />
        <span className="label c-gold">{index} — {label}</span>
        <span style={{ width: 28, height: 1, background: "linear-gradient(90deg,var(--gold),transparent)", display: "block" }} />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
        className="heading-xl c-cream" style={{ marginBottom: "var(--space-2)" }}
      >
        {title}
      </motion.h2>

      <motion.div
        initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }}
        viewport={{ once: true }} transition={{ duration: 0.48, delay: 0.2 }}
        style={{ transformOrigin: "center" }}
      >
        <span className="gold-line" />
      </motion.div>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.32 }}
          className="body-lg c-muted"
          style={{ maxWidth: 560, margin: "var(--space-2) auto 0" }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

/* ── Kitchen card ────────────────────────────────── */
export function KitchenCard({
  children, style, onClick, delay = 0, noHover,
}: {
  children: ReactNode; style?: React.CSSProperties;
  onClick?: () => void; delay?: number; noHover?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: EASE }}
      whileHover={noHover ? undefined : { y: -5 }}
      onClick={onClick}
      className="card"
      style={{ cursor: onClick ? "pointer" : "default", ...style }}
    >
      {children}
    </motion.div>
  );
}

/* ── Badge ───────────────────────────────────────── */
export function Badge({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <span className="badge" style={style}>{children}</span>;
}


/* Internal: uses hook at top-level of its own component */
function AnimatedBlob({ size, color, style, duration }: { size: number; color: string; style?: React.CSSProperties; duration: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div aria-hidden="true" className="glow"
      style={{ width: size, height: size, background: color, ...style }}
      animate={reduceMotion ? {} : { y: [0, -5, 0], scale: [1, 1.02, 1] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/* ── Glow blob ───────────────────────────────────── */
export function GlowBlob({
  size = 400, color = "rgba(200,145,58,0.06)", style, animate: shouldAnimate = true,
}: { size?: number; color?: string; style?: React.CSSProperties; animate?: boolean }) {
  if (shouldAnimate) {
    return <AnimatedBlob size={size} color={color} style={style} duration={10 + size / 100} />;
  }
  return (
    <div aria-hidden="true" className="glow"
      style={{ width: size, height: size, background: color, ...style }} />
  );
}

/* ── Button ──────────────────────────────────────── */
export function Btn({
  children, href, onClick, variant = "primary",
  style, target, rel, disabled, type = "button",
}: {
  children: ReactNode; href?: string; onClick?: () => void;
  variant?: "primary" | "secondary"; style?: React.CSSProperties;
  target?: string; rel?: string; disabled?: boolean; type?: "button" | "submit";
}) {
  const cls = `btn btn-${variant}`;
  const s = { opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer", ...style };
  if (href) return (
    <motion.a href={href} target={target} rel={rel} className={cls} style={s}
      whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
      {children}
    </motion.a>
  );
  return (
    <motion.button type={type} onClick={onClick} disabled={disabled} className={cls} style={s}
      whileHover={disabled ? {} : { y: -2 }} whileTap={disabled ? {} : { scale: 0.97 }}>
      {children}
    </motion.button>
  );
}

/* ── FadeUp ──────────────────────────────────────── */
export function FadeUp({
  children, delay = 0, style,
}: { children: ReactNode; delay?: number; style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: DUR.moderate, delay, ease: EASE }} style={style}>
      {children}
    </motion.div>
  );
}

/* ── Stagger container + item ────────────────────── */
const cV: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const iV: Variants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};
export function Stagger({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <motion.div variants={cV} initial="hidden" whileInView="show"
      viewport={{ once: true, margin: "-40px" }} style={style}>
      {children}
    </motion.div>
  );
}
export function Item({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <motion.div variants={iV} style={style}>{children}</motion.div>;
}

/* ── Skill pill ──────────────────────────────────── */
export function SkillPill({ label }: { label: string }) {
  return (
    <motion.span className="badge"
      whileHover={{ scale: 1.06, borderColor: "var(--border-active)", color: "var(--gold-hi)", background: "rgba(200,145,58,0.14)" }}
      transition={{ duration: 0.14 }}
      style={{ cursor: "default" }}>
      {label}
    </motion.span>
  );
}

/* ── Timeline item ───────────────────────────────── */
export function TimelineItem({
  year, title, desc, sym,
}: { year: string; title: string; desc: string; sym: string }) {
  return (
    <motion.div variants={iV} style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
      <motion.div
        whileHover={{ scale: 1.1, borderColor: "var(--border-active)" }}
        transition={{ duration: 0.18 }}
        style={{ flexShrink: 0, width: 38, height: 38, borderRadius: "50%", background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}
      >
        <span className="mono c-gold" style={{ opacity: 0.55, fontSize: 13 }}>{sym}</span>
      </motion.div>
      <div style={{ paddingTop: 5 }}>
        <div style={{ display: "flex", gap: "var(--space-1)", alignItems: "center", flexWrap: "wrap", marginBottom: "0.3rem" }}>
          <Badge>{year}</Badge>
          <span className="body-md c-cream" style={{ fontWeight: 500 }}>{title}</span>
        </div>
        <p className="body-sm c-muted">{desc}</p>
      </div>
    </motion.div>
  );
}

/* ── Book card ───────────────────────────────────── */
export function BookCard({
  title, author, quote, status, genre, pages, spineColor,
}: {
  title: string; author: string; quote: string;
  status: string; genre: string; pages: number; spineColor: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5, borderColor: "var(--border-hover)" }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="card"
      style={{ padding: "var(--space-3) var(--space-3)", position: "relative", overflow: "hidden" }}
    >
      {/* Spine accent */}
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 3, background: spineColor, borderRadius: "var(--radius-lg) 0 0 var(--radius-lg)" }} />
      <div style={{ paddingLeft: "var(--space-2)" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "0.4rem" }}>
          <Badge>{status}</Badge>
          <Badge style={{ opacity: 0.55 }}>{genre}</Badge>
          <span className="mono c-muted" style={{ fontSize: 10, alignSelf: "center" }}>{pages}p</span>
        </div>
        <p className="heading-md c-cream" style={{ marginBottom: 3 }}>{title}</p>
        <p className="label c-gold" style={{ letterSpacing: "0.1em", marginBottom: "var(--space-1)" }}>{author}</p>
        <p className="body-sm c-muted" style={{ fontStyle: "italic" }}>&ldquo;{quote}&rdquo;</p>
      </div>
    </motion.div>
  );
}
