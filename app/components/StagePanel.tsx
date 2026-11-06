"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { STEPS, WORK } from "../lib/pipeline-stages";

/** The four stage buttons and the stage-aware "where it shows up in my work" panel. Shared by the CSS hero and the WebGL prototype. */
export default function StagePanel({ active, onPick, rm }: { active: number; onPick: (i: number) => void; rm: boolean | null }) {
  return (
    <>
    <ol className="pipe__steps">
      {STEPS.map((s, i) => (
        <li key={s.key}>
          <button
            type="button"
            className={`pipe__step${active === i ? " is-on" : ""}`}
            aria-pressed={active === i}
            onMouseEnter={() => onPick(i)}
            onFocus={() => onPick(i)}
            onClick={() => onPick(i)}
          >
            <span className="pipe__k">0{i + 1} / {s.key}</span>
            <span className="pipe__h">{s.head}</span>
            <span className="pipe__b">{s.body}</span>
          </button>
        </li>
      ))}
    </ol>

    <div className="pipe__work" aria-live="polite">
      <p className="pipe__work-h">Stage 0{active + 1} · {STEPS[active].key}: where it shows up in my work</p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.ul
          key={active}
          className="pipe__work-list"
          initial={rm ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={rm ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {WORK[active].map((w) => (
            <li key={w.href}>
              <Link href={w.href}>
                <span className="pipe__work-p">{w.project}</span>
                <b>{w.title} <span aria-hidden="true">→</span></b>
                <span className="pipe__work-w">{w.why}</span>
              </Link>
            </li>
          ))}
        </motion.ul>
      </AnimatePresence>
    </div>

    </>
  );
}
