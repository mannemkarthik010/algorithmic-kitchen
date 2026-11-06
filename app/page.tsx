"use client";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import ProofOfEngineering from "./components/ProofOfEngineering";
import Projects from "./components/Projects";
import Contributions from "./components/Contributions";
import Experience from "./components/Experience";
import About from "./components/About";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import CommandPalette from "./components/CommandPalette";
import { SectionDivider } from "./components/ui";
import ScrollIndex from "@/components/kokonutui/scroll-index";

export default function Home() {
  return (
    <main>
      <ScrollToTop />
      <Nav />
      <Hero />
      <div className="dark">
        <ScrollIndex scroller="window" selector=".section-header h2" className="home-index">
      <Projects />
      <ProofOfEngineering />
      <SectionDivider />
      <Contributions />
      <SectionDivider />
      <Experience />
      <SectionDivider />
      <About />
      <Contact />
        </ScrollIndex>
      </div>
      <Footer />
      <CommandPalette />
    </main>
  );
}
