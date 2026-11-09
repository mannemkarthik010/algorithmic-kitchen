"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "motion/react";

/**
 * Link to a case study. A plain click plays a short exit (the showcase fades and its preview scales up)
 * and then navigates with the router, so the browser history and the back button behave normally.
 * Modified clicks, reduced motion, and no-JS fall back to an ordinary link.
 */
export default function CaseLink({ href, className, children, onLeave }: { href: string; className?: string; children: React.ReactNode; onLeave?: () => void }) {
  const router = useRouter();
  const rm = useReducedMotion();
  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        if (rm || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        onLeave?.();
        window.setTimeout(() => router.push(href), 340);
      }}
    >
      {children}
    </Link>
  );
}
