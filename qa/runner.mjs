// Runs one QA suite as a child process and decides whether it passed.
// A suite passes only if ALL of these hold: it started, it was not killed or timed out, it exited with status 0,
// it printed at least one PASS line, and it printed no FAIL line. Printed PASS lines never outweigh any of the others.
import { spawnSync } from "node:child_process";

export function runSuite({ name, cmd = "node", args, cwd, timeoutMs = 15 * 60_000 }) {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: timeoutMs });
  const lines = (r.stdout ?? "").split("\n").filter((l) => /^(PASS|FAIL)/.test(l));
  const failLines = lines.filter((l) => l.startsWith("FAIL"));
  const pass = lines.length - failLines.length;
  const problems = [];
  if (r.error) problems.push(`did not run to completion (${r.error.code ?? r.error.message})`);
  else if (r.signal) problems.push(`terminated by ${r.signal}`);
  else if (r.status !== 0) problems.push(`exited with status ${r.status}`);
  if (!lines.length) problems.push("printed no PASS or FAIL results");
  const stderr = (r.stderr ?? "").split("\n").find((l) => l.trim()) ?? "";
  return { name, pass, failLines, problems, stderr, ok: failLines.length === 0 && problems.length === 0 };
}

/** Runs the suites in order, prints one line per suite, returns { pass, fail, results }. */
export function runSuites(suites, opts = {}, log = console.log) {
  let pass = 0, fail = 0;
  const results = [];
  for (const s of suites) {
    const r = runSuite({ ...s, ...opts });
    results.push(r);
    pass += r.pass;
    fail += r.failLines.length + (r.problems.length ? 1 : 0);
    const why = r.problems.length ? `  (${r.problems.join("; ")}${r.stderr ? `; stderr: ${r.stderr.slice(0, 120)}` : ""})` : "";
    log(`${r.ok ? "ok  " : "FAIL"} ${r.name.padEnd(9)} ${r.pass} passed, ${r.failLines.length} failed${why}`);
    for (const l of r.failLines) log("       " + l.slice(0, 240));
  }
  return { pass, fail, results };
}
