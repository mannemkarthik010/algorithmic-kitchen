import { Level, Pos, Run, hazardActive, posAt } from "@/lib/echo/sim";

export const TILE = 56;
export const ID_COLOR: Record<string, string> = { a: "#2DD4BF", b: "#FBBF24", c: "#F472B6" };
export const GHOST_COLOR = ["#38BDF8", "#C084FC", "#FB923C", "#4ADE80"];
const WALL = "#161824";
const WALL_EDGE = "#2b2f45";
const EXIT = "#A5F3FC";
const HAZ = "#FF3B5C";

export interface Frame {
  level: Level;
  t: number;
  ghosts: Run[];
  player: { from: Pos; to: Pos } | null;
  /** player positions this run, for the trail */
  trail: Pos[];
  pressed: Set<string>;
  alpha: number;
  time: number;
  reduced: boolean;
  doorV: Record<string, number>;
  dead: boolean;
  won: boolean;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const px = (v: number) => v * TILE;

function glow(ctx: CanvasRenderingContext2D, color: string, blur: number, reduced: boolean) {
  ctx.shadowColor = color;
  ctx.shadowBlur = reduced ? 0 : blur;
}

export function draw(ctx: CanvasRenderingContext2D, f: Frame) {
  const { level } = f;
  const W = level.w * TILE, H = level.h * TILE;
  ctx.clearRect(0, 0, W, H);

  // floor: faint panels
  for (let y = 0; y < level.h; y++) for (let x = 0; x < level.w; x++) {
    if (level.wall[y * level.w + x]) continue;
    ctx.fillStyle = (x + y) % 2 ? "rgba(255,255,255,0.028)" : "rgba(255,255,255,0.016)";
    ctx.fillRect(px(x) + 1, px(y) + 1, TILE - 2, TILE - 2);
  }

  // walls: blocks with a lit edge on every side that faces open floor
  const isWall = (x: number, y: number) => x < 0 || y < 0 || x >= level.w || y >= level.h || level.wall[y * level.w + x];
  for (let y = 0; y < level.h; y++) for (let x = 0; x < level.w; x++) {
    if (!level.wall[y * level.w + x]) continue;
    ctx.fillStyle = WALL;
    ctx.fillRect(px(x), px(y), TILE, TILE);
    ctx.fillStyle = WALL_EDGE;
    if (!isWall(x, y - 1)) ctx.fillRect(px(x), px(y), TILE, 3);
    if (!isWall(x, y + 1)) ctx.fillRect(px(x), px(y + 1) - 3, TILE, 3);
    if (!isWall(x - 1, y)) ctx.fillRect(px(x), px(y), 3, TILE);
    if (!isWall(x + 1, y)) ctx.fillRect(px(x + 1) - 3, px(y), 3, TILE);
  }

  // exit portal
  {
    const cx = px(level.exit.x + 0.5), cy = px(level.exit.y + 0.5);
    ctx.save();
    glow(ctx, EXIT, 18, f.reduced);
    ctx.strokeStyle = EXIT;
    ctx.lineWidth = 2.5;
    for (let r = 0; r < 3; r++) {
      ctx.setLineDash([8 + r * 4, 6]);
      ctx.lineDashOffset = f.reduced ? 0 : -(f.time / 60) * (r % 2 ? -1 : 1);
      ctx.globalAlpha = 0.95 - r * 0.25;
      ctx.beginPath();
      ctx.arc(cx, cy, TILE * (0.16 + r * 0.11), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // plates: ring that fills when held, with its letter so colour is never the only cue
  for (const p of level.plates) {
    const cx = px(p.x + 0.5), cy = px(p.y + 0.5);
    const col = ID_COLOR[p.id];
    const on = f.pressed.has(p.id);
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = 3;
    ctx.fillStyle = on ? col : "rgba(0,0,0,0.35)";
    glow(ctx, col, on ? 22 : 6, f.reduced);
    ctx.beginPath(); ctx.rect(cx - TILE * 0.3, cy - TILE * 0.3, TILE * 0.6, TILE * 0.6); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = on ? "#0b0b10" : col;
    ctx.font = `700 ${TILE * 0.3}px ui-monospace, monospace`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(p.id.toUpperCase(), cx, cy + 1);
    ctx.restore();
  }

  // doors: two panels that slide apart; striped and lettered when shut
  for (const d of level.doors) {
    const v = f.doorV[`${d.x},${d.y}`] ?? 0;
    const col = ID_COLOR[d.id];
    const x0 = px(d.x), y0 = px(d.y);
    const half = (TILE / 2) * (1 - v) ;
    ctx.save();
    ctx.fillStyle = "#0e0f18";
    ctx.fillRect(x0, y0, TILE, TILE);
    ctx.fillStyle = col;
    glow(ctx, col, 10, f.reduced);
    ctx.globalAlpha = 0.28 + 0.62 * (1 - v);
    ctx.fillRect(x0, y0, TILE, half);
    ctx.fillRect(x0, y0 + TILE - half, TILE, half);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    if (v < 0.5) {
      ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.lineWidth = 3;
      for (let i = -TILE; i < TILE; i += 12) { ctx.beginPath(); ctx.moveTo(x0 + i, y0 + TILE); ctx.lineTo(x0 + i + TILE, y0); ctx.stroke(); }
      ctx.fillStyle = "#0b0b10"; ctx.font = `800 ${TILE * 0.34}px ui-monospace, monospace`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(d.id.toUpperCase(), x0 + TILE / 2, y0 + TILE / 2 + 1);
    }
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.strokeRect(x0 + 1, y0 + 1, TILE - 2, TILE - 2);
    ctx.restore();
  }

  // hazards: a pulsing beam; amber outline the tick before it fires
  for (const h of level.hazards) {
    const x0 = px(h.x), y0 = px(h.y);
    const on = hazardActive(h.pattern, f.t);
    const soon = !on && hazardActive(h.pattern, f.t + 1);
    ctx.save();
    ctx.fillStyle = "rgba(255,59,92,0.08)";
    ctx.fillRect(x0 + 2, y0 + 2, TILE - 4, TILE - 4);
    if (on) {
      glow(ctx, HAZ, 26, f.reduced);
      ctx.fillStyle = HAZ;
      ctx.fillRect(x0 + 6, y0 + 6, TILE - 12, TILE - 12);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0 + 10, y0 + 10); ctx.lineTo(x0 + TILE - 10, y0 + TILE - 10); ctx.moveTo(x0 + TILE - 10, y0 + 10); ctx.lineTo(x0 + 10, y0 + TILE - 10); ctx.stroke();
    } else {
      ctx.strokeStyle = soon ? "#FBBF24" : "rgba(255,59,92,0.55)";
      ctx.setLineDash(soon ? [4, 4] : [2, 6]);
      ctx.lineWidth = soon ? 3 : 2;
      ctx.strokeRect(x0 + 6, y0 + 6, TILE - 12, TILE - 12);
    }
    ctx.restore();
  }

  // ghosts, each with a number so they are told apart without colour
  const segs = f.reduced ? 3 : 9;
  f.ghosts.forEach((g, i) => {
    const col = GHOST_COLOR[i % GHOST_COLOR.length];
    const a = posAt(g, Math.max(0, f.t - 1)), b = posAt(g, f.t);
    const x = lerp(a.x, b.x, f.alpha), y = lerp(a.y, b.y, f.alpha);
    ctx.save();
    ctx.lineCap = "round";
    let prev = { x, y };
    for (let k = 1; k <= segs; k++) {
      const p = posAt(g, Math.max(0, f.t - k));
      ctx.strokeStyle = col; ctx.globalAlpha = 0.5 * (1 - k / (segs + 1));
      ctx.lineWidth = 9 * (1 - k / (segs + 2));
      ctx.beginPath(); ctx.moveTo(px(prev.x + 0.5), px(prev.y + 0.5)); ctx.lineTo(px(p.x + 0.5), px(p.y + 0.5)); ctx.stroke();
      prev = p;
    }
    ctx.globalAlpha = 1;
    glow(ctx, col, 20, f.reduced);
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.fillStyle = "rgba(8,8,14,0.78)";
    ctx.beginPath(); ctx.arc(px(x + 0.5), px(y + 0.5), TILE * 0.27, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = col; ctx.font = `800 ${TILE * 0.28}px ui-monospace, monospace`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1), px(x + 0.5), px(y + 0.5) + 1);
    ctx.restore();
  });

  // the player
  if (f.player) {
    const x = lerp(f.player.from.x, f.player.to.x, f.alpha), y = lerp(f.player.from.y, f.player.to.y, f.alpha);
    ctx.save();
    ctx.lineCap = "round";
    let prev = { x, y };
    const n = Math.min(f.trail.length - 1, segs);
    for (let k = 1; k <= n; k++) {
      const p = f.trail[f.trail.length - 1 - k];
      ctx.strokeStyle = "#fff"; ctx.globalAlpha = 0.55 * (1 - k / (n + 1));
      ctx.lineWidth = 8 * (1 - k / (n + 2));
      ctx.beginPath(); ctx.moveTo(px(prev.x + 0.5), px(prev.y + 0.5)); ctx.lineTo(px(p.x + 0.5), px(p.y + 0.5)); ctx.stroke();
      prev = p;
    }
    ctx.globalAlpha = f.dead ? 0.4 : 1;
    glow(ctx, "#ffffff", 26, f.reduced);
    ctx.fillStyle = f.dead ? HAZ : "#fff";
    ctx.beginPath(); ctx.arc(px(x + 0.5), px(y + 0.5), TILE * 0.24 + (f.reduced ? 0 : Math.sin(f.time / 160) * 1.2), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}
