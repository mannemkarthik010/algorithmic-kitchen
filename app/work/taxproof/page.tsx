import type { Metadata } from "next";
import TaxProofCase from "../../components/case/TaxProofCase";

export const metadata: Metadata = {
  title: "TaxProof: case study | Karthik Mannem",
  description:
    "An evidence graph that traces every tax-return number to its rule, extracted value and document page, a hash-chained audit log, server-side roles and a guarded AI reviewer. Built on a fictional case-study packet.",
  alternates: { canonical: "/work/taxproof" },
};

export default function Page() {
  return <TaxProofCase />;
}
