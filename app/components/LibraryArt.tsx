import type { ReactNode } from "react";
import type { LibBook } from "../lib/library";

/** Generated cover and spine art: no image files, no real book covers. Fully deterministic per book. */

const PAL = [
  { bg: "#F2E6CF", a: "#141414", b: "#1F3FB0", c: "#E2462A" },
  { bg: "#1F3FB0", a: "#F2E6CF", b: "#E2462A", c: "#141414" },
  { bg: "#E2462A", a: "#141414", b: "#F2E6CF", c: "#1F3FB0" },
  { bg: "#141414", a: "#F2E6CF", b: "#1F3FB0", c: "#E2462A" },
  { bg: "#F2E6CF", a: "#1F3FB0", b: "#E2462A", c: "#141414" },
];
type P = (typeof PAL)[number];

const SERIF = "var(--font-newsreader), Georgia, serif";
const SANS = "var(--font-inter-tight), system-ui, sans-serif";

export const palette = (b: LibBook): P => PAL[(b.hash >>> 3) % PAL.length];

function wrap(text: string, max: number): string[] {
  const words = text.toUpperCase().split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > max) { lines.push(cur); cur = w; } else cur = cur ? cur + " " + w : w;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** A duotone screen-print motif inside the box (x, y, w, h). Nested <svg> clips it to the box. */
function motif(kind: number, x: number, y: number, w: number, h: number, p: P): ReactNode {
  const cx = w / 2;
  let g: ReactNode;
  switch (kind) {
    case 0: // sun over bars
      g = (<>
        <circle cx={cx} cy={h * 0.42} r={Math.min(w, h) * 0.34} fill={p.c} />
        {Array.from({ length: 6 }).map((_, i) => <rect key={i} x={0} y={h * 0.62 + i * h * 0.065} width={w} height={h * 0.033} fill={i % 2 ? p.b : p.a} />)}
      </>);
      break;
    case 1: // diagonal bands
      g = (<g transform={`rotate(-24 ${cx} ${h / 2})`}>
        {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={-w * 0.3} y={-h * 0.2 + i * h * 0.16} width={w * 1.6} height={h * 0.09} fill={[p.b, p.c, p.a][i % 3]} />)}
      </g>);
      break;
    case 2: // dot grid
      g = (<>
        {Array.from({ length: 30 }).map((_, i) => {
          const col = i % 6, row = Math.floor(i / 6);
          return <circle key={i} cx={w * (0.1 + col * 0.16)} cy={h * (0.1 + row * 0.2)} r={Math.min(w, h) * (0.035 + ((i * 7) % 5) * 0.012)} fill={[p.b, p.c, p.a][(col + row) % 3]} />;
        })}
      </>);
      break;
    case 3: // concentric arches
      g = (<>
        {Array.from({ length: 5 }).map((_, i) => {
          const inset = i * w * 0.09;
          return <rect key={i} x={inset} y={inset * 0.9} width={w - inset * 2} height={h - inset * 0.9} rx={(w - inset * 2) / 2} fill={[p.c, p.a, p.b, p.bg, p.c][i]} />;
        })}
      </>);
      break;
    case 4: // mountains and sun
      g = (<>
        <circle cx={w * 0.72} cy={h * 0.25} r={Math.min(w, h) * 0.13} fill={p.c} />
        <polygon points={`0,${h} ${w * 0.38},${h * 0.2} ${w * 0.78},${h}`} fill={p.b} />
        <polygon points={`${w * 0.3},${h} ${w * 0.68},${h * 0.42} ${w},${h}`} fill={p.a} />
      </>);
      break;
    case 5: // waves
      g = (<>
        {Array.from({ length: 6 }).map((_, i) => {
          const yy = h * (0.12 + i * 0.15);
          return <path key={i} d={`M0 ${yy} Q ${w * 0.125} ${yy - h * 0.08} ${w * 0.25} ${yy} T ${w * 0.5} ${yy} T ${w * 0.75} ${yy} T ${w} ${yy}`} fill="none" stroke={[p.b, p.c, p.a][i % 3]} strokeWidth={h * 0.045} />;
        })}
      </>);
      break;
    default: // nested diamonds
      g = (<>
        {Array.from({ length: 5 }).map((_, i) => {
          const s = Math.min(w, h) * (0.5 - i * 0.09);
          return <rect key={i} x={cx - s} y={h / 2 - s} width={s * 2} height={s * 2} transform={`rotate(45 ${cx} ${h / 2})`} fill={[p.c, p.b, p.a, p.c, p.bg][i]} />;
        })}
      </>);
  }
  return <svg x={x} y={y} width={w} height={h} overflow="hidden">{g}</svg>;
}

/** Front cover, drawn in a 474 x 900 box. */
export function CoverShapes({ book }: { book: LibBook }) {
  const p = palette(book);
  const lines = wrap(book.short, 11);
  const longest = Math.max(...lines.map((l) => l.length));
  const size = Math.min(76, 410 / (longest * 0.56));
  const titleEnd = 150 + lines.length * size * 1.02;
  const artY = Math.max(titleEnd + 26, 400);
  const artH = 770 - artY;
  return (
    <g>
      <rect width="474" height="900" fill={p.bg} />
      <rect x="0" y="0" width="14" height="900" fill="#000" opacity=".12" />
      <rect x="22" y="22" width="430" height="856" fill="none" stroke={p.a} strokeWidth="2" opacity=".85" />
      <text x="237" y="68" textAnchor="middle" fill={p.a} fontFamily={SANS} fontWeight="600" fontSize="16" letterSpacing="3.4">READ BY KARTHIK MANNEM</text>
      <rect x="48" y="86" width="378" height="2" fill={p.a} />
      {lines.map((l, i) => (
        <text key={i} x="237" y={150 + size * 0.86 + i * size * 1.02} textAnchor="middle" fill={p.a} fontFamily={SERIF} fontWeight="400" fontSize={size} letterSpacing="-0.5">{l}</text>
      ))}
      {motif(book.hash % 7, 48, artY, 378, artH, p)}
      <text x="48" y="822" fill={p.a} fontFamily={SANS} fontWeight="600" fontSize="14" letterSpacing="2.6">{`BY ${book.author.toUpperCase()}`.slice(0, 30)}</text>
      <rect x="338" y="836" width="88" height="34" fill="none" stroke={p.a} strokeWidth="2" />
      <text x="382" y="859" textAnchor="middle" fill={p.a} fontFamily={SANS} fontWeight="600" fontSize="15" letterSpacing="3">BOOK</text>
    </g>
  );
}

/** Spine, drawn in a 142 x 840 box (the box ratio used by the shelf geometry). */
export function SpineShapes({ book }: { book: LibBook }) {
  const p = palette(book);
  const title = book.short.toUpperCase();
  // the vertical title must fit between the motif (y 150) and the author (y 700)
  const size = Math.min(54, (500 / title.length - 2) / 0.66);
  const last = book.author.split(" ").slice(-1)[0].toUpperCase();
  return (
    <g>
      <rect width="142" height="840" fill={p.bg} />
      <rect x="0" y="0" width="7" height="840" fill="#000" opacity=".14" />
      <rect x="135" y="0" width="7" height="840" fill="#000" opacity=".1" />
      <rect x="0" y="0" width="142" height="4" fill="#000" opacity=".18" />
      {motif((book.hash >>> 5) % 7, 18, 32, 106, 100, p)}
      <rect x="18" y="148" width="106" height="2" fill={p.a} />
      <text transform="translate(71 424) rotate(90)" textAnchor="middle" dominantBaseline="middle" fill={p.a} fontFamily={SERIF} fontWeight="400" fontSize={size} letterSpacing="2">{title}</text>
      <text x="71" y="722" textAnchor="middle" fill={p.a} fontFamily={SANS} fontWeight="600" fontSize="17" letterSpacing="3">{last.slice(0, 9)}</text>
      <rect x="30" y="748" width="82" height="38" fill="none" stroke={p.a} strokeWidth="2" />
      <text x="71" y="773" textAnchor="middle" fill={p.a} fontFamily={SANS} fontWeight="600" fontSize="16" letterSpacing="3">BOOK</text>
    </g>
  );
}
