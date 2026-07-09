"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTimeTheme, TimeSlot } from "../hooks/useTimeTheme";

const SLOT_ICONS: Record<TimeSlot, string> = {
  morning:   "☀",
  afternoon: "◉",
  evening:   "◈",
  night:     "◎",
  latenight: "◆",
};

const SLOT_LABELS: Record<TimeSlot, string> = {
  morning:   "Breakfast Service",
  afternoon: "Lunch Rush",
  evening:   "Dinner Service",
  night:     "Late Night Kitchen",
  latenight: "Debugging Shift",
};

function getSlot(h: number): TimeSlot {
  if (h >= 6  && h < 11) return "morning";
  if (h >= 11 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  if (h >= 21 && h < 24) return "night";
  return "latenight";
}

export default function TimeThemeProvider() {
  useTimeTheme();
  const [slot] = useState<TimeSlot>(() => getSlot(new Date().getHours()));
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show badge for 5 seconds on load, then hide
    const t1 = setTimeout(() => setVisible(true),  3400);
    const t2 = setTimeout(() => setVisible(false), 8000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12, x: "-50%" }}
          animate={{ opacity: 1, y: 0,  x: "-50%" }}
          exit={{   opacity: 0, y: 8,   x: "-50%" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            bottom: "1.8rem",
            left: "50%",
            zIndex: 300,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 16px",
            background: "rgba(6,4,2,0.82)",
            border: "1px solid var(--border)",
            borderRadius: 100,
            backdropFilter: "blur(12px)",
            pointerEvents: "none",
          }}
        >
          <span className="mono c-gold" style={{ fontSize: 11, opacity: 0.7 }}>{SLOT_ICONS[slot]}</span>
          <span className="label c-muted" style={{ fontSize: 10 }}>{SLOT_LABELS[slot]}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
