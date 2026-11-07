// Gallery QA over real browser input. usage: node gqa.mjs [base]
import { spawn } from "node:child_process";
import { CHROME } from "./chrome.mjs";
const base = process.argv[2] ?? "http://localhost:3300";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function session(o = {}) {
  const port = 9200 + Math.floor(Math.random() * 700);
  const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/cdpg2-${port}`, "about:blank"], { stdio: "ignore" });
  let t; for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (t.find((x) => x.type === "page")) break; } catch {} await sleep(250); }
  const ws = new WebSocket(t.find((x) => x.type === "page").webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = new Map(); const errors = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method === "Runtime.exceptionThrown") errors.push(d.params.exceptionDetails.exception?.description?.split("\n")[0] ?? "exception"); else if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") errors.push(d.params.args.map((a) => a.value ?? a.description).join(" ").slice(0, 160)); };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result.result?.value;
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: o.w ?? 1440, height: o.h ?? 900, deviceScaleFactor: 1, mobile: !!o.mobile });
  if (o.touch) await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  if (o.reduced) await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  const key = async (k, c, code) => { await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: k, windowsVirtualKeyCode: c, code: code ?? k }); await sleep(20); await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, windowsVirtualKeyCode: c, code: code ?? k }); };
  const click = async (sel) => { const p = await ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return null; e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}})()`); if (!p) return false; await sleep(250); const q = await ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); const r=e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}})()`); for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x: q.x, y: q.y, button: "left", clickCount: 1 }); await sleep(250); return true; };
  await send("Page.navigate", { url: base + "/" }); await sleep(o.wait ?? 5500);
  return { send, ev, key, click, errors, done: () => { ws.close(); chrome.kill(); } };
}
const out = []; const rec = (n, ok, d = "") => out.push(`${ok ? "PASS" : "FAIL"}  ${n}${d ? "  — " + d : ""}`);
const sel = (s) => s.ev(`[...document.querySelectorAll('.gx__tab')].findIndex(t=>t.getAttribute('aria-selected')==='true')`);

// ── desktop keyboard + click + mini interactions
{
  const s = await session();
  await s.ev(`document.getElementById('gx-tab-0').scrollIntoView({block:'center'}); document.getElementById('gx-tab-0').focus()`);
  await s.key("ArrowRight", 39); await sleep(500);
  rec("ArrowRight on the project index selects project 2 and moves focus", (await sel(s)) === 1 && (await s.ev(`document.activeElement.id`)) === "gx-tab-1");
  await s.key("End", 35); await sleep(300); rec("End selects the last project", (await sel(s)) === 2);
  await s.key("Home", 36); await sleep(300); rec("Home selects the first project", (await sel(s)) === 0);
  await s.ev(`document.getElementById('work').scrollIntoView()`); await sleep(500);
  const hit = await s.ev(`(()=>{for(const v of document.querySelectorAll('.gx-win:not(.is-active) .gx-win__veil')){const r=v.getBoundingClientRect();for(let x=r.left+4;x<r.right;x+=12)for(let y=r.top+20;y<r.bottom&&y<innerHeight;y+=40){if(x<0||x>innerWidth)continue;if(document.elementFromPoint(x,y)===v)return {x,y,hit:true}}}return {hit:false}})()`);
  if (hit.hit) { for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) await s.send("Input.dispatchMouseEvent", { type, x: hit.x, y: hit.y, button: "left", clickCount: 1 }); await sleep(900); }
  rec("clicking the visible part of a receding window brings it forward", hit.hit && (await sel(s)) !== 0, `hit ${JSON.stringify(hit)}, selected ${await sel(s)}`);
  const inert = await s.ev(`[...document.querySelectorAll('.gx-win')].map(w=>w.classList.contains('is-active')+':'+w.querySelector('.gx-win__in').inert).join(' ')`);
  rec("only the active window is interactive (others inert)", /true:false/.test(inert) && (inert.match(/false:true/g) || []).length === 2, inert);

  await s.ev(`document.getElementById('gx-tab-0').click()`); await sleep(1500);
  await s.click(".tm__line:nth-child(1)"); // ensure app responds
  await s.ev(`[...document.querySelectorAll('.tm__line')][1].click()`); await sleep(1200);
  const res = await s.ev(`document.querySelector('.tm__res')?.innerText`);
  rec("TaxProof: selecting Line 9 changes the result and the rule", res === "$8,260", `result ${res}`);
  const rule = await s.ev(`document.querySelector('.tm-row:nth-child(4) .tm__t')?.innerText`);
  rec("TaxProof: the rule shown is the line's real rule", /R-STANDARD-MILEAGE/.test(rule ?? ""), rule ?? "");

  await s.ev(`document.getElementById('gx-tab-1').click()`); await sleep(1600);
  await s.ev(`[...document.querySelectorAll('.rm__series button')][1].click()`); await sleep(500);
  const lab = await s.ev(`document.querySelector('.rm__chart svg').getAttribute('aria-label')`);
  rec("Retail: choosing a series updates the chart", /store 1, department 1/i.test(lab ?? ""), lab ?? "");
  await s.ev(`document.querySelector('.rm__chart svg').focus()`);
  const r0 = await s.ev(`document.querySelector('.rm__read').innerText`);
  await s.key("ArrowLeft", 37); await s.key("ArrowLeft", 37); await sleep(300);
  const r1 = await s.ev(`document.querySelector('.rm__read').innerText`);
  rec("Retail: arrow keys read individual weeks", r0 !== r1 && /actual|forecast/.test(r1), `${r0.slice(0, 40)} → ${r1.slice(0, 40)}`);

  await s.ev(`document.getElementById('gx-tab-2').click()`); await sleep(1600);
  await s.ev(`[...document.querySelectorAll('.pm__seg button')].find(b=>/Never passes/.test(b.innerText)).click()`);
  await s.ev(`document.querySelector('.pm__play').click()`); await sleep(8200);
  const ins = await s.ev(`document.querySelector('.pm__ins').innerText`);
  rec("Preventive: replay with 'never passes' ends at Route with the revision cap", /draft 3/i.test(ins), ins.replace(/\n/g, " ").slice(0, 120));
  rec("Preventive: limitation stays visible", /educational prototype/i.test(await s.ev(`document.querySelector('.pm__foot').innerText`)));

  // overlay: open, focus trap, escape, focus return
  await s.ev(`document.getElementById('gx-tab-1').click()`); await sleep(1600);
  await s.click("#gx-win-1 .mw-open"); await sleep(1800);
  rec("Retail overlay opens as a dialog and locks the page", (await s.ev(`!!document.querySelector('.gx-over[role=dialog]')`)) && (await s.ev(`document.body.style.overflow`)) === "hidden");
  rec("overlay focus starts on the close control", /back to the gallery/i.test(await s.ev(`document.activeElement.innerText`)));
  for (let i = 0; i < 30; i++) await s.key("Tab", 9, "Tab");
  rec("Tab never leaves the overlay", await s.ev(`!!document.activeElement.closest('.gx-over')`));
  await s.key("Escape", 27); await sleep(1400);
  rec("Escape closes it, restores scrolling and returns focus to the opener", !(await s.ev(`!!document.querySelector('.gx-over')`)) && (await s.ev(`document.body.style.overflow`)) === "" && /open the observatory/i.test(await s.ev(`document.activeElement.innerText`)), `focus on "${(await s.ev(`document.activeElement.innerText`)).trim()}"`);
  rec("no console errors on desktop", s.errors.length === 0, s.errors.slice(0, 2).join(" | "));
  s.done();
}

// ── phone
{
  const s = await session({ w: 390, h: 844, mobile: true, touch: true });
  const ov = await s.ev(`document.documentElement.scrollWidth - innerWidth`);
  rec("390px: no horizontal overflow on the homepage", ov <= 0, `${ov}`);
  await s.ev(`document.getElementById('work').scrollIntoView()`); await sleep(1200);
  const vis = await s.ev(`[...document.querySelectorAll('.gx-win')].map(w=>getComputedStyle(w).visibility).join(',')`);
  rec("390px: one exhibit at a time", (vis.match(/visible/g) || []).length === 1, vis);
  const tabH = await s.ev(`Math.min(...[...document.querySelectorAll('.gx__tab')].map(t=>t.getBoundingClientRect().height))`);
  rec("390px: project selector targets are at least 44px", tabH >= 44, `${Math.round(tabH)}px`);
  const small = await s.ev(`[...document.querySelectorAll('.gx-win.is-active button')].filter(b=>{const r=b.getBoundingClientRect();return r.height>0&&r.height<32}).map(b=>b.innerText.trim().slice(0,14)+' '+Math.round(b.getBoundingClientRect().height)).slice(0,6)`);
  rec("390px: controls inside the active exhibit are at least 32px tall", small.length === 0, JSON.stringify(small));
  await s.ev(`document.getElementById('gx-tab-2').click()`); await sleep(1500);
  const w = await s.ev(`(()=>{const r=document.querySelector('.gx-win.is-active').getBoundingClientRect();return {l:r.left,r:r.right,w:innerWidth}})()`);
  rec("390px: the active exhibit fits the screen", w.l >= -1 && w.r <= w.w + 1, JSON.stringify(w));
  await s.ev(`document.querySelector('#gx-win-2 .mw-open').click()`); await sleep(1500);
  rec("390px: the theatre opens full screen", await s.ev(`!!document.querySelector('.gx-over--prev')`));
  const ovw = await s.ev(`document.querySelector('.gx-over').scrollWidth - document.querySelector('.gx-over').clientWidth`);
  rec("390px: no horizontal overflow inside the theatre", ovw <= 1, `${ovw}`);
  await s.ev(`document.querySelector('.gx-over__close').click()`); await sleep(1200);
  rec("390px: close button works", !(await s.ev(`!!document.querySelector('.gx-over')`)));
  rec("no console errors on phone", s.errors.length === 0, s.errors.slice(0, 2).join(" | "));
  s.done();
}

// ── reduced motion
{
  const s = await session({ reduced: true });
  await s.ev(`document.getElementById('gx-tab-1').scrollIntoView({block:'center'}); document.getElementById('gx-tab-1').click()`); await sleep(1000);
  await s.click("#gx-win-1 .mw-open"); await sleep(500);
  rec("reduced motion: the overlay opens immediately and is usable", await s.ev(`!!document.querySelector('.gx-over') && getComputedStyle(document.querySelector('.gx-over')).width === innerWidth + 'px'`));
  await s.key("Escape", 27); await sleep(500);
  rec("reduced motion: Escape closes it", !(await s.ev(`!!document.querySelector('.gx-over')`)));
  rec("no console errors with reduced motion", s.errors.length === 0, s.errors.slice(0, 2).join(" | "));
  s.done();
}
console.log(out.join("\n")); process.exit(0);
