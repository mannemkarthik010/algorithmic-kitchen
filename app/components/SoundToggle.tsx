"use client";

import { motion } from "framer-motion";
import { useSound } from "../hooks/SoundContext";

export default function SoundToggle() {
  const { muted, toggle } = useSound();

  return (
    <motion.button
      onClick={toggle}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 5, duration: 0.5 }}
      whileHover={{ borderColor: "var(--border-hover)" }}
      aria-label={muted ? "Enable sound" : "Mute sound"}
      style={{
        position: "fixed",
        right: 24,
        bottom: 72,          /* sits above the terminal hint */
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "7px 14px",
        background: "rgba(8,5,2,0.88)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        cursor: "pointer",
        fontFamily: "var(--f-mono)",
        fontSize: 11,
        color: muted ? "var(--muted)" : "var(--gold)",
        backdropFilter: "blur(10px)",
        letterSpacing: "0.06em",
        transition: "color 0.2s ease, border-color 0.2s ease",
      }}
    >
      {/* Icon */}
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {muted ? (
          /* Volume X */
          <>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </>
        ) : (
          /* Volume 2 */
          <>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </>
        )}
      </svg>
      {muted ? "Sound off" : "Sound on"}
    </motion.button>
  );
}
