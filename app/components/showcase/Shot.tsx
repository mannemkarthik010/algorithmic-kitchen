"use client";
import { useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useScroll, useSpring, useTransform, useReducedMotion } from "motion/react";

export type ShotData = { src: string; width: number; height: number; alt: string; host: string };

/** Real product screenshot in a browser frame: slow scroll parallax and a gentle pointer tilt. Links to the live demo. */
export default function Shot({ shot, href, label, priority = false, sizes = "(max-width: 1100px) 94vw, 1180px" }: { shot: ShotData; href: string | null; label: string; priority?: boolean; sizes?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rm = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-3%", "3%"]);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotX = useSpring(useTransform(py, [-0.5, 0.5], [3.5, -3.5]), { stiffness: 130, damping: 18 });
  const rotY = useSpring(useTransform(px, [-0.5, 0.5], [-5, 5]), { stiffness: 130, damping: 18 });

  const onMove = (e: React.PointerEvent) => {
    if (rm || e.pointerType === "touch" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { px.set(0); py.set(0); };

  const frame = (
    <motion.div className="fw-shot__frame" ref={ref} style={rm ? undefined : { rotateX: rotX, rotateY: rotY }}>
      <div className="fw-shot__bar" aria-hidden="true"><i /><i /><i /><span>{shot.host}</span></div>
      <div className="fw-shot__view" style={{ aspectRatio: `${shot.width} / ${shot.height}` }}>
        <motion.div className="fw-shot__img" style={rm ? undefined : { y }}>
          <Image src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} sizes={sizes} priority={priority} />
        </motion.div>
        {href && <span className="fw-shot__cta" aria-hidden="true">{label} ↗</span>}
      </div>
    </motion.div>
  );

  return href ? (
    <a className="fw-shot" href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label}: ${shot.host}`} onPointerMove={onMove} onPointerLeave={onLeave}>{frame}</a>
  ) : (
    <div className="fw-shot" onPointerMove={onMove} onPointerLeave={onLeave}>{frame}</div>
  );
}
