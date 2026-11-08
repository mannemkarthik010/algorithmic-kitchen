// Final QA over real browser input. usage: node fqa.mjs <layout|links|keys|touch|motion|new|finish|retail-a11y|case-a11y|reading-room|reading-room-covers|reading-room-touch> [base]
import { spawn } from "node:child_process";
import { CHROME } from "./chrome.mjs";
const [mode, base = "http://localhost:3300"] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function session(o = {}) {
  const port = 9500 + Math.floor(Math.random() * 400);
  const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/cdpf-${port}`, "about:blank"], { stdio: "ignore" });
  let t; for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (t.find((x) => x.type === "page")) break; } catch {} await sleep(250); }
  const ws = new WebSocket(t.find((x) => x.type === "page").webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = new Map(); const errors = [];
  const handlers = new Map(); // CDP events a test wants to see, e.g. Fetch.requestPaused
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method && handlers.has(d.method)) handlers.get(d.method)(d.params); else if (d.method === "Runtime.exceptionThrown") errors.push(d.params.exceptionDetails.exception?.description?.split("\n")[0] ?? "exception"); else if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") errors.push(d.params.args.map((a) => a.value ?? a.description).join(" ").slice(0, 140)); };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result.result?.value;
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: o.w ?? 1440, height: o.h ?? 900, deviceScaleFactor: o.dpr ?? 1, mobile: !!o.mobile });
  if (o.touch) await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  if (o.reduced) await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  if (o.cpu) await send("Emulation.setCPUThrottlingRate", { rate: o.cpu });
  const key = async (k, c, code) => { await send("Input.dispatchKeyEvent", { type: k === "Enter" ? "keyDown" : "rawKeyDown", key: k, windowsVirtualKeyCode: c, code: code ?? k, ...(k === "Enter" ? { text: "\r" } : {}) }); await sleep(15); await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, windowsVirtualKeyCode: c, code: code ?? k }); };
  const go = async (path, wait = 5000) => { errors.length = 0; await send("Page.navigate", { url: base + path }); await sleep(wait); };
  return { send, ev, key, go, errors, on: (method, fn) => handlers.set(method, fn), done: () => { ws.close(); chrome.kill(); } };
}
const out = []; const rec = (n, ok, d = "") => out.push(`${ok ? "PASS" : "FAIL"}  ${n}${d ? "  — " + d : ""}`);
const PAGES = ["/", "/work/archive", "/work/taxproof", "/work/retail-demand-intelligence", "/work/preventive-care", "/lab", "/play"];

if (mode === "layout") {
  for (const w of [390, 768, 1024, 1440]) {
    const s = await session({ w, h: w < 600 ? 844 : w < 1100 ? 1024 : 900, mobile: w < 600, touch: w < 1100 });
    for (const p of PAGES) {
      await s.go(p, 4500);
      const r = await s.ev(`(()=>{const iw=innerWidth; const bad=[]; const clipAnc=(e)=>{for(let a=e.parentElement;a&&a!==document.body;a=a.parentElement){const o=getComputedStyle(a).overflowX; if(o!=='visible'){const r=a.getBoundingClientRect(); if(r.right<=iw+1&&r.left>=-1) return true}} return false}; for(const e of document.querySelectorAll('body *')){ if(e.closest('canvas,svg,nextjs-portal,script,style')) continue; const cs=getComputedStyle(e); if(cs.display==='none'||cs.visibility==='hidden'||cs.position==='fixed'&&e.closest('.exnav')) continue; const r=e.getBoundingClientRect(); if(r.width===0||r.height===0) continue; if(r.right>iw+2&&!clipAnc(e)&&!e.closest('[inert]')){bad.push(e.tagName+'.'+String(e.className).slice(0,30)+' '+Math.round(r.right))} } const small=[...document.querySelectorAll('a[href],button,input,summary,[role=tab]')].filter(e=>{const r=e.getBoundingClientRect(); const cs=getComputedStyle(e); return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&!e.closest('[inert],[hidden]')&&(r.height<24||r.width<24)&&!(e.closest('.eg-hud')&&false)}).map(e=>(e.getAttribute('aria-label')||e.textContent||e.tagName).trim().slice(0,18)+' '+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height)); return {ov:document.documentElement.scrollWidth-iw, bad:bad.slice(0,4), nbad:bad.length, small:small.slice(0,4), nsmall:small.length}})()`);
      rec(`${w}px ${p}: no horizontal overflow, no clipped content, no targets under 24px, no console errors`, r.ov <= 0 && r.nbad === 0 && r.nsmall === 0 && s.errors.length === 0, `overflow ${r.ov}; clipped ${r.nbad} ${JSON.stringify(r.bad)}; small ${r.nsmall} ${JSON.stringify(r.small)}; errors ${s.errors.length} ${s.errors[0] ?? ""}`);
    }
    s.done();
  }
}

if (mode === "links") {
  const s = await session();
  const seen = new Map(); const inpage = []; let inpageN = 0;
  for (const p of PAGES) {
    await s.go(p, 3500);
    const links = await s.ev(`[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(h=>h&&!h.startsWith('mailto:'))`);
    for (const h of links) {
      if (h.startsWith("#")) { // in-page anchors are checked against the live DOM, where the section ids exist
        if (!(await s.ev(`!!document.getElementById(${JSON.stringify(h.slice(1))})`))) inpage.push(`${h} on ${p}`);
        inpageN++; continue;
      }
      seen.set(h, p);
    }
  }
  const home = await (await fetch(base + "/")).text();
  const ids = new Set([...home.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
  let bad = [];
  for (const [h, from] of seen) {
    if (h.startsWith("http")) continue;
    const [path, hash] = h.split("#");
    const p = path || from;
    const res = await fetch(base + (p || "/"), { method: "GET" });
    if (res.status !== 200) bad.push(`${h} (${res.status}) from ${from}`);
    else if (hash) { const html = p === "/" || p === "" ? home : await res.text(); if (!html.includes(`id="${hash}"`) && !ids.has(hash)) bad.push(`${h}: no #${hash} on ${p || "/"}`); }
  }
  rec(`every internal link on ${PAGES.length} pages resolves (${seen.size} unique hrefs, ${[...seen.keys()].filter((h) => h.startsWith("http")).length} external not fetched)`, bad.length === 0, bad.join("; "));
  const stale = [...seen.keys()].filter((h) => /#(projects|experience|expertise|skills|live)\b/.test(h));
  rec(`every in-page anchor (${inpageN}, mostly the on-this-page bars) targets an element that exists in the live page`, inpage.length === 0, inpage.join("; "));
  rec("no link points at a section that no longer exists", stale.length === 0, stale.join(", "));
  s.done();
}

if (mode === "keys") {
  const s = await session();
  await s.go("/", 5500);
  const stops = []; 
  for (let i = 0; i < 120; i++) {
    await s.key("Tab", 9, "Tab"); await sleep(60);
    const d = await s.ev(`(()=>{const e=document.activeElement; if(!e||e===document.body) return null; const r=e.getBoundingClientRect(); const cs=getComputedStyle(e); const name=(e.getAttribute('aria-label')||e.innerText||e.textContent||e.getAttribute('title')||'').trim().replace(/\\s+/g,' ').slice(0,34); return {tag:e.tagName.toLowerCase(), name, vis: r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth, ring: cs.outlineStyle!=='none'&&parseFloat(cs.outlineWidth)>0 || cs.boxShadow!=='none', inert: !!e.closest('[inert]'), href:e.getAttribute('href')}})()`);
    if (!d) continue; stops.push(d);
    if (/play echo/i.test(d.name)) break;
  }
  const names = stops.map((x) => x.name);
  rec(`Tab reaches the end of the page in ${stops.length} stops without getting trapped`, stops.length > 15 && /play echo/i.test(names[names.length - 1]), `${stops.length} stops`);
  rec("every focused control has an accessible name", stops.every((x) => x.name.length > 0), stops.filter((x) => !x.name).length + " unnamed");
  rec("focus never lands on an inert or invisible control", stops.filter((x) => x.inert).length === 0, `${stops.filter((x) => x.inert).length} inert`);
  const noRing = stops.filter((x) => !x.ring).map((x) => x.name);
  rec("every focused control shows a visible focus indicator", noRing.length === 0, `${noRing.length} without: ${noRing.slice(0, 5).join(" | ")}`);
  const need = [/^01.*taxproof|taxproof/i, /retail/i, /preventive/i, /line 44a|business miles/i, /open the dossier/i, /contribution|merged|pandera/i, /say hello|mannemkarthik|copy email/i, /résumé/i];
  const missing = need.filter((re) => !names.some((n) => re.test(n))).map(String);
  rec("the journey passes the gallery index, the active exhibit, code gallery, contact and footer", missing.length === 0, missing.join(" "));
  rec("no console errors during the keyboard journey", s.errors.length === 0, s.errors.slice(0, 2).join(" | "));
  // overlay by keyboard
  await s.ev(`document.getElementById('gx-tab-1').scrollIntoView({block:'center'}); document.getElementById('gx-tab-1').focus()`);
  await s.key("Enter", 13); await sleep(1500);
  await s.ev(`document.querySelector('#gx-win-1 .mw-open').focus()`);
  await s.key("Enter", 13); await sleep(2200);
  rec("Enter on 'Open the observatory' opens the overlay and focuses its close control", (await s.ev(`!!document.querySelector('.gx-over')`)) && /back to the gallery/i.test(await s.ev(`document.activeElement.innerText`)));
  await s.key("Escape", 27); await sleep(1500);
  rec("Escape returns focus to the control that opened it", /open the observatory/i.test(await s.ev(`document.activeElement.innerText`)) && !(await s.ev(`!!document.querySelector('.gx-over')`)), (await s.ev(`document.activeElement.innerText`)).trim());
  // case study section navigation by keyboard
  await s.go("/work/retail-demand-intelligence", 5500);
  await s.ev(`document.querySelector('.cn a').focus()`);
  await s.key("Tab", 9, "Tab"); await s.key("Tab", 9, "Tab"); await s.key("Enter", 13); await sleep(1500);
  const y = await s.ev(`scrollY`); const cur = await s.ev(`document.querySelector('.cn a.is-on')?.innerText`);
  rec("case study: keyboard activation of a section link scrolls there and marks it current", y > 500 && !!cur, `scrollY ${y}, current "${(cur || "").replace(/\n/g, " ")}"`);
  s.done();
}

if (mode === "touch") {
  const s = await session({ w: 390, h: 844, mobile: true, touch: true });
  await s.go("/", 5500);
  await s.ev(`document.getElementById('gx-tab-1').click()`); await sleep(1800);
  await s.ev(`document.querySelector('.rm__chart').scrollIntoView({block:'center'})`); await sleep(500);
  const pt = await s.ev(`(()=>{const r=document.querySelector('.rm__plot').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  const y0 = await s.ev(`scrollY`);
  await s.send("Input.synthesizeScrollGesture", { x: pt.x, y: pt.y, yDistance: -260, gestureSourceType: "touch", speed: 900 }); await sleep(900);
  const y1 = await s.ev(`scrollY`);
  rec("touch: a vertical swipe starting on the chart scrolls the page", y1 - y0 > 150, `scrollY ${Math.round(y0)} → ${Math.round(y1)}`);
  await s.ev(`document.querySelector('.rm__series').scrollIntoView({block:'center'})`); await sleep(400);
  const sp = await s.ev(`(()=>{const e=document.querySelector('.rm__series');const r=e.getBoundingClientRect();return {x:r.x+r.width-30,y:r.y+r.height/2,sl:e.scrollLeft,over:e.scrollWidth>e.clientWidth}})()`);
  await s.send("Input.synthesizeScrollGesture", { x: sp.x, y: sp.y, xDistance: -220, gestureSourceType: "touch", speed: 800 }); await sleep(700);
  const sl1 = await s.ev(`document.querySelector('.rm__series').scrollLeft`);
  rec("touch: the series strip scrolls sideways and the page does not", sp.over && sl1 > sp.sl + 80, `scrollLeft ${sp.sl} → ${Math.round(sl1)}`);
  rec("touch: no horizontal page scroll afterwards", (await s.ev(`document.documentElement.scrollWidth - innerWidth`)) <= 0 && (await s.ev(`scrollX`)) === 0);
  await s.go("/work/taxproof", 5500);
  const c0 = await s.ev(`document.querySelector('.cn__list').scrollLeft`);
  await s.ev(`window.scrollTo(0, 2200)`); await sleep(600);
  const pt2 = await s.ev(`(()=>{const r=document.querySelector('.cn__list').getBoundingClientRect();return {x:r.x+r.width-30,y:r.y+r.height/2}})()`);
  await s.send("Input.synthesizeScrollGesture", { x: pt2.x, y: pt2.y, xDistance: -240, gestureSourceType: "touch", speed: 800 }); await sleep(700);
  rec("touch: the on-this-page strip scrolls sideways on a phone", (await s.ev(`document.querySelector('.cn__list').scrollLeft`)) > c0 + 60, `${c0} → ${await s.ev(`document.querySelector('.cn__list').scrollLeft`)}`);
  const top = () => s.ev(`Math.round(document.querySelector('.cn').getBoundingClientRect().top)`);
  const navHidden = () => s.ev(`document.querySelector('.exnav').classList.contains('is-hidden')`);
  const downTop = await top(), downHidden = await navHidden();
  rec("touch: reading downward, the nav steps away and the on-this-page bar sits at the top edge", downHidden && downTop === 0, `nav hidden ${downHidden}, bar top ${downTop}`);
  await s.ev(`window.scrollBy(0, -80)`); await sleep(700);
  const upTop = await top(), upHidden = await navHidden();
  rec("touch: scrolling up, the nav returns and the bar sits below it, not under it", !upHidden && Math.abs(upTop - 66) < 4, `nav hidden ${upHidden}, bar top ${upTop}`);
  s.done();
}

if (mode === "motion") {
  const sample = `window.__f=[];let l=performance.now();const t=(n)=>{window.__f.push(n-l);l=n;if(!window.__stop)requestAnimationFrame(t)};requestAnimationFrame(t);0`;
  const stats = `(()=>{window.__stop=true;const f=window.__f.slice(2).sort((a,b)=>a-b);const n=f.length;return {frames:n,median:+f[Math.floor(n/2)].toFixed(1),p95:+f[Math.floor(n*.95)].toFixed(1),max:+f[n-1].toFixed(1),over50:+(100*f.filter(x=>x>50).length/n).toFixed(1)}})()`;
  for (const [label, o] of [["desktop 1440, no throttle", { w: 1440, h: 900 }], ["phone 390, 4x CPU slowdown", { w: 390, h: 844, mobile: true, touch: true, cpu: 4 }]]) {
    const s = await session(o);
    await s.go("/", 6000);
    await s.ev(`document.getElementById('gx-tab-0').scrollIntoView({block:'center'})`); await sleep(800);
    await s.ev(sample); await s.ev(`document.getElementById('gx-tab-1').click()`); await sleep(1800); await s.ev(`document.getElementById('gx-tab-2').click()`); await sleep(1800);
    const a = await s.ev(stats);
    rec(`${label}: gallery transitions between exhibits`, a.p95 < 50, JSON.stringify(a));
    await s.ev(sample); await s.ev(`document.querySelector('#gx-win-2 .mw-open').click()`); await sleep(2500);
    const b = await s.ev(stats);
    rec(`${label}: opening a full-screen exhibit`, b.p95 < 50, JSON.stringify(b));
    s.done();
  }
}

if (mode === "new") {
  // covers and preserved state (desktop)
  let s = await session();
  await s.go("/", 6000);
  await s.ev(`document.getElementById('work').scrollIntoView()`); await sleep(800);
  const cov = await s.ev(`[...document.querySelectorAll('.gx-win')].map(w=>w.classList.contains('is-active')+':'+(+getComputedStyle(w.querySelector('.gx-cover')).opacity).toFixed(2)).join(' ')`);
  rec("inactive windows show their graphic cover; the active one shows its interface", /true:0\.00/.test(cov) && (cov.match(/false:1\.00|false:0\.9|false:1/g) || []).length === 2, cov);
  await s.ev(`[...document.querySelectorAll('.tm__line')][1].click()`); await sleep(600);
  await s.ev(`document.getElementById('gx-tab-1').click()`); await sleep(1500);
  await s.ev(`document.getElementById('gx-tab-0').click()`); await sleep(1500);
  rec("selection state survives visiting another exhibit (TaxProof line stays on Line 9)", await s.ev(`document.querySelectorAll('.tm__line')[1].getAttribute('aria-pressed')==='true'`));
  await s.ev(`document.querySelector('#gx-win-0 .mw-open').click()`); await sleep(3500);
  const ctx = await s.ev(`document.querySelector('.dos-ctx')?.innerText`);
  const page = await s.ev(`document.querySelector('.gx-over').innerText.includes('CALCULATED OUTPUT')||document.querySelector('.gx-over').innerText.toLowerCase().includes('calculated output')`);
  rec("dossier opens at the selected line's evidence and says so", /Line 9/.test(ctx || "") && page, (ctx || "").replace(/\n/g, " ").slice(0, 150));
  await s.ev(`[...document.querySelectorAll('.dos-ctx button')][0].click()`); await sleep(1200);
  rec("'Start from the cover' returns the dossier to its cover", /opens at its cover/i.test(await s.ev(`document.querySelector('.dos-ctx').innerText`)) && /Evidence dossier/i.test(await s.ev(`document.querySelector('.gx-over').innerText`)));
  s.done();
  // dossier cover label when nothing selected on a fresh load of a different path: default selection is Line 44A, so check the mapping
  // phone: Retail miniature and Observatory
  s = await session({ w: 390, h: 844, mobile: true, touch: true });
  await s.go("/", 6000);
  await s.ev(`document.getElementById('gx-tab-1').scrollIntoView({block:'center'}); document.getElementById('gx-tab-1').click()`); await sleep(2200);
  const m = await s.ev(`(()=>{const w=document.querySelector('#gx-win-1').getBoundingClientRect(); const bad=[]; for(const e of document.querySelectorAll('#gx-win-1 .gx-win__in *')){const r=e.getBoundingClientRect(); if(r.width&&r.height&&(r.right>w.right+1||r.left<w.left-1)&&!e.closest('.rm__series')) bad.push(e.tagName+'.'+String(e.className).slice(0,20))} const plot=document.querySelector('.rm__plot').getBoundingClientRect(); const svg=document.querySelector('.rm__plot svg').getBoundingClientRect(); const tick=parseFloat(getComputedStyle(document.querySelector('.rm__tick')).fontSize); const ex=document.querySelector('.rm__expand'); const er=ex.getBoundingClientRect(); return {bad:bad.slice(0,4), n:bad.length, svgFits: svg.width<=plot.width+1&&svg.height<=plot.height+1, tick, expand:{w:Math.round(er.width),h:Math.round(er.height),vis:getComputedStyle(ex).display!=='none', name:ex.getAttribute('aria-label')}, chipVisible:(()=>{const c=document.querySelector('.rm__chip').getBoundingClientRect(); return c.right<=w.right+1&&c.left>=w.left-1})()}})()`);
  rec("390px Retail miniature: nothing spills outside the window, badge whole", m.n === 0 && m.chipVisible, JSON.stringify({ n: m.n, bad: m.bad, chip: m.chipVisible }));
  rec("390px Retail miniature: chart is drawn at its real size and axis labels are at least 9px", m.svgFits && m.tick >= 9, `fits ${m.svgFits}, tick ${m.tick}px`);
  rec("390px Retail miniature: Expand button is visible, named and at least 36px tall", m.expand.vis && m.expand.h >= 36 && /observatory/i.test(m.expand.name || ""), JSON.stringify(m.expand));
  await s.ev(`document.querySelector('#gx-win-1 .rm__expand').click()`); await sleep(3500);
  const o = await s.ev(`(()=>{const c=document.querySelector('.fs__chart').getBoundingClientRect(); const o=document.querySelector('.gx-over'); return {chartTop:Math.round(c.top), chartH:Math.round(c.height), metricsTop:Math.round(document.querySelector('.obs__nums').getBoundingClientRect().top), metricsH:Math.round(document.querySelector('.obs__nums').getBoundingClientRect().height), ov:o.scrollWidth-o.clientWidth}})()`);
  rec("390px Observatory: the chart starts in the first screen and is tall enough to read", o.chartTop < 640 && o.chartH >= 280, JSON.stringify(o));
  rec("390px Observatory: metrics are one compact row and nothing overflows sideways", o.metricsH < 150 && o.ov <= 1, `metrics height ${o.metricsH}px, overflow ${o.ov}`);
  s.done();
}
if (mode === "finish") {
  // dossier centring, the Lines 28/29 note, and the Lightbox grid
  const s = await session();
  await s.go("/", 6000);
  await s.ev(`document.getElementById('work').scrollIntoView()`); await sleep(800);
  const openAt = async (i) => {
    await s.ev(`[...document.querySelectorAll('.tm__line')][${i}].click()`); await sleep(400);
    await s.ev(`document.querySelector('#gx-win-0 .mw-open').click()`); await sleep(3500);
  };
  const centre = () => s.ev(`(()=>{const o=document.querySelector('.gx-over').getBoundingClientRect(); const f=document.querySelector('.gx-over__body .max-w-4xl'); if(!f) return null; const r=f.getBoundingClientRect(); return {off:Math.round(((r.left+r.right)/2)-((o.left+o.right)/2)), w:Math.round(r.width)}})()`);
  const close = async () => { await s.ev(`document.querySelector('.gx-over__close').click()`); await sleep(1500); };
  for (const [i, label] of [[1, "Line 9"], [2, "Line 28"], [3, "Line 29"]]) {
    await openAt(i);
    const c = await centre();
    rec(`dossier is centred in the overlay when opened at ${label}`, !!c && Math.abs(c.off) <= 4 && c.w > 400, JSON.stringify(c));
    if (i >= 2) {
      const ctx = (await s.ev(`document.querySelector('.dos-ctx')?.innerText`)) || "";
      rec(`${label}: the note says the spread is the mileage contribution, not the complete calculation`, /mileage contribution/i.test(ctx) && /not the complete calculation/i.test(ctx), ctx.replace(/\n/g, " ").slice(0, 200));
    }
    await close();
  }
  s.done();
  for (const [w, cols, name] of [[1440, 4, "desktop"], [390, 2, "phone"]]) {
    const t = await session({ w, h: w === 390 ? 844 : 900, mobile: w === 390, touch: w === 390 });
    await t.go("/", 6000);
    await t.ev(`document.querySelector('.ex-screens__grid').scrollIntoView({block:'center'})`); await sleep(800);
    const g = await t.ev(`(()=>{const ul=document.querySelector('.ex-screens__grid ul'); const tr=getComputedStyle(ul).gridTemplateColumns.split(' ').length; const b=[...ul.querySelectorAll('li button')].map(x=>x.getBoundingClientRect()); const ratio=b[0].width/b[0].height; return {tracks:tr, n:b.length, ratio:+ratio.toFixed(2), minH:Math.round(Math.min(...b.map(r=>r.height))), ov:document.documentElement.scrollWidth-innerWidth}})()`);
    rec(`${name} Lightbox grid has ${cols} columns, even 4:3 tiles, no sideways overflow`, g.tracks === cols && Math.abs(g.ratio - 4 / 3) < 0.08 && g.ov <= 1, JSON.stringify(g));
    t.done();
  }
}
if (mode === "retail-a11y") {
  // Retail case study explorer: the series selector and the time-range buttons, read from Chrome's accessibility tree and driven by real keys.
  const s = await session();
  await s.send("Accessibility.enable");
  await s.go("/work/retail-demand-intelligence", 5500);
  await s.ev(`document.getElementById('explorer').scrollIntoView({block:'center'})`); await sleep(1500);
  const tree = async () => (await s.send("Accessibility.getFullAXTree")).result.nodes;
  const prop = (n, k) => n.properties?.find((p) => p.name === k)?.value?.value;
  const kids = (nodes, n) => (n.childIds ?? []).flatMap((id) => { const c = nodes.find((x) => x.nodeId === id); return !c ? [] : c.role?.value === "button" ? [c] : kids(nodes, c); });
  const read = async (groupName) => {
    const nodes = await tree();
    const gs = nodes.filter((n) => n.role?.value === "group" && n.name?.value === groupName && !n.ignored);
    return { groups: gs.length, buttons: gs[0] ? kids(nodes, gs[0]).map((b) => ({ name: b.name?.value, role: b.role?.value, pressed: prop(b, "pressed") })) : [] };
  };
  const pressedNames = (g) => g.buttons.filter((b) => String(b.pressed) === "true").map((b) => b.name);
  const dom = (sel) => s.ev(`[...document.querySelectorAll(${JSON.stringify(sel)})].map(b=>b.innerText.trim())`);
  const keyEv = async (k, mod = 0) => {
    const d = { Tab: [9, "Tab", ""], " ": [32, "Space", " "], Enter: [13, "Enter", "\r"] }[k];
    await s.send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code: d[1], windowsVirtualKeyCode: d[0], modifiers: mod, ...(d[2] ? { text: d[2] } : {}) });
    await sleep(25); await s.send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code: d[1], windowsVirtualKeyCode: d[0], modifiers: mod }); await sleep(400);
  };
  const active = () => s.ev(`(()=>{const a=document.activeElement; return {text:(a.innerText||'').trim(), pressed:a.getAttribute('aria-pressed'), tag:a.tagName, inChips:!!a.closest('#explorer .cs-chips'), inSeg:!!a.closest('#explorer .cs-seg')}})()`);
  const chart = () => s.ev(`(()=>{const v=document.querySelector('#explorer .cs-chart svg'); return {label:v.getAttribute('aria-label'), sig:v.outerHTML.length}})()`);

  const seriesDom = await dom("#explorer .cs-chips button"), rangeDom = await dom("#explorer .cs-seg button");
  let series = await read("Series"), range = await read("Time range");
  rec("series selector: one labelled group, with every series a button that exposes a pressed state, exactly one pressed",
    series.groups === 1 && series.buttons.length === seriesDom.length && seriesDom.length >= 5 && series.buttons.every((b) => b.role === "button" && (String(b.pressed) === "true" || String(b.pressed) === "false")) && pressedNames(series).length === 1,
    `${series.buttons.length} of ${seriesDom.length} buttons; pressed: ${pressedNames(series).join(", ")}`);
  rec("series selector: accessible names match the visible labels",
    JSON.stringify(series.buttons.map((b) => b.name)) === JSON.stringify(seriesDom.map((t) => t.replace(/\s+/g, " "))), series.buttons.slice(0, 2).map((b) => b.name).join(" | "));
  rec("time range: one labelled group of 3 buttons, each exposing a pressed state, exactly one pressed",
    range.groups === 1 && range.buttons.length === 3 && rangeDom.length === 3 && range.buttons.every((b) => b.role === "button" && (String(b.pressed) === "true" || String(b.pressed) === "false")) && pressedNames(range).length === 1,
    `${range.buttons.map((b) => `${b.name}=${b.pressed}`).join(", ")}`);
  rec("the explorer no longer declares tab or tablist roles (they promised arrow-key behaviour that was not there)",
    (await s.ev(`document.querySelectorAll('#explorer [role=tab], #explorer [role=tablist]').length`)) === 0 && !(await tree()).some((n) => ["tab", "tablist"].includes(n.role?.value) && n.name?.value === "Series"));

  // keyboard: series. Focus is placed on the pressed series button (the one programmatic step), then real keys do the rest.
  const before = pressedNames(series)[0], c0 = await chart();
  await s.ev(`document.querySelector('#explorer .cs-chips button[aria-pressed="true"]').focus()`);
  await keyEv("Tab"); const a1 = await active();
  rec("series: a real Tab moves focus to the next series button (each is a Tab stop), without selecting it", a1.inChips && a1.pressed === "false" && a1.text !== before.replace(/\s+/g, " "), `focus on "${a1.text}", pressed ${a1.pressed}`);
  await keyEv(" "); series = await read("Series"); const c1 = await chart(); const a2 = await active();
  rec("series: Space selects it; the accessibility tree then reports it pressed and the previous one not; the chart changes; focus stays on the button",
    pressedNames(series).length === 1 && pressedNames(series)[0] === a1.text && pressedNames(series)[0] !== before && c1.label !== c0.label && c1.sig !== c0.sig && a2.text === a1.text,
    `pressed now "${pressedNames(series)[0]}" (was "${before}"); chart: ${c1.label?.slice(0, 40)}`);
  await keyEv("Tab"); const a3 = await active(); await keyEv("Enter"); series = await read("Series"); const c2 = await chart();
  rec("series: Tab then Enter selects the next one the same way", pressedNames(series).length === 1 && pressedNames(series)[0] === a3.text && c2.label !== c1.label, `pressed "${pressedNames(series)[0]}"`);
  await keyEv("Tab", 8); const a4 = await active();
  rec("series: Shift+Tab moves back to the previous series button", a4.inChips && a4.text === a1.text, `focus on "${a4.text}"`);

  // keyboard: time range
  const rBefore = pressedNames(range)[0], r0 = await chart();
  await s.ev(`document.querySelector('#explorer .cs-seg button[aria-pressed="true"]').focus()`);
  await keyEv("Tab"); const b1 = await active();
  await keyEv(" "); range = await read("Time range"); const r1 = await chart();
  rec("time range: Tab reaches the next range button; Space selects it; the accessibility tree reports it pressed and the previous one not; the chart changes",
    b1.inSeg && pressedNames(range).length === 1 && pressedNames(range)[0] === b1.text && pressedNames(range)[0] !== rBefore && r1.sig !== r0.sig,
    `pressed now "${pressedNames(range)[0]}" (was "${rBefore}")`);
  await keyEv("Tab", 8); const b2 = await active();   // back towards the first range button (Tab from the last one would leave the group)
  if (b2.inSeg) { await keyEv("Enter"); range = await read("Time range"); }
  rec("time range: Shift+Tab then Enter selects the previous range button", b2.inSeg && b2.text !== b1.text && pressedNames(range).length === 1 && pressedNames(range)[0] === b2.text, `focus "${b2.text}", pressed "${pressedNames(range)[0]}"`);
  rec("no console errors during the keyboard selection", s.errors.length === 0, s.errors.slice(0, 2).join(" | "));
  s.done();
}
if (mode === "case-a11y") {
  // The other case-study selectors, read from Chrome's accessibility tree and driven by real keys:
  // TaxProof: lineage chips (EvidenceGraph), sample-log modes (HashChain), system-design layers (TaxProofCase).
  // Retail: pipeline stages (PipelineDiagram). The last two were not changed; they are tested to confirm they already work.
  const s = await session();
  await s.send("Accessibility.enable"); await s.send("DOM.enable");
  const ax = async (sel) => {
    const doc = await s.send("DOM.getDocument", { depth: 0 });
    const q = await s.send("DOM.querySelectorAll", { nodeId: doc.result.root.nodeId, selector: sel });
    const out = [];
    for (const nodeId of q.result.nodeIds) {
      const n = (await s.send("Accessibility.getPartialAXTree", { nodeId, fetchRelatives: false })).result.nodes[0];
      out.push({ role: n.role?.value, name: n.name?.value, pressed: n.properties?.find((p) => p.name === "pressed")?.value?.value });
    }
    return out;
  };
  const keyEv = async (k, mod = 0) => {
    const d = { Tab: [9, "Tab", ""], " ": [32, "Space", " "], Enter: [13, "Enter", "\r"] }[k];
    await s.send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code: d[1], windowsVirtualKeyCode: d[0], modifiers: mod, ...(d[2] ? { text: d[2] } : {}) });
    await sleep(25); await s.send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code: d[1], windowsVirtualKeyCode: d[0], modifiers: mod }); await sleep(450);
  };
  const isPressed = (n) => String(n.pressed) === "true";
  async function check(label, sel, effect, groupSel, groupName) {
    const q = JSON.stringify(sel);
    await s.ev(`document.querySelector(${q}).scrollIntoView({block:'center'})`); await sleep(900);
    let nodes = await ax(sel);
    const pressedIdx = () => s.ev(`[...document.querySelectorAll(${q})].findIndex(b=>b.getAttribute('aria-pressed')==='true')`);
    const focusIdx = () => s.ev(`[...document.querySelectorAll(${q})].indexOf(document.activeElement)`);
    rec(`${label}: ${nodes.length} buttons, each exposing a pressed state in the accessibility tree, exactly one pressed`,
      nodes.length >= 2 && nodes.every((n) => n.role === "button" && ["true", "false"].includes(String(n.pressed))) && nodes.filter(isPressed).length === 1,
      nodes.map((n) => `${n.name}=${n.pressed}`).join("; ").slice(0, 220));
    if (groupSel) {
      const g = (await ax(groupSel))[0];
      rec(`${label}: the buttons sit in a labelled group named "${groupName}"`, g?.role === "group" && g?.name === groupName, `role ${g?.role}, name ${g?.name}`);
    }
    const p0 = await pressedIdx(), dir = p0 + 1 < nodes.length ? 1 : -1, t1 = p0 + dir, e0 = await effect();
    await s.ev(`document.querySelectorAll(${q})[${p0}].focus()`);
    await keyEv("Tab", dir < 0 ? 8 : 0);
    rec(`${label}: a real ${dir < 0 ? "Shift+Tab" : "Tab"} moves focus to the neighbouring button without selecting it`, (await focusIdx()) === t1 && (await pressedIdx()) === p0, `focus on ${await focusIdx()} (wanted ${t1}), pressed ${await pressedIdx()}`);
    await keyEv(" "); await sleep(1300); nodes = await ax(sel);
    const e1 = await effect();
    rec(`${label}: Space selects it; the tree reports it pressed and the others not; the page content changes`,
      (await pressedIdx()) === t1 && nodes.filter(isPressed).length === 1 && isPressed(nodes[t1]) && e1 !== e0, `pressed ${await pressedIdx()} (wanted ${t1}); content changed ${e1 !== e0}`);
    const t2 = t1 + dir >= 0 && t1 + dir < nodes.length ? t1 + dir : p0;
    await keyEv("Tab", t2 > t1 ? 0 : 8);
    const f2 = await focusIdx();
    await keyEv("Enter"); await sleep(1300); nodes = await ax(sel);
    rec(`${label}: ${t2 > t1 ? "Tab" : "Shift+Tab"} then Enter selects that one; the tree reports it pressed and the others not`, f2 === t2 && (await pressedIdx()) === t2 && nodes.filter(isPressed).length === 1 && isPressed(nodes[t2]), `focus ${f2}, pressed ${await pressedIdx()} (wanted ${t2})`);
  }

  await s.go("/work/taxproof", 6000);
  rec("TaxProof lineage selector declares no tab or tablist roles", (await s.ev(`document.querySelectorAll('.tp-panel .cs-chips [role=tab], .tp-panel .cs-chips[role=tablist]').length`)) === 0);
  await check("TaxProof lineage chips", ".tp-panel .cs-chips button", () => s.ev(`document.querySelector('.tp-panel .cs-panel__why').innerText`), ".tp-panel .cs-chips", "Choose a lineage");
  await check("TaxProof sample-log modes", ".tp-chain__ctl button", () => s.ev(`document.querySelector('.tp-chain').innerText`), ".tp-chain__ctl", "Tamper with the sample log");
  await check("TaxProof system-design layers (unchanged)", ".cs-pipe .cs-node", () => s.ev(`document.querySelector('.cs-pipe__detail').innerText`));
  rec("no console errors on the TaxProof case study during keyboard selection", s.errors.length === 0, s.errors.slice(0, 2).join(" | "));
  await s.go("/work/retail-demand-intelligence", 6000);
  await check("Retail pipeline stages (unchanged)", ".cs-pipe .cs-node", () => s.ev(`document.querySelector('.cs-pipe__detail').innerText`));
  rec("no console errors on the Retail case study during keyboard selection", s.errors.length === 0, s.errors.slice(0, 2).join(" | "));
  s.done();
}
if (mode === "reading-room" || mode === "reading-room-covers" || mode === "reading-room-touch") {
  // The Reading Room on /lab, in headless Chrome: desktop with a real keyboard and mouse, a phone with real touch, and reduced motion.
  const keyEv = (s) => async (k, mod = 0) => {
    const d = { Tab: [9, "Tab", ""], " ": [32, "Space", " "], Enter: [13, "Enter", "\r"], Escape: [27, "Escape", ""], ArrowRight: [39, "ArrowRight", ""], ArrowLeft: [37, "ArrowLeft", ""] }[k];
    await s.send("Input.dispatchKeyEvent", { type: d[2] ? "keyDown" : "rawKeyDown", key: k, code: d[1], windowsVirtualKeyCode: d[0], modifiers: mod, ...(d[2] ? { text: d[2] } : {}) });
    await sleep(25); await s.send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code: d[1], windowsVirtualKeyCode: d[0], modifiers: mod }); await sleep(900);
  };
  const click = (s) => async (x, y) => { await s.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y }); await s.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 }); await sleep(40); await s.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 }); await sleep(900); };
  const tap = (s) => async (x, y) => { await s.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] }); await sleep(60); await s.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await sleep(900); };
  const centre = (s, sel) => s.ev(`(()=>{const r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height}})()`);
  const readCap = (s) => s.ev(`(()=>{const t=(q)=>(document.querySelector(q)?.innerText||'').trim(); return {title:t('.lib-cap-title'), sub:t('.lib-cap-sub'), status:t('.lib-cap-status'), note:t('.lib-cap-note'), sr:t('.lib-sr'), leaving:document.querySelectorAll('.lib-cap .is-abs').length}})()`);
  const over = (s) => s.ev(`(()=>{const d=document.querySelector('.lib-over'); const r=d.getBoundingClientRect(); const cs=getComputedStyle(d); return {vis:cs.visibility, w:Math.round(r.width), h:Math.round(r.height), top:Math.round(r.top), label:d.getAttribute('aria-label'), modal:d.getAttribute('aria-modal'), role:d.getAttribute('role'), hidden:d.getAttribute('aria-hidden'), overflow:document.documentElement.style.overflow, lesson:(d.querySelector('.lib-over__lesson')?.innerText||'').trim(), eyebrow:(d.querySelector('.lib-over__eyebrow')?.innerText||'').trim(), status:(d.querySelector('.lib-over__status')?.innerText||'').trim(), title:(d.querySelector('.lib-over__title')?.innerText||'').trim(), poster:!!d.querySelector('.lib-over__poster svg'), textLeft:Math.round(d.querySelector('.lib-over__text').getBoundingClientRect().left)}})()`);
  const active = (s) => s.ev(`(()=>{const a=document.activeElement; return {cls:String(a.className||a.tagName), label:(a.getAttribute('aria-label')||a.innerText||'').trim().slice(0,30), inOver:!!a.closest('.lib-over'), inLib:!!a.closest('#library')}})()`);
  const toLib = async (s, path = "/lab") => { await s.go(path, 6500); await s.ev(`document.getElementById('library').scrollIntoView()`); await sleep(2200); };

  if (mode === "reading-room") {

  // ── desktop ──
  let s = await session();
  await toLib(s);
  const k = keyEv(s), mouse = click(s);
  const gone = await s.ev(`['.lib-cursor','.lib-play','.lib-grain','.lib-logo','.lib-bar','.lib-ind'].filter((q)=>document.querySelector(q)).concat(getComputedStyle(document.querySelector('#library')).cursor==='none'?['cursor:none']:[])`);
  rec("1440px: the custom cursor, play ring, grain, separate logo, top bar and shelf indicator are gone", gone.length === 0, gone.join(", "));
  const look = await s.ev(`(()=>{const q=(x)=>document.querySelector(x); const cs=(x)=>getComputedStyle(q(x)); return {bg:cs('#library').backgroundColor, h2:q('.lib-head h2')?.innerText, label:q('.lib-head__n')?.innerText, open:[...document.querySelectorAll('button')].filter(b=>/open reading note/i.test(b.innerText)).length, title:parseFloat(cs('.lib-cap-title').fontSize), note:parseFloat(cs('.lib-cap-note').fontSize), status:parseFloat(cs('.lib-cap-status').fontSize), titleW:cs('.lib-cap-title').fontWeight, noteFont:cs('.lib-cap-note').fontFamily}})()`);
  rec("1440px: paper scene, exhibition numbered label, display heading, and exactly one 'Open reading note' action", look.bg === "rgb(237, 235, 228)" && /^\(01\)/.test(look.label ?? "") && /Books that shaped the way I build\./.test(look.h2 ?? "") && look.open === 1, `bg ${look.bg}; label "${look.label}"; h2 "${look.h2}"; actions ${look.open}`);
  const cap0 = await readCap(s);
  rec("1440px: the selected book shows reading status, author, title and note in a descending hierarchy", !!cap0.title && !!cap0.sub && !!cap0.status && cap0.note.length > 40 && look.title >= 2 * look.note && look.note > look.status && String(look.titleW) === "800" && /Instrument/i.test(look.noteFont), `title ${look.title}px/${look.titleW}, note ${look.note}px, status ${look.status}px; "${cap0.title}" · ${cap0.sub} · ${cap0.status}`);

  // keyboard browsing: the section takes focus (programmatic setup), then real arrow keys step through all 14 books and wrap
  await s.ev(`document.getElementById('library').focus()`);
  const titles = [cap0.title];
  for (let i = 0; i < 14; i++) { await k("ArrowRight"); titles.push((await readCap(s)).title); }
  rec("1440px keyboard: ArrowRight steps through 14 distinct books and wraps to the first", new Set(titles.slice(0, 14)).size === 14 && titles[14] === titles[0], titles.slice(0, 4).join(" | ") + " …");
  await k("ArrowLeft"); const back = (await readCap(s)).title;
  rec("1440px keyboard: ArrowLeft steps back", back === titles[13], `"${back}" (wanted "${titles[13]}")`);
  const live = await readCap(s);
  rec("1440px keyboard: the screen-reader line follows the selection (title, author, status)", /\bby\b/.test(live.sr) && /(Reading now|Read)\.$/.test(live.sr), live.sr);

  // every book: the caption never moves the controls, and no line overflows
  const ys = [], overflow = [];
  for (let i = 0; i < 14; i++) {
    await k("ArrowRight");
    const m = await s.ev(`(()=>{const r=document.getElementById('library').getBoundingClientRect(); const o=document.querySelector('.lib-open').getBoundingClientRect(); const bad=[...document.querySelectorAll('.lib-cap-title,.lib-cap-note,.lib-cap-sub')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.className); return {y:Math.round(o.top-r.top), bad}})()`);
    ys.push(m.y); overflow.push(...m.bad);
  }
  rec("1440px: across all 14 books the 'Open reading note' row never moves and no caption line overflows", Math.max(...ys) - Math.min(...ys) <= 1 && overflow.length === 0, `row offset ${Math.min(...ys)}..${Math.max(...ys)}px; overflow ${overflow.join(",") || "none"}`);

  // tab order: the four shelves, previous, open, next, the credit link
  await s.ev(`document.activeElement.blur(); const b=document.getElementById('library'); b.focus()`);
  const order = [];
  for (let i = 0; i < 8; i++) { await k("Tab"); order.push((await active(s)).label); }
  rec("1440px keyboard: Tab reaches All, Engineering, Thinking, Philosophy, Previous book, Open reading note, Next book, then the credit link, in that order",
    JSON.stringify(order.map((x) => x.toLowerCase())) === JSON.stringify(["all", "engineering", "thinking", "philosophy", "previous book", "open reading note", "next book", "covers via open library"]), order.join(" > "));
  const before = (await readCap(s)).title;
  await s.ev(`[...document.querySelectorAll('.lib-tab')].find(b=>/engineering/i.test(b.innerText)).focus()`);
  await k("Enter"); await sleep(1200);
  const eng = await s.ev(`document.querySelectorAll('.lib-tab[aria-pressed="true"]').length===1 && /engineering/i.test(document.querySelector('.lib-tab[aria-pressed="true"]').innerText)`);
  rec("1440px keyboard: Enter on a shelf tab moves the shelf and the tab reports pressed", eng && (await readCap(s)).title !== before, `title now "${(await readCap(s)).title}"`);

  // the other browsing interactions, with real mouse input: drag the shelf, scroll it sideways with the wheel, click a neighbouring spine
  await s.ev(`document.querySelector('.lib-shelf').scrollIntoView({block:'center'})`); await sleep(900);
  const shelfC = await centre(s, ".lib-shelf");
  const srTitle = async () => ((await readCap(s)).sr.split(" by ")[0] || "").trim();
  let t0b = await srTitle();
  await s.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1100, y: shelfC.y });
  await s.send("Input.dispatchMouseEvent", { type: "mousePressed", x: 1100, y: shelfC.y, button: "left", buttons: 1, clickCount: 1 });
  for (let i = 1; i <= 12; i++) { await s.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1100 - i * 30, y: shelfC.y, buttons: 1 }); await sleep(30); }
  await s.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: 740, y: shelfC.y, button: "left", buttons: 0, clickCount: 1 }); await sleep(1500);
  let t1b = await srTitle();
  rec("1440px mouse: dragging the shelf sideways changes the book, without opening the overlay", t1b !== t0b && (await over(s)).vis === "hidden", `"${t0b}" to "${t1b}"`);
  await s.send("Input.dispatchMouseEvent", { type: "mouseWheel", x: shelfC.x, y: shelfC.y, deltaX: 260, deltaY: 0 }); await sleep(1800);
  let t2b = await srTitle();
  rec("1440px mouse: a sideways wheel gesture over the shelf changes the book", t2b !== t1b, `"${t1b}" to "${t2b}"`);
  const y0w = await s.ev(`scrollY`);
  await s.send("Input.dispatchMouseEvent", { type: "mouseWheel", x: shelfC.x, y: shelfC.y, deltaX: 0, deltaY: 240 }); await sleep(1200);
  const y1w = await s.ev(`scrollY`);
  rec("1440px mouse: a plain vertical wheel over the shelf scrolls the page and leaves the book alone", y1w > y0w + 100 && (await srTitle()) === t2b, `scrollY ${y0w} to ${y1w}; still "${await srTitle()}"`);
  await s.ev(`document.querySelector('.lib-shelf').scrollIntoView({block:'center'})`); await sleep(700);
  const spine = await s.ev(`(()=>{let best=null; for(const t of document.querySelectorAll('.lib-tape')){ if(getComputedStyle(t).visibility==='hidden') continue; const r=t.querySelector('.lib-sp').getBoundingClientRect(); const cx=r.x+r.width/2; if(r.width<20||cx<innerWidth/2+260||cx>innerWidth-40) continue; const d=cx-innerWidth/2; if(!best||d<best.d) best={d,x:cx,y:r.y+r.height/2,name:t.getAttribute('data-title')}; } return best})()`);
  await mouse(spine.x, spine.y); await sleep(1500);
  rec("1440px mouse: clicking a neighbouring spine brings that book forward (and does not open the overlay)", (await srTitle()) === spine.name && (await over(s)).vis === "hidden", `clicked "${spine.name}"; selected "${await srTitle()}"`);
  await s.ev(`document.activeElement.blur(); document.getElementById('library').focus()`);
  await k("Enter"); await sleep(900);
  const enterOpened = (await over(s)).vis === "visible";
  await k("Escape"); await sleep(900);
  const enterClosed = (await over(s)).vis === "hidden", focusId = await s.ev(`document.activeElement.id`);
  rec("1440px keyboard: Enter on the focused Reading Room opens the overlay, and Escape closes it and returns focus to the section", enterOpened && enterClosed && focusId === "library", `opened ${enterOpened}; closed ${enterClosed}; focus on #${focusId}`);

  // overlay from the action, by keyboard: opens, takes focus, traps it, Escape closes and focus returns to the action
  await s.ev(`document.querySelector('.lib-open').focus()`);
  const sr = (await readCap(s)).sr, capNote = (await readCap(s)).note;
  await k("Enter"); await sleep(900);
  let o = await over(s), a = await active(s);
  rec("1440px overlay: Enter on 'Open reading note' opens a full-screen modal dialog named for the book, and the page behind is locked",
    o.vis === "visible" && o.w === 1440 && o.h === 900 && o.top === 0 && o.role === "dialog" && o.modal === "true" && o.hidden === "false" && o.overflow === "hidden" && sr.startsWith(o.label), `${o.w}x${o.h}; label "${o.label}"; scroll lock "${o.overflow}"`);
  rec("1440px overlay: focus moves to the close button", a.inOver && /gx-over__close/.test(a.cls), a.cls);
  rec("1440px overlay: it shows the same note as the caption, plus author, status, title and the cover", o.lesson === capNote && o.status.length > 0 && o.eyebrow.length > 0 && o.title === o.label && o.poster, `note match ${o.lesson === capNote}; "${o.eyebrow}" / "${o.status}"`);
  let stayed = true; for (let i = 0; i < 3; i++) { await k("Tab"); stayed = stayed && (await active(s)).inOver; } await k("Tab", 8); stayed = stayed && (await active(s)).inOver;
  rec("1440px overlay: Tab and Shift+Tab never leave the dialog", stayed);
  await k("Escape"); await sleep(900);
  o = await over(s); a = await active(s);
  rec("1440px overlay: Escape closes it, unlocks the page, and returns focus to 'Open reading note'", o.vis === "hidden" && o.overflow === "" && /lib-open/.test(a.cls), `visibility ${o.vis}; scroll lock "${o.overflow}"; focus ${a.label}`);

  // overlay from the cover, by mouse: click the front cover, close with the close button
  const cover = await s.ev(`(()=>{let best=null; for(const t of document.querySelectorAll('.lib-tape')){ if(getComputedStyle(t).visibility==='hidden') continue; const r=t.querySelector('.lib-cv').getBoundingClientRect(); const cx=r.x+r.width/2; const d=Math.abs(cx-innerWidth/2); if(!best||d<best.d) best={d,x:cx,y:r.y+r.height/2}; } return best})()`);
  await mouse(cover.x, cover.y); await sleep(900);
  o = await over(s);
  rec("1440px overlay: clicking the front cover opens it too", o.vis === "visible" && o.w === 1440, `visibility ${o.vis}`);
  const cl = await centre(s, ".gx-over__close"); await mouse(cl.x, cl.y); await sleep(900);
  o = await over(s); a = await active(s);
  rec("1440px overlay: the close button closes it and focus returns inside the Reading Room", o.vis === "hidden" && a.inLib, `visibility ${o.vis}; focus ${a.cls.slice(0, 30)}`);
  rec("1440px: no console errors", s.errors.length === 0, s.errors.slice(0, 2).join(" | "));
  s.done();

  // ── reduced motion ──
  s = await session({ reduced: true });
  await toLib(s);
  const kr = keyEv(s);
  await s.ev(`document.getElementById('library').focus()`);
  const t0 = (await readCap(s)).title;
  await kr("ArrowRight");
  const c1 = await readCap(s);
  rec("reduced motion: the shelf and the caption change at once, with no sliding lines left behind", c1.title !== t0 && c1.leaving === 0, `"${t0}" to "${c1.title}"; leaving lines ${c1.leaving}`);
  await s.ev(`document.querySelector('.lib-open').focus()`);
  await s.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" }); await sleep(25); await s.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 }); await sleep(250);
  o = await over(s);
  rec("reduced motion: the overlay is open and full screen within 250 ms", o.vis === "visible" && o.w === 1440 && o.h === 900, `${o.w}x${o.h} ${o.vis}`);
  await s.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await sleep(25); await s.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await sleep(250);
  o = await over(s); a = await active(s);
  rec("reduced motion: Escape closes it within 250 ms and focus returns to the action", o.vis === "hidden" && /lib-open/.test(a.cls), `visibility ${o.vis}; focus ${a.label}`);
  s.done();

  // ── phone ──
  for (const [w, h] of [[390, 844], [768, 1024]]) {
    s = await session({ w, h, mobile: true, touch: true });
    await toLib(s);
    const tp = tap(s);
    const L = `${w}px`;
    const lay = await s.ev(`(()=>{const q=(x)=>[...document.querySelectorAll(x)]; const vis=(e)=>{const r=e.getBoundingClientRect(); return r.left>=0&&r.right<=innerWidth+0.5&&r.width>0}; return {over:document.documentElement.scrollWidth-innerWidth, tabs:q('.lib-tab').map(e=>({ok:vis(e),h:Math.round(e.getBoundingClientRect().height)})), ctl:q('.lib-ctl button').map(e=>({n:e.getAttribute('aria-label')||e.innerText,ok:vis(e),h:Math.round(e.getBoundingClientRect().height),w:Math.round(e.getBoundingClientRect().width)}))}})()`);
    rec(`${L}: no sideways overflow; the four shelves, Previous, Open reading note and Next are all on screen and at least 44px tall`, lay.over <= 0 && lay.tabs.length === 4 && lay.tabs.every((t) => t.ok && t.h >= 44) && lay.ctl.length === 3 && lay.ctl.every((c) => c.ok && c.h >= 44 && c.w >= 44), `overflow ${lay.over}; tabs ${lay.tabs.map((t) => t.h).join(",")}; controls ${lay.ctl.map((c) => `${c.n} ${c.w}x${c.h}`).join("; ")}`);
    await s.ev(`document.querySelector('.lib-ctl').scrollIntoView({block:'center'})`); await sleep(800);
    const hits = await s.ev(`(()=>{const out=[]; for(const e of document.querySelectorAll('.lib-ctl button, .lib-tab')){const r=e.getBoundingClientRect(); if(r.bottom<0||r.top>innerHeight) continue; const x=r.x+r.width/2, y=r.y+r.height/2; const hit=document.elementFromPoint(x,y); let f=hit; while(f&&f!==document.body&&getComputedStyle(f).position!=='fixed') f=f.parentElement; out.push({n:(e.getAttribute('aria-label')||e.innerText).trim().slice(0,20), ok:hit===e||e.contains(hit), by: (hit===e||e.contains(hit))?'':(f&&f!==document.body?(f.className||f.tagName).toString().slice(0,20)+' (fixed)':String(hit?.className||hit?.tagName).slice(0,20))})} return out})()`);
    rec(`${L}: with the action row in the middle of the screen, a touch at the centre of each visible control reaches that control`, hits.length >= 3 && hits.every((x) => x.ok), `${hits.length} checked; ${hits.filter((x) => !x.ok).map((x) => `${x.n} hit by ${x.by}`).join("; ") || "none obstructed"}`);
    // information only: the page's own fixed Sound and Terminal buttons can sit over the action row when it is scrolled to the bottom of the screen
    const zones = [];
    for (const frac of [0.2, 0.5, 0.85]) {
      await s.ev(`(()=>{const r=document.querySelector('.lib-ctl').getBoundingClientRect(); scrollBy(0, r.top + r.height/2 - innerHeight*${frac})})()`); await sleep(500);
      const z = await s.ev(`(()=>{const bad=[]; for(const e of document.querySelectorAll('.lib-ctl button')){const r=e.getBoundingClientRect(); if(r.bottom<0||r.top>innerHeight) continue; const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2); if(!(hit===e||e.contains(hit))) bad.push((e.getAttribute('aria-label')||e.innerText).trim().slice(0,14)+' covered by '+String(hit?.closest('button')?.innerText||hit?.className||hit?.tagName).trim().slice(0,14))} return bad})()`);
      zones.push(`${Math.round(frac * 100)}%: ${z.length ? z.join("; ") : "clear"}`);
    }
    out.push(`INFO  ${L}: action row at 20% / 50% / 85% of the screen height: ${zones.join(" | ")}`);
    await s.ev(`document.querySelector('.lib-ctl').scrollIntoView({block:'center'})`); await sleep(600);
    const t1 = (await readCap(s)).title;
    const nx = await centre(s, '.lib-arrow[aria-label="Next book"]'); await tp(nx.x, nx.y);
    const t2 = (await readCap(s)).title;
    const pv = await centre(s, '.lib-arrow[aria-label="Previous book"]'); await tp(pv.x, pv.y);
    rec(`${L}: touching Next and Previous changes the book and back`, t2 !== t1 && (await readCap(s)).title === t1, `"${t1}" > "${t2}" > "${(await readCap(s)).title}"`);
    const ys2 = [], wide = [];
    for (let i = 0; i < 14; i++) {
      const n2 = await centre(s, '.lib-arrow[aria-label="Next book"]'); await tp(n2.x, n2.y);
      const m = await s.ev(`(()=>{const r=document.getElementById('library').getBoundingClientRect(); const o=document.querySelector('.lib-open').getBoundingClientRect(); const bad=[...document.querySelectorAll('.lib-cap-title,.lib-cap-note,.lib-cap-sub')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.className); return {y:Math.round(o.top-r.top), bad}})()`);
      ys2.push(m.y); wide.push(...m.bad);
    }
    rec(`${L}: across all 14 books the action row never moves and no caption line overflows`, Math.max(...ys2) - Math.min(...ys2) <= 1 && wide.length === 0, `row offset ${Math.min(...ys2)}..${Math.max(...ys2)}px; overflow ${wide.join(",") || "none"}`);
    const op = await centre(s, ".lib-open"); await tp(op.x, op.y); await sleep(600);
    o = await over(s);
    rec(`${L}: touching 'Open reading note' opens a full-screen overlay with the cover, and the text clears the screen edge`, o.vis === "visible" && o.w === w && o.h === h && o.poster && o.textLeft >= 14, `${o.w}x${o.h}; text starts ${o.textLeft}px from the left`);
    const cc = await centre(s, ".gx-over__close"); await tp(cc.x, cc.y); await sleep(600);
    o = await over(s); a = await active(s);
    rec(`${L}: touching Back to the shelf closes it, unlocks the page and returns focus to the action`, o.vis === "hidden" && o.overflow === "" && /lib-open/.test(a.cls), `visibility ${o.vis}; focus ${a.label}`);
    rec(`${L}: no console errors`, s.errors.length === 0, s.errors.slice(0, 2).join(" | "));
    s.done();
  }
  }

  // ═══ covers that fail or are slow ═══
  if (mode === "reading-room-covers") {
    // A synthetic cover (two colour bands) served in place of the Open Library image, so the "slow, then arrives" case needs no network.
    const { deflateSync, crc32 } = await import("node:zlib");
    const png = (w, h, top, bottom) => {
      const raw = Buffer.alloc((w * 3 + 1) * h);
      for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; const c = y < h / 2 ? top : bottom; for (let x = 0; x < w; x++) { raw[y * (w * 3 + 1) + 1 + x * 3] = c[0]; raw[y * (w * 3 + 1) + 2 + x * 3] = c[1]; raw[y * (w * 3 + 1) + 3 + x * 3] = c[2]; } }
      const chunk = (t, d) => { const b = Buffer.concat([Buffer.from(t), d]); const o = Buffer.alloc(4); o.writeUInt32BE(crc32(b)); const l = Buffer.alloc(4); l.writeUInt32BE(d.length); return Buffer.concat([l, b, o]); };
      const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
      return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ih), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]).toString("base64");
    };
    const COVER = png(40, 60, [30, 140, 90], [160, 50, 40]);
    // How much detail is in a region? The standard deviation of its luminance: a flat colour block is near 0, generated art or a real cover is not.
    const detail = async (s, r) => {
      const shot = await s.send("Page.captureScreenshot", { format: "png" });
      return s.ev(`new Promise((res)=>{const i=new Image(); i.onload=()=>{const c=document.createElement('canvas'); const x0=${r.x}+${r.w}*.2, y0=${r.y}+${r.h}*.2, w=${r.w}*.6, h=${r.h}*.6; c.width=Math.max(4,Math.round(w)); c.height=Math.max(4,Math.round(h)); const g=c.getContext('2d'); g.drawImage(i,x0,y0,w,h,0,0,c.width,c.height); const d=g.getImageData(0,0,c.width,c.height).data; let n=0,m=0,q=0; for(let k=0;k<d.length;k+=4){const l=.3*d[k]+.59*d[k+1]+.11*d[k+2]; n++; m+=l; q+=l*l} res(Math.sqrt(Math.max(0,q/n-(m/n)*(m/n))))}; i.src='data:image/png;base64,${shot.result.data}'})`);
    };
    const frontCover = (s) => s.ev(`(()=>{let best=null; for(const t of document.querySelectorAll('.lib-tape')){ if(getComputedStyle(t).visibility==='hidden') continue; const r=t.querySelector('.lib-cv').getBoundingClientRect(); const d=Math.abs(r.x+r.width/2-innerWidth/2); if(!best||d<best.d) best={d,x:r.x,y:r.y,w:r.width,h:r.height}; } return best})()`);
    const posterRect = (s) => s.ev(`(()=>{const r=document.querySelector('.lib-over__poster').getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}})()`);
    // images that are showing without having loaded: a flat tint where the generated art should be
    const phantom = (s) => s.ev(`[...document.querySelectorAll('.lib-cover-img')].filter((i)=>{const cs=getComputedStyle(i); return cs.display!=='none' && Number(cs.opacity)>0 && !(i.complete && i.naturalWidth>0)}).length`);
    // the cover image and its colour block are only allowed in the overlay once the image has loaded (a failed <image> draws a broken-image icon over the art)
    const tintBoxes = (s) => s.ev(`document.querySelectorAll('.lib-over__poster [data-cover-tint], .lib-over__poster [data-cover-image]').length`);

    const scenarios = [
      ["every cover request fails (network error)", (s, p) => s.send("Fetch.failRequest", { requestId: p.requestId, errorReason: "Failed" })],
      ["every cover request returns 404 (what Open Library sends for a missing cover)", (s, p) => s.send("Fetch.fulfillRequest", { requestId: p.requestId, responseCode: 404, responseHeaders: [{ name: "Content-Type", value: "text/plain" }], body: Buffer.from("not found").toString("base64") })],
      ["every cover request hangs (slow connection)", null],
    ];
    for (const [label, respond] of scenarios) {
      const s = await session();
      const held = []; let seen = 0;
      s.on("Fetch.requestPaused", (p) => { seen++; if (respond) respond(s, p); else held.push(p.requestId); });
      await s.send("Fetch.enable", { patterns: [{ urlPattern: "*covers.openlibrary.org*" }] });
      await s.go("/lab", 6500);
      await s.ev(`document.getElementById('library').scrollIntoView()`); await sleep(4500);
      const L = label.split(" (")[0];
      rec(`covers, ${L}: the requests were really intercepted`, seen >= 1, `${seen} cover requests intercepted${respond ? "" : `, ${held.length} held`}`);
      const fc = await frontCover(s);
      const shelfDetail = await detail(s, { x: fc.x, y: fc.y, w: fc.w, h: fc.h });
      rec(`covers, ${L}: the pulled-out cover on the shelf shows the generated artwork (not a flat colour), and no image is showing unloaded`, shelfDetail > 12 && (await phantom(s)) === 0, `detail ${shelfDetail.toFixed(1)} (flat colour is near 0); unloaded images showing: ${await phantom(s)}`);
      await s.ev(`document.querySelector('.lib-open').click()`); await sleep(2500);
      const pr = await posterRect(s);
      if (process.env.RR_SHOT) (await import("node:fs")).writeFileSync(`${process.env.RR_SHOT}-${scenarios.findIndex((x) => x[0] === label)}.png`, Buffer.from((await s.send("Page.captureScreenshot", { format: "png" })).result.data, "base64"));
      const overlayDetail = await detail(s, pr);
      rec(`covers, ${L}: the overlay's cover shows the generated artwork, with no colour block or image element over it`, overlayDetail > 12 && (await tintBoxes(s)) === 0, `detail ${overlayDetail.toFixed(1)}; colour block or image elements over the art: ${await tintBoxes(s)}`);
      rec(`covers, ${L}: the overlay's text, close button and focus work as usual`, await s.ev(`(()=>{const d=document.querySelector('.lib-over'); return getComputedStyle(d).visibility==='visible' && document.activeElement.classList.contains('gx-over__close') && d.querySelector('.lib-over__lesson').innerText.length>40})()`));
      if (!respond) {
        // the slow request finally answers: the real image is swapped in, in both places
        for (const id of held) { try { await s.send("Fetch.fulfillRequest", { requestId: id, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: "image/png" }, { name: "Access-Control-Allow-Origin", value: "*" }], body: COVER }); } catch {} }
        await sleep(2500);
        const arrived = await s.ev(`({poster: !!document.querySelector('.lib-over__poster [data-cover-image]'), imgs:[...document.querySelectorAll('.lib-cover-img')].filter(i=>i.complete&&i.naturalWidth>0&&Number(getComputedStyle(i).opacity)>0).length})`);
        rec(`covers, ${L}: when the image finally arrives it replaces the artwork, in the overlay and on the shelf`, arrived.poster && arrived.imgs > 0, `overlay image ${arrived.poster}; shelf images showing ${arrived.imgs}`);
      }
      await s.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await sleep(900);
      rec(`covers, ${L}: no script errors`, s.errors.length === 0, s.errors.slice(0, 2).join(" | "));
      s.done();
    }
  }
  // ═══ real touch dragging, odd layouts, overlay scrolling, reading order ═══
  if (mode === "reading-room-touch") {
    const drag = (s) => async (x0, x1, y) => {
      await s.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y }] }); await sleep(50);
      for (let i = 1; i <= 14; i++) { await s.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 + ((x1 - x0) * i) / 14, y }] }); await sleep(18); }
      await s.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await sleep(1300);
    };
    const swipeY = (s) => async (x, y, dy) => { await s.send("Input.synthesizeScrollGesture", { x, y, yDistance: -dy, gestureSourceType: "touch", speed: 700, preventFling: true }); await sleep(900); };
    const srTitle = async (s) => (((await readCap(s)).sr.split(" by ")[0]) || "").trim();
    for (const [w, h, name] of [[390, 844, "phone portrait 390x844"], [600, 900, "600x900"], [844, 390, "phone landscape 844x390"], [667, 375, "small phone landscape 667x375"]]) {
      const s = await session({ w, h, mobile: true, touch: true });
      await toLib(s);
      const L = name, tp = tap(s), dr = drag(s), sy = swipeY(s);

      // layout and reach
      const lay = await s.ev(`(()=>{const vis=(e)=>{const r=e.getBoundingClientRect(); return r.left>=-0.5&&r.right<=innerWidth+0.5&&r.width>0}; const q=(x)=>[...document.querySelectorAll(x)]; const cv=[...document.querySelectorAll('.lib-tape')].filter(t=>getComputedStyle(t).visibility!=='hidden').map(t=>t.querySelector('.lib-cv').getBoundingClientRect()).sort((a,b)=>Math.abs(a.x+a.width/2-innerWidth/2)-Math.abs(b.x+b.width/2-innerWidth/2))[0]; return {over:document.documentElement.scrollWidth-innerWidth, tabs:q('.lib-tab').map(e=>({ok:vis(e),h:Math.round(e.getBoundingClientRect().height)})), ctl:q('.lib-ctl button').map(e=>({ok:vis(e),h:Math.round(e.getBoundingClientRect().height),w:Math.round(e.getBoundingClientRect().width)})), coverH:Math.round(cv.height), head:vis(document.querySelector('.lib-head__h')), foot:vis(document.querySelector('.lib-credit'))}})()`);
      rec(`${L}: no sideways overflow; heading, 4 shelves, 3 controls and the credit link are inside the screen; controls at least 44px; the pulled-out cover is at least 120px tall`, lay.over <= 0 && lay.head && lay.foot && lay.tabs.length === 4 && lay.tabs.every((t) => t.ok && t.h >= 44) && lay.ctl.length === 3 && lay.ctl.every((c) => c.ok && c.h >= 44 && c.w >= 44) && lay.coverH >= 120, `overflow ${lay.over}; cover ${lay.coverH}px tall; controls ${lay.ctl.map((c) => `${c.w}x${c.h}`).join(" ")}`);
      const hit = [], low = [];
      for (const sel of [".lib-head__h", ".lib-tabs", ".lib-ctl"]) {
        await s.ev(`document.querySelector(${JSON.stringify(sel)}).scrollIntoView({block:'center'})`); await sleep(500);
        const r = await s.ev(`(()=>{const out=[]; for(const e of document.querySelectorAll('.lib-tab, .lib-ctl button')){const r=e.getBoundingClientRect(); if(r.bottom<0||r.top>innerHeight) continue; const x=r.x+r.width/2,y=r.y+r.height/2; const hit=document.elementFromPoint(x,y); const own=hit===e||e.contains(hit); let f=hit; while(f&&f!==document.body&&getComputedStyle(f).position!=='fixed') f=f.parentElement; out.push({n:(e.getAttribute('aria-label')||e.innerText).trim().slice(0,16), ok:own, by: own?'':((f&&f!==document.body?'a fixed page button ('+(f.innerText||f.className).toString().trim().slice(0,14)+')':String(hit?.className||hit?.tagName).slice(0,24))), bottom: y > innerHeight - 110})} return out})()`);
        hit.push(...r.filter((x) => !x.bottom)); low.push(...r.filter((x) => x.bottom && !x.ok));
      }
      rec(`${L}: a touch at the centre of every shelf tab and control that is not in the bottom 110px of the screen reaches it`, hit.length >= 7 && hit.every((x) => x.ok), `${hit.length} checks; ${hit.filter((x) => !x.ok).map((x) => `${x.n} hit by ${x.by}`).join("; ") || "none obstructed"}`);
      out.push(`INFO  ${L}: controls whose centre is in the bottom 110px of the screen and is covered: ${low.length ? [...new Set(low.map((x) => `${x.n} by ${x.by}`))].join("; ") : "none"}`);

      // real touch drag on the shelf
      await s.ev(`document.querySelector('.lib-shelf').scrollIntoView({block:'center'})`); await sleep(800);
      const sh = await centre(s, ".lib-shelf");
      const y0 = await s.ev(`scrollY`), t0 = await srTitle(s);
      await dr(w * 0.78, w * 0.22, sh.y);
      const t1 = await srTitle(s);
      rec(`${L}: a real touch drag leftwards across the shelf changes the book, does not open the overlay, and does not scroll the page`, t1 !== t0 && (await over(s)).vis === "hidden" && Math.abs((await s.ev(`scrollY`)) - y0) <= 2, `"${t0}" to "${t1}"; scrollY moved ${Math.abs((await s.ev(`scrollY`)) - y0)}px`);
      await dr(w * 0.22, w * 0.78, sh.y);
      const t2 = await srTitle(s);
      rec(`${L}: dragging back rightwards changes the book again (${t2 === t0 ? "back to the first" : "to a different one"})`, t2 !== t1, `"${t1}" to "${t2}"`);
      const yA = await s.ev(`scrollY`);
      const room = await s.ev(`document.documentElement.scrollHeight - innerHeight - scrollY`);
      const dy = room >= 300 ? 260 : -260;   // down if the page has room below, otherwise back up
      await sy(w / 2, sh.y, dy);
      const moved2 = Math.abs((await s.ev(`scrollY`)) - yA);
      rec(`${L}: a vertical swipe that starts on the shelf scrolls the page ${dy > 0 ? "down" : "up"} by about the distance swiped and leaves the book alone`, moved2 >= 200 && (await srTitle(s)) === t2, `scrollY moved ${moved2}px of 260; still "${await srTitle(s)}"`);
      await s.ev(`document.querySelector('.lib-shelf').scrollIntoView({block:'center'})`); await sleep(800);
      const sp = await s.ev(`(()=>{let best=null; for(const t of document.querySelectorAll('.lib-tape')){ if(getComputedStyle(t).visibility==='hidden') continue; const r=t.querySelector('.lib-sp').getBoundingClientRect(); const cx=r.x+r.width/2; if(r.width<14||cx<innerWidth/2+${Math.round(w * 0.2)}||cx>innerWidth-10) continue; const d=cx-innerWidth/2; if(!best||d<best.d) best={d,x:cx,y:r.y+r.height/2,name:t.querySelector('.lib-sp')?.parentElement?.getAttribute('data-name')||''}; } return best})()`);
      if (sp) { const before = await srTitle(s); await tp(sp.x, sp.y); await sleep(900); rec(`${L}: tapping a neighbouring spine brings it forward (and does not open the overlay)`, (await srTitle(s)) !== before && (await over(s)).vis === "hidden", `"${before}" to "${await srTitle(s)}"`); }
      else rec(`${L}: tapping a neighbouring spine brings it forward`, false, "no spine was visible beside the cover to tap");

      // overlay: open by touch, scroll it by touch, close it
      await s.ev(`document.querySelector('.lib-ctl').scrollIntoView({block:'center'})`); await sleep(600);
      const op = await centre(s, ".lib-open"); await tp(op.x, op.y); await sleep(900);
      let o = await over(s);
      const sc = await s.ev(`(()=>{const d=document.querySelector('.lib-over'); return {scrollable:d.scrollHeight>d.clientHeight+4, sh:d.scrollHeight, ch:d.clientHeight}})()`);
      const winY = await s.ev(`scrollY`);
      if (sc.scrollable) await sy(w / 2, Math.round(h * 0.62), 400);
      const st = await s.ev(`(()=>{const d=document.querySelector('.lib-over'); const b=document.querySelector('.gx-over__close').getBoundingClientRect(); const hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2); return {top:d.scrollTop, closeVisible:b.top>=0&&b.bottom<=innerHeight, closeHit:hit===document.querySelector('.gx-over__close')||document.querySelector('.gx-over__close').contains(hit), page:scrollY}})()`);
      rec(`${L}: the overlay opens full screen; ${sc.scrollable ? "a touch scroll moves its content (" + sc.sh + "px of content in " + sc.ch + "px)" : "its content fits"}; the page behind does not move; the close button stays reachable`, o.vis === "visible" && o.w === w && o.h === h && (!sc.scrollable || st.top >= Math.min(100, sc.sh - sc.ch) - 2) && st.page === winY && st.closeVisible && st.closeHit, `${o.w}x${o.h}; overlay scrollTop ${st.top}; page scrollY ${winY} to ${st.page}; close visible ${st.closeVisible}, hit ${st.closeHit}`);
      const cc = await centre(s, ".gx-over__close"); await tp(cc.x, cc.y); await sleep(800);
      o = await over(s); const a = await active(s);
      rec(`${L}: touching Back to the shelf closes it, unlocks the page and returns focus to the action`, o.vis === "hidden" && o.overflow === "" && /lib-open/.test(a.cls), `visibility ${o.vis}; focus ${a.label}`);
      rec(`${L}: no console errors`, s.errors.length === 0, s.errors.slice(0, 2).join(" | "));

      // reading order, on the phone portrait layout only
      if (w === 390) {
        await s.ev(`document.getElementById('library').scrollIntoView()`); await sleep(500);
        await s.send("Accessibility.enable"); await s.send("DOM.enable");
        const doc = await s.send("DOM.getDocument", { depth: 0 });
        const sec = await s.send("DOM.querySelector", { nodeId: doc.result.root.nodeId, selector: "#library" });
        const bid = (await s.send("DOM.describeNode", { nodeId: sec.result.nodeId })).result.node.backendNodeId;
        const nodes = (await s.send("Accessibility.getFullAXTree")).result.nodes;
        const byId = new Map(nodes.map((n) => [n.nodeId, n]));
        const root = nodes.find((n) => n.backendDOMNodeId === bid);
        const seq = [];
        const walk = (n) => { if (!n) return; if (!n.ignored) { const r = n.role?.value, nm = (n.name?.value ?? "").toString().trim(); if (["heading", "button", "link"].includes(r) || (r === "StaticText" && nm)) seq.push({ r, nm, desc: n.description?.value ?? "" }); } (n.childIds ?? []).forEach((c) => walk(byId.get(c))); };
        walk(root);
        const names = seq.filter((x) => x.r !== "StaticText" || x.nm.length > 0).map((x) => `${x.r}:${x.nm}`);
        const bookButtons = seq.filter((x) => x.r === "button" && / by /.test(x.nm)).length;
        rec(`${L} reading order: the 42 shelf tapes (3 copies of 14 books) are not exposed to assistive technology as buttons`, bookButtons === 0, `${bookButtons} book buttons in the accessibility tree`);
        const idx = (re) => names.findIndex((x) => re.test(x));
        out.push(`INFO  ${L} reading order: what assistive technology meets, in order: ${names.map((x) => x.slice(0, 40)).join(" | ")}`);
        const order = [idx(/heading:Books that shaped/i), idx(/button:All$/i), idx(/button:Engineering/i), idx(/button:Thinking/i), idx(/button:Philosophy/i), -2, idx(/button:Previous book/i), idx(/button:Open reading note/i), idx(/button:Next book/i), idx(/link:Covers via Open Library/i)];
        order[5] = names.findIndex((x, i) => i > order[4] && /^StaticText:by$/.test(x));
        rec(`${L} reading order: assistive technology meets the heading, the four shelves, the selection summary, Previous, Open reading note, Next, then the credit link, in that order`, order.every((v, i) => v >= 0 && (i === 0 || v > order[i - 1])), `positions ${order.join(",")}`);
        const open = seq.find((x) => x.r === "button" && /Open reading note/.test(x.nm));
        const note = (await readCap(s)).note;
        rec(`${L} reading order: the book's note (otherwise visible but hidden from assistive technology) is the description of the Open reading note button`, !!open && note.length > 40 && (open.desc || "").includes(note.slice(0, 40)), `description "${(open?.desc || "").slice(0, 60)}"`);
        // keyboard order against visual order
        await s.ev(`document.activeElement.blur(); document.getElementById('library').focus()`);
        const seen = [];
        for (let i = 0; i < 8; i++) { await s.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }); await sleep(20); await s.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }); await sleep(250); seen.push(await s.ev(`(()=>{const a=document.activeElement; const r=a.getBoundingClientRect(); return {n:(a.getAttribute('aria-label')||a.innerText||'').trim().slice(0,24), top:Math.round(r.top+scrollY), left:Math.round(r.left)}})()`)); }
        const downward = seen.every((x, i) => i === 0 || x.top > seen[i - 1].top - 2 || (Math.abs(x.top - seen[i - 1].top) <= 2 && x.left >= seen[i - 1].left));
        rec(`${L} reading order: Tab visits the controls in the order they appear on screen (top to bottom, left to right)`, seen.length === 8 && downward, seen.map((x) => `${x.n}@${x.top}`).join(" > "));
        rec(`${L} reading order: on a phone the visible order is books, controls, then status, title, note; the focusable order is unaffected by that`, await s.ev(`(()=>{const t=(q)=>document.querySelector(q).getBoundingClientRect().top; return t('.lib-shelf')<t('.lib-ctl') && t('.lib-ctl')<t('.lib-cap-status') && t('.lib-cap-status')<t('.lib-cap-title') && t('.lib-cap-title')<t('.lib-cap-note') && t('.lib-cap-note')<t('.lib-foot')})()`));
      }
      s.done();
    }

    // the navigation bar against the Reading Room's own controls: scroll up through them with real input and check what a pointer would hit
    for (const [w, h, touch, name] of [[390, 844, true, "phone portrait 390x844"], [844, 390, true, "phone landscape 844x390"], [1024, 768, false, "1024x768 with a mouse"], [1440, 900, false, "1440x900 with a mouse"]]) {
      const s = await session({ w, h, mobile: touch, touch });
      await toLib(s);
      const swipe = async (dy) => { await s.send("Input.synthesizeScrollGesture", { x: Math.round(w / 2), y: Math.round(h / 2), yDistance: -dy, gestureSourceType: touch ? "touch" : "mouse", speed: touch ? 500 : 800, preventFling: true }); await sleep(800); };
      const probe = () => s.ev(`(()=>{const out=[]; for(const e of document.querySelectorAll('.lib-tab, .lib-ctl button, .lib-credit')){const r=e.getBoundingClientRect(); let l=Math.max(0,r.left),t=Math.max(0,r.top),rt=Math.min(innerWidth,r.right),b=Math.min(innerHeight,r.bottom); if(rt-l<4||b-t<4) continue; const hit=document.elementFromPoint((l+rt)/2,(t+b)/2); out.push({n:(e.getAttribute('aria-label')||e.innerText).trim().slice(0,16), nav:!!hit?.closest('.exnav'), own:hit===e||e.contains(hit)})} return {y:Math.round(scrollY), hidden:/is-hidden|is-yield/.test(document.querySelector('.exnav').className), tabsTop:document.querySelector('.lib-tabs').getBoundingClientRect().top, out}})()`);
      await s.ev(`document.querySelector('.lib-credit').scrollIntoView({block:'start'})`); await sleep(900);   // lower controls at the top of the screen
      let checks = 0, guard = 0, still = 0; const bad = []; let last = await s.ev(`scrollY`);
      while (guard++ < 100) {
        await swipe(-40);
        const p = await probe(); checks += p.out.length;
        p.out.filter((x) => x.nav).forEach((x) => bad.push(`${x.n} @scrollY ${p.y}`));
        if (p.tabsTop > 150) break;   // the shelf tabs have passed under the bar
        still = Math.abs(p.y - last) < 5 ? still + 1 : 0;
        if (still >= 2) break;   // two gestures in a row that did not move the page: the top of the page
        last = p.y;
      }
      // at 390 px the page ends before the shelf tabs can reach the bar, so only a few positions are reachable there; elsewhere the sweep must cover the tabs and the action row
      rec(`${name}: scrolling up through the Reading Room, the navigation bar never sits on a shelf tab, a control or the credit link`, checks >= (w === 390 ? 7 : 25) && bad.length === 0, `${checks} checks in ${guard} steps; ${[...new Set(bad)].slice(0, 4).join("; ") || "none covered by the bar"}`);
      s.done();
    }
  }
}
console.log(out.join("\n")); process.exit(0);
