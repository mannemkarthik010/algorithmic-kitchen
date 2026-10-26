"use client";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import KitchenStats from "./components/KitchenStats";
import Ticker from "./components/Ticker";
import PlayZone from "./components/PlayZone";
import About from "./components/About";
import Projects from "./components/Projects";
import ExpertiseLab from "./components/ExpertiseLab";
import Skills from "./components/Skills";
import CareerTimeline from "./components/CareerTimeline";
import Experience from "./components/Experience";
import Contributions from "./components/Contributions";
import LiveKitchen from "./components/LiveKitchen";
import ReadingRoom from "./components/ReadingRoom";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Terminal from "./components/Terminal";
import CourseRail from "./components/CourseRail";
import EmberCursor from "./components/EmberCursor";
import CommandPalette from "./components/CommandPalette";
import ScrollToTop from "./components/ScrollToTop";
import SoundToggle from "./components/SoundToggle";
import SteamDivider from "./components/SteamDivider";
import TimeThemeProvider from "./components/TimeThemeProvider";
import { SectionDivider } from "./components/ui";

export default function Home() {
  return (
    <main>
      <TimeThemeProvider />
      <ScrollToTop />
      <Nav />
      <Hero />
      <SteamDivider compact />
      <KitchenStats />
      <Ticker />
      <About />
      <SectionDivider />
      <Projects />
      <PlayZone />
      <SteamDivider />
      <ExpertiseLab />
      <SectionDivider />
      <Skills />
      <SectionDivider />
      <CareerTimeline />
      <SteamDivider />
      <Experience />
      <SectionDivider />
      <Contributions />
      <SteamDivider />
      <LiveKitchen />
      <SteamDivider />
      <ReadingRoom />
      <SteamDivider />
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
