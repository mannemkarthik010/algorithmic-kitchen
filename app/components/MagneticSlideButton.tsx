"use client";
import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import SlideTextButton from "@/components/kokonutui/slide-text-button";

/**
 * One primary call to action. Kokonut's slide-text button (MIT) supplies the label swap; a Motion spring pulls it a few
 * pixels toward a nearby pointer. The pull is off for touch, keyboard focus and reduced motion, and the link underneath
 * is an ordinary anchor, so nothing depends on the effect.
 */
export default function MagneticSlideButton({ href, text, hoverText, className }: { href: string; text: string; hoverText?: string; className?: string }) {
  const rm = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.4 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.4 });

  const onMove = (e: React.PointerEvent) => {
    if (rm || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    x.set(Math.max(-10, Math.min(10, dx * 0.18)));
    y.set(Math.max(-8, Math.min(8, dy * 0.25)));
  };
  const reset = () => { x.set(0); y.set(0); };

  return (
    <motion.div ref={ref} className="mag" style={{ x, y }} onPointerMove={onMove} onPointerLeave={reset}>
      <SlideTextButton href={href} text={text} hoverText={hoverText} animateIn={false} className={`mag__btn ${className ?? ""}`} />
    </motion.div>
  );
}
