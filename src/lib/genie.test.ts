import { describe, expect, it } from "vitest";
import {
  type Box,
  fitIn,
  genieQuad,
  homography,
  type Point,
} from "#/lib/genie";

const win: Box = { x: 100, y: 80, w: 600, h: 400 };
const slot: Box = { x: 700, y: 850, w: 28, h: 28 };

// where the homography sends a point of the window, in its own coordinates
function apply(m: number[], [x, y]: Point): Point {
  const [a, b, c, d, e, f, g, h] = m;
  const w = g * x + h * y + 1;
  return [(a * x + b * y + c) / w, (d * x + e * y + f) / w];
}

function close([x, y]: Point, [ex, ey]: Point) {
  expect(x).toBeCloseTo(ex, 6);
  expect(y).toBeCloseTo(ey, 6);
}

describe("fitIn", () => {
  it("scales the window down to fit the spot, centred", () => {
    const fit = fitIn(win, slot);
    expect(fit.w).toBeCloseTo(28);
    expect(fit.h).toBeCloseTo(28 * (400 / 600));
    expect(fit.x).toBeCloseTo(700);
    expect(fit.y + fit.h / 2).toBeCloseTo(850 + 14);
  });
});

describe("genieQuad", () => {
  const fit = fitIn(win, slot);
  it("starts as the window and ends as its thumbnail", () => {
    expect(genieQuad(win, fit, 0)).toEqual([
      [100, 80],
      [700, 80],
      [700, 480],
      [100, 480],
    ]);
    const end = genieQuad(win, fit, 1);
    close(end[0], [fit.x, fit.y]);
    close(end[2], [fit.x + fit.w, fit.y + fit.h]);
  });
  it("pinches the bottom toward the spot before the top follows", () => {
    const [tl, tr, br, bl] = genieQuad(win, fit, 0.35);
    const top = tr[0] - tl[0];
    const bottom = br[0] - bl[0];
    expect(bottom).toBeLessThan(top);
    expect(tl[1]).toBeLessThan(br[1]);
  });
  it("never pinches so hard the content looks tipped over", () => {
    for (let p = 0; p <= 1; p += 0.05) {
      const [tl, tr, br, bl] = genieQuad(win, fit, p);
      expect((tr[0] - tl[0]) / (br[0] - bl[0])).toBeLessThanOrEqual(3 + 1e-9);
    }
  });
});

describe("homography", () => {
  it("sends the window's corners to the quad's", () => {
    const quad: [Point, Point, Point, Point] = [
      [10, 5],
      [590, 40],
      [350, 700],
      [250, 700],
    ];
    const m = homography(600, 400, quad);
    close(apply(m, [0, 0]), quad[0]);
    close(apply(m, [600, 0]), quad[1]);
    close(apply(m, [600, 400]), quad[2]);
    close(apply(m, [0, 400]), quad[3]);
  });
  it("is a plain scale and shift for a rectangle", () => {
    const m = homography(600, 400, [
      [20, 10],
      [320, 10],
      [320, 210],
      [20, 210],
    ]);
    expect(m[6]).toBeCloseTo(0);
    expect(m[7]).toBeCloseTo(0);
    close(apply(m, [300, 200]), [170, 110]);
  });
});
