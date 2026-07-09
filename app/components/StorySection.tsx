"use client";
import { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * StorySection — wraps each major section with a cinematic scroll reveal.
 * Each section arrives as its own scene in the narrative.
 */
export function StorySection({ children, id }: { children: ReactNode; id?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      id={id}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: "relative" }}
    >
      {children}
    </motion.div>
  );
}
