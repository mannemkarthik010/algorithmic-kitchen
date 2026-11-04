"use client";
import { useEffect, useRef, useState } from "react";

/** Measures an element's width so SVG charts can draw crisp, fixed-size text at any viewport. */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    queueMicrotask(() => setW(el.clientWidth));
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export function niceStep(raw: number) {
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / p;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
}

export const money = (v: number) => (v >= 1000 ? `$${Math.round(v / 1000)}K` : `$${Math.round(v)}`);
export const moneyFull = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const dateLabel = (iso: string) => `${MON[Number(iso.slice(5, 7)) - 1]} ${Number(iso.slice(8, 10))}, ${iso.slice(0, 4)}`;
export const monthIdx = (iso: string) => Number(iso.slice(5, 7)) - 1;
