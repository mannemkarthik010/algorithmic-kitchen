// Proves that qa/run-all.mjs fails when it should, using deliberately failing fixtures (qa/fixtures/).
// usage: npm run qa:selftest        (needs no server and no browser)
// Each case runs the real runner as a child process and checks its exit status and its output.
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "qa-selftest-"));
const fx = (f) => `qa/fixtures/${f}`;
const out = [];
let bad = 0;

function runner(suites, extra = []) {
  const file = join(dir, `suites-${Math.random().toString(36).slice(2)}.json`);
  writeFileSync(file, JSON.stringify(suites));
  const r = spawnSync("node", ["qa/run-all.mjs", "--suites-file", file, ...extra], { cwd: root, encoding: "utf8" });
  return { status: r.status, text: (r.stdout ?? "") + (r.stderr ?? "") };
}
function expect(name, suites, { status, mention, extra }) {
  const r = runner(suites, extra);
  const ok = r.status === status && (!mention || r.text.includes(mention));
  if (!ok) bad++;
  out.push(`${ok ? "PASS" : "FAIL"}  ${name}  — exit ${r.status} (wanted ${status})${mention ? `, output ${r.text.includes(mention) ? "contains" : "LACKS"} "${mention}"` : ""}`);
  if (!ok) out.push("      " + r.text.split("\n").join("\n      "));
}

expect("control: a suite that prints PASS and exits 0 passes the run", [{ name: "control", args: [fx("pass.mjs")] }], { status: 0 });
expect("a suite that prints PASS lines then exits 3 fails the run", [{ name: "exit3", args: [fx("pass-then-exit3.mjs")] }], { status: 1, mention: "exited with status 3" });
expect("a suite killed after printing PASS fails the run", [{ name: "killed", args: [fx("pass-then-killed.mjs")] }], { status: 1, mention: "terminated by SIGKILL" });
expect("a suite that cannot start fails the run", [{ name: "nostart", cmd: "qa-no-such-program", args: [] }], { status: 1, mention: "did not run to completion" });
expect("a suite that times out after printing PASS fails the run", [{ name: "hangs", args: [fx("hangs.mjs")] }], { status: 1, mention: "ETIMEDOUT", extra: ["--timeout-ms", "1500"] });
expect("a suite that prints a FAIL line fails the run", [{ name: "failline", args: [fx("fail-line.mjs")] }], { status: 1, mention: "FAIL  one bad check" });
expect("a suite that exits 0 and prints nothing fails the run", [{ name: "silent", args: [fx("silent.mjs")] }], { status: 1, mention: "printed no PASS or FAIL results" });
expect("one bad suite among good ones fails the run, and the good ones are still reported", [
  { name: "good-1", args: [fx("pass.mjs")] }, { name: "bad", args: [fx("pass-then-exit3.mjs")] }, { name: "good-2", args: [fx("pass.mjs")] },
], { status: 1, mention: "ok   good-2" });

console.log(out.join("\n"));
console.log(`\n${out.filter((l) => l.startsWith("PASS")).length} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
