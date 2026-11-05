"use client";
import { useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { contributions, type Contribution } from "../data/contributions";
import live from "../data/contributions-live.json";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { EASE } from "../lib/motion";

type Line = { t: "meta" | "add" | "del" | "ctx"; s: string };
type LiveFile = { path: string; status: string; additions: number; deletions: number; role: "source" | "test"; hunk: Line[] };
type LivePR = {
  slug: string; repo: string; number: number; url: string; title: string; state: "merged" | "open" | "closed"; draft: boolean;
  createdAt: string; updatedAt: string; mergedAt: string | null; closedAt: string | null; additions: number; deletions: number; changedFiles: number;
  labels: string[]; reviews: { user: string; state: string; at: string; mine: boolean }[]; latestDecisions: Record<string, string>;
  closingNote: { by: string; at: string; text: string } | null; files: LiveFile[];
};
const PRS = (live as unknown as { prs: LivePR[] }).prs;
const FETCHED = (live as unknown as { fetchedAt: string }).fetchedAt;

const STAGES = [
  { k: "problem", t: "Problem" },
  { k: "change", t: "Code change" },
  { k: "validation", t: "Validation" },
  { k: "review", t: "Review" },
  { k: "outcome", t: "Outcome" },
] as const;
type Stage = (typeof STAGES)[number]["k"];

/** Status wording comes from what GitHub reported on the fetch date, never from memory. */
function status(pr: LivePR) {
  const decisions = Object.entries(pr.latestDecisions);
  const approved = decisions.filter(([, s]) => s === "APPROVED").map(([u]) => u);
  const changes = decisions.filter(([, s]) => s === "CHANGES_REQUESTED").map(([u]) => u);
  if (pr.state === "merged") return { key: "merged", label: "Merged", line: `Merged on ${pr.mergedAt}${approved.length ? `, approved by ${approved.join(", ")}` : ""}.` };
  if (pr.state === "closed") return { key: "closed", label: pr.closingNote ? "Closed · superseded" : "Closed", line: pr.closingNote ? `Closed on ${pr.closedAt} without merging. ${pr.closingNote.text}` : `Closed on ${pr.closedAt} without merging.` };
  if (changes.length) return { key: "changes", label: "Open · changes requested", line: `Open. ${changes.join(", ")} requested changes. Not merged.` };
  if (approved.length) return { key: "approved", label: "Open · approved", line: `Open and approved by ${approved.join(", ")}. Not merged yet.` };
  return { key: "open", label: "Open", line: "Open, no decision recorded. Not merged." };
}

function lineNos(hunk: Line[]) {
  let n = Number(/\+(\d+)/.exec(hunk[0]?.s ?? "")?.[1] ?? 1);
  return hunk.map((l) => (l.t === "meta" ? "" : l.t === "del" ? "" : String(n++)));
}

function Diff({ file, animateIn }: { file: LiveFile; animateIn: boolean }) {
  const rm = useReducedMotion();
  const nos = lineNos(file.hunk);
  return (
    <figure className="ce-diff">
      <figcaption>
        <code>{file.path}</code>
        <span><b className="is-add">+{file.additions}</b> <b className="is-del">−{file.deletions}</b></span>
      </figcaption>
      <pre aria-label={`Diff of ${file.path}`}>
        {file.hunk.map((l, i) => (
          <motion.span
            key={i}
            className={`ce-line ce-line--${l.t}`}
            initial={animateIn && !rm ? { opacity: 0, x: -8 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: EASE, delay: animateIn && !rm ? Math.min(i * 0.03, 0.7) : 0 }}
          >
            <i aria-hidden="true">{nos[i]}</i>
            <u aria-hidden="true">{l.t === "add" ? "+" : l.t === "del" ? "−" : " "}</u>
            <code>{l.s || " "}</code>
          </motion.span>
        ))}
      </pre>
      <p className="ce-diff__note">First hunk of the file, as shown on GitHub. The pull request has the rest.</p>
    </figure>
  );
}

export default function CodeEvolution({ onOpenWriteup }: { onOpenWriteup: (c: Contribution) => void }) {
  const rm = useReducedMotion();
  const [slug, setSlug] = useState(contributions[0].slug);
  const [stage, setStage] = useState<Stage>("problem");
  const [expanded, setExpanded] = useState(false);
  const c = contributions.find((x) => x.slug === slug)!;
  const pr = PRS.find((x) => x.slug === slug)!;
  const st = status(pr);
  const src = pr.files.filter((f) => f.role === "source");
  const tst = pr.files.filter((f) => f.role === "test");
  const reviewers = pr.reviews.filter((r) => !r.mine);

  return (
    <div className="ce">
      <Tabs value={slug} onValueChange={(v) => { setSlug(v); setStage("problem"); }} className="ce__tabs">
        <TabsList className="ce__list" aria-label="Choose a contribution">
          {contributions.map((x) => {
            const p = PRS.find((q) => q.slug === x.slug)!;
            const s = status(p);
            return (
              <TabsTrigger key={x.slug} value={x.slug} className="ce__tab">
                <span className={`ce-pill ce-pill--${s.key}`}>{s.label}</span>
                <b>{x.repo}</b>
                <span>#{x.prNumber} · {x.title.length > 54 ? `${x.title.slice(0, 52)}…` : x.title}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <div className="ce__stage">
        <LayoutGroup id="ce-stages">
          <ol className="ce__steps" aria-label="Stages of this contribution">
            {STAGES.map((s, i) => (
              <li key={s.k}>
                <button type="button" className={stage === s.k ? "is-on" : ""} aria-current={stage === s.k ? "step" : undefined} onClick={() => setStage(s.k)}>
                  {stage === s.k && <motion.span layoutId="ce-underline" className="ce__under" transition={rm ? { duration: 0 } : { duration: 0.35, ease: EASE }} />}
                  <span>{String(i + 1).padStart(2, "0")}</span>{s.t}
                </button>
              </li>
            ))}
          </ol>
        </LayoutGroup>

        <div className="ce__body" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={`${slug}-${stage}`} initial={rm ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={rm ? { opacity: 0 } : { opacity: 0, y: -8 }} transition={{ duration: 0.26, ease: EASE }}>
              {stage === "problem" && (
                <div className="ce__prose">
                  <h4>{c.title}</h4>
                  <p>{c.excerpt}</p>
                  <p className="ce__meta"><a href={c.issueUrl} target="_blank" rel="noopener noreferrer">Issue #{c.issueNumber} ↗</a><span>{c.repo}</span><span>{c.language}</span></p>
                </div>
              )}
              {stage === "change" && (
                <div>
                  {src.slice(0, 1).map((f) => (<Diff key={f.path} file={f} animateIn />))}
                  <p className="ce__meta"><span>{pr.changedFiles} files · +{pr.additions} / −{pr.deletions}</span><button type="button" className="ce__link" onClick={() => setExpanded(true)}>Expand diff ⤢</button></p>
                </div>
              )}
              {stage === "validation" && (
                <div>
                  {tst.length ? tst.slice(0, 1).map((f) => (<Diff key={f.path} file={f} animateIn />)) : <p className="ce__prose">No test file in this pull request.</p>}
                  <p className="ce__meta"><span>{tst.reduce((a, f) => a + f.additions, 0)} lines of tests added</span><span>CI results are on the pull request, not recorded here</span></p>
                </div>
              )}
              {stage === "review" && (
                <div className="ce__prose">
                  {reviewers.length ? (
                    <ol className="ce-reviews">
                      {reviewers.map((r, i) => (
                        <li key={i}><b>{r.user}</b><span className={`ce-rv ce-rv--${r.state.toLowerCase()}`}>{r.state === "APPROVED" ? "Approved" : r.state === "CHANGES_REQUESTED" ? "Requested changes" : r.state === "COMMENTED" ? "Commented" : r.state.toLowerCase()}</span><time>{r.at}</time></li>
                      ))}
                    </ol>
                  ) : <p>No reviews recorded.</p>}
                  {pr.labels.length > 0 && <p className="ce__meta">{pr.labels.map((l) => (<span key={l}>{l}</span>))}</p>}
                </div>
              )}
              {stage === "outcome" && (
                <div className="ce__prose">
                  <p className="ce__out"><span className={`ce-pill ce-pill--${st.key}`}>{st.label}</span></p>
                  <p>{st.line}</p>
                  {pr.labels.includes("Stale") && pr.state === "open" && <p>GitHub has labelled it Stale, which means it is waiting on review or activity, not that it was rejected.</p>}
                  <p className="ce__meta"><a href={pr.url} target="_blank" rel="noopener noreferrer">Open PR #{pr.number} on GitHub ↗</a><button type="button" className="ce__link" onClick={() => onOpenWriteup(c)}>Read the full write-up →</button></p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <p className="ce__src">Status, reviews and diffs fetched from the public GitHub API on {FETCHED} by <code>scripts/build-contributions-data.py</code>. Merged means merged: open pull requests are shown as open.</p>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="ce__dialog">
          <DialogTitle className="ce__dialog-t">PR #{pr.number}: {pr.title}</DialogTitle>
          <DialogDescription className="ce__dialog-d">{st.label} · {pr.changedFiles} files · +{pr.additions} / −{pr.deletions}</DialogDescription>
          {pr.files.map((f) => (<Diff key={f.path} file={f} animateIn={false} />))}
        </DialogContent>
      </Dialog>
    </div>
  );
}
