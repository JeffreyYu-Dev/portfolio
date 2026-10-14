import { describe, expect, it } from "vitest";
import { furthestEntry } from "#/lib/browser-history";

describe("furthestEntry", () => {
  it("moves to a pushed entry, dropping the ones after it", () => {
    expect(furthestEntry(4, 2, "PUSH")).toBe(2);
  });

  it("keeps the entries ahead when going back", () => {
    expect(furthestEntry(4, 3, "BACK")).toBe(4);
    expect(furthestEntry(4, 1, "GO")).toBe(4);
  });

  it("follows forward past what it knew", () => {
    expect(furthestEntry(2, 3, "FORWARD")).toBe(3);
  });

  it("leaves the entries ahead on a replace", () => {
    expect(furthestEntry(4, 2, "REPLACE")).toBe(4);
  });
});
