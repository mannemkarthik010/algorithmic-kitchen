import type { Metadata } from "next";
import RetailCase from "../../components/case/RetailCase";

export const metadata: Metadata = {
  title: "Retail Demand Intelligence Platform: case study | Karthik Mannem",
  description:
    "Per-series demand forecasting with measured prediction-interval coverage, monitoring that closes the loop, and an auditable tool-calling agent. Built on a synthetic retail dataset, with every number sourced from the repository.",
  alternates: { canonical: "/work/retail-demand-intelligence" },
};

export default function Page() {
  return <RetailCase />;
}
