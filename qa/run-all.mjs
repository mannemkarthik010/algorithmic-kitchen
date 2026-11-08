// Runs every browser suite against a running production server and totals the results.
//   npm run build && npx next start -p 3300      (in another terminal)
//   npm run qa                                    (or: node qa/run-all.mjs http://localhost:3300)
// The process exits non-zero if ANY suite fails, exits non-zero, is killed, times out, fails to start, or prints no results.
// Self-test of that rule with deliberately failing fixtures: npm run qa:selftest
//   --suites-file <json>   run the suites listed in a JSON file instead (used by the self-test)
//   --timeout-ms <n>       per-suite time limit (default 15 minutes)
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { runSuites } from "./runner.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const argv = process.argv.slice(2);
const opt = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv.splice(i, 2)[1] : undefined; };
const suitesFile = opt("--suites-file");
const timeoutArg = opt("--timeout-ms");
const timeoutMs = timeoutArg ? Number(timeoutArg) : undefined;
const base = argv[0] ?? "http://localhost:3300";

let suites;
if (suitesFile) {
  suites = JSON.parse(readFileSync(suitesFile, "utf8"));
} else {
  const gen = spawnSync("npx", ["vite-node", "qa/dump-solutions.ts", "qa/.generated/solutions.json"], { cwd: root, encoding: "utf8" });
  if (gen.error || gen.status !== 0) { console.error("could not generate the game solutions: " + (gen.error?.message ?? "") + (gen.stdout ?? "") + (gen.stderr ?? "")); process.exit(2); }
  suites = [
    ["layout", ["qa/fqa.mjs", "layout", base]],
    ["links", ["qa/fqa.mjs", "links", base]],
    ["keys", ["qa/fqa.mjs", "keys", base]],
    ["touch", ["qa/fqa.mjs", "touch", base]],
    ["motion", ["qa/fqa.mjs", "motion", base]],
    ["new", ["qa/fqa.mjs", "new", base]],
    ["finish", ["qa/fqa.mjs", "finish", base]],
    ["retail-a11y", ["qa/fqa.mjs", "retail-a11y", base]],
    ["case-a11y", ["qa/fqa.mjs", "case-a11y", base]],
    ["reading-room", ["qa/fqa.mjs", "reading-room", base]],
    ["rr-covers", ["qa/fqa.mjs", "reading-room-covers", base]],
    ["rr-touch", ["qa/fqa.mjs", "reading-room-touch", base]],
    ["nav", ["qa/navobs.mjs", base]],
    ["hash", ["qa/hash.mjs", base]],
    ["structure", ["qa/axaudit.mjs", base]],
    ["gallery", ["qa/gqa.mjs", base]],
    ["game", ["qa/qa.mjs", base]],
  ].map(([name, args]) => ({ name, args }));
}

const { pass, fail } = runSuites(suites, { cwd: root, ...(timeoutMs ? { timeoutMs } : {}) });
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
