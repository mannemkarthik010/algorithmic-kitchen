"use client";
import RealOrFake from "./RealOrFake";
import BuildPlate from "./BuildPlate";
import { SectionHeader } from "./ui";

export default function PlayZone() {
  return (
    <section id="play" style={{ position: "relative", padding: "var(--space-6) 0" }}>
      <div className="container">
        <SectionHeader
          index="03½"
          label="Play"
          title={<>Taste-test <span className="c-gold">the kitchen</span></>}
          subtitle="Two quick games — see if you can spot what's real, then build a plate of projects that fits what you're hiring for."
        />
        <div className="play-grid">
          <RealOrFake />
          <BuildPlate />
        </div>
      </div>
    </section>
  );
}
