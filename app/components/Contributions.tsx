"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { contributions, Contribution } from "../data/contributions";
import { SectionHeader } from "./ui";
import { useSoundFx } from "../hooks/useSoundFx";
import ContributionModal from "./ContributionModal";

export default function Contributions() {
  const [active, setActive] = useState<Contribution | null>(null);
  const { play } = useSoundFx();

  return (
    <section id="contributions" style={{ position: "relative", padding: "var(--space-5) 0 var(--space-6)" }}>

      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <SectionHeader
          index="03"
          label="Open Source"
          align="split"
          title={<>Open-Source <span className="t-grad">Contributions</span></>}
          subtitle="Pull requests to open-source projects, with their real status (merged, open, or closed) and what each one taught me."
        />

        <div className="oss-list">
          {contributions.map((c, i) => (
            <motion.button
              key={c.slug}
              type="button"
              className="oss-row"
              initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5, delay: i * 0.05 }}
              onClick={() => { play("/sounds/click.mp3", 0.2); setActive(c); }}
            >
              <span className="oss-row__meta">
                <span className={`oss-status oss-status--${c.prStatus}`}>{c.statusLabel}</span>
                <span className="oss-row__repo">{c.repo}</span>
                <span className="oss-row__pr">PR #{c.prNumber} · {c.diffStat}</span>
              </span>
              <span className="oss-row__body">
                <span className="oss-row__title">{c.title}</span>
                <span className="oss-row__ex">{c.excerpt}</span>
                <span className="oss-row__go">Read the write-up →</span>
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      <ContributionModal contribution={active} onClose={() => setActive(null)} />
    </section>
  );
}
