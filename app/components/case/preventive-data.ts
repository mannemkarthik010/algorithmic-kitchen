import raw from "../../data/preventive-case.json";

export type Risk = {
  risk_percentage: number;
  risk_tier: "Low" | "Borderline" | "Intermediate" | "High";
  method: string;
  out_of_validated_age_range: boolean;
  race_approximated_as_white: boolean;
};

export type Patient = {
  id: string; label: string; age: number; sex: "male" | "female"; race: "white" | "black";
  total_cholesterol: number; hdl_cholesterol: number; systolic_bp: number;
  smoker: boolean; diabetes: boolean; bp_meds: boolean;
  risk: Risk; query: string;
};

export type CorpusDoc = { file: string; pages: number; chars: number; text: string; boilerplate: boolean };

export type PreventiveData = {
  meta: { repo: string; repoUrl: string; sha: string; builtAt: string; demoUrl: string; utilsSha256: string };
  worked: { sex: string; race: string; risk: number }[];
  patients: Patient[];
  corpus: CorpusDoc[];
  boilerplate: string;
  stats: { documents: number; boilerplateDocs: number; pagesEach: number };
  pipeline: { k: number; chunkSize: number; chunkOverlap: number; chunkUnit: string; embedding: string; maxRevisions: number; temperature: number };
};

export const preventive = raw as unknown as PreventiveData;
export const SOURCE_URL = `${preventive.meta.repoUrl}/tree/${preventive.meta.sha}`;

/** Bounds from schemas.PatientProfile. */
export const BOUNDS = {
  age: [18, 100], total_cholesterol: [100, 400], hdl_cholesterol: [20, 100], systolic_bp: [90, 250],
} as const;

/**
 * Port of agent._route_after_critique and the revision counter in agent.critique_plan.
 * `verdicts[i]` is the critic's pass/fail on draft i+1. The page lets the visitor choose the verdicts;
 * no model is involved.
 */
export function simulateLoop(verdicts: boolean[], maxRevisions: number) {
  let revisionCount = 0;
  const rounds: { draft: number; pass: boolean; routed: "end" | "revise"; reason: string }[] = [];
  for (let i = 0; i < verdicts.length; i++) {
    const pass = verdicts[i];
    if (!pass) revisionCount += 1;
    let routed: "end" | "revise";
    let reason: string;
    if (pass) { routed = "end"; reason = "critic passed the draft"; }
    else if (revisionCount > maxRevisions) { routed = "end"; reason = `revision count ${revisionCount} is above the cap of ${maxRevisions}`; }
    else { routed = "revise"; reason = `revision count ${revisionCount} is within the cap of ${maxRevisions}`; }
    rounds.push({ draft: i + 1, pass, routed, reason });
    if (routed === "end") break;
  }
  const last = rounds[rounds.length - 1];
  const passed = last?.pass ?? false;
  const revisionsRun = rounds.length - 1;
  const caption = passed ? "Self-critique passed." : `Self-critique did not fully pass after ${revisionCount} revision(s) — showing best draft.`;
  return { rounds, revisionCount, revisionsRun, passed, caption, done: last?.routed === "end" };
}
