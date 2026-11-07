// Does the floating navigation get in the way of controls on a phone? usage: node qa/navobs.mjs [base]
//
// What this exercises (headless Chrome, 390x844 mobile emulation with touch):
//   - real touch input: a tap (Input.dispatchTouchEvent) and swipes (Input.synthesizeScrollGesture, gestureSourceType "touch");
//     the page is never scrolled with window.scrollBy/scrollTo here, so the page's own scroll-direction logic runs
//   - real key events (Input.dispatchKeyEvent) for the keyboard-focus case
// What it asserts:
//   - the controls were actually found (a count is asserted, so "found nothing" fails instead of passing)
//   - at every sampled scroll position, the visible centre of every control (gallery selector tabs, and the controls inside the
//     active exhibit) is what a pointer would actually hit: elementFromPoint at that centre returns the control itself
//   - scrolling down hides the bar; scrolling up through the control strips yields to them and returns after them
//   - keyboard focus on the bar brings it back, and it hides again once focus has left and the page is scrolled down
// What it does not do: it does not run in Safari, and the one programmatic step is placing focus on the first control after the
// bar (focus()) before pressing a real Shift+Tab, because Chrome has no sequential-focus start point in a fresh page.
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
  const idx = document.querySelector('.gx__index')?.getBoundingClientRect();
  const menu = document.querySelector('.exnav__menu');
  const mc = menu ? menu.getBoundingClientRect() : null;
  const mhit = mc ? document.elementFromPoint(mc.x + mc.width / 2, mc.y + mc.height / 2) : null;
  return {
    y: Math.round(scrollY), hidden: nav.classList.contains('is-hidden'),
    selTop: idx ? Math.round(idx.top) : null, selBottom: idx ? Math.round(idx.bottom) : null,
    selUnderBar: !!idx && idx.bottom > 0 && idx.top < 72,
    menuOnScreen: !!mc && mc.top >= 0 && mc.bottom <= innerHeight, menuHit: !!mhit && (mhit === menu || menu.contains(mhit)),
    inNav: !!document.activeElement?.closest('.exnav'), active: document.activeElement?.className?.toString().slice(0, 30) || document.activeElement?.tagName,
    ctrls,
  };
})()`;

// ── real input ──
const tap = async (x, y) => { await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] }); await sleep(60); await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await sleep(500); };
// positive dy reads further down the page. The bar's own transition is ~350 ms, so wait it out before sampling.
const swipe = async (dy) => { const y0 = await ev("scrollY"); await send("Input.synthesizeScrollGesture", { x: 195, y: 420, yDistance: -dy, gestureSourceType: "touch", speed: 500, preventFling: true }); await sleep(800); return (await ev("scrollY")) - y0; };
const tab = async (shift) => { const m = shift ? 8 : 0; await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, modifiers: m }); await sleep(20); await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, modifiers: m }); await sleep(500); };
const summary = (cs) => cs.filter((c) => !c.ok).map((c) => `${c.n} @y${c.y} hit ${c.by}`).slice(0, 4).join("; ");

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await send("Page.navigate", { url: base + "/#work" }); await sleep(6500);
await sleep(1500); // let the hash-landing retries finish

// 1 ── the selector is found and every tab's visible centre receives input
let s = await ev(PROBE);
const tabs = s.ctrls.filter((c) => /Taxproof|Retail|Preventive/i.test(c.n));
rec("gallery selector: all 3 tabs found on screen, and each visible centre hits the tab itself", tabs.length === 3 && tabs.every((c) => c.ok), `found ${tabs.length}; ${summary(s.ctrls) || "none blocked"}`);

// 2 ── a real touch tap on the Retail tab selects it
const pt = await ev(`(()=>{const r=document.getElementById('gx-tab-1').getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
await tap(pt.x, pt.y); await sleep(1800);
rec("touch tap on the Retail tab selects it", (await ev(`document.getElementById('gx-tab-1').getAttribute('aria-selected')`)) === "true");

// 3 ── touch-scroll DOWN until the chart's range buttons are near the top; the bar must be away and nothing sits under it
let moved = [];
for (let i = 0; i < 14 && (await ev(`document.querySelector('.rm__range').getBoundingClientRect().top`)) > 60; i++) moved.push(await swipe(110));
s = await ev(PROBE);
const retailCtl = s.ctrls.filter((c) => /^S\d|wk|1 yr|All|band|Expand/i.test(c.n));
rec("touch scroll down: the page moved with every swipe and the range buttons reached the top of the screen", moved.length > 0 && moved.every((d) => d > 20) && (await ev(`document.querySelector('.rm__range').getBoundingClientRect().top`)) <= 60, `${moved.length} swipes, moved ${moved.join(",")}px`);
rec("touch scroll down: the bar is hidden and the Retail controls (series, ranges, band, Expand) are found", s.hidden && retailCtl.length >= 8, `hidden ${s.hidden}; found ${retailCtl.length} Retail controls`);
let all = [...s.ctrls]; let sawYield = false, sawReturn = false, samples = 1; const offenders = [];
if (s.ctrls.some((c) => !c.ok)) offenders.push(`down: ${summary(s.ctrls)}`);

// 4 ── touch-scroll UP in small steps, past the chart controls and past the gallery selector, sampling every step
let upMoves = [], guard = 0;
while (guard++ < 40) {
  const d = await swipe(-70); upMoves.push(d);
  s = await ev(PROBE); samples++; all = all.concat(s.ctrls);
  if (s.ctrls.some((c) => !c.ok)) offenders.push(`y${s.y} ${s.hidden ? "bar hidden" : "bar shown"}: ${summary(s.ctrls)}`);
  if (s.selUnderBar && s.hidden) sawYield = true;
  if (!s.hidden && s.menuOnScreen) sawReturn = true;
  if (s.selTop !== null && s.selTop > 150) break;       // the selector has passed under the bar and is well below it
  if (d >= -5) break;                                    // reached the top of the page or the swipe did not move it
}
rec("touch scroll up: every swipe moved the page up, and the selector was reached", upMoves.length > 3 && upMoves.slice(0, -1).every((d) => d < -20) && s.selTop !== null && s.selTop > 150, `${upMoves.length} swipes; selector top ${s.selTop}`);
rec(`visible centre of every control receives input at all ${samples} sampled positions (down, then up through the control strips)`, offenders.length === 0 && all.length >= 30, `${all.length} control checks; ${offenders.slice(0, 3).join(" | ") || "none obstructed"}`);
rec("scroll up: the bar stayed away while the selector or a control strip was under it", sawYield);
rec("scroll up: the bar returned once they had passed, and its Menu button is hit at its centre", sawReturn && s.menuHit && s.menuOnScreen && !s.hidden, `shown ${!s.hidden}, menu hit ${s.menuHit}`);

// 5 ── keyboard: hide the bar again, then bring focus back to it with real Shift+Tab
await swipe(130); await swipe(130);
s = await ev(PROBE);
const hiddenAgain = s.hidden;
const anchored = await ev(`(()=>{const nav=document.querySelector('.exnav'); const f=[...document.querySelectorAll('a[href],button:not([disabled]),input,[tabindex]:not([tabindex="-1"])')].find(e=>!nav.contains(e)&&(nav.compareDocumentPosition(e)&Node.DOCUMENT_POSITION_FOLLOWING)&&e.offsetParent!==null); if(!f) return null; f.focus({preventScroll:true}); return (f.innerText||f.getAttribute('aria-label')||f.tagName).trim().slice(0,28)})()`);
await tab(true);
s = await ev(PROBE);
rec("keyboard: with the bar hidden, a real Shift+Tab from the first control after it lands on the bar and brings it back", hiddenAgain && !!anchored && s.inNav && !s.hidden && /exnav__menu/.test(s.active), `hidden before ${hiddenAgain}; anchored on "${anchored}"; focus now ${s.active}; bar shown ${!s.hidden}`);
rec("keyboard: the focused Menu button is on screen and receives input at its centre", s.menuOnScreen && s.menuHit);
await tab(false); await tab(false);
s = await ev(PROBE);
const left = !s.inNav;
// Tabbing onward can scroll the page back to the top, where the bar is always shown (by design, below 140 px). Read down again first.
for (let i = 0; i < 5 && (await ev("scrollY")) < 400; i++) await swipe(130);
s = await ev(PROBE);
rec("keyboard: once focus has left the bar, scrolling down hides it again", left && s.hidden && s.y >= 400, `focus left bar ${left}; scrollY ${s.y}; hidden ${s.hidden}`);

console.log(out.join("\n"));
ws.close(); chrome.kill();
process.exit(bad ? 1 : 0);
