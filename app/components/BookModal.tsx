"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "./ui";
import { useSoundFx } from "../hooks/useSoundFx";

export type BookEntry = {
  title: string;
  author: string;
  spineColor: string;
  status: string;
  genre: string;
  lesson: string;
  connection?: string;
  concept?: string;
  reflection?: string;
};

interface BookModalProps {
  book: BookEntry | null;
  shelf: string;
  onClose: () => void;
}

export default function BookModal({ book, shelf, onClose }: BookModalProps) {
  const { play } = useSoundFx();

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") { play("/sounds/click.mp3", 0.18); onClose(); }
    };
    document.addEventListener("keydown", h);
    if (book) document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [book, onClose, play]);

  const handleClose = () => { play("/sounds/click.mp3", 0.18); onClose(); };

  return (
    <AnimatePresence>
      {book && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={handleClose}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(3,2,1,0.85)",
            backdropFilter: "blur(20px)",
            zIndex: 9100,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "var(--space-4)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.34, ease: [0.22,1,0.36,1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-hover)",
              borderRadius: "var(--radius-xl)",
              width: "100%", maxWidth: 560,
              overflow: "hidden",
            }}
          >
            {/* Header — book color accent */}
            <div style={{
              background: `linear-gradient(135deg, ${book.spineColor}55, var(--bg-card))`,
              borderBottom: "1px solid var(--border)",
              padding: "var(--space-4)",
              position: "relative",
            }}>
              {/* Book block + meta */}
              <div className="flex-row gap-3">
                <div style={{
                  width: 52, height: 72, flexShrink: 0,
                  background: book.spineColor,
                  borderRadius: "4px 8px 8px 4px",
                  boxShadow: "4px 4px 14px rgba(0,0,0,0.5)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }} />
                <div style={{ flex: 1 }}>
                  <div className="flex-row gap-1 mb-1">
                    <Badge>{book.status}</Badge>
                    <Badge style={{ opacity: 0.55 }}>{book.genre}</Badge>
                    <Badge style={{ opacity: 0.55 }}>{shelf}</Badge>
                  </div>
                  <h2 className="heading-lg c-cream mb-1" style={{ lineHeight: 1.2 }}>{book.title}</h2>
                  <p className="label c-gold">{book.author}</p>
                </div>
              </div>
              {/* Close button */}
              <button onClick={handleClose} aria-label="Close"
                style={{
                  position: "absolute", top: "var(--space-2)", right: "var(--space-2)",
                  background: "rgba(200,145,58,0.08)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)", color: "var(--muted)",
                  width: 30, height: 30, cursor: "pointer", fontSize: 13,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.18s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--cream)"; e.currentTarget.style.borderColor = "var(--border-active)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}>
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "var(--space-4)" }}>
              {/* Lesson */}
              <div className="modal-section">
                <p className="label mb-1">Lesson Learned</p>
                <p className="body-md c-2" style={{ fontStyle: "italic", lineHeight: 1.75 }}>
                  &ldquo;{book.lesson}&rdquo;
                </p>
              </div>

              {/* Connection to engineering/philosophy */}
              {book.connection && (
                <div className="modal-section">
                  <p className="label mb-1">Connection to My Work</p>
                  <div className="decision-block">
                    <p>{book.connection}</p>
                  </div>
                </div>
              )}

              {/* Key concept */}
              {book.concept && (
                <div className="modal-section">
                  <p className="label mb-1">Key Concept</p>
                  <p className="body-sm c-muted">{book.concept}</p>
                </div>
              )}

              {/* Reflection — why this book matters */}
              {book.reflection && (
                <div className="book-reflection">
                  <p className="label">Why this book matters</p>
                  <p>{book.reflection}</p>
                </div>
              )}

              {/* Close */}
              <motion.button
                onClick={handleClose}
                className="btn btn-secondary"
                style={{ width: "100%", justifyContent: "center", marginTop: "var(--space-2)" }}
                whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
              >
                Close Book
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
