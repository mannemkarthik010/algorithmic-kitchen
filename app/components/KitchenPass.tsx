"use client";
import { motion, useReducedMotion } from "framer-motion";
import { resume } from "../data/resume";
import { STATUS } from "../lib/status";
import { StatusChip } from "./StatusChip";
import { useSoundFx } from "../hooks/useSoundFx";
import { EASE } from "../lib/motion";

/* Torn-paper bottom edge: a zig-zag clip-path, generated once. */
const TEETH = 18;
const TORN = (() => {
  const pts = ["0% 0%", "100% 0%"];
  for (let i = TEETH; i >= 0; i--) {
    const x = ((i / TEETH) * 100).toFixed(2);
    pts.push(`${x}% ${i % 2 === 0 ? "100%" : "calc(100% - 7px)"}`);
  }
  return `polygon(${pts.join(", ")})`;
})();

const TILT = [-1.3, 0.9, -0.7, 1.2];

/**
 * The pass — the rail where finished plates and fresh tickets sit.
 * Each ticket is something that is actually on the line right now.
 */
export default function KitchenPass() {
  const rm = useReducedMotion();
  const { play } = useSoundFx();

  return (
    <div style={{ marginBottom: "var(--space-6)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "var(--space-3)" }}>
        <span className="mono c-gold" style={{ opacity: 0.55, fontSize: 11 }}>◉</span>
        <span className="label c-gold">The Pass — tickets up right now</span>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--border), transparent)" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "var(--space-3)", alignItems: "start" }}>
        {resume.kitchenPass.map((t, i) => {
          const st = STATUS[t.status];
          const external = t.href.startsWith("http");
          return (
            <motion.a
              key={t.no}
              href={t.href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              onClick={() => play("/sounds/click.mp3", 0.2)}
              className="ticket-wrap"
              initial={rm ? false : { opacity: 0, y: -22, rotate: 0 }}
              whileInView={{ opacity: 1, y: 0, rotate: rm ? 0 : TILT[i % TILT.length] }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: i * 0.12, ease: EASE }}
              whileHover={rm ? undefined : { rotate: 0, y: -5 }}
            >
              <div className="ticket" style={{ clipPath: TORN }}>
                <span className="ticket__stamp" style={{ color: st.color }}>{st.stamp}</span>

                <p className="ticket__meta">TICKET No. {t.no}</p>
                <p className="ticket__meta" style={{ opacity: 0.55 }}>TABLE · {t.table}</p>
                <div className="ticket__rule" />

                <p className="ticket__dish">{t.dish}</p>
                <ul className="ticket__items">
                  {t.items.map((it) => (
                    <li key={it}><span>1×</span><span>{it}</span></li>
                  ))}
                </ul>

                <div className="ticket__rule" />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <StatusChip status={t.status} size="sm" />
                  <span className="ticket__cta">{t.cta} {external ? "↗" : "→"}</span>
                </div>
              </div>
            </motion.a>
          );
        })}
      </div>
    </div>
  );
}
