// Runs every browser suite against a running production server and totals the results.
//   npm run build && npx next start -p 3300      (in another terminal)
//   npm run qa                                    (or: node qa/run-all.mjs http://localhost:3300)
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const base = process.argv[2] ?? "http://localhost:3300";
const run = (cmd, args) => spawnSync(cmd, args, { cwd: join(here, ".."), encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

const gen = run("npx", ["vite-node", "qa/dump-solutions.ts", "qa/.generated/solutions.json"]);
if (gen.status !== 0) { console.error(gen.stdout + gen.stderr); process.exit(2); }

const SUITES = [
  ["layout", ["qa/fqa.mjs", "layout", base]],
  ["links", ["qa/fqa.mjs", "links", base]],
  ["keys", ["qa/fqa.mjs", "keys", base]],
  ["touch", ["qa/fqa.mjs", "touch", base]],
  ["motion", ["qa/fqa.mjs", "motion", base]],
  ["new", ["qa/fqa.mjs", "new", base]],
  ["finish", ["qa/fqa.mjs", "finish", base]],
  ["nav", ["qa/navobs.mjs", base]],
  ["hash", ["qa/hash.mjs", base]],
  ["structure", ["qa/axaudit.mjs", base]],
  ["gallery", ["qa/gqa.mjs", base]],
  ["game", ["qa/qa.mjs", base]],
];
let pass = 0, fail = 0;
for (const [name, args] of SUITES) {
  const r = run("node", args);
  const lines = (r.stdout ?? "").split("\n").filter((l) => /^(PASS|FAIL)/.test(l));
  const p = lines.filter((l) => l.startsWith("PASS")).length, f = lines.filter((l) => l.startsWith("FAIL")).length;
  pass += p; fail += f + (lines.length === 0 ? 1 : 0);
  console.log(`${f === 0 && lines.length ? "ok  " : "FAIL"} ${name.padEnd(8)} ${p} passed, ${f} failed${lines.length === 0 ? "  (no results: " + (r.stderr ?? "").split("\n")[0] + ")" : ""}`);
  for (const l of lines.filter((l) => l.startsWith("FAIL"))) console.log("       " + l.slice(0, 240));
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
