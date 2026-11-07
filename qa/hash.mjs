// Does loading a URL with a #hash land on that section? usage: node qa/hash.mjs [base]
import { spawn } from "node:child_process";
import { CHROME } from "./chrome.mjs";
const base = process.argv[2] ?? "http://localhost:3300";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 9000 + Math.floor(Math.random() * 900);
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/cdph-${port}`, "about:blank"], { stdio: "ignore" });
let t; for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (t.find((x) => x.type === "page")) break; } catch {} await sleep(250); }
const ws = new WebSocket(t.find((x) => x.type === "page").webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result.result?.value;
await send("Page.enable"); const out = [];
for (const [w, h] of [[1440, 900], [390, 844]]) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
  for (const hash of ["work", "contributions", "about", "contact"]) {
    await send("Page.navigate", { url: `${base}/?x=${w}${hash}#${hash}` }); await sleep(5500);
    const top = await ev(`Math.round(document.getElementById(${JSON.stringify(hash)}).getBoundingClientRect().top)|0`);
    const ok = top > -20 && top < 140;
    out.push(`${ok ? "PASS" : "FAIL"}  ${w}px: opening /#${hash} lands on the section  — section top at ${top}px (scrollY ${Math.round(await ev("scrollY"))})`);
  }
}
// and the same by clicking a link from another page (client-side navigation), as a visitor does
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
for (const [from, sel, hash] of [["/work/taxproof", ".ex-foot a[href='/#work']", "work"], ["/work/retail-demand-intelligence", ".cs-back", "work"], ["/work/preventive-care", ".ex-foot a[href='/#contact']", "contact"], ["/work/archive", ".ex-foot a[href='/#work']", "work"]]) {
  await send("Page.navigate", { url: base + from }); await sleep(4500);
  await ev(`document.querySelector(${JSON.stringify(sel)}).click()`); await sleep(3500);
  const top = await ev(`Math.round(document.getElementById(${JSON.stringify(hash)})?.getBoundingClientRect().top ?? 99999)|0`);
  out.push(`${top > -20 && top < 140 ? "PASS" : "FAIL"}  clicking "${sel}" on ${from} lands on #${hash}  — section top at ${top}px`);
}
console.log(out.join("\n")); ws.close(); chrome.kill(); process.exit(0);
