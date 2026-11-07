// does the floating navigation sit on top of chart controls at phone size? usage: node navobs.mjs [base]
import { spawn } from "node:child_process";
import { CHROME } from "./chrome.mjs";
const base = process.argv[2] ?? "http://localhost:3300";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 9000 + Math.floor(Math.random() * 900);
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/cdpn-${port}`, "about:blank"], { stdio: "ignore" });
let t; for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (t.find((x) => x.type === "page")) break; } catch {} await sleep(250); }
const ws = new WebSocket(t.find((x) => x.type === "page").webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result.result?.value;
await send("Page.enable"); await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }); await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await send("Page.navigate", { url: base + "/" }); await sleep(6000);
await ev(`document.getElementById('gx-tab-1').click()`); await sleep(2200);
// bring the range buttons to the top of the screen, as a reader scrolling the chart would
await ev(`(()=>{const r=document.querySelector('.rm__range').getBoundingClientRect(); window.scrollBy(0, r.top-18)})()`); await sleep(700);
// then scroll DOWN a little with a real touch gesture, as the reader would, so the page's own scroll direction logic runs
await sleep(900);
const r = await ev(`(()=>{const out=[]; for(const b of document.querySelectorAll('.rm__range button, .rm__series button, .rm__expand')){const q=b.getBoundingClientRect(); if(q.bottom<0||q.top>innerHeight||q.y+q.height/2<0) continue; const x=q.x+q.width/2,y=q.y+q.height/2; const top=document.elementFromPoint(x,y); out.push({name:(b.getAttribute('aria-label')||b.innerText).trim().slice(0,14), y:Math.round(y), blockedBy: (top===b||b.contains(top))?null:(top?.closest('.exnav')?'NAV':String(top?.className||top?.tagName).slice(0,20))})} return {scrollY:Math.round(scrollY), navHidden:document.querySelector('.exnav')?.classList.contains('is-hidden'), controls:out}})()`);
const blocked = r.controls.filter((c) => c.blockedBy);
console.log(`${blocked.length ? "FAIL" : "PASS"}  at 390px the floating navigation does not sit on top of chart controls scrolled beneath it` + (blocked.length ? `  — ${blocked.map((c) => `${c.name} by ${c.blockedBy}`).join("; ")}` : ""));
ws.close(); chrome.kill(); process.exit(0);
