// usage: node play.mjs <levelId> [shot.png] [url-base]
// Plays a level in the real page with real keyboard events, at tick-accurate timing, and reports what the page shows.
import { spawn } from "node:child_process";
import { CHROME } from "./chrome.mjs";
import { readFileSync, writeFileSync } from "node:fs";
const [levelId, shotPath = "", base = "http://localhost:3300"] = process.argv.slice(2);
const sols = JSON.parse(readFileSync(new URL("./.generated/solutions.json", import.meta.url)));
const runs = sols[levelId];
const port = 9800 + Math.floor(Math.random() * 400);
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/cdpg-${port}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.find((t) => t.type === "page")) break; } catch {} await sleep(250); }
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true })).result.result.value;
const KEY = { 1: ["ArrowUp", 38], 2: ["ArrowDown", 40], 3: ["ArrowLeft", 37], 4: ["ArrowRight", 39], 0: ["x", 88] };
const tap = async (k, code) => {
  await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: k, windowsVirtualKeyCode: code, code: k.length === 1 ? "Key" + k.toUpperCase() : k });
  await sleep(18);
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, windowsVirtualKeyCode: code, code: k.length === 1 ? "Key" + k.toUpperCase() : k });
};
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: `${base}/play?level=${levelId}` });
await sleep(3500);
const log = [];
for (let r = 0; r < runs.length; r++) {
  const dirs = runs[r];
  const t0 = performance.now();
  for (let i = 0; i < dirs.length; i++) {
    const target = t0 + 100 * i + (i === 0 ? 0 : 45);
    const wait = target - performance.now();
    if (wait > 0) await sleep(wait);
    // a leading wait must still start the clock; later waits are simply no input
    if (dirs[i] === 0 && i > 0) continue;
    const [k, c] = KEY[dirs[i]];
    await tap(k, c);
  }
  if (r < runs.length - 1) {
    await sleep(260); // let the last tick land
    const before = await ev(`document.querySelector('.eg-hud__lab')?.textContent`);
    await tap(" ", 32);
    await sleep(500);
    log.push(`run ${r + 1}/${runs.length} done (${dirs.length} moves) -> echo; hud "${before}" -> "${await ev(`document.querySelector('.eg-hud__lab')?.textContent`)}"`);
  }
}
await sleep(900);
const solved = await ev(`(()=>{const c=document.querySelector('.eg-solved__card'); return c? c.innerText.replace(/\\n+/g,' | '):null})()`);
const hint = await ev(`document.querySelector('.eg-hint')?.textContent`);
console.log(JSON.stringify({ levelId, loops: runs.length, solvedOverlay: solved, hint, log }, null, 1));
if (shotPath) { const r = await send("Page.captureScreenshot", { format: "png" }); writeFileSync(shotPath, Buffer.from(r.result.data, "base64")); }
ws.close(); chrome.kill(); process.exit(0);
