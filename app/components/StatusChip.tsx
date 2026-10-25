"use client";
import { STATUS, Status } from "../lib/status";

export function StatusChip({ status, size = "md" }: { status: Status; size?: "sm" | "md" }) {
  const s = STATUS[status];
  return (
    <span
      className="mono"
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: size === "sm" ? "2px 8px" : "3px 10px",
        borderRadius: 999,
        border: `1px solid ${s.color}55`,
        background: `${s.color}14`,
        color: s.color,
        fontSize: size === "sm" ? 9 : 10,
        letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap",
      }}
    >
      <span
        aria-hidden="true"
        className={s.pulse ? "status-dot status-dot--pulse" : "status-dot"}
        style={{ background: s.color }}
      />
      {s.label}
    </span>
  );
}
