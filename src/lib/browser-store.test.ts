import { describe, expect, it } from "vitest";
import {
  EXPAND_AT,
  initialBrowser,
  nextExpanded,
  sidebarShown,
  toggledSidebar,
  wheelExpanded,
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

describe("the sidebar", () => {
  it("shows beside the page and starts tucked away in full screen", () => {
    expect(sidebarShown(initialBrowser, false)).toBe(true);
    expect(sidebarShown(initialBrowser, true)).toBe(false);
  });
  it("keeps a setting per size, so going back restores the earlier one", () => {
    const closed = toggledSidebar(initialBrowser, false);
    const openBig = toggledSidebar(closed, true);
    expect(sidebarShown(openBig, true)).toBe(true);
    expect(sidebarShown(openBig, false)).toBe(false);
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
