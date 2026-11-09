"use client";

import { useEffect } from "react";

/**
 * On a fresh page the view starts at the top. When the URL carries a #hash (the nav's Work link, the case studies' back
 * link, the footer), it starts at that section instead. The layout keeps settling for a moment after hydration (fonts,
 * the lazily loaded exhibits), so a hash scroll is repeated briefly, and stops the instant the visitor scrolls.
 */
export default function ScrollToTop() {
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";

    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
      const raf = requestAnimationFrame(() => window.scrollTo(0, 0));
      return () => cancelAnimationFrame(raf);
    }

    let stopped = false;
    const go = () => { if (!stopped) document.getElementById(hash)?.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" }); };
    go();
    const timers = [80, 250, 600, 1200].map((ms) => window.setTimeout(go, ms));
    const stop = () => { stopped = true; timers.forEach(clearTimeout); };
    const events = ["wheel", "touchstart", "keydown", "mousedown"] as const;
    events.forEach((e) => window.addEventListener(e, stop, { once: true, passive: true }));
    return () => { stop(); events.forEach((e) => window.removeEventListener(e, stop)); };
  }, []);

  return null;
}
