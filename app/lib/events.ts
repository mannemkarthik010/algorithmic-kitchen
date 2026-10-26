/* Tiny cross-component event bus (window CustomEvents) so the hero book,
   the command palette and the project section can talk without prop-drilling. */
export const OPEN_PROJECT = "ak:open-project";
export const OPEN_PALETTE = "ak:open-palette";
export const OPEN_PLAYGROUND = "ak:open-playground";

/** Section ids that live inside the collapsed Playground. */
export const PLAYGROUND_IDS = ["playground", "play", "live", "cook", "reading"];

export function openProject(slug: string) {
  window.dispatchEvent(new CustomEvent(OPEN_PROJECT, { detail: { slug } }));
}

export function openPalette() {
  window.dispatchEvent(new Event(OPEN_PALETTE));
}

export function scrollToId(id: string) {
  const go = () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  if (document.getElementById(id)) { go(); return; }
  if (PLAYGROUND_IDS.includes(id)) {
    window.dispatchEvent(new Event(OPEN_PLAYGROUND));
    setTimeout(go, 400);
  }
}
