import { describe, expect, it } from "vitest";
import {
  EXPAND_AT,
  expanded,
  initialBrowser,
  nextExpanded,
  wheelExpanded,
  shrunk,
  toggledSidebar,
} from "#/lib/browser-store";

describe("nextExpanded", () => {
  it("expands once scrolled past the threshold", () => {
    expect(nextExpanded(false, EXPAND_AT)).toBe(false);
    expect(nextExpanded(false, EXPAND_AT + 1)).toBe(true);
  });
  it("only shrinks back at the very top, so it doesn't flicker near the line", () => {
    expect(nextExpanded(true, EXPAND_AT - 10)).toBe(true);
    expect(nextExpanded(true, 1)).toBe(true);
    expect(nextExpanded(true, 0)).toBe(false);
  });
  it("treats overscroll above the top as the top", () => {
    expect(nextExpanded(true, -20)).toBe(false);
  });
});

describe("expanding and the sidebar", () => {
  it("starts shrunk with the sidebar open", () => {
    expect(initialBrowser).toEqual({
      expanded: false,
      sidebar: true,
      sidebarBefore: null,
    });
  });
  it("collapses the sidebar on expand and restores it on shrink", () => {
    const big = expanded(initialBrowser);
    expect(big).toMatchObject({ expanded: true, sidebar: false });
    expect(shrunk(big)).toEqual(initialBrowser);
  });
  it("keeps a closed sidebar closed after shrinking", () => {
    const closed = toggledSidebar(initialBrowser);
    expect(shrunk(expanded(closed)).sidebar).toBe(false);
  });
  it("lets the sidebar open while expanded, then restores the earlier state", () => {
    const closed = toggledSidebar(initialBrowser);
    const big = toggledSidebar(expanded(closed));
    expect(big.sidebar).toBe(true);
    expect(shrunk(big).sidebar).toBe(false);
  });
  it("does nothing when already in that mode", () => {
    const big = expanded(initialBrowser);
    expect(expanded(big)).toBe(big);
    expect(shrunk(initialBrowser)).toBe(initialBrowser);
  });
});

describe("wheelExpanded", () => {
  it("expands on a scroll down, even when the page is too short to move", () => {
    expect(wheelExpanded(false, 12, 0)).toBe(true);
  });
  it("shrinks on a scroll up at the top", () => {
    expect(wheelExpanded(true, -12, 0)).toBe(false);
  });
  it("stays expanded scrolling up mid-page, the scroll itself handles the top", () => {
    expect(wheelExpanded(true, -12, 300)).toBe(true);
  });
  it("ignores tiny trackpad jitter", () => {
    expect(wheelExpanded(false, 2, 0)).toBe(false);
    expect(wheelExpanded(true, -2, 0)).toBe(true);
  });
  it("leaves sideways scrolling alone", () => {
    expect(wheelExpanded(false, 0, 0)).toBe(false);
  });
});
