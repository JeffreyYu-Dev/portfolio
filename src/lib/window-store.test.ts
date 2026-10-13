import { describe, expect, it } from "vitest";
import {
  closed,
  focused,
  initialWindows,
  opened,
  type Windows,
} from "#/lib/window-store";

describe("window state", () => {
  it("starts with everything closed", () => {
    expect(Object.values(initialWindows).every((w) => !w.open)).toBe(true);
  });
  it("opens and closes", () => {
    const open = opened(initialWindows, "mail");
    expect(open.mail.open).toBe(true);
    expect(closed(open, "mail").mail.open).toBe(false);
  });
  it("puts an opened window on top", () => {
    const state = opened(initialWindows, "mail");
    expect(state.mail.z).toBeGreaterThan(initialWindows.mail.z);
  });
  it("doesn't raise a window that's already on top", () => {
    const state = opened(initialWindows, "mail");
    expect(focused(state, "mail")).toBe(state);
    expect(opened(state, "mail")).toBe(state);
  });
  it("raises a window above the others", () => {
    // a second app type-cast in, so the ordering is tested before phase 3 adds one
    const two = {
      ...opened(initialWindows, "mail"),
      other: { id: "other", open: true, z: 5 },
    } as unknown as Windows;
    expect(focused(two, "mail").mail.z).toBe(6);
  });
  it("closing an already closed window changes nothing", () => {
    expect(closed(initialWindows, "mail")).toBe(initialWindows);
  });
});
