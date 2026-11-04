"use client";
import { useEffect } from "react";
import Link from "next/link";
import Nav from "./Nav";
import Footer from "./Footer";
import PlayZone from "./PlayZone";
import LiveKitchen from "./LiveKitchen";
import Library from "./Library";
import FooterPlay from "./FooterPlay";
import Terminal from "./Terminal";
import SoundToggle from "./SoundToggle";
import CommandPalette from "./CommandPalette";
import EmberCursor from "./EmberCursor";
import TimeThemeProvider from "./TimeThemeProvider";

/** The optional side of the portfolio: games, the reading room, what is on the stove, and experiments. */
export default function LabPage() {
  // Deep links such as /lab#library: the sections mount on the client, so scroll once they exist.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView(), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <main>
      <TimeThemeProvider />
      <Nav />
      <header id="lab" className="lab-head">
        <div className="container">
          <p className="sh-label">The Lab</p>
          <h1 className="lab-head__t">Things I make when nobody asked.</h1>
          <p className="lab-head__p">
            Two small games, a bookshelf of what I have read, what I am building right now, and a dosa-shaped
            optical illusion. None of it is needed to hire me. It is here because I like making it.
          </p>
          <Link className="fw-ghost" href="/">← Back to the portfolio</Link>
        </div>
      </header>

      <PlayZone />
      <LiveKitchen />
      <Library />
      <div id="tiffin"><FooterPlay /></div>
      <Footer />
      <Terminal />
      <SoundToggle />
      <CommandPalette />
      <EmberCursor />
    </main>
  );
}
