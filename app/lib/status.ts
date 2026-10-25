/**
 * Kitchen-vocabulary status for projects and tickets.
 *   live    — deployed and usable right now
 *   beta    — deployed, still looking for testers / not final
 *   cooking — actively being built
 *   review  — submitted, waiting on someone else (e.g. an open-source PR)
 *   plated  — finished; no longer being worked on
 */
export type Status = "live" | "beta" | "cooking" | "review" | "plated";

export const STATUS: Record<Status, { label: string; stamp: string; color: string; pulse?: boolean }> = {
  live:    { label: "Live",        stamp: "SERVED",       color: "#6FCF7C" },
  beta:    { label: "Open beta",   stamp: "HELP ME TEST", color: "#7AA2FF" },
  cooking: { label: "On the line", stamp: "FIRED",        color: "#E4AD52", pulse: true },
  review:  { label: "On the pass", stamp: "IN REVIEW",    color: "#C8913A" },
  plated:  { label: "Plated",      stamp: "PLATED",       color: "#9A8A70" },
};
