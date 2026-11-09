"use client";
import { useMemo, useState } from "react";
import AIAgentLanes, { type AgentLane } from "@/components/kokonutui/ai-agent-lanes";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { preventive } from "./preventive-data";

/**
 * The agent's real stages drawn as lanes (Kokonut UI "AI Agent Lanes", MIT, customised). The horizontal axis counts
 * pipeline stages. It is a schematic of order and responsibility: bar widths are not durations, the risk figure is
 * the repository code's real output for the chosen sample patient, and no retrieved text or model output appears.
 */
export default function PreventiveLanes() {
  const [pid, setPid] = useState(preventive.patients[1].id);
  const pt = preventive.patients.find((p) => p.id === pid)!;
  const P = preventive.pipeline;

  const lanes: AgentLane[] = useMemo(() => [
    {
      id: "graph", name: "Graph",
      steps: [
        { tool: "think", label: "Validate the profile", start: 0, end: 1, inputs: "Nine fields: age, sex, race group, total cholesterol, HDL, systolic BP, smoker, diabetes, BP medication.", outputs: "A typed PatientProfile, or a rejected request.", limits: "Range checks only. It does not test that the values are plausible together." },
        { tool: "read", label: "Route after the critic", start: 7.5, end: 8.5, inputs: "The critic's verdict and the revision counter.", outputs: `Stop on a pass. On a fail, revise while the counter is at most ${P.maxRevisions}.`, limits: "After the cap the last draft is delivered, and the status line can read one revision too high." },
        { tool: "read", label: "Deliver", start: 10.5, end: 11.5, inputs: "Risk result, plan, critic status and the five retrieved sources.", outputs: "Risk and tier, warnings, the four plan sections, and the sources with file and page.", limits: "Sources are listed beside the plan. Individual recommendations are not linked to one." },
      ],
    },
    {
      id: "risk", name: "Risk (code)", summary: `${pt.risk.risk_percentage}% · ${pt.risk.risk_tier}`,
      steps: [
        { tool: "read", label: "Pooled Cohort Equations", start: 1, end: 2, result: `${pt.risk.risk_percentage}%, tier ${pt.risk.risk_tier}`, inputs: "The validated profile.", outputs: "10-year ASCVD risk, a tier, and flags for age range and race approximation. Computed by the repository's code for this sample.", limits: "Derived for White and African American adults aged 40 to 79. Other inputs are flagged or approximated." },
      ],
    },
    {
      id: "retriever", name: "Retriever",
      steps: [
        { tool: "search", label: `Top ${P.k} chunks`, start: 2, end: 4, result: "Chunks not shown", inputs: pt.query, outputs: `${P.k} chunks with file and page, from a Chroma index.`, limits: "Ranking comes from embeddings this page does not run. The index is 12 mock PDFs, ten with the same sentence, so the chunks are close to interchangeable." },
      ],
    },
    {
      id: "drafter", name: "Drafter (LLM)",
      steps: [
        { tool: "write", label: "Structured care plan", start: 4, end: 6, result: "Plan not shown", inputs: "The patient line, risk and tier, and the five excerpts.", outputs: "CarePlan: screening, lifestyle, pharmacological, follow-up.", limits: "Grounding is instructed in the prompt, not verified recommendation by recommendation. Output is not shown here." },
        { tool: "write", label: "Revise, only if failed", start: 8.5, end: 10, result: "Runs only when the critic fails a draft", inputs: "The draft plus the critic's feedback.", outputs: "A revised CarePlan.", limits: `At most ${P.maxRevisions} revisions.` },
      ],
    },
    {
      id: "critic", name: "Critic (LLM)",
      steps: [
        { tool: "think", label: "Score against the rubric", start: 6, end: 7.5, result: "Verdict not shown", inputs: "The draft and the same excerpts.", outputs: "passes (true or false) and feedback.", limits: "Rubric: complete, grounded, tailored to the tier, nothing contraindicated. It is another model call and can miss what the drafter gets wrong." },
        { tool: "think", label: "Re-check, only if revised", start: 10, end: 10.5, inputs: "The revised draft.", outputs: "A new verdict.", limits: "Loops until a pass or the cap." },
      ],
    },
  ], [pt, P]);

  return (
    <div className="pl">
      <Tabs value={pid} onValueChange={setPid} className="pl__tabs">
        <TabsList className="pl__list" aria-label="Choose a sample patient">
          {preventive.patients.map((p) => (
            <TabsTrigger key={p.id} value={p.id} className="pl__tab">{p.age}{p.sex === "female" ? "F" : "M"} · {p.risk.risk_tier} risk</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="dark">
        <AIAgentLanes
          key={pid}
          task={`Pipeline stages for a ${pt.age}-year-old ${pt.sex}, ${pt.risk.risk_percentage}% 10-year risk`}
          lanes={lanes}
          answer=""
          className="pl__lanes max-w-none dark:bg-[#12161A] dark:ring-[rgba(237, 235, 228,0.14)]"
        />
      </div>
      <p className="cs-small cs-small--light">A schematic of order and responsibility. Bars are stages, not durations. The risk number is the repository code&apos;s output for an invented patient. Retrieved text, drafts and verdicts are not shown because none were captured.</p>
    </div>
  );
}
