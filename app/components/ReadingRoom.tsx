"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion, useInView } from "framer-motion";
import { resume, bookArchive } from "../data/resume";
import { AKMark, Badge, FadeUp, SectionHeader } from "./ui";
import BookModal, { BookEntry } from "./BookModal";
import { useSoundFx } from "../hooks/useSoundFx";

/* ══════════════════════════════════════════════════════════
   DUST PARTICLES — microscopic motes in the archive air
══════════════════════════════════════════════════════════ */
function DustParticles() {
  const rm = useReducedMotion();
  if (rm) return null;
  // fixed seed values — no Math.random() on every render
  const MOTES = [
    { l: 8,  t: 22, w: 1.2, d: 6.8, dl: 0.0 },
    { l: 17, t: 55, w: 1.8, d: 8.2, dl: 1.4 },
    { l: 26, t: 38, w: 1.0, d: 7.1, dl: 3.2 },
    { l: 35, t: 70, w: 1.5, d: 9.4, dl: 0.8 },
    { l: 44, t: 15, w: 1.3, d: 6.5, dl: 5.1 },
    { l: 53, t: 62, w: 1.7, d: 8.8, dl: 2.0 },
    { l: 62, t: 42, w: 1.1, d: 7.6, dl: 4.4 },
    { l: 71, t: 28, w: 1.9, d: 9.1, dl: 1.1 },
    { l: 80, t: 75, w: 1.4, d: 7.3, dl: 3.7 },
    { l: 88, t: 50, w: 1.6, d: 8.0, dl: 6.2 },
    { l: 14, t: 85, w: 1.0, d: 6.9, dl: 2.6 },
    { l: 47, t: 90, w: 1.2, d: 7.8, dl: 0.5 },
  ] as const;
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 1 }}>
      {MOTES.map((m, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            width: m.w, height: m.w,
            borderRadius: "50%",
            background: "rgba(200,145,58,0.22)",
            left: `${m.l}%`,
            top: `${m.t}%`,
          }}
          animate={{
            y: [0, -55, -55],
            x: [0, i % 2 === 0 ? 10 : -8, i % 2 === 0 ? 6 : -4],
            opacity: [0, 0.65, 0],
          }}
          transition={{ duration: m.d, delay: m.dl, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   AMBIENT WARM GLOW — candlelight pool (no candle prop)
══════════════════════════════════════════════════════════ */
function WarmGlow({ left, intensity = 1 }: { left: string; intensity?: number }) {
  const rm = useReducedMotion();
  return (
    <motion.div
      aria-hidden="true"
      animate={rm ? {} : { opacity: [0.55 * intensity, 0.82 * intensity, 0.6 * intensity, 0.88 * intensity, 0.55 * intensity] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      style={{
        position: "absolute", bottom: 0, left,
        transform: "translateX(-50%)",
        width: 320, height: 220,
        background: "radial-gradient(ellipse 55% 100% at 50% 100%, rgba(200,130,40,0.16), transparent 72%)",
        pointerEvents: "none", zIndex: 0,
      }}
    />
  );
}

/* ══════════════════════════════════════════════════════════
   ENGINEERING SPINE
══════════════════════════════════════════════════════════ */
type EngBook = typeof bookArchive.engineering[number];

function EngineeringSpine({ book, active, onClick, index }: {
  book: EngBook; active: boolean; onClick: () => void; index: number;
}) {
  const rm = useReducedMotion();
  return (
    <motion.div
      onClick={onClick}
      initial={rm ? false : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      aria-label={book.title}
      style={{
        position: "relative",
        width: 56,
        height: 240,
        borderRadius: "6px 10px 10px 6px",
        overflow: "hidden",
        flexShrink: 0,
        cursor: "pointer",
        background: book.spineColor,
        transform: active ? "translateY(-22px) scale(1.05)" : "translateY(0) scale(1)",
        filter: active ? "brightness(1.28)" : "brightness(1)",
        boxShadow: active
          ? `0 28px 52px rgba(0,0,0,0.72), 0 0 32px rgba(200,145,58,0.2), inset 0 0 18px rgba(255,255,255,0.04)`
          : "4px 8px 20px rgba(0,0,0,0.68), -1px 0 2px rgba(0,0,0,0.3)",
        border: active ? "1px solid rgba(200,145,58,0.62)" : "1px solid rgba(0,0,0,0.38)",
        transition: "transform 0.38s cubic-bezier(0.22,1,0.36,1), box-shadow 0.38s ease, filter 0.3s ease, border-color 0.3s ease",
      }}
    >
      {/* Left-edge spine shadow */}
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 10, background: "linear-gradient(90deg, rgba(0,0,0,0.52), transparent)", zIndex: 2, pointerEvents: "none" }} />
      {/* Top page-edge highlight */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(180deg, rgba(255,255,255,0.11), transparent)", borderRadius: "6px 10px 0 0", zIndex: 2, pointerEvents: "none" }} />
      {/* Right page-stack lines */}
      <div style={{ position: "absolute", top: 4, right: 0, bottom: 4, width: 3, background: "repeating-linear-gradient(to bottom, rgba(240,230,206,0.13) 0px, rgba(240,230,206,0.13) 1px, transparent 1px, transparent 5px)", zIndex: 2, pointerEvents: "none" }} />
      {/* Active gold glow top */}
      {active && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 32% at 50% 6%, rgba(200,145,58,0.2), transparent 68%)", zIndex: 3, pointerEvents: "none" }}
        />
      )}
      {/* Title */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", zIndex: 1 }}>
        <span style={{
          display: "block",
          transform: "rotate(-90deg)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          maxWidth: 200,
          fontFamily: "var(--f-display)",
          fontSize: 10.5, fontWeight: 300, letterSpacing: "0.07em",
          color: "rgba(255,245,220,0.86)",
        }}>
          {book.title}
        </span>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   BOOK DETAIL PANEL
══════════════════════════════════════════════════════════ */
function BookDetailPanel({ book, onOpen }: { book: EngBook | null; onOpen: (b: BookEntry) => void }) {
  const { play } = useSoundFx();
  return (
    <AnimatePresence mode="wait">
      {book ? (
        <motion.div
          key={book.title}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          style={{
            padding: "var(--space-3) var(--space-4)",
            background: "linear-gradient(135deg, rgba(30,20,8,0.96), rgba(12,8,4,0.98))",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            borderLeft: `3px solid ${book.spineColor}`,
            flex: 1, minWidth: 0,
          }}
        >
          <div style={{ display: "flex", gap: 6, marginBottom: "var(--space-2)", flexWrap: "wrap" }}>
            <Badge>{book.status}</Badge>
            <Badge style={{ opacity: 0.6 }}>{book.genre}</Badge>
          </div>
          <p className="heading-lg c-cream" style={{ marginBottom: 4, lineHeight: 1.2 }}>{book.title}</p>
          <p className="label c-gold" style={{ letterSpacing: "0.14em", marginBottom: "var(--space-2)" }}>{book.author}</p>
          {book.concept && (
            <p className="body-sm c-muted" style={{ marginBottom: "var(--space-2)", lineHeight: 1.65 }}>
              <span className="label" style={{ marginRight: 8 }}>Concept</span>{book.concept}
            </p>
          )}
          <div style={{ borderLeft: "2px solid var(--gold)", paddingLeft: "var(--space-2)", marginBottom: "var(--space-3)" }}>
            <p className="label c-muted" style={{ marginBottom: 6 }}>Key Lesson</p>
            <p className="body-sm c-cream" style={{ fontStyle: "italic", lineHeight: 1.7 }}>&ldquo;{book.lesson}&rdquo;</p>
          </div>
          <motion.button
            onClick={() => { play("/sounds/click.mp3", 0.18); onOpen(book); }}
            className="btn btn-secondary"
            style={{ fontSize: 11, padding: "7px 18px" }}
            whileHover={{ y: -2, borderColor: "var(--border-active)" }}
            whileTap={{ scale: 0.97 }}
          >
            Open Book →
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-4)", border: "1px dashed rgba(200,145,58,0.14)", borderRadius: "var(--radius-lg)" }}
        >
          <p className="label c-muted" style={{ opacity: 0.38 }}>← select a spine to open</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════════════
   CURRENTLY READING HERO
══════════════════════════════════════════════════════════ */
function CurrentlyReadingHero() {
  const rm = useReducedMotion();
  const book = bookArchive.thinking[0];
  return (
    <motion.div
      className="current-read-hero"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: "var(--space-5)",
        alignItems: "center",
        padding: "var(--space-5)",
        background: "radial-gradient(ellipse 80% 60% at 18% 50%, rgba(26,58,92,0.28), transparent 60%), linear-gradient(135deg, rgba(30,22,10,0.92), rgba(12,8,5,0.96))",
        border: "1px solid rgba(200,145,58,0.22)",
        borderRadius: "var(--radius-xl)",
        overflow: "hidden",
        marginBottom: "var(--space-6)",
      }}
    >
      {/* Ambient top-left glow */}
      <div aria-hidden="true" style={{ position: "absolute", top: -40, left: 60, width: 160, height: 160, background: "radial-gradient(circle, rgba(200,145,58,0.11), transparent 70%)", filter: "blur(28px)", pointerEvents: "none" }} />

      {/* 3D book */}
      <motion.div
        animate={rm ? {} : { rotateY: [-3, 3, -3], rotateZ: [-0.6, 0.6, -0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "relative", flexShrink: 0, transformStyle: "preserve-3d" }}
      >
        {/* Floor shadow */}
        <div style={{ position: "absolute", bottom: -18, left: "50%", transform: "translateX(-50%)", width: 82, height: 18, background: "radial-gradient(ellipse, rgba(0,0,0,0.55), transparent 70%)", filter: "blur(5px)" }} />
        {/* Book body */}
        <div style={{
          width: 102, height: 140,
          background: `linear-gradient(148deg, ${book.spineColor}, color-mix(in srgb, ${book.spineColor} 65%, #000))`,
          borderRadius: "5px 12px 12px 5px",
          boxShadow: "10px 14px 34px rgba(0,0,0,0.72), -3px 0 6px rgba(0,0,0,0.45), inset 14px 0 0 rgba(0,0,0,0.32)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 28% 18%, rgba(255,255,255,0.07), transparent 52%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 18, left: 10, right: 10, height: 1, background: "rgba(200,145,58,0.48)" }} />
          <div style={{ position: "absolute", bottom: 24, left: 10, right: 10, height: 1, background: "rgba(200,145,58,0.28)" }} />
          <div style={{ position: "absolute", inset: 0, padding: "24px 13px 30px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 5 }}>
            <p style={{ fontFamily: "var(--f-display)", fontSize: 9.5, color: "rgba(240,230,206,0.82)", lineHeight: 1.4, textAlign: "center" }}>{resume.currentlyReading}</p>
            <p style={{ fontFamily: "var(--f-mono)", fontSize: 7.5, color: "rgba(200,145,58,0.72)", textAlign: "center", marginTop: 3 }}>{resume.currentlyReadingAuthor}</p>
          </div>
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 13, background: "linear-gradient(90deg, rgba(0,0,0,0.55), transparent)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 4, right: 0, bottom: 4, width: 4, background: "repeating-linear-gradient(to bottom, rgba(240,230,206,0.14) 0px, rgba(240,230,206,0.14) 1px, transparent 1px, transparent 5px)", pointerEvents: "none" }} />
          <motion.div
            animate={rm ? {} : { opacity: [0.14, 0.32, 0.14] }}
            transition={{ duration: 3.2, repeat: Infinity }}
            style={{ position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)", width: 84, height: 84, background: "radial-gradient(circle, rgba(200,145,58,0.28), transparent 70%)", filter: "blur(12px)", pointerEvents: "none" }}
          />
        </div>
        <div style={{ position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}>
          <Badge style={{ fontSize: 8 }}>Reading Now</Badge>
        </div>
      </motion.div>

      {/* Text */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <p className="label c-muted" style={{ marginBottom: 8, letterSpacing: "0.14em" }}>Currently on the stovetop</p>
        <p className="heading-lg c-cream" style={{ marginBottom: 4, lineHeight: 1.15 }}>{resume.currentlyReading}</p>
        <p className="label c-gold" style={{ letterSpacing: "0.16em", marginBottom: "var(--space-3)" }}>{resume.currentlyReadingAuthor}</p>
        <p className="body-md c-2" style={{ fontStyle: "italic", maxWidth: 500, lineHeight: 1.75, marginBottom: "var(--space-3)" }}>
          {resume.currentlyReadingNote}
        </p>
        {/* Reading progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <p className="label c-muted">Progress</p>
          <div style={{ display: "flex", gap: 5 }}>
            {[1,2,3,4,5].map((n) => (
              <motion.div
                key={n}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 + n * 0.1, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                style={{ width: 8, height: 8, borderRadius: "50%", background: n <= 3 ? "var(--gold)" : "rgba(200,145,58,0.18)", border: "1px solid rgba(200,145,58,0.35)" }}
              />
            ))}
          </div>
          <p className="label c-gold">~60%</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   ENGINEERING BOOKSHELF STAGE
══════════════════════════════════════════════════════════ */
function EngineeringShelf({ activeBook, onBookClick, onOpenModal }: {
  activeBook: number | null;
  onBookClick: (i: number) => void;
  onOpenModal: (b: BookEntry) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const inView   = useInView(stageRef, { once: true, margin: "-60px" });

  return (
    <FadeUp delay={0.08}>
      <div style={{ marginBottom: "var(--space-6)" }}>
        {/* Shelf label row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "var(--space-3)" }}>
          <span className="mono c-gold" style={{ opacity: 0.55, fontSize: 11 }}>◉</span>
          <span className="label c-gold">Engineering Shelf</span>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--border), transparent)" }} />
          <span className="label c-muted" style={{ fontSize: 9, opacity: 0.45 }}>select a spine</span>
        </div>

        {/* The shelf stage */}
        <div
          ref={stageRef}
          style={{
            position: "relative",
            borderRadius: "var(--radius-xl)",
            overflow: "hidden",
            background: "radial-gradient(circle at 50% 0%, rgba(200,145,58,0.11), transparent 50%), linear-gradient(180deg, rgba(40,24,8,0.85), rgba(10,7,4,0.97))",
            border: "1px solid var(--border)",
            padding: "var(--space-4) var(--space-4) 0",
          }}
        >
          {/* Atmosphere */}
          {inView && <DustParticles />}
          <WarmGlow left="22%" intensity={0.88} />
          <WarmGlow left="78%" intensity={0.65} />
          {/* Ceiling shadow */}
          <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 30, background: "linear-gradient(180deg, rgba(55,30,10,0.65), transparent)", pointerEvents: "none", zIndex: 0 }} />

          {/* Books */}
          <div style={{ position: "relative", zIndex: 2, display: "flex", gap: 7, alignItems: "flex-end", overflowX: "auto", paddingBottom: 0, msOverflowStyle: "none", scrollbarWidth: "none" } as React.CSSProperties}>
            {bookArchive.engineering.map((book, i) => (
              <EngineeringSpine key={i} book={book} active={activeBook === i} onClick={() => onBookClick(i)} index={i} />
            ))}
            {/* Bookend */}
            <div style={{ flexShrink: 0, width: 20, height: 80, background: "linear-gradient(180deg,#3a2810,#1a1008)", borderRadius: "4px 4px 2px 2px", marginLeft: 4, alignSelf: "flex-end", boxShadow: "3px 6px 16px rgba(0,0,0,0.55)", border: "1px solid rgba(0,0,0,0.45)" }} />
          </div>

          {/* Plank */}
          <div style={{ position: "relative", zIndex: 2, height: 16, background: "linear-gradient(180deg,#4a3010,#1a0e06)", borderRadius: "0 0 4px 4px", boxShadow: "0 8px 28px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.4)" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1.5, background: "linear-gradient(90deg, transparent, rgba(200,145,58,0.38), transparent)" }} />
          </div>

          {/* Detail panel */}
          <div style={{ position: "relative", zIndex: 2, padding: "var(--space-3) 0 var(--space-4)" }}>
            <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start" }}>
              {/* Mini book thumbnail */}
              {activeBook !== null && bookArchive.engineering[activeBook] && (
                <motion.div
                  key={activeBook}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.28 }}
                  style={{ width: 40, height: 58, background: bookArchive.engineering[activeBook].spineColor, borderRadius: "3px 7px 7px 3px", flexShrink: 0, boxShadow: "4px 4px 14px rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.06)" }}
                />
              )}
              <BookDetailPanel
                book={activeBook !== null ? bookArchive.engineering[activeBook] : null}
                onOpen={onOpenModal}
              />
            </div>
          </div>
        </div>
      </div>
    </FadeUp>
  );
}

/* ══════════════════════════════════════════════════════════
   SMALL BOOK ROW (Thinking / Philosophy)
══════════════════════════════════════════════════════════ */
type SmallBook = typeof bookArchive.thinking[number];

function SmallBookRow({ book, index, shelf, onOpen }: {
  book: SmallBook; index: number; shelf: string;
  onOpen: (b: BookEntry, s: string) => void;
}) {
  const { play } = useSoundFx();
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      onClick={() => { play("/sounds/click.mp3", 0.18); onOpen(book, shelf); }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      initial={{ opacity: 0, x: -14 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-10px" }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        padding: "10px 14px 10px 18px",
        background: hovered ? "var(--bg-card-hi)" : "var(--bg-card)",
        border: "1px solid",
        borderColor: hovered ? "var(--border-hover)" : "var(--border)",
        borderRadius: "var(--radius-md)",
        position: "relative",
        cursor: "pointer",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "background 0.2s, border-color 0.2s, transform 0.2s",
      }}
    >
      {/* Spine accent */}
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 3, background: book.spineColor, borderRadius: "var(--radius-md) 0 0 var(--radius-md)" }} />
      {/* Color bleed on hover */}
      {hovered && <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 56, background: `radial-gradient(ellipse at 0% 50%, ${book.spineColor}20, transparent 80%)`, pointerEvents: "none", borderRadius: "var(--radius-md) 0 0 var(--radius-md)" }} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="body-md c-cream" style={{ fontFamily: "var(--f-display)", fontWeight: 600, marginBottom: 2, lineHeight: 1.3 }}>{book.title}</p>
          <p className="label c-gold" style={{ opacity: 0.72 }}>{book.author}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <Badge style={{ fontSize: 8 }}>{book.status}</Badge>
          <motion.span animate={{ x: hovered ? 3 : 0, opacity: hovered ? 1 : 0 }} transition={{ duration: 0.18 }} className="c-gold" style={{ fontSize: 13 }}>→</motion.span>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   SHELF PANEL (Thinking / Philosophy wrapper)
══════════════════════════════════════════════════════════ */
function ShelfPanel({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <div style={{
      padding: "var(--space-3) var(--space-3) var(--space-4)",
      background: "linear-gradient(160deg, rgba(28,18,6,0.75), rgba(10,7,4,0.92))",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-xl)",
    }}>
      {/* Panel header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "var(--space-1)" }}>
        <span className="mono c-gold" style={{ opacity: 0.5, fontSize: 10 }}>◈</span>
        <span className="label c-gold">{title}</span>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--border), transparent)" }} />
      </div>
      <p className="body-sm c-muted" style={{ fontStyle: "italic", marginBottom: "var(--space-2)", lineHeight: 1.6, paddingLeft: 22 }}>{note}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   QUOTE BLOCK
══════════════════════════════════════════════════════════ */
function ClosingQuote() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      style={{
        textAlign: "center",
        padding: "var(--space-6) var(--space-4) var(--space-3)",
        borderTop: "1px solid var(--border)",
        position: "relative",
      }}
    >
      {/* AK mark centered */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-3)" }}>
        <AKMark size="sm" />
      </div>
      <p className="heading-lg c-cream" style={{ fontStyle: "italic", fontWeight: 300, maxWidth: 680, margin: "0 auto var(--space-2)", lineHeight: 1.75 }}>
        &ldquo;The best machine learning engineers are not just coders — they are storytellers, scientists, and chefs who know the real magic happens at the intersection of data and intuition.&rdquo;
      </p>
      <cite className="label c-gold" style={{ letterSpacing: "0.2em" }}>— Karthik Mannem</cite>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════ */
export default function ReadingRoom() {
  const [activeBook, setActiveBook] = useState<number | null>(0);
  const [bookModal, setBookModal]   = useState<{ book: BookEntry; shelf: string } | null>(null);
  const { play }                    = useSoundFx();

  const handleSpineClick = (i: number) => {
    if (activeBook !== i) play("/sounds/click.mp3", 0.18);
    setActiveBook(activeBook === i ? null : i);
  };

  return (
    <>
      <section
        id="reading"
        style={{ position: "relative", paddingTop: "var(--space-6)", paddingBottom: "var(--space-6)", overflow: "hidden" }}
      >
        {/* Section atmosphere */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 90% 50% at 50% 100%, rgba(200,130,40,0.055), transparent 60%), radial-gradient(ellipse 50% 40% at 18% 50%, rgba(26,58,92,0.07), transparent 60%)", pointerEvents: "none", zIndex: 0 }} />
        <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: "32%", background: "linear-gradient(to bottom, rgba(6,4,2,0.45), transparent)", pointerEvents: "none", zIndex: 0 }} />

        <div className="container" style={{ position: "relative", zIndex: 2 }}>

          {/* Standard branded section header — matches every other section */}
          <SectionHeader
            index="§ 06"
            label="The Archive"
            title={<>The <span className="t-grad">Reading Room</span></>}
            subtitle="Books that shaped the way I build systems, think deeply, and create intelligently."
          />

          {/* Currently reading */}
          <CurrentlyReadingHero />

          {/* Engineering shelf */}
          <EngineeringShelf
            activeBook={activeBook}
            onBookClick={handleSpineClick}
            onOpenModal={(b) => setBookModal({ book: b, shelf: "Engineering Shelf" })}
          />

          {/* Thinking + Philosophy */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
            <FadeUp delay={0.1}>
              <ShelfPanel title="Thinking Shelf" note="Mindset books outside engineering. Click any to read the lesson.">
                {bookArchive.thinking.map((book, i) => (
                  <SmallBookRow key={i} book={book} shelf="Thinking Shelf" index={i}
                    onOpen={(b, s) => setBookModal({ book: b, shelf: s })} />
                ))}
              </ShelfPanel>
            </FadeUp>
            <FadeUp delay={0.15}>
              <ShelfPanel title="Philosophy Shelf" note="Beyond code — discipline, purpose, and systems of thought.">
                {bookArchive.philosophy.map((book, i) => (
                  <SmallBookRow key={i} book={book} shelf="Philosophy Shelf" index={i}
                    onOpen={(b, s) => setBookModal({ book: b, shelf: s })} />
                ))}
              </ShelfPanel>
            </FadeUp>
          </div>

          {/* Quote */}
          <ClosingQuote />

        </div>
      </section>

      <BookModal
        book={bookModal?.book ?? null}
        shelf={bookModal?.shelf ?? ""}
        onClose={() => setBookModal(null)}
      />
    </>
  );
}
