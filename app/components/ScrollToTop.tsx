"use client";

import { useEffect } from "react";

/**
 * ScrollToTop — forces page to top on every mount.
 *
 * Three-layer approach:
 * 1. history.scrollRestoration = "manual"  →  disables browser scroll restore
 * 2. window.scrollTo(0, 0)                 →  immediate synchronous reset
 * 3. requestAnimationFrame scrollTo        →  catches any post-hydration reflow
 */
export default function ScrollToTop() {
  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    // Synchronous scroll — runs before browser paints
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });

    // rAF catches reflows triggered by Framer Motion whileInView observers
    const id = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });

    return () => cancelAnimationFrame(id);
  }, []);

  return null;
}
