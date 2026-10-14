import { describe, expect, it } from "vitest";
import {
  BROWSER,
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
  zoomedTo,
} from "#/lib/window-store";

const rect: Rect = { x: 100, y: 100, w: 600, h: 400 };
const screen: Bounds = { width: 1440, height: 900 };

describe("opening", () => {
  it("starts with just the browser, placed by css until it's dragged", () => {
    expect(initialWindows.windows).toEqual({
      [BROWSER]: { rect: null, z: 1, minimized: false, zoomed: false },
    });
    expect(topmost(initialWindows)).toBe(BROWSER);
  });
  it("adds a window in front", () => {
    const one = opened(initialWindows, "ghostty", rect);
    const two = opened(one, "zed", rect);
    expect(two.windows.ghostty).toMatchObject({ rect, z: 2 });
    expect(two.windows.zed).toMatchObject({ rect, z: 3 });
    expect(topmost(two)).toBe("zed");
  });
  it("brings an open window back where it was, in front, instead of resetting it", () => {
    let state = opened(initialWindows, "ghostty", rect);
    state = moved(state, "ghostty", { ...rect, x: 300, y: 200 }, screen);
    state = minimized(state, "ghostty");
    state = opened(state, "zed", rect);
    state = opened(state, "ghostty", { x: 0, y: 0, w: 1, h: 1 });
    expect(state.windows.ghostty).toMatchObject({
      rect: { ...rect, x: 300, y: 200 },
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
    let state = opened(initialWindows, "zed", rect);
    state = minimized(state, "zed");
    expect(topmost(state)).toBe(BROWSER);
    expect(topmost(minimized(state, BROWSER))).toBeNull();
  });
});

describe("moving", () => {
  const state = opened(initialWindows, "zed", rect);
  it("moves the window", () => {
    const to = { ...rect, x: 200, y: 300 };
    expect(moved(state, "zed", to, screen).windows.zed.rect).toEqual(to);
  });
  it("gives a css-placed window its measured size on its first drag", () => {
    const to = { x: 40, y: 48, w: 1152, h: 788 };
    expect(moved(initialWindows, BROWSER, to, screen).windows[BROWSER].rect)
      .toEqual(to);
  });
  it("can't go up behind the menu bar", () => {
    const to = { ...rect, y: -50 };
    expect(moved(state, "zed", to, screen).windows.zed.rect?.y).toBe(MENU_BAR);
  });
  it("keeps some of the title bar on screen to grab it again", () => {
    const far = moved(state, "zed", { ...rect, x: 5000, y: 5000 }, screen)
      .windows.zed.rect;
    expect(far?.x).toBeLessThan(screen.width);
    expect(far?.y).toBeLessThan(screen.height);
    const left = moved(state, "zed", { ...rect, x: -5000 }, screen).windows.zed
      .rect;
    expect((left?.x ?? 0) + rect.w).toBeGreaterThan(0);
  });
});

describe("minimizing and zooming", () => {
  it("minimizes", () => {
    const state = minimized(opened(initialWindows, "zed", rect), "zed");
    expect(state.windows.zed.minimized).toBe(true);
  });
  it("orders minimized windows by when they were minimized", () => {
    let state = opened(initialWindows, "zed", rect);
    state = minimized(state, "zed");
    state = minimized(state, BROWSER);
    expect(state.windows[BROWSER].z).toBeGreaterThan(state.windows.zed.z);
    expect(minimized(state, BROWSER)).toBe(state);
  });
  it("zooms and unzooms, keeping the old spot to go back to", () => {
    const state = opened(initialWindows, "zed", rect);
    const big = toggledZoom(state, "zed");
    expect(big.windows.zed).toMatchObject({ rect, zoomed: true });
    expect(toggledZoom(big, "zed").windows.zed.zoomed).toBe(false);
  });
  it("leaves the state alone when zooming to where it already is", () => {
    expect(zoomedTo(initialWindows, BROWSER, false)).toBe(initialWindows);
    const big = zoomedTo(initialWindows, BROWSER, true);
    expect(zoomedTo(big, BROWSER, true)).toBe(big);
  });
  it("ignores windows that aren't open", () => {
    expect(minimized(initialWindows, "zed")).toBe(initialWindows);
    expect(toggledZoom(initialWindows, "zed")).toBe(initialWindows);
    expect(zoomedTo(initialWindows, "zed", true)).toBe(initialWindows);
    expect(moved(initialWindows, "zed", rect, screen)).toBe(initialWindows);
  });
});

describe("loading saved windows", () => {
  it("restores what was saved", () => {
    const state = opened(initialWindows, "zed", rect);
    expect(loaded(JSON.stringify(state))).toEqual(state);
  });
  it("falls back to just the browser when the save is missing or broken", () => {
    expect(loaded(null)).toEqual(initialWindows);
    expect(loaded("{not json")).toEqual(initialWindows);
    expect(
      loaded(JSON.stringify({ windows: { zed: { rect: "a" } }, top: 1 })),
    ).toEqual(initialWindows);
  });
  it("always brings the browser back out, in front, where it was", () => {
    let state = moved(initialWindows, BROWSER, rect, screen);
    state = opened(state, "zed", rect);
    const wasMinimized = loaded(JSON.stringify(minimized(state, BROWSER)));
    expect(wasMinimized.windows[BROWSER]).toMatchObject({
      rect,
      minimized: false,
    });
    expect(topmost(wasMinimized)).toBe(BROWSER);
    const wasClosed = loaded(JSON.stringify(closed(state, BROWSER)));
    expect(topmost(wasClosed)).toBe(BROWSER);
    expect(wasClosed.windows[BROWSER].rect).toBeNull();
  });
});
