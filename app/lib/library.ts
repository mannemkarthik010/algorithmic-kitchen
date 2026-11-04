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
