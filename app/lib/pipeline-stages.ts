/** The pipeline behind the Retail Demand Intelligence Platform, drawn as four layers in depth.
 *  Every figure comes from that project's own results. */
export const STEPS = [
  { key: "Data", head: "240 synthetic store and department series", body: "Five years of weekly sales generated to mirror a retail chain, backtested with a rolling origin." },
  { key: "Model", head: "A winner chosen per series", body: "Seasonal-naive, Holt-Winters and gradient boosting compete; no single model wins everywhere." },
  { key: "Evaluation", head: "7.9% WAPE, and an honest gap", body: "The 80% prediction intervals covered 74.2% on held-out data. Reported, not hidden." },
  { key: "Deployment", head: "Live demo, honest scope", body: "Runs on Vercel with passing CI. The AWS Terraform is written and mock-tested, not yet applied to an account." },
] as const;

/** Where each stage is best shown, with the reason. Every line restates something the linked section itself says. */
export const WORK: { title: string; why: string; href: string; project: string }[][] = [
  [
    { project: "Retail", title: "240 synthetic series", why: "Weekly store and department sales generated to mirror a retail chain, and labelled synthetic on the page.", href: "/work/retail-demand-intelligence#problem" },
    { project: "TaxProof", title: "A frozen source packet", why: "A SHA-256-hashed sample packet of 74 documents that nothing downstream is allowed to edit.", href: "/work/taxproof#source" },
  ],
  [
    { project: "Retail", title: "A winner chosen per series", why: "Three models compete on every series in a rolling-origin backtest; no single model wins everywhere.", href: "/work/retail-demand-intelligence#model-selection" },
    { project: "Preventive Care", title: "Risk in code, then retrieval", why: "A staged agent where the arithmetic never goes through the language model.", href: "/work/preventive-care#lanes" },
  ],
  [
    { project: "Retail", title: "The calibration gap", why: "The 80% intervals covered 74.2% of held-out values, and the page explains what that does and does not mean.", href: "/work/retail-demand-intelligence#evaluation" },
    { project: "Preventive Care", title: "A published answer to check", why: "The risk function is run against the guideline's own worked example.", href: "/work/preventive-care#verified" },
    { project: "TaxProof", title: "A challenge engine", why: "Checks are re-derived from the evidence, so a confident mistake can be caught rather than displayed.", href: "/work/taxproof#challenge" },
  ],
  [
    { project: "Retail", title: "Score in batch, serve by reading", why: "The online layer only reads versioned artifacts. The AWS Terraform is written and mock-tested, not applied.", href: "/work/retail-demand-intelligence#system-design" },
    { project: "TaxProof", title: "Permissions on the server", why: "Roles are enforced by the API, not the interface; the demo is live on Vercel.", href: "/work/taxproof#permissions" },
  ],
];
