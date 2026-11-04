import raw from "../../data/retail-case.json";

export type Model = "seasonal_naive" | "holt_winters" | "global_gbm";
export const MODELS: Model[] = ["seasonal_naive", "holt_winters", "global_gbm"];
export const MODEL_LABEL: Record<Model, string> = {
  seasonal_naive: "Seasonal-naive",
  holt_winters: "Holt-Winters",
  global_gbm: "Gradient boosting",
};

export interface Point { d: string; v: number; h: boolean; p: boolean }
export interface Fc { d: string; v: number; lo: number; hi: number }
export interface Series {
  id: string; store: number; dept: number; why: string;
  selected: Model; modelUsed: Model;
  history: Point[]; forecast: Fc[];
  wapeByModel: Record<Model, { wape: number }>;
  cutoffs: ({ cutoff: string } & Record<Model, number>)[];
}
export interface Retrain {
  series: string; deployed_model: Model; best_model_at_latest_cutoff: Model; action: "kept_same" | "reselected";
  trigger: { latest_wape: number; prior_avg_wape: number; delta: number };
  latest_cutoff_wape_by_candidate: Record<Model, number>;
}
export interface RetailData {
  source: { repo: string; commit: string; files: string[]; note: string };
  events: { disruption_store: number; disruption_dept: number; disruption_start: string; disruption_weeks: number; covid_start: string; covid_crash_end: string; covid_recover_end: string; n_stores: number; n_depts: number; n_weeks: number; n_rows: number };
  leaderboard: { model: Model; meanWape: number; medianWape: number; stdWape: number; wins: number }[];
  fleet: { series: string; model: Model; wape: number }[];
  coverage: { nominal: number; overall: number; n: number; cutoff: string; byModel: Record<Model, number> };
  importance: { feature: string; value: number }[];
  monitoring: { cutoff: string; wape: number; drift: boolean }[];
  alerts: { series: string; model: Model; latest_wape: string; prior_avg_wape: string; delta: string }[];
  retraining: Retrain[];
  agent: { cases: number; passed: number; knownLimitations: number; byCategory: Record<string, { n: number; passed: number }> };
  trace: { question: string; backend: string; step: { reasoning: string; tool: string; args: Record<string, number> }; result: { series: string; model_used: string }; answer: string[] };
  series: Series[];
}

export const retail = raw as unknown as RetailData;
export const SOURCE_URL = `https://github.com/${retail.source.repo}/tree/${retail.source.commit}`;
