"use client";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import KitchenStats from "./components/KitchenStats";
import Ticker from "./components/Ticker";
import Projects from "./components/Projects";
import Contributions from "./components/Contributions";
import Experience from "./components/Experience";
import ExpertiseLab from "./components/ExpertiseLab";
import About from "./components/About";
import LabTeaser from "./components/LabTeaser";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Terminal from "./components/Terminal";
import ScrollToTop from "./components/ScrollToTop";
import SoundToggle from "./components/SoundToggle";
import CourseRail from "./components/CourseRail";
import EmberCursor from "./components/EmberCursor";
import CommandPalette from "./components/CommandPalette";
import TimeThemeProvider from "./components/TimeThemeProvider";
import { SectionDivider } from "./components/ui";

export default function Home() {
  return (
    <main>
      <TimeThemeProvider />
      <ScrollToTop />
      <Nav />
      <Hero />
      <KitchenStats />
      <Ticker />
      <Projects />
      <SectionDivider />
      <Contributions />
      <SectionDivider />
      <Experience />
      <SectionDivider />
      <ExpertiseLab />
      <SectionDivider />
      <About />
      <LabTeaser />
      <Contact />
      <Footer />
      <Terminal />
      <SoundToggle />
      <CommandPalette />
      <CourseRail />
      <EmberCursor />
    </main>
  );
}
