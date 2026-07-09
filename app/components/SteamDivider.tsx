"use client";
import { motion, useReducedMotion } from "framer-motion";

/**
 * SteamDivider — cinematic atmospheric transition between sections.
 * Heavy mode (default): full warm bloom + steam particles + light trail.
 * Compact mode: minimal — just the hairline glow.
 */
export default function SteamDivider({ compact = false }: { compact?: boolean }) {
  const rm = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      style={{
        position: "relative",
        height: compact ? 48 : 100,
        overflow: "hidden",
        zIndex: 2,
        borderTop: "0.5px solid transparent",
        backgroundImage: `
          linear-gradient(var(--bg-page), var(--bg-page)),
          linear-gradient(90deg,
            transparent 0%,
            rgba(200,145,58,0.06) 15%,
            rgba(200,145,58,0.22) 50%,
            rgba(200,145,58,0.06) 85%,
            transparent 100%)
        `,
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
      }}
    >
      {/* Vertical gradient */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent, rgba(200,145,58,0.03), transparent)", pointerEvents: "none" }} />

      {/* Central bloom */}
      <motion.div
        style={{ position: "absolute", left: "50%", top: "50%", width: compact ? "45%" : "70%", height: compact ? 40 : 80,
          transform: "translate(-50%, -50%)", borderRadius: "50%",
          background: "rgba(200,145,58,0.07)", filter: "blur(28px)" }}
        animate={rm ? {} : { opacity: [0.18, 0.44, 0.18], scaleX: [1, 1.06, 1], y: [4, -4, 4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Steam particles — only in heavy mode */}
      {!compact && !rm && [24, 38, 50, 62, 76].map((left, i) => (
        <motion.div key={i}
          style={{ position: "absolute", bottom: 6, left: `${left}%`, width: 3, height: 3,
            borderRadius: "50%", background: "rgba(200,145,58,0.35)", filter: "blur(1.5px)" }}
          animate={{ y: [0, -52], opacity: [0, 0.45, 0], scale: [1, 2.2, 0] }}
          transition={{ duration: 3.4, delay: i * 0.5, repeat: Infinity, ease: "easeOut" }}
        />
      ))}

      {/* Ornament */}
      {!compact && (
        <motion.div
          style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", display: "flex", alignItems: "center", gap: 10 }}
          initial={{ opacity: 0 }} animate={{ opacity: 0.22 }} transition={{ duration: 1 }}
        >
          <div style={{ width: 60, height: 1, background: "linear-gradient(90deg, transparent, rgba(200,145,58,0.4))" }} />
          <span className="mono c-gold" style={{ fontSize: 8, letterSpacing: "0.2em", opacity: 0.6 }}>◈</span>
          <div style={{ width: 60, height: 1, background: "linear-gradient(90deg, rgba(200,145,58,0.4), transparent)" }} />
        </motion.div>
      )}
    </div>
  );
}
