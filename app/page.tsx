"use client";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import About from "./components/About";
import Projects from "./components/Projects";
import ExpertiseLab from "./components/ExpertiseLab";
import Skills from "./components/Skills";
import CareerTimeline from "./components/CareerTimeline";
import Experience from "./components/Experience";
import Contributions from "./components/Contributions";
import Playground from "./components/Playground";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Terminal from "./components/Terminal";
import ScrollToTop from "./components/ScrollToTop";
import SoundToggle from "./components/SoundToggle";
import KitchenStats from "./components/KitchenStats";
import Ticker from "./components/Ticker";
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
      <Experience />
      <SectionDivider />
      <Contributions />
      <SectionDivider />
      <ExpertiseLab />
      <Skills />
      <SectionDivider />
      <About />
      <CareerTimeline />
      <SectionDivider />
      <Playground />
      <SectionDivider />
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
