import { spawn } from "node:child_process";
import { CHROME } from "./chrome.mjs";
const [url] = process.argv.slice(2);
const port = 9000 + Math.floor(Math.random() * 900);
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/cdpl-${port}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let t; for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (t.find((x) => x.type === "page")) break; } catch {} await sleep(250); }
const ws = new WebSocket(t.find((x) => x.type === "page").webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Page.enable"); await send("Network.enable"); await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send("Emulation.setCPUThrottlingRate", { rate: 4 });
await send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750 });
await send("Page.addScriptToEvaluateOnNewDocument", { source: `window.__l=[];new PerformanceObserver(l=>{for(const e of l.getEntries())window.__l.push({t:Math.round(e.startTime),tag:e.element?.tagName,cls:String(e.element?.className||'').slice(0,40),src:(e.url||'').slice(-40),size:e.size})}).observe({type:'largest-contentful-paint',buffered:true})` });
await send("Page.navigate", { url }); await sleep(15000);
console.log(JSON.stringify((await send("Runtime.evaluate", { expression: "JSON.stringify(window.__l)", returnByValue: true })).result.result.value));
ws.close(); chrome.kill(); process.exit(0);
