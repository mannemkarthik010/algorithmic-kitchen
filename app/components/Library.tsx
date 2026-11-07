"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { LIB_BOOKS, CATS, START_INDEX } from "../lib/library";
import { CoverShapes, SpineShapes, COVER_W } from "./LibraryArt";

/**
 * The Reading Room: a 3D shelf of book spines on a paper scene. One book is pulled out and turned to show its cover.
 * Click, drag, arrows, tabs or keys change the book; "Open reading note" (or the cover) opens the note in an overlay that
 * grows out of the cover, like the exhibits. One requestAnimationFrame loop drives the shelf; the Web Animations API
 * drives the caption and the overlay. The engine measures the shelf element, so the section is an ordinary flowing layout.
 */

const N = LIB_BOOKS.length;
const COPIES = 3;
const TOTAL = N * COPIES;
const EASE = "cubic-bezier(.2,.8,.2,1)";
const OVER_EASE = "cubic-bezier(.22,1,.36,1)"; // the exhibit overlays' easing
const smooth = (x: number) => x * x * (3 - 2 * x);
const mod = (a: number, n: number) => ((a % n) + n) % n;

type Api = {
  step: (n: number) => void;
  goTab: (i: number) => void;
  open: () => void;
  close: () => void;
};

const statusLabel = (s: string) => (s === "Reading" ? "Reading now" : "Read");

export default function Library() {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(START_INDEX);
  const [open, setOpen] = useState(false);
  const [detailIdx, setDetailIdx] = useState(START_INDEX);

  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const shelfRef = useRef<HTMLDivElement>(null);
  const capTitle = useRef<HTMLDivElement>(null);
  const capSub = useRef<HTMLDivElement>(null);
  const capStatus = useRef<HTMLDivElement>(null);
  const capNote = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const api = useRef<Api | null>(null);

  useEffect(() => { queueMicrotask(() => setMounted(true)); }, []);

  const tabIndex = 1 + CATS.indexOf(LIB_BOOKS[active].cat);

  /* The engine: geometry, the animation loop, and every input. */
  useEffect(() => {
    if (!mounted) return;
    const root = rootRef.current, stage = stageRef.current, shelf = shelfRef.current;
    const dlg = detailRef.current, inner = innerRef.current;
    const cT = capTitle.current, cS = capSub.current, cY = capStatus.current, cN = capNote.current;
    if (!root || !stage || !shelf || !dlg || !inner || !cT || !cS || !cY || !cN) return;

    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tapes = Array.from(stage.children) as HTMLElement[];

    const g = { W: 0, H: 0, ws: 0, d: 0, gap: 0, cy: 0, left: 0, top: 0 }; // cy: the shelf's vertical centre, from the top of the section
    const S = {
      s: START_INDEX + N, T: START_INDEX + N, hover: -1,
      mx: 0, my: 0, cx: 0, cy: 0, tiltX: 0, tiltY: 0,
      onCover: false, open: false, dragging: false, didDrag: false, inside: false,
      active: START_INDEX, pendingOpen: false, visible: true, running: false,
      drag: null as null | { x: number; T0: number }, wheelT: 0 as unknown as ReturnType<typeof setTimeout>,
    };
    let opener: HTMLElement | null = null; // what had focus when the note opened, so focus can go back there
    const lift = new Float32Array(TOTAL);
    const hidden = tapes.map(() => true);
    const spFaces = tapes.map((t) => t.querySelector(".lib-sp") as HTMLElement);
    const cvFaces = tapes.map((t) => t.querySelector(".lib-cv") as HTMLElement);

    const probe = document.createElement("div");
    probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;width:0;height:var(--H)";
    root.appendChild(probe);

    const measure = () => {
      const r = root.getBoundingClientRect();
      g.W = r.width; g.left = r.left; g.top = r.top;
      const sr = shelf.getBoundingClientRect();
      g.cy = sr.top - r.top + sr.height / 2;
      g.H = probe.offsetHeight;
      g.ws = (g.H * 142) / 840;
      g.d = (g.H * COVER_W) / 900;
      g.gap = g.H * 0.03;
      root.style.setProperty("--ws", `${g.ws}px`);
      root.style.setProperty("--d", `${g.d}px`);
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
        // belt and braces: a throttled tab may never fire onfinish
        setTimeout(() => o.remove(), 900);
      });
      el.appendChild(span);
      span.animate([{ transform: `translateY(${dir * 105}%)` }, { transform: "translateY(0)" }], { duration: 650, easing: EASE, fill: "both" });
    };
    const fillCaption = (idx: number, dir: number, instant = false) => {
      const b = LIB_BOOKS[idx];
      swap(cT, b.short, dir, instant);
      swap(cS, `${b.author} · ${b.genre}`, dir, instant);
      swap(cY, statusLabel(b.status), dir, instant);
      swap(cN, b.lesson, dir, instant);
      cY.dataset.reading = b.status === "Reading" ? "1" : "0";
    };
    fillCaption(S.active, 1, true);

    /* Which book is under the pointer? Chrome cannot hit-test a face rotated in 3D (the open cover
       never receives clicks), so pick from each visible book's projected on-screen box instead. */
    const pick = (px: number, py: number) => {
      let best = -1;
      let bestZ = -Infinity;
      for (let v = 0; v < TOTAL; v++) {
        if (hidden[v]) continue;
        const face = Math.abs(rel(v, S.s)) < 0.5 ? cvFaces[v] : spFaces[v];
        const r = face.getBoundingClientRect();
        if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) {
          const z = Number(tapes[v].style.zIndex) || 0;
          if (z > bestZ) { bestZ = z; best = v; }
        }
      }
      return best;
    };

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
      S.onCover = !S.open && S.inside && Math.abs(rx - W / 2) < 0.55 * d && Math.abs(ry - g.cy) < 0.55 * H && Math.abs(S.T - S.s) < 0.3;
      const tx = S.onCover ? ((rx - W / 2) / (0.55 * d)) * 9 : ((S.mx - g.left - W / 2) / Math.max(W, 1)) * 5 * (S.inside ? 1 : 0);
      const ty = S.onCover ? (-(ry - g.cy) / (H / 2)) * 6 : 0;
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

      // hovered book (lifts a spine)
      if (S.inside && !S.open && !S.dragging) S.hover = pick(S.mx, S.my);
      else if (!S.inside) S.hover = -1;

      if (S.pendingOpen && Math.abs(S.T - S.s) < 0.01) { S.pendingOpen = false; openDetail(); }

      if (S.visible || S.open) raf = requestAnimationFrame(frame);
      else S.running = false;
    };
    const start = () => { if (S.running) return; S.running = true; last = 0; raf = requestAnimationFrame(frame); };

    /* ── the reading-note overlay: grows from the cover like the exhibits, focus goes in and comes back ── */
    const coverRect = () => (activeTape().querySelector(".lib-cv") as HTMLElement).getBoundingClientRect();
    const box = (r: DOMRect) => ({ top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` });
    const FULL = { top: "0px", left: "0px", width: "100vw", height: "100dvh" };

    function openDetail() {
      if (S.open) return;
      if (Math.abs(S.T - S.s) > 0.02) { S.T = Math.round(S.T); S.pendingOpen = true; return; }
      const ae = document.activeElement as HTMLElement | null;
      opener = ae && root!.contains(ae) ? ae : root;
      const r = coverRect();
      flushSync(() => { setDetailIdx(S.active); setOpen(true); });
      S.open = true;
      S.hover = -1;
      document.documentElement.style.overflow = "hidden";
      dlg!.getAnimations().forEach((an) => an.cancel());
      inner!.getAnimations().forEach((an) => an.cancel());
      dlg!.style.visibility = "visible";
      if (!rm) {
        dlg!.animate([box(r), FULL], { duration: 600, easing: OVER_EASE, fill: "both" });
        inner!.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, delay: 350, easing: "linear", fill: "both" });
      }
      closeRef.current?.focus({ preventScroll: true });
      start();
    }

    function closeDetail() {
      if (!S.open) return;
      S.open = false;
      const finish = () => {
        dlg!.style.visibility = "hidden";
        dlg!.getAnimations().forEach((x) => x.cancel());
        inner!.getAnimations().forEach((x) => x.cancel());
        document.documentElement.style.overflow = "";
        ((opener && opener.isConnected ? opener : root) as HTMLElement).focus({ preventScroll: true });
        setOpen(false);
      };
      if (rm) { finish(); return; }
      inner!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: "linear", fill: "both" });
      const an = dlg!.animate([FULL, box(coverRect())], { duration: 500, easing: OVER_EASE, fill: "both" });
      an.onfinish = finish;
      setTimeout(() => { if (dlg!.style.visibility === "visible" && !S.open) finish(); }, 800); // a throttled tab may never fire onfinish
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

    const onShelfClick = (e: MouseEvent) => {
      if (S.open) return;
      if (S.didDrag) { S.didDrag = false; return; }
      const v = pick(e.clientX, e.clientY);
      if (v < 0) return;
      const r = rel(v, S.s);
      if (Math.abs(r) < 0.5) openDetail();
      else goTo(Math.round(S.T + r));
    };
    shelf.addEventListener("click", onShelfClick);

    const onMove = (e: PointerEvent) => {
      S.mx = e.clientX; S.my = e.clientY;
      if (!S.cx && !S.cy) { S.cx = S.mx; S.cy = S.my; }
      const r = root.getBoundingClientRect();
      g.left = r.left; g.top = r.top;
      S.inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (S.drag) {
        const dx = e.clientX - S.drag.x;
        if (!S.dragging && Math.abs(dx) > 7) S.dragging = true;
        if (S.dragging) S.T = S.drag.T0 - dx / (g.ws + g.gap);
      }
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
      if (S.open) {
        if (e.key === "Escape") { e.preventDefault(); closeDetail(); }
        else if (e.key === "Tab") {
          // keep focus inside the overlay: its controls are the close button, and the dialog itself for scrolling
          const f = Array.from(dlg!.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex="0"]'));
          if (!f.length) { e.preventDefault(); return; }
          const first = f[0], last = f[f.length - 1], a = document.activeElement;
          if (!dlg!.contains(a)) { e.preventDefault(); first.focus(); }
          else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
        }
        return;
      }
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
    shelf.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    root.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(measure);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      shelf.removeEventListener("pointerdown", onDown);
      shelf.removeEventListener("click", onShelfClick);
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
  const act = LIB_BOOKS[active];

  return (
    <section id="library" ref={rootRef} className="lib" tabIndex={0} aria-label="Reading room: Karthik's bookshelf" data-no-ember>
      <header className="lib-head">
        <div className="lib-head__row">
          <p className="ex-mono lib-head__n"><span>(01)</span> &nbsp;The Reading Room</p>
          <p className="ex-mono lib-head__c">{N} books · {CATS.length} shelves</p>
        </div>
        <h2 className="lib-head__h">Books that shaped the way <em>I build.</em></h2>
      </header>

      <nav className="lib-tabs" aria-label="Shelves">
        {["All", ...CATS].map((c, i) => (
          <button key={c} type="button" className={`lib-tab${tabIndex === i ? " is-on" : ""}`} aria-pressed={tabIndex === i} onClick={() => api.current?.goTab(i)}>{c}</button>
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

      {/* the selected book: status and author, title, note, then one action row */}
      <div className="lib-cap">
        <span className="lib-sr" aria-live="polite">{act.title} by {act.author}. {statusLabel(act.status)}.</span>
        <div className="lib-meta">
          <div className="lib-mask ex-mono lib-cap-status" ref={capStatus} aria-hidden="true" />
          <div className="lib-mask ex-mono lib-cap-sub" ref={capSub} aria-hidden="true" />
        </div>
        <div className="lib-mask lib-cap-title" ref={capTitle} aria-hidden="true" />
        <div className="lib-mask lib-cap-note" ref={capNote} aria-hidden="true" />
        <div className="lib-ctl">
          <button type="button" className="lib-arrow" aria-label="Previous book" onClick={() => api.current?.step(-1)}>
            <svg width="18" height="10" viewBox="0 0 18 10" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M5 1 L1 5 L5 9 M1 5 H17" /></svg>
          </button>
          <button type="button" className="ex-cta ex-cta--orange lib-open" onClick={() => api.current?.open()}>Open reading note</button>
          <button type="button" className="lib-arrow" aria-label="Next book" onClick={() => api.current?.step(1)}>
            <svg width="18" height="10" viewBox="0 0 18 10" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M13 1 L17 5 L13 9 M17 5 H1" /></svg>
          </button>
        </div>
      </div>

      <div className="lib-foot">
        <a className="ex-mono lib-credit" href="https://openlibrary.org" target="_blank" rel="noopener noreferrer">Covers via Open Library</a>
        <span className="ex-mono lib-foot__hint">Drag · ← → · click the cover</span>
      </div>

      {mounted && createPortal(
        <div className="gx-over gx-over--lib lib-over" ref={detailRef} role="dialog" aria-modal="true" aria-label={db.title} aria-hidden={!open} data-no-ember>
          <div className="gx-over__in" ref={innerRef}>
            <header className="gx-over__bar">
              <button ref={closeRef} type="button" className="gx-over__close" onClick={() => api.current?.close()}>← Back to the shelf <kbd>Esc</kbd></button>
              <span className="gx-over__t">Reading note</span>
              <span className="ex-mono lib-over__n">{String(detailIdx + 1).padStart(2, "0")} / {N}</span>
            </header>
            <div className="lib-over__body">
              <div className="lib-over__poster">
                <svg viewBox={`0 0 ${COVER_W} 900`} aria-hidden="true" preserveAspectRatio="xMidYMid meet">
                  <CoverShapes book={db} />
                  {db.cover && (<>
                    <rect width={COVER_W} height="900" fill={db.cover.tint} />
                    <image href={db.cover.src} x="0" y="0" width={COVER_W} height="900" preserveAspectRatio="xMidYMid meet" />
                  </>)}
                </svg>
              </div>
              <div className="lib-over__text">
                <p className="ex-mono lib-over__eyebrow">{db.author} · {db.genre}</p>
                <h3 className={`lib-over__title${db.title.length > 34 ? " is-long" : ""}`}>{db.title}</h3>
                <p className="ex-mono lib-over__status" data-reading={db.status === "Reading" ? "1" : "0"}>{statusLabel(db.status)} · {db.cat} shelf</p>
                <p className="lib-over__lesson">{db.lesson}</p>
                {db.story && <p className="lib-over__story">{db.story}</p>}
                {db.concept && <p className="ex-mono lib-over__ideas"><span>Key ideas</span> {db.concept.replace(/\.$/, "")}</p>}
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}
