import { resume, featuredWork } from "../../data/resume";

export function getProject(slug: string) {
  const p = resume.projects.find((x) => x.slug === slug)!;
  const fw = featuredWork.find((x) => x.slug === slug)!;
  return { p, fw };
}

export const nameOf = (title: string) => title.split(" — ")[0];

/** The same four-part technical detail set, built from the project data, for every showcase. */
export function Details({ slug, limits }: { slug: string; limits: string[] }) {
  const { p, fw } = getProject(slug);
  return (
    <div className="sw-details">
      <section>
        <h4>The problem</h4>
        <p>{p.problem}</p>
      </section>
      <section>
        <h4>What I built</h4>
        <p>{p.solution}</p>
      </section>
      <section>
        <h4>Architecture</h4>
        <ol className="sw-flow">
          {p.architecture.map((a) => (<li key={a.step}><b>{a.step}</b><span>{a.desc}</span></li>))}
        </ol>
      </section>
      <section>
        <h4>Verified results</h4>
        <ul>{p.results.map((r) => (<li key={r}>{r}</li>))}</ul>
      </section>
      <section>
        <h4>How it was evaluated</h4>
        <dl>{fw.evalRows.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}</dl>
      </section>
      <section>
        <h4>Limitations and trade-offs</h4>
        <ul>{limits.map((l) => (<li key={l}>{l}</li>))}</ul>
      </section>
      <section className="sw-details__wide">
        <h4>Stack</h4>
        <ul className="fw-stack" aria-label="Tech stack">{p.ingredients.map((t) => (<li key={t}>{t}</li>))}</ul>
      </section>
    </div>
  );
}
