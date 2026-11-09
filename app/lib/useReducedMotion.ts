import { useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  const m = window.matchMedia("(prefers-reduced-motion: reduce)");
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

/**
 * The system reduced-motion setting, safe to use in anything that renders on the server.
 * During hydration it returns false (what the server rendered) and switches to the real value straight after, so there is
 * no hydration mismatch. Motion's own hook already reports the real value on the first client render.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
}
