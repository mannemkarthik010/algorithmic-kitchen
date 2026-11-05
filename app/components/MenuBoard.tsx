"use client";
import { motion, useReducedMotion } from "motion/react";
import { resume, Project } from "../data/resume";
import { STATUS, Status } from "../lib/status";
import { EASE } from "../lib/motion";

const COURSES: { status: Status; title: string; note: string }[] = [
  { status: "cooking", title: "In progress",       note: "being built now" },
  { status: "live",    title: "Live",              note: "running today" },
  { status: "beta",    title: "Open beta",         note: "tell me what is off" },
  { status: "plated",  title: "Archive",           note: "finished, no longer worked on" },
];

/** Projects as a plain list: name ........ category, one line beneath. */
export default function MenuBoard({ onOpen }: { onOpen: (p: Project) => void }) {
  const rm = useReducedMotion();
  const order = COURSES.flatMap((c) => resume.projects.filter((p) => p.status === c.status).map((p) => p.slug));

  return (
    <div className="menu-board">
      <div className="menu-board__frame">
        <p className="menu-board__crest">ALL PROJECTS</p>
        <p className="menu-board__sub">Karthik Mannem · Los Angeles</p>

        {COURSES.map((course) => {
          const items = resume.projects.filter((p) => p.status === course.status);
          if (items.length === 0) return null;
          return (
            <section key={course.status} className="menu-course">
              <h3 className="menu-course__title">
                {course.title}
                <span style={{ color: STATUS[course.status].color }}> ●</span>
                <em>{course.note}</em>
              </h3>

              {items.map((p) => {
                const [name, ...rest] = p.title.split(" — ");
                const delay = rm ? 0 : (order.indexOf(p.slug) + 1) * 0.06;
                return (
                  <motion.button
                    key={p.slug}
                    type="button"
                    className="menu-row"
                    onClick={() => onOpen(p)}
                    initial={rm ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay, ease: EASE }}
                  >
                    <span className="menu-row__line">
                      <span className="menu-row__name">{name}</span>
                      <span className="menu-row__dots" aria-hidden="true" />
                      <span className="menu-row__tag">{p.category}</span>
                    </span>
                    <span className="menu-row__desc">
                      {rest.length > 0 && <>{rest.join(", ")} · </>}
                      {p.finalTaste}
                    </span>
                  </motion.button>
                );
              })}
            </section>
          );
        })}

        <p className="menu-board__foot">
          {resume.projects.length} projects · each opens its write-up
        </p>
      </div>
    </div>
  );
}
