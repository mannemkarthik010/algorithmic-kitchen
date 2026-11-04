import raw from "../../data/taxproof-case.json";

export type NodeKind = "doc" | "evidence" | "line";
export type FlagType = "duplicate" | "wrong" | "ok" | "note";

export type TNode = {
  id: string;
  kind: NodeKind;
  label: string;
  value?: number | null;
  unit?: "usd" | "mi";
  // line
  form?: string;
  rule?: string;
  ruleText?: string;
  inputs?: string[];
  sources?: string[];
  note?: string | null;
  core?: boolean;
  // evidence
  field?: string;
  doc?: string;
  page?: number | null;
  docTitle?: string;
  textAsRead?: string;
  confidence?: number;
  members?: { id: string; doc: string; value: number }[];
  // doc
  docType?: string;
  pageCount?: number;
  fileName?: string;
  received?: string;
  heading?: string | null;
};

export type TEdge = { from: string; to: string; kind: "read" | "feeds" | "corroborates" | "duplicate" | "excluded"; label?: string };
export type TFlag = { type: FlagType; title: string; text: string };

export type Trace = {
  id: string;
  tab: string;
  question: string;
  summary: string;
  nodes: TNode[];
  edges: TEdge[];
  flags: Record<string, TFlag>;
  engine: { label: string; value: number; unit: "usd" | "mi" };
  independent: { label: string; value: number; unit: "usd" | "mi"; how: string; derived: boolean };
  effect: { text: string; source: string };
  carry: Record<string, { engine: number; independent: number; how: string }>;
};

export type ChainEvent = {
  engagement: string; at: string; actor: string; role: string; action: string; target: string;
  payload: Record<string, unknown>; prev: string; hash: string;
};

export type TaxProofData = {
  meta: {
    repo: string; repoUrl: string; sha: string; builtAt: string; packetSha256: string; packetName: string; packetVersion: string;
    counts: { documents: number; extractedValues: number; returnVersions: { version: string; lines: number; computedAt: string }[] };
    v3: { trigger: string; federalBalanceDue: number; federalTotalTax: number; federalAgi: number };
  };
  traces: Trace[];
  chain: ChainEvent[];
};

export const taxproof = raw as unknown as TaxProofData;
export const SOURCE_URL = `${taxproof.meta.repoUrl}/tree/${taxproof.meta.sha}`;
export const DEMO_URL = "https://taxproof-web.vercel.app";

export const fmt = (v: number | null | undefined, unit: "usd" | "mi" = "usd") =>
  v == null ? "" : unit === "mi" ? `${Math.round(v).toLocaleString("en-US")} mi` : `$${Math.round(v).toLocaleString("en-US")}`;
