"use client";
import { useState } from "react";
import { Contribution } from "../data/contributions";
import CodeEvolution from "./CodeEvolution";
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
          index="02"
          label="Open Source"
          align="split"
          title={<>Code <span className="t-grad">evolution</span></>}
          subtitle="Four pull requests, followed from problem to outcome. Status and diffs come straight from GitHub."
        />

        <CodeEvolution onOpenWriteup={(c) => { play("/sounds/click.mp3", 0.2); setActive(c); }} />
      </div>

      <ContributionModal contribution={active} onClose={() => setActive(null)} />
    </section>
  );
}
