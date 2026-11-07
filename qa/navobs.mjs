// Does the floating navigation get in the way of controls? usage: node qa/navobs.mjs [base]
//
// Runs the same journey at 390, 768, 960 (touch) and 1024, 1440 px (real mouse wheel and mouse clicks), headless Chrome.
// What this exercises:
//   - real input: taps and swipes (Input.synthesizeScrollGesture, touch) up to 960 px; mouse clicks and mouse-wheel scrolling
//     from 1024 px; real key events for the keyboard case. The page is never scrolled with scrollBy/scrollTo, so the page's own
//     scroll logic runs.
// What it asserts, at every width:
//   - the controls were actually found (counts are asserted, so "found nothing" fails instead of passing)
//   - after each scroll step on the way down and then back up through the gallery selector and the Retail controls, the visible
//     centre of every control (selector tabs and the active exhibit's buttons) is what a pointer would actually hit
//   - when the bar is showing, the centre of each of its own controls receives input
//   - up to 960 px: scrolling down hides the bar, scrolling up yields to the selector and control strips and returns after, and
//     keyboard focus on the bar brings it back (real Shift+Tab) and it hides again once focus has left
// What it does not do: no Safari; Chrome's touch emulation is not a finger on iOS. From 1024 px the keyboard case is not run
// (the bar's Menu button is not shown there). One programmatic setup step: focus() on the first control after the bar before the
// real Shift+Tab.
import { spawn } from "node:child_process";
import { CHROME } from "./chrome.mjs";

const base = process.argv[2] ?? "http://localhost:3300";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 9000 + Math.floor(Math.random() * 900);
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/cdpn-${port}`, "about:blank"], { stdio: "ignore" });
process.on("exit", () => chrome.kill());
let t;
for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (t.find((x) => x.type === "page")) break; } catch {} await sleep(250); }
const ws = new WebSocket(t.find((x) => x.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result.result?.value;

const out = []; let bad = 0;
const rec = (name, ok, detail = "") => { if (!ok) bad++; out.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`); };

// ── page-side probe: where is the bar, and what would a pointer hit at the visible centre of each control? ──
const PROBE = `(() => {
  const nav = document.querySelector('.exnav');
  const visible = (el) => {                       // the part of the control that is on screen and not clipped by an ancestor
    const r = el.getBoundingClientRect();
    let l = Math.max(0, r.left), tp = Math.max(0, r.top), rt = Math.min(innerWidth, r.right), b = Math.min(innerHeight, r.bottom);
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      const q = (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') ? a.getBoundingClientRect() : null;
      if (q && cs.overflowX !== 'visible') { l = Math.max(l, q.left); rt = Math.min(rt, q.right); }
      if (q && cs.overflowY !== 'visible') { tp = Math.max(tp, q.top); b = Math.min(b, q.bottom); }
    }
    return rt - l >= 4 && b - tp >= 4 ? { x: (l + rt) / 2, y: (tp + b) / 2 } : null;
  };
  const name = (el) => (el.getAttribute('aria-label') || el.innerText || el.className || el.tagName).toString().trim().replace(/\\s+/g, ' ').slice(0, 24);
  const live = (el) => !el.closest('[aria-hidden="true"]');
  const sel = [...document.querySelectorAll('.gx__index [role=tab]'), ...document.querySelectorAll('.gx__stage [role=tabpanel] button, .gx__stage [role=tabpanel] a[href]')].filter(live);
  const ctrls = [];
  for (const el of sel) {
    const c = visible(el); if (!c) continue;
    const hit = document.elementFromPoint(c.x, c.y);
    ctrls.push({ n: name(el), y: Math.round(c.y), ok: hit === el || el.contains(hit), by: hit?.closest('.exnav') ? 'NAV' : (hit ? String(hit.className || hit.tagName).slice(0, 24) : 'nothing') });
  }
  const navCtl = [];                              // the bar's own controls that are on screen: does a pointer hit each one?
  for (const el of document.querySelectorAll('.exnav a, .exnav button')) {
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || r.bottom <= 0 || r.top >= innerHeight) continue;
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    navCtl.push({ n: name(el), ok: hit === el || el.contains(hit) });
  }
  const idx = document.querySelector('.gx__index')?.getBoundingClientRect();
  const menu = document.querySelector('.exnav__menu');
  const mc = menu ? menu.getBoundingClientRect() : null;
  const mhit = mc ? document.elementFromPoint(mc.x + mc.width / 2, mc.y + mc.height / 2) : null;
  return {
    y: Math.round(scrollY), hidden: nav.classList.contains('is-hidden'), yielded: /is-yield/.test(nav.className),
    selTop: idx ? Math.round(idx.top) : null, selBottom: idx ? Math.round(idx.bottom) : null,
    selUnderBar: !!idx && idx.bottom > 0 && idx.top < 72,
    menuOnScreen: !!mc && mc.top >= 0 && mc.bottom <= innerHeight, menuHit: !!mhit && (mhit === menu || menu.contains(mhit)),
    inNav: !!document.activeElement?.closest('.exnav'), active: document.activeElement?.className?.toString().slice(0, 30) || document.activeElement?.tagName,
    navCtl, ctrls,
  };
})()`;

// ── real input ──
const summary = (cs) => cs.filter((c) => !c.ok).map((c) => `${c.n} @y${c.y} hit ${c.by}`).slice(0, 4).join("; ");
const tab = async (shift) => { const m = shift ? 8 : 0; await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, modifiers: m }); await sleep(20); await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, modifiers: m }); await sleep(500); };

async function runWidth({ w, h, touch }) {
  const L = `${w}px`;
  const mobile = w <= 960 && touch;
  const tap = async (x, y) => {
    if (touch) { await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] }); await sleep(60); await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); }
    else { await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y }); await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 }); await sleep(40); await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 }); }
    await sleep(500);
  };
  // positive dy reads further down the page. The bar's own transition is ~350 ms, so wait it out before sampling.
  const swipe = async (dy) => { const y0 = await ev("scrollY"); await send("Input.synthesizeScrollGesture", { x: Math.round(w / 2), y: 420, yDistance: -dy, gestureSourceType: touch ? "touch" : "mouse", speed: touch ? 500 : 800, preventFling: true }); await sleep(800); return (await ev("scrollY")) - y0; };

  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: touch });
  await send("Emulation.setTouchEmulationEnabled", { enabled: touch, maxTouchPoints: touch ? 5 : 0 });
  await send("Page.navigate", { url: `${base}/?nw=${w}#work` }); await sleep(7500);

  // 1 ── the selector is found and every tab's visible centre receives input
  let s = await ev(PROBE);
  const tabs = s.ctrls.filter((c) => /Taxproof|Retail|Preventive/i.test(c.n));
  rec(`${L}: gallery selector: all 3 tabs found on screen, and each visible centre hits the tab itself`, tabs.length === 3 && tabs.every((c) => c.ok), `found ${tabs.length}; ${summary(s.ctrls) || "none blocked"}`);

  // 2 ── a real tap or click on the Retail tab selects it
  const pt = await ev(`(()=>{const r=document.getElementById('gx-tab-1').getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await tap(pt.x, pt.y); await sleep(1800);
  rec(`${L}: ${touch ? "touch tap" : "mouse click"} on the Retail tab selects it`, (await ev(`document.getElementById('gx-tab-1').getAttribute('aria-selected')`)) === "true");

  // 3 ── scroll DOWN until the chart's range buttons are near the top of the screen
  const moved = [];
  // Position under control: coarse gestures down, then corrective gestures (either direction) until the range buttons sit 0 to 60 px
  // from the top, i.e. under where the bar would be. A fixed number of gestures lands on a threshold at some widths and overshoots.
  const rtop = () => ev(`document.querySelector('.rm__range').getBoundingClientRect().top`);
  for (let i = 0; i < 20; i++) { const t0 = await rtop(); if (t0 >= 0 && t0 <= 60) break; moved.push(await swipe(Math.max(-120, Math.min(110, Math.round(t0 - 30))))); }
  s = await ev(PROBE);
  const retailCtl = s.ctrls.filter((c) => /^S\d|wk|1 yr|All|band|Expand/i.test(c.n));
  const rangeTop = await ev(`document.querySelector('.rm__range').getBoundingClientRect().top`);
  rec(`${L}: ${touch ? "touch" : "mouse-wheel"} scroll down: the page moved and the range buttons are 0 to 60 px from the top of the screen`, moved.length > 0 && moved.some((d) => d > 20) && rangeTop >= 0 && rangeTop <= 60, `${moved.length} gestures, moved ${moved.join(",")}px, range top ${Math.round(rangeTop)}`);
  rec(`${L}: scroll down: the Retail controls (series, ranges, band, Expand) are found${mobile ? " and the bar is hidden" : ""}`, retailCtl.length >= 8 && (!mobile || s.hidden), `found ${retailCtl.length} of ${s.ctrls.length} controls (${s.ctrls.map((c) => c.n).join(' | ').slice(0, 160)}); bar hidden ${s.hidden}; scrollY ${s.y}; range top ${Math.round(rangeTop)}`);
  let all = [...s.ctrls]; let sawYield = false, sawReturn = false, samples = 1, hiddenSamples = s.hidden ? 1 : 0; const offenders = [], navBad = [];
  if (s.ctrls.some((c) => !c.ok)) offenders.push(`down y${s.y}: ${summary(s.ctrls)}`);

  // 4 ── scroll UP in small steps past the chart controls and past the gallery selector, sampling every step
  const step = touch ? 70 : 40; const upMoves = []; let guard = 0;
  while (guard++ < 70) {
    const d = await swipe(-step); upMoves.push(d);
    s = await ev(PROBE); samples++; all = all.concat(s.ctrls);
    if (s.hidden || s.yielded) hiddenSamples++;
    if (s.ctrls.some((c) => !c.ok)) offenders.push(`y${s.y} ${s.hidden ? "bar hidden" : "bar shown"}: ${summary(s.ctrls)}`);
    if (s.navCtl.some((c) => !c.ok)) navBad.push(`y${s.y}: ${s.navCtl.filter((c) => !c.ok).map((c) => c.n).join(",")}`);
    if (s.selUnderBar && s.hidden) sawYield = true;
    if (!s.hidden) sawReturn = true;
    if (s.selTop !== null && s.selTop > 150) break;       // the selector has passed under the bar and is well below it
    if (d >= -5) break;                                    // top of the page reached, or the gesture did not move it
  }
  rec(`${L}: scroll up: every gesture moved the page up, and the selector was reached`, upMoves.length > 3 && upMoves.slice(0, -1).every((d) => d < -10) && s.selTop !== null && s.selTop > 150, `${upMoves.length} gestures; selector top ${s.selTop}`);
  rec(`${L}: visible centre of every control receives input at all ${samples} sampled positions (down, then up through the control strips)`, offenders.length === 0 && all.length >= 30, `${all.length} control checks; ${offenders.slice(0, 3).join(" | ") || "none obstructed"}`);
  rec(`${L}: whenever the bar is showing, each of its own on-screen controls receives input at its centre`, navBad.length === 0 && sawReturn && !s.hidden && s.navCtl.length >= 2, `${s.navCtl.length} bar controls on screen at the end; ${navBad.slice(0, 2).join(" | ") || "none obstructed"}`);
  if (mobile) {
    rec(`${L}: scroll up: the bar stayed away while the selector or a control strip was under it`, sawYield);
    rec(`${L}: scroll up: the bar returned once they had passed, and its Menu button is hit at its centre`, sawReturn && s.menuHit && s.menuOnScreen && !s.hidden, `shown ${!s.hidden}, menu hit ${s.menuHit}`);
  } else {
    out.push(`INFO  ${L}: a capsule stepped aside in ${hiddenSamples} of ${samples} samples while a control sat under it (not an assertion by itself; the obstruction assertions above are)`);
  }

  // 5 ── keyboard (up to 960 px, where the Menu button is the bar's last control): hide the bar, then bring focus back with a real Shift+Tab
  if (mobile) {
    await swipe(130); await swipe(130);
    s = await ev(PROBE);
    const hiddenAgain = s.hidden;
    const anchored = await ev(`(()=>{const nav=document.querySelector('.exnav'); const f=[...document.querySelectorAll('a[href],button:not([disabled]),input,[tabindex]:not([tabindex="-1"])')].find(e=>!nav.contains(e)&&(nav.compareDocumentPosition(e)&Node.DOCUMENT_POSITION_FOLLOWING)&&e.offsetParent!==null); if(!f) return null; f.focus({preventScroll:true}); return (f.innerText||f.getAttribute('aria-label')||f.tagName).trim().slice(0,28)})()`);
    await tab(true);
    s = await ev(PROBE);
    rec(`${L}: keyboard: with the bar hidden, a real Shift+Tab from the first control after it lands on the bar and brings it back`, hiddenAgain && !!anchored && s.inNav && !s.hidden && /exnav__menu/.test(s.active), `hidden before ${hiddenAgain}; focus now ${s.active}; bar shown ${!s.hidden}`);
    rec(`${L}: keyboard: the focused Menu button is on screen and receives input at its centre`, s.menuOnScreen && s.menuHit);
    await tab(false); await tab(false);
    s = await ev(PROBE);
    const left = !s.inNav;
    // Tabbing onward can scroll the page back to the top, where the bar is always shown (by design, below 140 px). Read down again first.
    for (let i = 0; i < 6 && (await ev("scrollY")) < 400; i++) await swipe(130);
    s = await ev(PROBE);
    rec(`${L}: keyboard: once focus has left the bar, scrolling down hides it again`, left && s.hidden && s.y >= 400, `focus left bar ${left}; scrollY ${s.y}; hidden ${s.hidden}`);
  }
}

await send("Page.enable");
// NAVOBS_WIDTHS=768,1024 runs only those widths (for reproducing one)
const only = process.env.NAVOBS_WIDTHS?.split(",").map(Number);
for (const cfg of [{ w: 390, h: 844, touch: true }, { w: 768, h: 1024, touch: true }, { w: 960, h: 800, touch: true }, { w: 1024, h: 768, touch: false }, { w: 1440, h: 900, touch: false }]) if (!only || only.includes(cfg.w)) await runWidth(cfg);

console.log(out.join("\n"));
ws.close(); chrome.kill();
process.exit(bad ? 1 : 0);
