"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { contributions, Contribution } from "../data/contributions";
import { SectionHeader, Badge, GlowBlob, Stagger, Item } from "./ui";
import { useSoundFx } from "../hooks/useSoundFx";
import ContributionModal from "./ContributionModal";

export default function Contributions() {
  const [active, setActive] = useState<Contribution | null>(null);
  const { play } = useSoundFx();

  return (
    <section id="contributions" className="s-warm" style={{ position: "relative" }}>
      <GlowBlob size={420} color="rgba(200,145,58,0.05)" style={{ top: "10%", right: -100 }} />

      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <SectionHeader
          index="§ 05.7"
          label="Open Source"
          title={<>Beyond the <span className="t-grad">Day Job</span></>}
          subtitle="Real contributions to real projects — including the writeups, the mistakes, and the proof that the fix actually works."
        />

        <Stagger style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {contributions.map((c) => (
            <Item key={c.slug}>
              <motion.div
                whileHover={{ y: -3, borderColor: "var(--border-hover)" }}
                className="card"
                style={{ padding: "var(--space-4)", cursor: "pointer", transition: "border-color 0.22s" }}
                onClick={() => { play("/sounds/click.mp3", 0.2); setActive(c); }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "var(--space-1)" }}>
                      <Badge>{c.repo}</Badge>
                      <Badge style={{ opacity: 0.6 }}>★ {c.stars}</Badge>
                      <Badge style={{ opacity: 0.6 }}>{c.prStatus === "merged" ? "Merged" : "Approved · Open"}</Badge>
                    </div>
                    <p className="heading-md c-cream" style={{ marginBottom: 6, lineHeight: 1.25 }}>{c.title}</p>
                    <p className="body-sm c-muted" style={{ lineHeight: 1.65, marginBottom: "var(--space-1)" }}>{c.excerpt}</p>
                    <p className="mono c-gold" style={{ fontSize: 11, opacity: 0.7 }}>PR #{c.prNumber} · {c.diffStat}</p>
                  </div>
                  <span className="mono c-gold" style={{ fontSize: 11, opacity: 0.55, flexShrink: 0, whiteSpace: "nowrap" }}>Read the writeup →</span>
                </div>
              </motion.div>
            </Item>
          ))}
        </Stagger>
      </div>

      <ContributionModal contribution={active} onClose={() => setActive(null)} />
    </section>
  );
}
