"use client";
import { useEffect, useRef } from "react";

interface Ember { x: number; y: number; vx: number; vy: number; life: number; r: number }

/** Warm embers drift off the pointer. Fine pointers only; off for reduced-motion. */
export default function EmberCursor() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = ref.current;
    if (!fine || reduce || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, raf = 0, last = 0, lastSpawn = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const embers: Ember[] = [];

    const resize = () => {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastSpawn < 28) return;
      lastSpawn = now;
      embers.push({
        x: e.clientX + (Math.random() - 0.5) * 6, y: e.clientY + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 0.35, vy: -0.25 - Math.random() * 0.55,
        life: 1, r: 1 + Math.random() * 1.8,
      });
      if (embers.length > 60) embers.shift();
    };

    const frame = (t: number) => {
      const dt = Math.min((t - last) / 16.7, 3) || 1;
      last = t;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.life -= 0.016 * dt;
        if (e.life <= 0) { embers.splice(i, 1); continue; }
        e.x += e.vx * dt + Math.sin((t + i * 90) / 300) * 0.15;
        e.y += e.vy * dt;
        const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 5);
        g.addColorStop(0, `rgba(255,200,110,${0.55 * e.life})`);
        g.addColorStop(0.4, `rgba(228,140,50,${0.22 * e.life})`);
        g.addColorStop(1, "rgba(200,90,20,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 5, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 150, pointerEvents: "none" }} />;
}
