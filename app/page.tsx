"use client";
import "./exhibit/exhibit.css";
import ExNav from "./exhibit/ExNav";
import Opening from "./exhibit/Opening";
import Gallery from "./exhibit/Gallery";
import Screens from "./exhibit/Screens";
import ExAbout from "./exhibit/ExAbout";
import ExContact from "./exhibit/ExContact";
import ExFooter from "./exhibit/ExFooter";
import Contributions from "./components/Contributions";
import ScrollToTop from "./components/ScrollToTop";
import CommandPalette from "./components/CommandPalette";

/** The homepage as an exhibition: opening installation (ink), live exhibits (paper), code gallery (ink), about (paper), contact (ink). */
export default function Home() {
  return (
    <main id="main-content" tabIndex={-1} className="ex">
      <ScrollToTop />
      <ExNav />
      <Opening />
      <Gallery />
      <Screens />
      <div className="ex-code"><Contributions /></div>
      <ExAbout />
      <ExContact />
      <ExFooter />
      <CommandPalette />
    </main>
  );
}
