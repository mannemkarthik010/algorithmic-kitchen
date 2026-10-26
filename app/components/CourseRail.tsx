"use client";
import { useEffect, useState } from "react";
import { scrollToId } from "../lib/events";

const COURSES: [string, string][] = [
  ["hero", "Top"],
  ["projects", "Projects"],
  ["experience", "Experience"],
  ["contributions", "Open source"],
  ["expertise", "Skills"],
  ["about", "About"],
  ["playground", "Playground"],
  ["contact", "Contact"],
];

/** A "tasting menu" progress rail on the right edge — shows which course you're on. */
export default function CourseRail() {
  const [active, setActive] = useState("hero");
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShown(window.scrollY > window.innerHeight * 0.6);
      const mid = window.innerHeight * 0.4;
      let cur = COURSES[0][0];
      for (const [id] of COURSES) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= mid) cur = id;
      }
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`course-rail${shown ? " is-shown" : ""}`} aria-label="Sections">
      {COURSES.map(([id, label], i) => (
        <button
          key={id}
          type="button"
          className={`course-rail__dot${active === id ? " is-active" : ""}`}
          onClick={() => scrollToId(id)}
          aria-label={label}
          aria-current={active === id ? "true" : undefined}
        >
          <span className="course-rail__label"><i>{String(i + 1).padStart(2, "0")}</i> {label}</span>
        </button>
      ))}
    </nav>
  );
}
