/* Tiny cross-component event bus (window CustomEvents) so the hero, the command palette
   and the project section can talk without prop-drilling. */
export const OPEN_PROJECT = "ak:open-project";
export const OPEN_PALETTE = "ak:open-palette";

/** Section ids that live on the /lab page instead of the homepage. */
export const LAB_IDS = ["lab", "play", "live", "cook", "library", "tiffin"];

export function openProject(slug: string) {
  window.dispatchEvent(new CustomEvent(OPEN_PROJECT, { detail: { slug } }));
}

export function openPalette() {
  window.dispatchEvent(new Event(OPEN_PALETTE));
}

/** Scroll to a section on this page, or navigate to the page that owns it (homepage or /lab). */
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
  window.location.assign(LAB_IDS.includes(id) ? (id === "lab" ? "/lab" : `/lab#${id}`) : `/#${id}`);
}
