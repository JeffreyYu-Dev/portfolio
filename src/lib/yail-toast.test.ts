import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let toast: typeof import("#/lib/yail-toast");

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  toast = await import("#/lib/yail-toast");
});
afterEach(() => {
  vi.useRealTimers();
});

describe("sent toast", () => {
  it("shows the sent message and hides after 6 seconds", () => {
    toast.showSent("s1");
    expect(toast.getToast().sentId).toBe("s1");
    vi.advanceTimersByTime(toast.TOAST_MS - 1);
    expect(toast.getToast().sentId).toBe("s1");
    vi.advanceTimersByTime(1);
    expect(toast.getToast().sentId).toBeNull();
  });
  it("restarts the clock for a second send", () => {
    toast.showSent("s1");
    vi.advanceTimersByTime(5000);
    toast.showSent("s2");
    vi.advanceTimersByTime(5000);
    expect(toast.getToast().sentId).toBe("s2");
  });
  it("can be dismissed early", () => {
    toast.showSent("s1");
    toast.dismiss();
    expect(toast.getToast().sentId).toBeNull();
  });
});
