"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { LIB_BOOKS, CATS, START_INDEX } from "../lib/library";
import { CoverShapes, SpineShapes, COVER_W } from "./LibraryArt";

/**
 * The Library: a 3D shelf of book spines. One book is pulled out and turned to show its cover.
 * Click, drag, arrows, tabs or keys change the book; opening one grows a sheet of paper out of the cover.
 * One requestAnimationFrame loop drives the shelf; the Web Animations API drives reveals. No opacity fades.
 */

const N = LIB_BOOKS.length;
const COPIES = 3;
const TOTAL = N * COPIES;
const EASE = "cubic-bezier(.2,.8,.2,1)";
const SHEET_EASE = "cubic-bezier(.76,0,.18,1)";
const smooth = (x: number) => x * x * (3 - 2 * x);
const mod = (a: number, n: number) => ((a % n) + n) % n;
const upper = (s: string) => s.toUpperCase();

const BLOBS = [
  { cx: 194, cy: 330, delay: 0 }, { cx: 439, cy: 600, delay: 120 }, { cx: 323, cy: 120, delay: 220 },
  { cx: 116, cy: 760, delay: 300 }, { cx: 516, cy: 250, delay: 360 }, { cx: 335, cy: 860, delay: 420 },
  { cx: 297, cy: 470, delay: 180 },
];

type Api = {
  step: (n: number) => void;
  goTab: (i: number) => void;
  open: () => void;
  close: () => void;
};

const statusLabel = (s: string) => (s === "Reading" ? "READING NOW" : "READ");

export default function Library() {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(START_INDEX);
  const [open, setOpen] = useState(false);
  const [detailIdx, setDetailIdx] = useState(START_INDEX);

  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const shelfRef = useRef<HTMLDivElement>(null);
  const indRef = useRef<HTMLSpanElement>(null);
  const playRef = useRef<HTMLButtonElement>(null);
  const capTitle = useRef<HTMLDivElement>(null);
  const capSub = useRef<HTMLDivElement>(null);
  const capYear = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const api = useRef<Api | null>(null);

  useEffect(() => { queueMicrotask(() => setMounted(true)); }, []);

  const tabIndex = 1 + CATS.indexOf(LIB_BOOKS[active].cat);

  /* The cobalt block under the decade-style tabs slides and stretches to the active tab. */
  useEffect(() => {
    if (!mounted) return;
    const place = () => {
      const t = tabRefs.current[tabIndex];
      const ind = indRef.current;
      if (!t || !ind) return;
      ind.style.width = `${t.offsetWidth}px`;
      ind.style.transform = `translateX(${t.offsetLeft}px)`;
    };
    place();
    window.addEventListener("resize", place);
    document.fonts?.ready.then(place);
    return () => window.removeEventListener("resize", place);
  }, [mounted, tabIndex]);

  /* The engine: geometry, the animation loop, and every input. */
  useEffect(() => {
    if (!mounted) return;
    const root = rootRef.current, stage = stageRef.current, shelf = shelfRef.current;
    const play = playRef.current, cursor = cursorRef.current, dlg = detailRef.current;
    const cT = capTitle.current, cS = capSub.current, cY = capYear.current;
    if (!root || !stage || !shelf || !play || !cursor || !dlg || !cT || !cS || !cY) return;

    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const tapes = Array.from(stage.children) as HTMLElement[];

    const g = { W: 0, H: 0, ws: 0, d: 0, gap: 0, rootH: 0, left: 0, top: 0 };
    const S = {
      s: START_INDEX + N, T: START_INDEX + N, hover: -1,
      mx: 0, my: 0, cx: 0, cy: 0, tiltX: 0, tiltY: 0,
      onCover: false, open: false, dragging: false, didDrag: false, inside: false, overBtn: false,
      active: START_INDEX, pendingOpen: false, visible: true, running: false,
      drag: null as null | { x: number; T0: number }, wheelT: 0 as unknown as ReturnType<typeof setTimeout>,
      curState: "", curOn: false, ps: -1,
    };
    const lift = new Float32Array(TOTAL);
    const hidden = tapes.map(() => true);

    const probe = document.createElement("div");
    probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;width:0;height:var(--H)";
    root.appendChild(probe);

    const measure = () => {
      const r = root.getBoundingClientRect();
      g.W = r.width; g.rootH = r.height; g.left = r.left; g.top = r.top;
      g.H = probe.offsetHeight;
      g.ws = (g.H * 142) / 840;
      g.d = (g.H * COVER_W) / 900;
      g.gap = g.H * 0.03;
      root.style.setProperty("--ws", `${g.ws}px`);
      root.style.setProperty("--d", `${g.d}px`);
      play.style.left = `${g.W / 2 - g.d / 2 - 6}px`;
      play.style.top = `${g.rootH / 2 + 0.36 * g.H}px`;
    };

    const rel = (v: number, s: number) => {
      let r = mod(v - s, TOTAL);
      if (r >= TOTAL / 2) r -= TOTAL;
      return r;
    };
    const activeTape = () => {
      for (let v = 0; v < TOTAL; v++) if (Math.abs(rel(v, S.s)) < 0.5) return tapes[v];
      return tapes[START_INDEX + N];
    };

    /* ── caption: each line slides up through its own mask ── */
    const swap = (el: HTMLElement, text: string, dir: number, instant = false) => {
      const olds = Array.from(el.children) as HTMLElement[];
      const span = document.createElement("span");
      span.className = "lib-span";
      span.textContent = text;
      if (instant || rm || olds.length === 0) {
        olds.forEach((o) => o.remove());
        el.appendChild(span);
        return;
      }
      olds.forEach((o) => {
        if (o.dataset.leaving) return;
        o.dataset.leaving = "1";
        o.classList.add("is-abs");
        const from = getComputedStyle(o).transform;
        o.animate([{ transform: from === "none" ? "translateY(0)" : from }, { transform: `translateY(${-dir * 105}%)` }], { duration: 650, easing: EASE, fill: "both" })
          .onfinish = () => o.remove();
      });
      el.appendChild(span);
      span.animate([{ transform: `translateY(${dir * 105}%)` }, { transform: "translateY(0)" }], { duration: 650, easing: EASE, fill: "both" });
    };
    const fillCaption = (idx: number, dir: number, instant = false) => {
      const b = LIB_BOOKS[idx];
      swap(cT, b.short, dir, instant);
      swap(cS, `${upper(b.author)} / ${upper(b.genre)}`, dir, instant);
      swap(cY, statusLabel(b.status), dir, instant);
    };
    fillCaption(S.active, 1, true);

    /* ── the frame loop ── */
    let raf = 0;
    let last = 0;
    const frame = (t: number) => {
      const dt = Math.min((t - (last || t)) / 1000, 0.05);
      last = t;
      const { W, H, ws, d, gap } = g;

      // scroll spring
      const k = S.dragging ? 18 : 5.2;
      if (rm) S.s = S.T;
      else { S.s += (S.T - S.s) * (1 - Math.exp(-k * dt)); if (Math.abs(S.T - S.s) < 1e-4) S.s = S.T; }
      const loop = N * 4;
      if (Math.abs(S.s - N) > loop) { const sh = Math.round((S.s - N) / N) * N; S.s -= sh; S.T -= sh; }

      // active book + caption
      const a = mod(Math.round(S.s), N);
      if (a !== S.active) {
        const dir = Math.sign(S.T - S.s) || (a > S.active ? 1 : -1);
        S.active = a;
        fillCaption(a, dir);
        setActive(a);
      }

      // is the pointer on the open cover? then lean the cover toward it
      const rx = S.mx - g.left, ry = S.my - g.top;
      S.onCover = !S.open && S.inside && Math.abs(rx - W / 2) < 0.55 * d && Math.abs(ry - g.rootH / 2) < 0.55 * H && Math.abs(S.T - S.s) < 0.3;
      const tx = S.onCover ? ((rx - W / 2) / (0.55 * d)) * 9 : ((S.mx - g.left - W / 2) / Math.max(W, 1)) * 5 * (S.inside ? 1 : 0);
      const ty = S.onCover ? (-(ry - g.rootH / 2) / (H / 2)) * 6 : 0;
      const ek = rm ? 1 : 1 - Math.exp(-7 * dt);
      S.tiltY += (tx - S.tiltY) * ek;
      S.tiltX += (ty - S.tiltX) * ek;

      // every tape
      for (let v = 0; v < TOTAL; v++) {
        const r = rel(v, S.s);
        const ar = Math.abs(r);
        const B = ar < 1 ? (r + Math.sin(Math.PI * r) / Math.PI) / 2 : Math.sign(r) * 0.5;
        const x = r * (ws + gap) + (d - ws + 1.6 * gap) * B;
        const el = tapes[v];
        if (Math.abs(x) > W / 2 + 1.5 * d) {
          if (!hidden[v]) { el.style.visibility = "hidden"; hidden[v] = true; }
          continue;
        }
        if (hidden[v]) { el.style.visibility = "visible"; hidden[v] = false; }
        const o = smooth(Math.max(0, 1 - ar));
        const target = S.hover === v && ar > 0.5 ? 1 : 0;
        lift[v] = rm ? target : lift[v] + (target - lift[v]) * (1 - Math.exp(-12 * dt));
        el.style.transform =
          `translate3d(${x.toFixed(2)}px,${(-o * 0.025 * H - lift[v] * 0.045 * H).toFixed(2)}px,${(o * 0.2 * H).toFixed(2)}px) ` +
          `rotateZ(${(-4.5 * o).toFixed(3)}deg) rotateX(${(S.tiltX * o).toFixed(3)}deg) rotateY(${(-90 * o + S.tiltY * o).toFixed(3)}deg)`;
        el.style.zIndex = String(Math.round(100 - ar * 4));
        el.style.setProperty("--ssh", (o * 0.55).toFixed(3));
        el.style.setProperty("--csh", ((1 - o) * 0.5).toFixed(3));
      }

      // play ring pops in once the shelf settles
      const ps = S.open ? 0 : smooth(Math.max(0, 1 - Math.abs(S.T - S.s) * 3));
      if (Math.abs(ps - S.ps) > 0.002) {
        S.ps = ps;
        play.style.transform = `translate(-50%,-50%) scale(${ps.toFixed(3)})`;
        play.style.pointerEvents = ps < 0.2 ? "none" : "auto";
      }

      if (S.pendingOpen && Math.abs(S.T - S.s) < 0.01) { S.pendingOpen = false; openDetail(); }

      // cursor
      if (fine) {
        S.cx += (S.mx - S.cx) * (rm ? 1 : 1 - Math.exp(-16 * dt));
        S.cy += (S.my - S.cy) * (rm ? 1 : 1 - Math.exp(-16 * dt));
        cursor.style.transform = `translate3d(${S.cx.toFixed(1)}px,${S.cy.toFixed(1)}px,0)`;
        const on = S.inside || S.open;
        if (on !== S.curOn) { S.curOn = on; cursor.classList.toggle("is-on", on); }
        const hovRel = S.hover >= 0 ? Math.abs(rel(S.hover, S.s)) : 0;
        const state = S.open ? (S.overBtn ? "btn" : "") : S.onCover ? "open" : S.hover >= 0 && hovRel > 0.5 ? "spine" : S.overBtn ? "btn" : "";
        if (state !== S.curState) {
          cursor.classList.remove("spine", "btn", "open");
          if (state) cursor.classList.add(state);
          S.curState = state;
        }
      }

      if (S.visible || S.open) raf = requestAnimationFrame(frame);
      else S.running = false;
    };
    const start = () => { if (S.running) return; S.running = true; last = 0; raf = requestAnimationFrame(frame); };

    /* ── detail sheet ── */
    let inkRaf = 0;
    const coverRect = () => (activeTape().querySelector(".lib-cv") as HTMLElement).getBoundingClientRect();
    const insetFrom = (r: DOMRect) => `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round 3px)`;

    function openDetail() {
      if (S.open) return;
      if (Math.abs(S.T - S.s) > 0.02) { S.T = Math.round(S.T); S.pendingOpen = true; return; }
      const r = coverRect();
      flushSync(() => { setDetailIdx(S.active); setOpen(true); });
      S.open = true;
      S.hover = -1;
      document.documentElement.style.overflow = "hidden";
      dlg!.getAnimations().forEach((an) => an.cancel());
      dlg!.style.visibility = "visible";
      dlg!.style.transformOrigin = `${r.left + r.width / 2}px ${r.top + r.height / 2}px`;
      dlg!.animate(
        [{ clipPath: insetFrom(r), transform: "rotate(-4.5deg)" }, { clipPath: "inset(0px 0px 0px 0px round 0px)", transform: "rotate(0deg)" }],
        { duration: rm ? 1 : 1050, easing: SHEET_EASE, fill: "both" },
      );
      dlg!.querySelectorAll<HTMLElement>("[data-line]").forEach((el, i) => {
        el.getAnimations().forEach((an) => an.cancel());
        el.animate([{ transform: "translateY(110%)" }, { transform: "translateY(0)" }], { duration: rm ? 1 : 900, delay: rm ? 0 : 620 + i * 75, easing: EASE, fill: "both" });
      });
      // the poster bleeds in as ragged ink blots
      const circles = Array.from(dlg!.querySelectorAll<SVGCircleElement>(".lib-ink-c"));
      circles.forEach((c) => c.setAttribute("r", "0"));
      const t0 = performance.now() + 520 - (rm ? 5000 : 0);
      cancelAnimationFrame(inkRaf);
      const tick = () => {
        const now = performance.now();
        let done = true;
        circles.forEach((c) => {
          const p = Math.min(Math.max((now - t0 - Number(c.dataset.delay)) / 1250, 0), 1);
          c.setAttribute("r", String(720 * (1 - Math.pow(1 - p, 3))));
          if (p < 1) done = false;
        });
        if (!done && S.open) inkRaf = requestAnimationFrame(tick);
      };
      inkRaf = requestAnimationFrame(tick);
      (dlg!.querySelector(".lib-close") as HTMLElement | null)?.focus({ preventScroll: true });
      start();
    }

    function closeDetail() {
      if (!S.open) return;
      S.open = false;
      cancelAnimationFrame(inkRaf);
      setOpen(false);
      const r = coverRect();
      const an = dlg!.animate(
        [{ clipPath: "inset(0px 0px 0px 0px round 0px)", transform: "rotate(0deg)" }, { clipPath: insetFrom(r), transform: "rotate(-4.5deg)" }],
        { duration: rm ? 1 : 850, easing: SHEET_EASE, fill: "both" },
      );
      an.onfinish = () => {
        dlg!.style.visibility = "hidden";
        dlg!.getAnimations().forEach((x) => x.cancel());
        dlg!.querySelectorAll<HTMLElement>("[data-line]").forEach((el) => el.getAnimations().forEach((x) => x.cancel()));
        document.documentElement.style.overflow = "";
        root!.focus({ preventScroll: true });
      };
    }

    /* ── inputs ── */
    const goTo = (T: number) => { S.T = T; start(); };
    const step = (n: number) => goTo(Math.round(S.T) + n);
    api.current = {
      step,
      goTab: (i) => {
        const target = i === 0 ? 0 : LIB_BOOKS.findIndex((b) => b.cat === CATS[i - 1]);
        const from = Math.round(S.T);
        let delta = mod(target - from, N);
        if (delta > N / 2) delta -= N;
        goTo(from + delta);
      },
      open: openDetail,
      close: closeDetail,
    };

    tapes.forEach((el, v) => {
      el.addEventListener("pointerenter", () => { S.hover = v; });
      el.addEventListener("pointerleave", () => { if (S.hover === v) S.hover = -1; });
      el.addEventListener("click", () => {
        if (S.didDrag) { S.didDrag = false; return; }
        const r = rel(v, S.s);
        if (Math.abs(r) < 0.5) openDetail();
        else goTo(Math.round(S.T + r));
      });
    });

    const onMove = (e: PointerEvent) => {
      S.mx = e.clientX; S.my = e.clientY;
      if (!S.cx && !S.cy) { S.cx = S.mx; S.cy = S.my; }
      const r = root.getBoundingClientRect();
      g.left = r.left; g.top = r.top;
      S.inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (S.drag) {
        const dx = e.clientX - S.drag.x;
        if (!S.dragging && Math.abs(dx) > 5) S.dragging = true;
        if (S.dragging) S.T = S.drag.T0 - dx / (g.ws + g.gap);
      }
    };
    const onOver = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      S.overBtn = !!el?.closest?.("button, a, [data-cur='btn']") && !el.closest(".lib-tape");
    };
    const onDown = (e: PointerEvent) => {
      if (S.open || (e.target as HTMLElement).closest("button, a")) return;
      S.drag = { x: e.clientX, T0: S.T };
    };
    const onUp = () => {
      if (!S.drag) return;
      if (S.dragging) { S.didDrag = true; S.T = Math.round(S.T); setTimeout(() => { S.didDrag = false; }, 0); }
      S.dragging = false; S.drag = null;
    };
    const onWheel = (e: WheelEvent) => {
      if (S.open) return;
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.2 || (e.shiftKey && Math.abs(e.deltaY) > 0);
      if (!horizontal) return; // plain vertical scrolling still scrolls the page
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > 0 ? e.deltaX : e.deltaY;
      S.T += (delta / (g.ws + g.gap)) * 0.5;
      clearTimeout(S.wheelT);
      S.wheelT = setTimeout(() => { S.T = Math.round(S.T); }, 160);
      start();
    };
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (S.open) { if (e.key === "Escape") { e.preventDefault(); closeDetail(); } return; }
      if (!S.inside && !root.contains(document.activeElement)) return;
      if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
      else if ((e.key === "Enter") && (e.target === root || e.target === document.body)) { e.preventDefault(); openDetail(); }
    };

    const io = new IntersectionObserver(([en]) => { S.visible = en.isIntersecting; if (S.visible) { measure(); start(); } }, { rootMargin: "120px" });
    io.observe(root);
    const onResize = () => measure();
    measure();
    start();

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    shelf.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    root.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(measure);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(inkRaf);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      shelf.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      root.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      document.documentElement.style.overflow = "";
      probe.remove();
      api.current = null;
    };
  }, [mounted]);

  const db = LIB_BOOKS[detailIdx];
  const long = db.title.length > 34;

  return (
    <section id="reading" ref={rootRef} className="lib" tabIndex={0} aria-label="Reading room: Karthik's bookshelf" data-no-ember>
      {/* top bar */}
      <div className="lib-bar">
        <span className="lib-lbl lib-box">The library</span>
        <div className="lib-logo">
          <span className="lib-logo__t">The Reading Room</span>
          <span className="lib-logo__s">KARTHIK MANNEM</span>
        </div>
        <span className="lib-lbl lib-right">{N} BOOKS / {CATS.length} SHELVES</span>
      </div>

      {/* shelf tabs */}
      <nav className="lib-tabs" aria-label="Shelves">
        <span className="lib-ind" ref={indRef} aria-hidden="true" />
        {["All", ...CATS].map((c, i) => (
          <button key={c} type="button" ref={(el) => { tabRefs.current[i] = el; }} className={`lib-lbl lib-tab${tabIndex === i ? " is-on" : ""}`} onClick={() => api.current?.goTab(i)}>{c}</button>
        ))}
      </nav>

      {/* 3D shelf */}
      <div className="lib-shelf" ref={shelfRef}>
        <div className="lib-stage" ref={stageRef}>
          {Array.from({ length: TOTAL }).map((_, v) => {
            const b = LIB_BOOKS[v % N];
            return (
              <div key={v} className="lib-tape" role="button" tabIndex={-1} aria-label={`${b.title} by ${b.author}`}>
                <div className="lib-face lib-sp"><svg viewBox="0 0 142 840" preserveAspectRatio="none" aria-hidden="true"><SpineShapes book={b} /></svg></div>
                <div className="lib-face lib-cv"><svg viewBox={`0 0 ${COVER_W} 900`} preserveAspectRatio="none" aria-hidden="true"><CoverShapes book={b} /></svg>
                  {b.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="lib-cover-img" src={b.cover.src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" style={{ background: b.cover.tint }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button type="button" ref={playRef} className="lib-play" aria-label="Open book" onClick={() => api.current?.open()}>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1 L11 6 L2 11 Z" fill="currentColor" /></svg>
      </button>

      {/* caption */}
      <div className="lib-cap" aria-live="polite">
        <span className="lib-sr">{LIB_BOOKS[active].title} by {LIB_BOOKS[active].author}</span>
        <div className="lib-mask lib-cap-title" ref={capTitle} aria-hidden="true" />
        <div className="lib-mask lib-lbl lib-cap-sub" ref={capSub} aria-hidden="true" />
        <div className="lib-mask lib-cap-year" ref={capYear} aria-hidden="true" />
      </div>

      <button type="button" className="lib-arrow lib-arrow--l" aria-label="Previous book" onClick={() => api.current?.step(-1)}>
        <svg width="18" height="10" viewBox="0 0 18 10" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="M5 1 L1 5 L5 9 M1 5 H17" /></svg>
      </button>
      <button type="button" className="lib-arrow lib-arrow--r" aria-label="Next book" onClick={() => api.current?.step(1)}>
        <svg width="18" height="10" viewBox="0 0 18 10" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="M13 1 L17 5 L13 9 M17 5 H1" /></svg>
      </button>

      <div className="lib-foot">
        <span className="lib-lbl">BOOKS THAT SHAPED THE WAY I BUILD.</span>
        <span className="lib-foot__r">
          <span className="lib-lbl lib-foot__hint">DRAG · ← → · CLICK THE COVER</span>
          <a className="lib-lbl lib-credit" href="https://openlibrary.org" target="_blank" rel="noopener noreferrer">COVERS VIA OPEN LIBRARY</a>
        </span>
      </div>

      <div className="lib-grain" aria-hidden="true" />

      {mounted && createPortal(
        <>
          <div className="lib-cursor" ref={cursorRef} aria-hidden="true">
            <i className="lib-ring" /><i className="lib-dot" />
            <span className="lib-lbl lib-cur-lbl">OPEN<br />BOOK</span>
          </div>

          <div className="lib-detail" ref={detailRef} role="dialog" aria-modal="true" aria-label={db.title} aria-hidden={!open} data-no-ember>
            <div className="lib-d-top">
              <button type="button" className="lib-lbl lib-box lib-close" onClick={() => api.current?.close()}>CLOSE</button>
              <div className="lib-logo lib-logo--d"><span className="lib-logo__t">The Reading Room</span><span className="lib-logo__s">KARTHIK MANNEM</span></div>
            </div>
            <div className="lib-d-grid">
              <div className="lib-d-text">
                <div className="lib-mask"><div data-line className="lib-lbl lib-cobalt">{upper(db.author)} / {upper(db.genre)}</div></div>
                <div className="lib-mask"><h3 data-line className={`lib-d-title${long ? " is-long" : ""}`}>{db.title}</h3></div>
                <div className="lib-mask"><div data-line className="lib-lbl lib-muted">{statusLabel(db.status)} / {upper(db.cat)} SHELF</div></div>
                <div className="lib-mask"><p data-line className="lib-d-syn">{db.lesson}</p></div>
                {db.story && <div className="lib-mask"><p data-line className="lib-d-credit">{db.story}</p></div>}
                {db.concept && <div className="lib-mask"><div data-line className="lib-lbl lib-muted">KEY IDEAS / {upper(db.concept).replace(/\.$/, "")}</div></div>}
                <div className="lib-mask"><button data-line type="button" className="lib-lbl lib-watch" onClick={() => api.current?.close()}>BACK TO THE SHELF</button></div>
              </div>
              <div className="lib-d-poster">
                <svg viewBox={`0 0 ${COVER_W} 900`} aria-hidden="true" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <filter id="lib-inkf" filterUnits="userSpaceOnUse" x="-300" y="-300" width="1212" height="1500">
                      <feTurbulence type="fractalNoise" baseFrequency=".011" numOctaves="3" seed="7" result="n" />
                      <feDisplacementMap in="SourceGraphic" in2="n" scale="120" xChannelSelector="R" yChannelSelector="G" />
                    </filter>
                    <mask id="lib-ink" maskUnits="userSpaceOnUse" x="-200" y="-200" width="1012" height="1300">
                      <g filter="url(#lib-inkf)">
                        {BLOBS.map((b, i) => <circle key={i} className="lib-ink-c" cx={b.cx} cy={b.cy} r="0" data-delay={b.delay} fill="#fff" />)}
                      </g>
                    </mask>
                  </defs>
                  <g mask="url(#lib-ink)">
                    <CoverShapes book={db} />
                    {db.cover && (<>
                      <rect width={COVER_W} height="900" fill={db.cover.tint} />
                      <image href={db.cover.src} x="0" y="0" width={COVER_W} height="900" preserveAspectRatio="xMidYMid meet" />
                    </>)}
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </>,
        document.body,
      )}
    </section>
  );
}
