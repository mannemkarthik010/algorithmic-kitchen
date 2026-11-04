import { bookArchive, resume } from "../data/resume";

export type Cat = "Engineering" | "Thinking" | "Philosophy";
export const CATS: Cat[] = ["Engineering", "Thinking", "Philosophy"];

export interface LibBook {
  id: string;
  title: string;
  short: string;
  author: string;
  cat: Cat;
  status: string;
  genre: string;
  lesson: string;
  story: string;
  concept: string;
  hash: number;
  /** Real cover from Open Library (hotlinked, not stored), with colours taken from it for the spine. */
  cover?: { src: string; tint: string; ink: string; accent: string };
}

type Raw = { title: string; author: string; status: string; genre: string; lesson: string; reflection?: string; connection?: string; concept?: string };

const SHORT: Record<string, string> = {
  "Build a Large Language Model From Scratch": "LLM From Scratch",
  "Designing Machine Learning Systems": "Designing ML Systems",
};

export const shortTitle = (t: string) => SHORT[t] ?? t.split(":")[0];

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};

/** Open Library cover ids, matched by title and author. Books without a matching edition keep generated art. */
const COVERS: Record<string, { id: number; tint: string; ink: string; accent: string }> = {
  "Build a Large Language Model From Scratch": { id: 15225524, tint: "#17020D", ink: "#F0E6CE", accent: "#5D3E37" },
  "Hands-On Machine Learning": { id: 9388208, tint: "#FFFFFF", ink: "#1A1410", accent: "#A79B8D" },
  "Designing Machine Learning Systems": { id: 13314480, tint: "#FFFFFF", ink: "#1A1410", accent: "#59483D" },
  "AI Engineering": { id: 15091156, tint: "#FFFFFF", ink: "#1A1410", accent: "#1C1611" },
  "Quiet: The Power of Introverts in a World That Can't Stop Talking": { id: 7079753, tint: "#7F8185", ink: "#1A1410", accent: "#C8913A" },
  "Do Epic Shit": { id: 12550538, tint: "#FFF217", ink: "#1A1410", accent: "#9FC860" },
  "Rich Dad Poor Dad": { id: 8315603, tint: "#60544D", ink: "#F0E6CE", accent: "#1E1819" },
  "One Arranged Murder": { id: 10504047, tint: "#E7E6D2", ink: "#1A1410", accent: "#7E726A" },
  "Journey of Self Discovery": { id: 7273805, tint: "#1C1D22", ink: "#F0E6CE", accent: "#6A5A4D" },
  "The Higher Taste": { id: 689824, tint: "#66222B", ink: "#F0E6CE", accent: "#A37356" },
  "Sanatana Dharma": { id: 13507353, tint: "#506437", ink: "#F0E6CE", accent: "#E29B16" },
};

const coverFor = (title: string) => {
  const c = COVERS[title];
  return c ? { src: `https://covers.openlibrary.org/b/id/${c.id}-L.jpg?default=false`, tint: c.tint, ink: c.ink, accent: c.accent } : undefined;
};

const make = (raw: Raw, cat: Cat): LibBook => ({
  id: raw.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  title: raw.title,
  short: shortTitle(raw.title),
  author: raw.author,
  cat,
  status: raw.status,
  genre: raw.genre,
  lesson: raw.lesson,
  story: raw.reflection ?? raw.connection ?? "",
  concept: raw.concept ?? "",
  hash: hash(raw.title),
  cover: coverFor(raw.title),
});

/** Every book on the shelf, in shelf order: engineering, thinking, philosophy. */
export const LIB_BOOKS: LibBook[] = [
  ...bookArchive.engineering.map((b) => make(b as Raw, "Engineering")),
  ...bookArchive.thinking.map((b) => make(b as Raw, "Thinking")),
  ...bookArchive.philosophy.map((b) => make(b as Raw, "Philosophy")),
];

/** The book that opens turned out on the shelf: the one currently being read. */
export const START_INDEX = Math.max(
  0,
  LIB_BOOKS.findIndex((b) => resume.currentlyReading.startsWith(b.short)),
);
