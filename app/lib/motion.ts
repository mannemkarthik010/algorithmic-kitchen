/**
 * motion.ts — Single source of truth for all animation constants.
 * Import from here. Never define easing inline.
 */

// The one easing curve used everywhere
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Duration scale — premium sites feel calm, not hyperactive
export const DUR = {
  instant:  0.12,   // hover state changes
  fast:     0.22,   // micro-interactions (hover, tap)
  normal:   0.45,   // card reveals, badge pops
  moderate: 0.65,   // section elements, modal body
  slow:     0.88,   // modal open, major transitions
  cinematic: 1.4,   // hero reveal, curtain
  drift:    6.0,    // steam, fog, floating objects
} as const;

// Pre-built transition objects for common uses
export const t = {
  fast:     { duration: DUR.fast,     ease: EASE },
  normal:   { duration: DUR.normal,   ease: EASE },
  moderate: { duration: DUR.moderate, ease: EASE },
  slow:     { duration: DUR.slow,     ease: EASE },
  cinematic:{ duration: DUR.cinematic,ease: EASE },
} as const;

// Viewport margin for whileInView — same everywhere
export const VIEWPORT = { once: true, margin: "-40px" } as const;

// Stagger timing
export const STAGGER = 0.09;
