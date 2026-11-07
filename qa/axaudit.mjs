// Structure audit of what assistive technology reads: headings, landmarks, names, tabs, dialogs.
// A programmatic stand-in for a screen-reader pass. It is NOT VoiceOver. usage: node qa/axaudit.mjs [base]
import { spawn } from "node:child_process";
import { CHROME } from "./chrome.mjs";
const base = process.argv[2] ?? "http://localhost:3300";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 9000 + Math.floor(Math.random() * 900);
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/cdpa-${port}`, "about:blank"], { stdio: "ignore" });
let t; for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (t.find((x) => x.type === "page")) break; } catch {} await sleep(250); }
const ws = new WebSocket(t.find((x) => x.type === "page").webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result.result?.value;
await send("Page.enable"); await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
const out = []; const rec = (n, ok, d = "") => out.push(`${ok ? "PASS" : "FAIL"}  ${n}${d ? "  — " + d : ""}`);
const AUDIT = `(()=>{
  const vis=(e)=>{const r=e.getBoundingClientRect();const c=getComputedStyle(e);return c.visibility!=='hidden'&&c.display!=='none'};
  const name=(e)=>(e.getAttribute('aria-label')||(e.getAttribute('aria-labelledby')&&document.getElementById(e.getAttribute('aria-labelledby'))?.textContent)||(e.labels&&e.labels.length?[...e.labels].map(l=>l.textContent).join(' '):'')||e.textContent||'').trim().replace(/\\s+/g,' ');
  const hs=[...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(vis||(()=>true)).map(h=>({l:+h.tagName[1],t:name(h).slice(0,40)}));
  let skip=[]; for(let i=1;i<hs.length;i++) if(hs[i].l>hs[i-1].l+1) skip.push(hs[i-1].t+' (h'+hs[i-1].l+') → '+hs[i].t+' (h'+hs[i].l+')');
  const mains=document.querySelectorAll('main').length;
  const navs=[...document.querySelectorAll('nav')].map(n=>n.getAttribute('aria-label')||'');
  const noAlt=[...document.querySelectorAll('img:not([alt])')].length;
  const unnamed=[...document.querySelectorAll('a[href],button,[role=tab],[role=button],input,select,textarea,summary')].filter(e=>!e.closest('[inert],[hidden],nextjs-portal')&&!name(e)&&!e.getAttribute('title')).map(e=>e.tagName+'.'+String(e.className).slice(0,24));
  const tabs=[...document.querySelectorAll('[role=tab]')]; const badTab=tabs.filter(t=>!t.hasAttribute('aria-selected')||(t.getAttribute('aria-controls')&&!document.getElementById(t.getAttribute('aria-controls'))));
  const panels=[...document.querySelectorAll('[role=tabpanel]')].filter(p=>!p.getAttribute('aria-labelledby')&&!p.getAttribute('aria-label'));
  const ids=[...document.querySelectorAll('[id]')].map(e=>e.id); const dup=ids.filter((x,i)=>ids.indexOf(x)!==i);
  const skipLink=document.querySelector('a[href="#main-content"]'); const target=document.getElementById('main-content');
  return {hs,skip,mains,navs,noAlt,unnamed:unnamed.slice(0,5),nUnnamed:unnamed.length,tabs:tabs.length,badTab:badTab.length,panelsUnnamed:panels.length,dup:[...new Set(dup)].slice(0,5),lang:document.documentElement.lang,title:document.title,skipLink:!!skipLink,target:!!target}
})()`;
for (const p of ["/", "/work/archive", "/work/taxproof", "/work/retail-demand-intelligence", "/work/preventive-care", "/lab", "/play"]) {
  await send("Page.navigate", { url: base + p }); await sleep(5000);
  const a = await ev(AUDIT);
  const h1 = a.hs.filter((h) => h.l === 1).length;
  rec(`${p}: one h1, one main landmark, document language and title set`, h1 === 1 && a.mains === 1 && !!a.lang && !!a.title, `h1 ${h1}, main ${a.mains}, lang "${a.lang}", title "${a.title.slice(0, 40)}"`);
  rec(`${p}: no skipped heading levels`, a.skip.length === 0, a.skip.join("; ") || `${a.hs.length} headings`);
  rec(`${p}: every control has an accessible name; no image lacks alt; no duplicate ids`, a.nUnnamed === 0 && a.noAlt === 0 && a.dup.length === 0, `unnamed ${a.nUnnamed} ${a.unnamed.join(",")}; no-alt ${a.noAlt}; dup ${a.dup.join(",")}`);
  if (p !== "/play") rec(`${p}: skip link present and its target exists`, a.skipLink && a.target);
  if (a.tabs) rec(`${p}: tabs have aria-selected and no dangling aria-controls; panels are labelled`, a.badTab === 0 && a.panelsUnnamed === 0, `${a.tabs} tabs`);
  if (p === "/") rec("/ : the gallery has a heading, so a heading-rotor user can find it", a.hs.some((h) => /three working exhibits/i.test(h.t)), a.hs.map((h) => `h${h.l} ${h.t}`).join(" | ").slice(0, 300));
}
console.log(out.join("\n")); ws.close(); chrome.kill(); process.exit(0);
