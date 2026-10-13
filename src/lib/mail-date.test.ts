import { describe, expect, it } from "vitest";
import { mailDate } from "#/lib/mail-date";

// local times, so the tests pass in any timezone
const now = new Date(2026, 9, 13, 18, 30); // tue oct 13 2026, 6:30pm
const at = (y: number, m: number, d: number, h: number, min: number) =>
  new Date(y, m, d, h, min).toISOString();

describe("mailDate", () => {
  it("shows the time for today", () => {
    expect(mailDate(at(2026, 9, 13, 15, 4), now)).toBe("3:04 PM");
    expect(mailDate(at(2026, 9, 13, 0, 5), now)).toBe("12:05 AM");
    expect(mailDate(at(2026, 9, 13, 12, 0), now)).toBe("12:00 PM");
  });
  it("shows Yesterday", () => {
    expect(mailDate(at(2026, 9, 12, 23, 59), now)).toBe("Yesterday");
  });
  it("shows Yesterday across a month boundary", () => {
    const first = new Date(2026, 10, 1, 9, 0);
    expect(mailDate(at(2026, 9, 31, 22, 0), first)).toBe("Yesterday");
  });
  it("shows the weekday within the last week", () => {
    expect(mailDate(at(2026, 9, 9, 10, 0), now)).toBe("Friday");
    expect(mailDate(at(2026, 9, 7, 10, 0), now)).toBe("Wednesday");
  });
  it("shows the month and day after a week", () => {
    expect(mailDate(at(2026, 9, 6, 10, 0), now)).toBe("Oct 6");
  });
  it("shows the month and day across a year boundary", () => {
    expect(mailDate(at(2025, 11, 31, 10, 0), now)).toBe("Dec 31");
  });
  it("shows future dates as month and day, not negative days", () => {
    expect(mailDate(at(2026, 9, 20, 10, 0), now)).toBe("Oct 20");
  });
  it("handles a bare date string", () => {
    expect(mailDate("2026-10-01", now)).toMatch(/^(Sep 30|Oct 1)$/);
  });
});
