/**
 * Status for projects and tickets.
 *   live    — deployed and usable right now
 *   beta    — deployed, still looking for testers / not final
 *   cooking — actively being built (shown as In progress)
 *   review  — submitted, waiting on someone else (e.g. an open-source PR)
 *   plated  — finished; no longer being worked on (shown as Archived)
 */
export type Status = "live" | "beta" | "cooking" | "review" | "plated";

export const STATUS: Record<Status, { label: string; stamp: string; color: string; pulse?: boolean }> = {
  live:    { label: "Live",        stamp: "LIVE",       color: "#70D5B3" },
  beta:    { label: "Open beta",   stamp: "OPEN BETA", color: "#7AA2FF" },
  cooking: { label: "In progress", stamp: "BUILDING",        color: "#E6946F", pulse: true },
  review:  { label: "In review",   stamp: "IN REVIEW",    color: "#D87B55" },
  plated:  { label: "Archived",    stamp: "ARCHIVED",       color: "#9A8A70" },
};
