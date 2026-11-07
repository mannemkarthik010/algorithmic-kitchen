"use client";
import "./exhibit/exhibit.css";
import Link from "next/link";
import ExNav from "./exhibit/ExNav";
import Opening from "./exhibit/Opening";
import Gallery from "./exhibit/Gallery";
import Screens from "./exhibit/Screens";
import ExAbout from "./exhibit/ExAbout";
import ExContact from "./exhibit/ExContact";
import Contributions from "./components/Contributions";
import ScrollToTop from "./components/ScrollToTop";
import CommandPalette from "./components/CommandPalette";
import { resume } from "./data/resume";

/** The homepage as an exhibition: opening installation (ink), live exhibits (paper), code gallery (ink), about (paper), contact (ink). */
export default function Home() {
  return (
    <main className="ex">
      <ScrollToTop />
      <ExNav />
      <Opening />
      <Gallery />
      <Screens />
      <div className="ex-code"><Contributions /></div>
      <ExAbout />
      <ExContact />
      <footer className="ex-foot">
        <span>© {new Date().getFullYear()} Karthik Mannem</span>
        <nav aria-label="Footer">
          <a href="/Karthik_Mannem_Resume.pdf" target="_blank" rel="noopener noreferrer">Résumé</a>
          <a href={resume.github} target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href={resume.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <Link href="/lab">Lab</Link>
          <Link href="/play">Play ECHO//SHIFT</Link>
        </nav>
      </footer>
      <CommandPalette />
    </main>
  );
}
