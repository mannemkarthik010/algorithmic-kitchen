"use client";
import LightboxGrid, { type LightboxImage } from "@/components/kokonutui/lightbox-grid";

/** The real screens: the three flagship applications as captured, plus the SplitWise beta poster. Kokonut Lightbox Grid (MIT). */
const IMAGES: LightboxImage[] = [
  { src: "/images/projects/taxproof.jpg", width: 1200, height: 750, alt: "TaxProof overview screen: return assurance score, evidence coverage, critical issues and the role switcher", caption: "TaxProof: the overview screen of the live demo" },
  { src: "/images/projects/retail-intel.jpg", width: 1200, height: 750, alt: "Retail Demand Intelligence Platform: eight-week forecast with prediction interval, model backtest comparison", caption: "Retail Demand Intelligence: forecast with prediction interval, on synthetic data" },
  { src: "/images/projects/preventive-care.jpg", width: 1200, height: 676, alt: "Preventive Care Recommendation Agent: patient data form and the educational-demo notice", caption: "Preventive Care: the patient form and the educational-demo notice" },
  { src: "/images/splitwise-pro-receipt.jpg", width: 760, height: 1499, alt: "A receipt-style poster inviting people to beta test SplitWise Pro", caption: "SplitWise Pro: the beta-test poster" },
];

export default function Screens() {
  return (
    <section className="ex-screens" aria-labelledby="ex-screens-h">
      <div className="ex-screens__head">
        <p className="ex-mono">(01) &nbsp;The real screens</p>
        <h2 id="ex-screens-h">Captured from the running applications. <em>Select one to enlarge.</em></h2>
      </div>
      <LightboxGrid images={IMAGES} className="ex-screens__grid" />
    </section>
  );
}
