import type { Metadata } from "next";
import PreventiveCase from "../../components/case/PreventiveCase";

export const metadata: Metadata = {
  title: "Preventive Care Recommendation Agent: case study | Karthik Mannem",
  description:
    "A LangGraph agent that computes cardiovascular risk in code, retrieves guideline passages, drafts a structured plan and sends it through a critic loop. An educational prototype on a mock corpus, with what is and is not verified stated plainly.",
  alternates: { canonical: "/work/preventive-care" },
};

export default function Page() {
  return <PreventiveCase />;
}
