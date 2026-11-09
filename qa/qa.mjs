// Game QA over real browser input. usage: node qa.mjs [base]
import { spawn } from "node:child_process";
import { CHROME } from "./chrome.mjs";
import { readFileSync } from "node:fs";
const base = process.argv[2] ?? "http://localhost:3300";
const sols = JSON.parse(readFileSync(new URL("./.generated/solutions.json", import.meta.url)));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const KEY = { 1: ["ArrowUp", 38], 2: ["ArrowDown", 40], 3: ["ArrowLeft", 37], 4: ["ArrowRight", 39], 0: ["x", 88] };
async function session(opts = {}) {
  const port = 9300 + Math.floor(Math.random() * 600);
  const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/cdpq-${port}`, "about:blank"], { stdio: "ignore" });
  let targets;
  for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.find((t) => t.type === "page")) break; } catch {} await sleep(250); }
  const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result.result?.value;
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: opts.w ?? 1440, height: opts.h ?? 900, deviceScaleFactor: 1, mobile: !!opts.mobile });
  if (opts.touch) await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  if (opts.reduced) await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  const key = async (k, c) => { const code = k.length === 1 ? "Key" + k.toUpperCase() : k === " " ? "Space" : k; await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: k, windowsVirtualKeyCode: c, code }); await sleep(18); await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, windowsVirtualKeyCode: c, code }); };
  const goto = async (p) => { await send("Page.navigate", { url: base + p }); await sleep(3200); };
  const playRun = async (dirs) => { const t0 = performance.now(); for (let i = 0; i < dirs.length; i++) { const w = t0 + 100 * i + (i ? 45 : 0) - performance.now(); if (w > 0) await sleep(w); if (dirs[i] === 0 && i > 0) continue; await key(...KEY[dirs[i]]); } await sleep(260); };
  const text = (sel) => ev(`document.querySelector(${JSON.stringify(sel)})?.innerText ?? null`);
  const done = () => { ws.close(); chrome.kill(); };
  return { send, ev, key, goto, playRun, text, done };
}
const out = [];
const rec = (name, ok, detail = "") => { out.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`); };

// 1. progress saves and unlocks across reloads
{
  const s = await session();
  await s.goto("/play");
  await s.ev(`localStorage.clear()`);
  await s.goto("/play?level=first-echo");
  await s.playRun(sols["first-echo"][0]);
  await sleep(700);
  const solved = await s.text(".eg-solved__card");
  rec("level 1 solved via keyboard", /Perfect loop|Solved/.test(solved ?? ""), (solved ?? "").split("\n").slice(0, 3).join(" "));
  const saved = await s.ev(`localStorage.getItem('echoshift:v1')`);
  const best = saved && JSON.parse(saved).best?.["first-echo"];
  rec("progress written to localStorage", !!best && best.loops === 1 && best.score === 984, JSON.stringify(best ? { loops: best.loops, score: best.score } : null));
  await s.goto("/play");
  await s.ev(`[...document.querySelectorAll('button')].find(b=>/^LEVELS/.test(b.innerText))?.click()`);
  await sleep(700);
  const lv = await s.ev(`[...document.querySelectorAll('.eg-lv')].map(b=>({n:b.querySelector('.eg-lv__t').innerText,dis:b.disabled}))`);
  rec("after reload: level 2 unlocked, level 3 still locked", lv && lv[1].dis === false && lv[2].dis === true, JSON.stringify(lv?.slice(0, 3)));
  await s.ev(`[...document.querySelectorAll('.eg-lv')][1].click()`);
  await sleep(900);
  rec("level select opens the level", (await s.text(".eg-hud__title")) ?.includes("The Switch"));
  s.done();
}

// 2. replay + share + deterministic ghosts
{
  const s = await session();
  await s.goto("/play");
  await s.ev(`localStorage.clear()`);
  await s.ev(`window.__copied=null; Object.defineProperty(navigator,'clipboard',{value:{writeText:async(t)=>{window.__copied=t}},configurable:true})`);
  await s.goto("/play?level=the-switch");
  await s.ev(`window.__copied=null; Object.defineProperty(navigator,'clipboard',{value:{writeText:async(t)=>{window.__copied=t}},configurable:true})`);
  const [r0, r1] = sols["the-switch"];
  await s.playRun(r0); await s.key(" ", 32); await sleep(500); await s.playRun(r1); await sleep(700);
  await s.ev(`[...document.querySelectorAll('.eg-solved button')].find(b=>/SHARE/.test(b.innerText)).click()`);
  await sleep(400);
  const copied = await s.ev(`window.__copied`);
  rec("share copies ECHO//SHIFT text with loops, score and URL", /ECHO\/\/SHIFT/.test(copied ?? "") && /Solved in 2 loops/.test(copied ?? "") && /karthikmannem\.com\/play\?level=the-switch/.test(copied ?? ""), JSON.stringify(copied));
  await s.ev(`[...document.querySelectorAll('.eg-solved button')].find(b=>/REPLAY/.test(b.innerText)).click()`);
  await sleep(600);
  const hint1 = await s.text(".eg-hint");
  rec("replay of saved solution starts", /Replaying/.test(hint1 ?? ""), hint1 ?? "");
  await sleep(2600);
  const hint2 = await s.text(".eg-hint");
  rec("replay ends on its own and returns to the level", !/Replaying/.test(hint2 ?? ""), hint2 ?? "");
  s.done();
}

// 3. dying: step into an active hazard, see the message, auto-retry back to tick 0 with ghosts kept
{
  const s = await session();
  await s.goto("/play?level=timing-matters");
  // walk right along row 1 immediately: hazard at x=4 is active on arrival tick 4 for phase 0, period 6, on 3 -> ticks 0,1,2 on, 3,4,5 off. arrive at tick 4 is SAFE; use S down-left route instead:
  // go (1,1)->(2,1)->(3,1)->(4,1): arrives tick 3 => (3+0)%6=3 safe. Wait 0 then step: tick 1 arrival impossible. So force danger by waiting until tick 6 mod 6 = 0 arrival.
  await s.key("x", 88); // starts the clock (a wait tick)
  await sleep(100 * 4);
  for (const d of [4, 4, 4]) { await s.key(...KEY[d]); await sleep(100); }
  await sleep(400);
  const hint = await s.text(".eg-hint");
  const died = /Caught by a pulse|Restarting/.test(hint ?? "");
  rec("walking into an active pulse kills the run", died, hint ?? "");
  await sleep(1300);
  const after = await s.text(".eg-hint");
  rec("then restarts the run automatically", !/Restarting/.test(after ?? ""), after ?? "");
  s.done();
}

// 4. daily challenge
{
  const s = await session();
  await s.goto("/play");
  const label = await s.ev(`[...document.querySelectorAll('.eg-btn')].find(b=>/DAILY/.test(b.innerText))?.innerText`);
  rec("daily challenge button shows today's number", /DAILY CHALLENGE #\d+/.test(label ?? ""), (label ?? "").replace(/\n/g, " "));
  const n = Number((label ?? "").match(/#(\d+)/)?.[1]);
  await s.goto(`/play?daily=${n}`);
  const title = await s.text(".eg-hud__title");
  const again = await session(); await again.goto(`/play?daily=${n}`);
  const title2 = await again.text(".eg-hud__title");
  rec("same daily number gives the same puzzle in separate sessions", !!title && title === title2, (title ?? "").replace(/\n/g, " "));
  s.done(); again.done();
}

// 5. touch: emulated phone, on-screen pad, no horizontal overflow
{
  const s = await session({ w: 390, h: 844, mobile: true, touch: true });
  await s.goto("/play?level=first-echo");
  const pad = await s.ev(`!!document.querySelector('.eg-pad')`);
  const overflow = await s.ev(`document.documentElement.scrollWidth - innerWidth`);
  rec("touch device shows the on-screen controls", pad === true);
  rec("no horizontal overflow at 390px", overflow <= 0, `scrollWidth-innerWidth=${overflow}`);
  const btn = await s.ev(`(()=>{const b=document.querySelector('.eg-pad__b.r').getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2,w:b.width,h:b.height}})()`);
  rec("pad buttons are at least 44px", btn.w >= 44 && btn.h >= 44, `${Math.round(btn.w)}x${Math.round(btn.h)}`);
  const touch = (type, x, y) => s.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
  const pos = async (id) => { const b = await s.ev(`(()=>{const b=document.querySelector('${id}').getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`); return b; };
  const dirs = sols["first-echo"][0];
  const sel = { 1: ".eg-pad__b.u", 2: ".eg-pad__b.d", 3: ".eg-pad__b.l", 4: ".eg-pad__b.r" };
  const t0 = performance.now();
  for (let i = 0; i < dirs.length; i++) { const w = t0 + 100 * i + (i ? 45 : 0) - performance.now(); if (w > 0) await sleep(w); const p = await pos(sel[dirs[i]]); await touch("touchStart", p.x, p.y); await sleep(20); await touch("touchEnd"); }
  await sleep(900);
  const solved = await s.text(".eg-solved__card");
  rec("level 1 solved with touch controls", /Perfect loop|Solved/.test(solved ?? ""), (solved ?? "").split("\n").slice(0, 2).join(" "));
  s.done();
}

// 6. reduced motion
{
  const s = await session({ reduced: true });
  await s.goto("/play");
  const cls = await s.ev(`document.querySelector('.eg').className`);
  const ghostOpacity = await s.ev(`getComputedStyle(document.querySelector('.eg-bg i')).opacity`);
  const anim = await s.ev(`getComputedStyle(document.querySelector('.eg-logo__ghost')).animationName + '/' + getComputedStyle(document.querySelector('.eg-bg i')).animationName`);
  rec("prefers-reduced-motion switches the game to reduced mode", /is-reduced/.test(cls), cls);
  rec("decorative animation is off under reduced motion", ghostOpacity === "0" && anim === "none/none", `drifting orbs opacity ${ghostOpacity}; animations (logo/orbs) ${anim}`);
  s.done();
}
console.log(out.join("\n"));
process.exit(0);
