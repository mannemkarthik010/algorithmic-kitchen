"use client";
import { useEffect } from "react";
import Link from "next/link";
import Nav from "./Nav";
import Library from "./Library";
import Terminal from "./Terminal";
import CommandPalette from "./CommandPalette";

/** The Lab: the one game, the reading room, and a terminal. The old mini-games live in Git history. */
export default function LabPage() {
  // Deep links such as /lab#library: the sections mount on the client, so scroll once they exist.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView(), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <main id="main-content" tabIndex={-1} className="ex lab-ex">
      <Nav />
      <header id="lab" className="lab-hero">
        <p className="ex-mono">(Lab) &nbsp;Things I make when nobody asked</p>
        <h1>One game.<br /><em>One bookshelf.</em></h1>
        <p className="lab-hero__p">None of this is needed to hire me. It is here because I like making it.</p>
      </header>

      <section className="lab-play" aria-labelledby="lab-play-h">
        <div>
          <p className="ex-mono">A game, standing on its own</p>
          <h2 id="lab-play-h"><span>ECHO</span>{"//"}<span>SHIFT</span></h2>
          <p className="lab-play__p">A time-loop puzzle game. Your past self is your teammate: record a run, then let it hold the switch while you walk through the door. Six handcrafted levels and a daily challenge, with its own page.</p>
          <Link className="ex-cta ex-cta--orange" href="/play">Play now</Link>
        </div>
        <div className="lab-play__art" aria-hidden="true"><i /><i /><i /></div>
      </section>

      <Library />
      <Terminal />
      <CommandPalette />
    </main>
  );
}
