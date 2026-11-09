import { preventive } from "../../components/case/preventive-data";

/** Stage text for Preventive Care, kept word for word from the case study so every surface says the same thing. */
const P = preventive.pipeline;
export const STAGES = [
  { n: "01", t: "Risk", lane: "Code", runs: "computed here", stat: "4 / 4", statL: "worked-example cases reproduced", d: "The 2013 ACC/AHA Pooled Cohort Equations, written as plain Python. The language model never does this arithmetic; it receives the finished percentage and tier." },
  { n: "02", t: "Retrieve", lane: "Vector search", runs: "not run on this page", stat: `top ${P.k}`, statL: `chunks of ${P.chunkSize} ${P.chunkUnit}, ${P.embedding} embeddings`, d: "A query built from the patient's profile and risk tier searches a Chroma index. The page does not run the retriever, so it shows no retrieved passages." },
  { n: "03", t: "Draft", lane: "LLM", runs: "not run on this page", stat: "4 sections", statL: "screening, lifestyle, medication, follow-up", d: "The model writes a structured care plan, instructed to ground it only in the retrieved excerpts. The output has a fixed schema, so it cannot arrive as free text." },
  { n: "04", t: "Critique", lane: "LLM", runs: "not run on this page", stat: "4-point", statL: "rubric: complete, grounded, tailored, safe", d: "A second pass scores the draft against the rubric and returns a verdict with feedback. It is another model call, so it can miss what the drafter gets wrong." },
  { n: "05", t: "Route", lane: "Code", runs: "the real routing logic, driven by verdicts you choose", stat: `≤ ${P.maxRevisions}`, statL: "revisions, then the last draft is delivered", d: "Pass: stop. Fail: send back with the feedback, at most twice. After the cap, the last draft is delivered with a status line." },
] as const;

export const LIMITS = [
  "An educational prototype, not a validated clinical tool. No clinician has reviewed its output, and nothing here is medical advice.",
  "The knowledge base is 12 mock one-page PDFs. Ten contain the same generic sentence and two are one-line stubs, so the plan cannot be better grounded than that.",
  "The retrieved sources are listed beside the plan, but individual recommendations are not linked to a source.",
  "The repository has no test suite and no plan-quality evaluation. The only verification is the risk function against its published worked example.",
] as const;

/** Critic scenarios for the replay: the verdict on each draft. The router logic that follows them is the real one. */
export const SCENARIOS = [
  { id: "pass", label: "Passes first time", verdicts: [true, false, false] },
  { id: "once", label: "Fails once", verdicts: [false, true, false] },
  { id: "never", label: "Never passes", verdicts: [false, false, false] },
] as const;
