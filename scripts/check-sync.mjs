// Fails if the website's Experience/Education data drifts from the résumé source.
// resume/resume.tex is the source of truth for these sections; app/data/resume.ts may hold *more*
// (projects, leadership, etc.) but must not contradict what the résumé says.
import { readFileSync } from "node:fs";

const tex = readFileSync(new URL("../resume/resume.tex", import.meta.url), "utf8");
const data = readFileSync(new URL("../app/data/resume.ts", import.meta.url), "utf8");

const clean = (t) =>
  t.replace(/\\%/g, "%").replace(/\\&/g, "&").replace(/\\\$/g, "$").replace(/\\textbf\{([^}]*)\}/g, "$1")
    .replace(/--/g, "–").replace(/\;|\$\|\$/g, "").replace(/\s+/g, " ").trim();

const section = (name) => {
  const m = tex.match(new RegExp(`\\\\section\\{\\\\textbf\\{${name}\\}\\}([\\s\\S]*?)(?=\\\\section\\{|\\\\end\\{document\\})`));
  return m ? m[1] : "";
};

const block = (start, end) => {
  const a = data.indexOf(start);
  const b = data.indexOf(end, a);
  return a >= 0 && b > a ? data.slice(a, b) : "";
};

const problems = [];
const need = (haystack, needle, what) => {
  if (!haystack.includes(needle)) problems.push(`${what}: "${needle}" is in resume.tex but not on the site`);
};

// ── Experience ────────────────────────────────────────────────
const expTex = section("Experience");
const expSite = block("experience: [", "leadership:").replace(/\s+/g, " ");
const entries = expTex.split("\\resumeSubheading").slice(1);
if (entries.length === 0) problems.push("Could not parse any Experience entries from resume.tex");
for (const e of entries) {
  const head = [...e.matchAll(/\{([^{}]*)\}/g)].slice(0, 4).map((m) => clean(m[1]));
  const [role, dates, company, loc] = head;
  need(expSite, role, "Experience role");
  need(expSite, dates, "Experience dates");
  need(expSite, company, "Experience company");
  need(expSite, loc, "Experience location");
  for (const it of e.matchAll(/\\item\s*\{([\s\S]*?)\}\s*(?=\\item|\\resumeItemListEnd)/g)) {
    need(expSite, clean(it[1]), `Bullet (${role})`);
  }
}
const siteRoles = [...expSite.matchAll(/role: "([^"]+)"/g)].map((m) => m[1]);
if (siteRoles.length !== entries.length) {
  problems.push(`Experience has ${entries.length} entries in resume.tex but ${siteRoles.length} on the site (extras belong in "leadership")`);
}

// ── Education ─────────────────────────────────────────────────
const eduTex = section("Education");
const eduSite = block("education: [", "certifications:").replace(/\s+/g, " ");
for (const e of eduTex.split("\\resumeSubheading").slice(1)) {
  const parts = [...e.matchAll(/\{([^{}]*)\}/g)].map((m) => clean(m[1]));
  need(eduSite, parts[0].replace("Dr. Sagunthala R&D Institute of Science and Technology", "Dr. Sagunthala R&D Institute"), "Education school");
  need(eduSite, parts[1], "Education dates");
  const gpa = (parts[2].match(/CGPA:\s*([\d.]+\s*\/\s*[\d.]+)/) || [])[1];
  if (gpa) need(eduSite, gpa.replace(/\s+/g, " "), "Education GPA");
}

if (problems.length) {
  console.error("✖ resume.tex and the website are out of sync:\n" + problems.map((p) => "  - " + p).join("\n"));
  process.exit(1);
}
console.log("✔ Experience and education on the site match resume.tex");
