"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeader } from "./ui";
import PlayZone from "./PlayZone";
import LiveKitchen from "./LiveKitchen";
import ReadingRoom from "./ReadingRoom";
import FooterPlay from "./FooterPlay";
import { OPEN_PLAYGROUND, PLAYGROUND_IDS } from "../lib/events";

/** Everything fun lives here, collapsed by default so the main page stays short and focused. */
export default function Playground() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_PLAYGROUND, onOpen);
    // Deep links such as /#reading open the playground and scroll to the target.
    const id = window.location.hash.slice(1);
    if (id && PLAYGROUND_IDS.includes(id)) {
      queueMicrotask(() => setOpen(true));
      setTimeout(() => document.getElementById(id)?.scrollIntoView(), 700);
    }
    return () => window.removeEventListener(OPEN_PLAYGROUND, onOpen);
  }, []);

  return (
    <section id="playground" style={{ position: "relative", padding: "var(--space-6) 0" }}>
      <div className="container">
        <SectionHeader
          index="06"
          label="Playground"
          title={<>The <span className="t-grad">Playground</span></>}
          subtitle="The fun side of the kitchen: two games, what I'm cooking now, my reading room, and a dosa illusion. Optional — the work is above."
        />
        <div className="fw-more" style={{ marginTop: 0 }}>
          <button type="button" className="pill-cta" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? "Close the playground ↑" : "Open the playground ↓"}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="play"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
          >
            <PlayZone />
            <LiveKitchen />
            <ReadingRoom />
            <FooterPlay />
            <div className="fw-more">
              <button type="button" className="fw-ghost" onClick={() => { setOpen(false); document.getElementById("playground")?.scrollIntoView(); }}>Close the playground ↑</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
