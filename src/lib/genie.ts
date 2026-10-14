// the mac's genie minimize, as near as css gets. each frame the window is mapped
// onto a four-cornered shape with a perspective transform, so its content
// squishes along: the bottom pinches into the dock spot first, then the top
// pours down after it. the mac bends the sides into curves, here they stay straight

export type Point = [number, number];
export type Box = { x: number; y: number; w: number; h: number };
// top-left, top-right, bottom-right, bottom-left
export type Quad = [Point, Point, Point, Point];

export const GENIE_MS = 500;

// the window scaled down to fit inside the dock spot, centred, like a thumbnail
export function fitIn(win: Box, slot: Box): Box {
  const scale = Math.min(slot.w / win.w, slot.h / win.h);
  const w = win.w * scale;
  const h = win.h * scale;
  return { x: slot.x + (slot.w - w) / 2, y: slot.y + (slot.h - h) / 2, w, h };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (t: number) => Math.min(1, Math.max(0, t));
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

// how many times wider the top may be than the bottom. a straight-sided
// perspective squeezes the narrow end's content together and blows the wide
// end's up, so past this it reads as the page tipping back, not squishing
const MAX_PINCH = 3;

// the shape at progress p, 0 the window and 1 its thumbnail. the bottom edge
// moves over the first 60%, the top over the last 70%, so they overlap
export function genieQuad(from: Box, to: Box, p: number): Quad {
  const bottom = easeInOut(clamp(p / 0.6));
  const top = easeInOut(clamp((p - 0.3) / 0.7));
  const edge = (t: number, y0: number, y1: number): [Point, Point] => {
    const y = lerp(y0, y1, t);
    return [
      [lerp(from.x, to.x, t), y],
      [lerp(from.x + from.w, to.x + to.w, t), y],
    ];
  };
  const [tl, tr] = edge(top, from.y, to.y);
  const [bl, br] = edge(bottom, from.y + from.h, to.y + to.h);
  const least = (tr[0] - tl[0]) / MAX_PINCH;
  if (br[0] - bl[0] < least) {
    const mid = (bl[0] + br[0]) / 2;
    bl[0] = mid - least / 2;
    br[0] = mid + least / 2;
  }
  return [tl, tr, br, bl];
}

// the projective map sending a w by h box at the origin onto the quad, as
// [a, b, c, d, e, f, g, h] for x' = (ax + by + c) / (gx + hy + 1) and
// y' = (dx + ey + f) / (gx + hy + 1). heckbert's square-to-quad, scaled
export function homography(w: number, h: number, quad: Quad): number[] {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = quad;
  const sx = x0 - x1 + x2 - x3;
  const sy = y0 - y1 + y2 - y3;
  let g = 0;
  let k = 0;
  if (Math.abs(sx) > 1e-9 || Math.abs(sy) > 1e-9) {
    const dx1 = x1 - x2;
    const dx2 = x3 - x2;
    const dy1 = y1 - y2;
    const dy2 = y3 - y2;
    const det = dx1 * dy2 - dx2 * dy1;
    g = (sx * dy2 - dx2 * sy) / det;
    k = (dx1 * sy - sx * dy1) / det;
  }
  // for the unit square, then divided through by w and h for the box
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + k * x3;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + k * y3;
  return [a / w, b / h, x0, d / w, e / h, y0, g / w, k / h];
}

// as a css transform, for an element whose transform origin is its top left
export function genieTransform(from: Box, to: Box, p: number): string {
  const quad = genieQuad(from, to, p).map(
    ([x, y]) => [x - from.x, y - from.y] as Point,
  ) as Quad;
  const [a, b, c, d, e, f, g, k] = homography(from.w, from.h, quad);
  // column by column
  return `matrix3d(${a},${d},0,${g},${b},${e},0,${k},0,0,1,0,${c},${f},0,1)`;
}
