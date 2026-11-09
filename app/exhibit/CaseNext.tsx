import Link from "next/link";

const CASES = [
  { key: "taxproof", href: "/work/taxproof", n: "01", t: "TaxProof", k: "Evidence dossier" },
  { key: "retail", href: "/work/retail-demand-intelligence", n: "02", t: "Retail Intelligence", k: "Forecasting instrument" },
  { key: "preventive", href: "/work/preventive-care", n: "03", t: "Preventive Care", k: "Agent theatre" },
] as const;

/** The other two exhibits, so every case study leads somewhere. */
export default function CaseNext({ current }: { current: (typeof CASES)[number]["key"] }) {
  const others = CASES.filter((c) => c.key !== current);
  return (
    <section className="cx" aria-label="More work">
      <p className="ex-mono">Keep exploring</p>
      <div className="cx__grid">
        {others.map((c) => (
          <Link key={c.key} href={c.href} className={`cx__card cx__card--${c.key}`}>
            <span className="cx__n">{c.n}</span>
            <b>{c.t}</b>
            <span className="cx__k">{c.k} →</span>
          </Link>
        ))}
        <Link href="/work/archive" className="cx__card cx__card--archive"><span className="cx__n">+</span><b>Everything else</b><span className="cx__k">The work archive →</span></Link>
      </div>
    </section>
  );
}
