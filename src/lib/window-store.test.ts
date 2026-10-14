import { describe, expect, it } from "vitest";
import {
  type Bounds,
  closed,
  focused,
  initialWindows,
  loaded,
  MENU_BAR,
  minimized,
  moved,
  opened,
  type Rect,
  toggledZoom,
  topmost,
} from "#/lib/window-store";

const rect: Rect = { x: 100, y: 100, w: 600, h: 400 };
const screen: Bounds = { width: 1440, height: 900 };

describe("opening", () => {
  it("starts with no windows", () => {
    expect(initialWindows).toEqual({ windows: {}, top: 0 });
  });
  it("adds a window in front", () => {
    const one = opened(initialWindows, "ghostty", rect);
    const two = opened(one, "zed", rect);
    expect(two.windows.ghostty).toMatchObject({ ...rect, z: 1 });
    expect(two.windows.zed).toMatchObject({ ...rect, z: 2 });
    expect(topmost(two)).toBe("zed");
  });
  it("brings an open window back where it was, in front, instead of resetting it", () => {
    let state = opened(initialWindows, "ghostty", rect);
    state = moved(state, "ghostty", 300, 200, screen);
    state = minimized(state, "ghostty");
    state = opened(state, "zed", rect);
    state = opened(state, "ghostty", { x: 0, y: 0, w: 1, h: 1 });
    expect(state.windows.ghostty).toMatchObject({
      x: 300,
      y: 200,
      w: 600,
      minimized: false,
    });
    expect(topmost(state)).toBe("ghostty");
  });
});

describe("closing", () => {
  it("removes the window", () => {
    const state = closed(opened(initialWindows, "zed", rect), "zed");
    expect(state.windows.zed).toBeUndefined();
  });
  it("does nothing for a window that isn't open", () => {
    expect(closed(initialWindows, "zed")).toBe(initialWindows);
  });
});

describe("focusing", () => {
  it("raises the window above the rest", () => {
    let state = opened(initialWindows, "ghostty", rect);
    state = opened(state, "zed", rect);
    state = focused(state, "ghostty");
    expect(topmost(state)).toBe("ghostty");
  });
  it("leaves the state alone when it's already in front, so clicks don't re-render", () => {
    const state = opened(initialWindows, "zed", rect);
    expect(focused(state, "zed")).toBe(state);
  });
  it("skips minimized windows when finding the front one", () => {
    let state = opened(initialWindows, "ghostty", rect);
    state = opened(state, "zed", rect);
    state = minimized(state, "zed");
    expect(topmost(state)).toBe("ghostty");
    expect(topmost(minimized(state, "ghostty"))).toBeNull();
  });
});

describe("moving", () => {
  const state = opened(initialWindows, "zed", rect);
  it("moves the window", () => {
    expect(moved(state, "zed", 200, 300, screen).windows.zed).toMatchObject({
      x: 200,
      y: 300,
    });
  });
  it("can't go up behind the menu bar", () => {
    expect(moved(state, "zed", 200, -50, screen).windows.zed.y).toBe(MENU_BAR);
  });
  it("keeps some of the title bar on screen to grab it again", () => {
    const far = moved(state, "zed", 5000, 5000, screen).windows.zed;
    expect(far.x).toBeLessThan(screen.width);
    expect(far.y).toBeLessThan(screen.height);
    const left = moved(state, "zed", -5000, 200, screen).windows.zed;
    expect(left.x + left.w).toBeGreaterThan(0);
  });
});

describe("minimizing and zooming", () => {
  it("minimizes", () => {
    const state = minimized(opened(initialWindows, "zed", rect), "zed");
    expect(state.windows.zed.minimized).toBe(true);
  });
  it("zooms and unzooms, keeping the old size to go back to", () => {
    const state = opened(initialWindows, "zed", rect);
    const big = toggledZoom(state, "zed");
    expect(big.windows.zed).toMatchObject({ ...rect, zoomed: true });
    expect(toggledZoom(big, "zed").windows.zed.zoomed).toBe(false);
  });
  it("ignores windows that aren't open", () => {
    expect(minimized(initialWindows, "zed")).toBe(initialWindows);
    expect(toggledZoom(initialWindows, "zed")).toBe(initialWindows);
    expect(moved(initialWindows, "zed", 1, 1, screen)).toBe(initialWindows);
  });
});

describe("loading saved windows", () => {
  it("restores what was saved", () => {
    const state = opened(initialWindows, "zed", rect);
    expect(loaded(JSON.stringify(state))).toEqual(state);
  });
  it("falls back to nothing open when the save is missing or broken", () => {
    expect(loaded(null)).toEqual(initialWindows);
    expect(loaded("{not json")).toEqual(initialWindows);
    expect(loaded(JSON.stringify({ windows: { zed: { x: "a" } } }))).toEqual(
      initialWindows,
    );
  });
});
