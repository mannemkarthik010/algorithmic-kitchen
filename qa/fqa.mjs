// Final QA over real browser input. usage: node fqa.mjs <layout|links|keys|touch|motion|new|finish|retail-a11y> [base]
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
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method === "Runtime.exceptionThrown") errors.push(d.params.exceptionDetails.exception?.description?.split("\n")[0] ?? "exception"); else if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") errors.push(d.params.args.map((a) => a.value ?? a.description).join(" ").slice(0, 140)); };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result.result?.value;
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: o.w ?? 1440, height: o.h ?? 900, deviceScaleFactor: o.dpr ?? 1, mobile: !!o.mobile });
  if (o.touch) await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  if (o.reduced) await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  if (o.cpu) await send("Emulation.setCPUThrottlingRate", { rate: o.cpu });
  const key = async (k, c, code) => { await send("Input.dispatchKeyEvent", { type: k === "Enter" ? "keyDown" : "rawKeyDown", key: k, windowsVirtualKeyCode: c, code: code ?? k, ...(k === "Enter" ? { text: "\r" } : {}) }); await sleep(15); await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, windowsVirtualKeyCode: c, code: code ?? k }); };
  const go = async (path, wait = 5000) => { errors.length = 0; await send("Page.navigate", { url: base + path }); await sleep(wait); };
  return { send, ev, key, go, errors, done: () => { ws.close(); chrome.kill(); } };
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
console.log(out.join("\n")); process.exit(0);
