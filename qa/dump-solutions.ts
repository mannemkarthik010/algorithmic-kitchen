/**
 * Writes the solver's solution for every level to a JSON file the browser suites replay with real key events.
 * Run:  npx vite-node qa/dump-solutions.ts qa/.generated/solutions.json
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { LEVELS, levelOf } from "../lib/echo/levels";
import { solve } from "../lib/echo/solver";

const out: Record<string, number[][]> = {};
for (const d of LEVELS) {
  const s = solve(levelOf(d));
  if (!s) throw new Error(`${d.id} has no solution`);
  out[d.id] = s.runs;
  console.log(d.id, `${s.loops} loops`, s.runs.map((r) => r.length).join(","));
}
const path = process.argv[2] ?? "qa/.generated/solutions.json";
mkdirSync(dirname(path), { recursive: true });
writeFileSync(path, JSON.stringify(out));
