import type { Metadata } from "next";
import Link from "next/link";
import "../../exhibit/exhibit.css";
import Nav from "../../components/Nav";
import ExFooter from "../../exhibit/ExFooter";
import { resume } from "../../data/resume";
import { STATUS } from "../../lib/status";

export const metadata: Metadata = {
  title: "Work archive | Karthik Mannem",
  description: "Everything else I have built: an inventory system for a restaurant group, an expense-sharing app, and three earlier machine learning projects, each with its code.",
  alternates: { canonical: "https://karthikmannem.com/work/archive" },
};

const FLAGSHIP = new Set(["taxproof", "retail-intel", "preventive-care"]);

/** The projects that are not on the flagship gallery, in the order they are kept in the data. Every field is read from resume.ts. */
export default function Archive() {
  const rows = resume.projects.filter((p) => !FLAGSHIP.has(p.slug));
  return (
    <main className="ex arc">
      <Nav />
      <header className="arc__head">
        <p className="ex-mono">Work archive · {rows.length} projects</p>
        <h1>Everything <em>else.</em></h1>
        <p className="arc__sub">The flagship work lives in the <Link href="/#work">exhibition</Link>. These are the other things I have built, with their code. Where there is no live demo, there is no link to one.</p>
      </header>

      <ol className="arc__list">
        {rows.map((p, i) => {
          const [name, tag] = p.title.split(" — ");
          const st = STATUS[p.status as keyof typeof STATUS];
          const res = ((p as { results?: string[] }).results ?? []).slice(0, 3);
          return (
            <li key={p.slug} className="arc__row" id={p.slug}>
              <span className="arc__n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <div className="arc__main">
                <p className="ex-mono arc__cat">{p.category} · <span>{st.label}</span></p>
                <h2>{name}{tag && <small>{tag}</small>}</h2>
                <p className="arc__d">{p.description}</p>
                {res.length > 0 && <ul className="arc__res">{res.map((r) => (<li key={r}>{r}</li>))}</ul>}
                <p className="arc__stack">{p.ingredients.join(" · ")}</p>
              </div>
              <div className="arc__links">
                {p.demo && <a className="ex-cta ex-cta--orange" href={p.demo} target="_blank" rel="noopener noreferrer">Live demo ↗</a>}
                {p.github && <a className="ex-cta" href={p.github} target="_blank" rel="noopener noreferrer">Code on GitHub ↗</a>}
                {!p.github && !p.demo && <span className="ex-mono arc__none">No public code or demo</span>}
              </div>
            </li>
          );
        })}
      </ol>

      <ExFooter />
    </main>
  );
}
