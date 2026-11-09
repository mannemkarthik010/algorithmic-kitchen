import Link from "next/link";
import { resume } from "../data/resume";

/** The one footer, used on the homepage, the archive and every case study. Every link lands on something that exists. */
export default function ExFooter() {
  return (
    <footer className="ex-foot ex-foot--full">
      <div className="ex-foot__brand">
        <p className="ex-foot__name">Karthik Mannem</p>
        <p className="ex-foot__line">I build AI systems you can inspect, test, and trust.</p>
        <p className="ex-foot__sub">Los Angeles · open to full-time roles</p>
      </div>
      <nav aria-label="Site" className="ex-foot__col">
        <p className="ex-mono">Site</p>
        <Link href="/#work">Work</Link>
        <Link href="/work/archive">Archive</Link>
        <Link href="/#contributions">Open source</Link>
        <Link href="/#about">About</Link>
        <Link href="/#contact">Contact</Link>
        <Link href="/lab">Lab</Link>
        <Link href="/play">Play ECHO//SHIFT</Link>
      </nav>
      <nav aria-label="Elsewhere" className="ex-foot__col">
        <p className="ex-mono">Elsewhere</p>
        <a href="/Karthik_Mannem_Resume.pdf" target="_blank" rel="noopener noreferrer">Résumé ↗</a>
        <a href={resume.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
        <a href={resume.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
        <a href={`mailto:${resume.email}`}>Email</a>
      </nav>
      <p className="ex-foot__copy">© {new Date().getFullYear()} {resume.name}</p>
    </footer>
  );
}
