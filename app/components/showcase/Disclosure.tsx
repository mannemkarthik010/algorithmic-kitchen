"use client";
import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { EASE } from "../../lib/motion";

/** Expandable technical details. A real button with aria-expanded; the panel animates height unless motion is reduced. */
export default function Disclosure({ label, children, defaultOpen = false }: { label: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const rm = useReducedMotion();
  return (
    <div className={`sw-disc${open ? " is-open" : ""}`}>
      <button type="button" className="sw-disc__btn" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
        <span>{label}</span>
        <i aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            className="sw-disc__panel"
            initial={rm ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={rm ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <div className="sw-disc__inner">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
