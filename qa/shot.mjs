// usage: node shot.mjs <url> <out.png> <width> <height> [scrollSelector] [waitMs]
import { spawn } from "node:child_process";
import { CHROME } from "./chrome.mjs";
import { writeFileSync } from "node:fs";
const [url, out, W, H, sel = "", wait = "4500"] = process.argv.slice(2);
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn(CHROME,
  ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/cdp-${port}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.find(t => t.type === "page")) break; } catch {} await sleep(250); }
const ws = new WebSocket(targets.find(t => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: 1, mobile: +W < 700 });
await send("Page.navigate", { url });
await sleep(+wait);
if (sel) {
  await send("Runtime.evaluate", { expression: `(()=>{const e=document.querySelector(${JSON.stringify(sel)});window.scrollTo(0,e.getBoundingClientRect().top+scrollY-20)})()` });
  await sleep(2500);
}
const act = process.argv[8];
if (act) { await send("Runtime.evaluate", { expression: act, awaitPromise: true }); await sleep(2400); }
const r = await send("Page.captureScreenshot", { format: "png" });
writeFileSync(out, Buffer.from(r.result.data, "base64"));
ws.close(); chrome.kill(); process.exit(0);
