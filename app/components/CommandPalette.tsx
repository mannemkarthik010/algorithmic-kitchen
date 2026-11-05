"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "./ui/command";
import { DialogDescription, DialogTitle } from "./ui/dialog";
import { resume, featuredWork } from "../data/resume";
import { STATUS } from "../lib/status";
import { OPEN_PALETTE, openProject, scrollToId } from "../lib/events";

const SECTIONS: [string, string, string][] = [
  ["projects", "Selected work", "work portfolio featured projects"],
  ["contributions", "Open-source contributions", "pytorch pandera pr code evolution"],
  ["experience", "Experience", "jobs handshake sln"],
  ["expertise", "What I build, and the full stack", "skills stack expertise tools"],
  ["about", "About me", "bio story education timeline"],
  ["contact", "Contact", "email hire message"],
  ["lab", "The Lab", "games experiments extras"],
  ["library", "Lab: the library", "books reading shelf"],
];

/** Cmd/Ctrl+K or "/" opens a searchable index of sections, projects, case studies and links. shadcn/ui Command on cmdk. */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const run = useCallback((fn: () => void) => () => { setOpen(false); setTimeout(fn, 90); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName ?? "");
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); return; }
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setOpen(true); }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE, onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener(OPEN_PALETTE, onOpen); };
  }, []);

  const cases = featuredWork.filter((f) => "caseStudy" in f && f.caseStudy);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <DialogTitle className="sr-only">Search the site</DialogTitle>
      <DialogDescription className="sr-only">Jump to a section, open a project or case study, or copy a link.</DialogDescription>
      <CommandInput placeholder="Jump to a section, open a project, grab a link…" />
      <CommandList>
        <CommandEmpty>Nothing matches that.</CommandEmpty>

        <CommandGroup heading="Case studies">
          {cases.map((f) => {
            const p = resume.projects.find((x) => x.slug === f.slug)!;
            return (
              <CommandItem key={f.slug} value={`case study ${p.title} ${f.headline}`} onSelect={run(() => router.push((f as { caseStudy: string }).caseStudy))}>
                <span>{p.title.split(" — ")[0]}</span>
                <CommandShortcut>case study →</CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandGroup heading="Go to">
          {SECTIONS.map(([id, label, kw]) => (
            <CommandItem key={id} value={`${label} ${kw}`} onSelect={run(() => scrollToId(id))}>
              <span>{label}</span>
              <CommandShortcut>#{id}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="All projects">
          {resume.projects.map((p) => (
            <CommandItem key={p.slug} value={`project ${p.title} ${p.category} ${p.slug}`} onSelect={run(() => { scrollToId("projects"); setTimeout(() => openProject(p.slug), 350); })}>
              <span>{p.title.split(" — ")[0]}</span>
              <CommandShortcut>{STATUS[p.status].label}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Links">
          <CommandItem value="resume pdf cv download" onSelect={run(() => window.open("/Karthik_Mannem_Resume.pdf", "_blank", "noopener"))}><span>Résumé (PDF)</span><CommandShortcut>↓</CommandShortcut></CommandItem>
          <CommandItem value="github code repos" onSelect={run(() => window.open(resume.github, "_blank", "noopener"))}><span>GitHub</span><CommandShortcut>↗</CommandShortcut></CommandItem>
          <CommandItem value="linkedin profile" onSelect={run(() => window.open(resume.linkedin, "_blank", "noopener"))}><span>LinkedIn</span><CommandShortcut>↗</CommandShortcut></CommandItem>
          <CommandItem value={`email ${resume.email} contact hire`} onSelect={run(() => window.open(`mailto:${resume.email}`, "_self"))}><span>Email {resume.email}</span><CommandShortcut>✉</CommandShortcut></CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
