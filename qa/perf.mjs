// usage: node perf.mjs <path> <mobile|desktop> [clickExpr]
import { spawn } from "node:child_process";
import { CHROME } from "./chrome.mjs";
const [path, mode, clickExpr = ""] = process.argv.slice(2);
const base = "http://localhost:3300";
const port = 9100 + Math.floor(Math.random() * 500);
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/cdpp-${port}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.find((t) => t.type === "page")) break; } catch {} await sleep(250); }
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map(); const events = [];
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method) events.push(d); };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const mobile = mode === "mobile";
await send("Network.enable"); await send("Page.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Emulation.setDeviceMetricsOverride", { width: mobile ? 390 : 1440, height: mobile ? 844 : 900, deviceScaleFactor: mobile ? 2 : 1, mobile });
if (mobile) {
  await send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750 });
}
await send("Page.addScriptToEvaluateOnNewDocument", { source: `
  window.__p={lcp:0,cls:0,tbt:0,fcp:0,ev:0};
  new PerformanceObserver(l=>{for(const e of l.getEntries())window.__p.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});
  new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__p.cls+=e.value}).observe({type:'layout-shift',buffered:true});
  new PerformanceObserver(l=>{for(const e of l.getEntries())if(e.startTime>0)window.__p.tbt+=Math.max(0,e.duration-50)}).observe({type:'longtask',buffered:true});
  new PerformanceObserver(l=>{for(const e of l.getEntries())if(e.name==='first-contentful-paint')window.__p.fcp=e.startTime}).observe({type:'paint',buffered:true});
  new PerformanceObserver(l=>{for(const e of l.getEntries())window.__p.ev=Math.max(window.__p.ev,e.duration)}).observe({type:'event',durationThreshold:16,buffered:true});
`});
await send("Page.navigate", { url: base + path });
await sleep(mobile ? 16000 : 7000);
const bytes = { js: 0, css: 0, img: 0, font: 0, other: 0 }; const types = new Map();
for (const e of events) {
  if (e.method === "Network.responseReceived") types.set(e.params.requestId, e.params.type);
  if (e.method === "Network.loadingFinished") { const t = types.get(e.params.requestId); const n = e.params.encodedDataLength; if (t === "Script") bytes.js += n; else if (t === "Stylesheet") bytes.css += n; else if (t === "Image") bytes.img += n; else if (t === "Font") bytes.font += n; else bytes.other += n; }
}
if (clickExpr) { await send("Runtime.evaluate", { expression: `(()=>{const el=${clickExpr}; if(!el) return 'noel'; const r=el.getBoundingClientRect(); window.__pt={x:r.x+r.width/2,y:r.y+r.height/2}; el.scrollIntoView({block:'center'}); return 'ok'})()` }); await sleep(600);
  const pt = (await send("Runtime.evaluate", { expression: `(()=>{const el=${clickExpr}; const r=el.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}})()`, returnByValue: true })).result.result.value;
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: pt.x, y: pt.y }); await send("Input.dispatchMouseEvent", { type: "mousePressed", x: pt.x, y: pt.y, button: "left", clickCount: 1 }); await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: pt.x, y: pt.y, button: "left", clickCount: 1 }); await sleep(1200); }
const p = (await send("Runtime.evaluate", { expression: "JSON.stringify(window.__p)", returnByValue: true })).result.result.value;
const o = JSON.parse(p);
const kb = (n) => Math.round(n / 1024);
console.log(`${path} ${mode}: FCP ${Math.round(o.fcp)}ms  LCP ${Math.round(o.lcp)}ms  CLS ${o.cls.toFixed(3)}  TBT~${Math.round(o.tbt)}ms  slowest event ${Math.round(o.ev)}ms  JS ${kb(bytes.js)}KB  CSS ${kb(bytes.css)}KB  img ${kb(bytes.img)}KB  font ${kb(bytes.font)}KB`);
ws.close(); chrome.kill(); process.exit(0);
