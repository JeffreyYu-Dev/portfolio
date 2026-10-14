import { beforeEach, describe, expect, it, vi } from "vitest";
import { newDraft } from "#/lib/mail-store";

let compose: typeof import("#/lib/yail-compose");

beforeEach(async () => {
  vi.resetModules();
  compose = await import("#/lib/yail-compose");
});

describe("compose window", () => {
  it("starts closed", () => {
    expect(compose.getCompose()).toMatchObject({
      mode: "closed",
      initial: null,
    });
  });
  it("opens with a draft and a fresh key each time", () => {
    const draft = newDraft(1);
    compose.openCompose(draft);
    const first = compose.getCompose();
    expect(first).toMatchObject({ mode: "open", initial: draft });
    compose.openCompose({ ...draft, subject: "Re: hi" });
    expect(compose.getCompose().key).toBeGreaterThan(first.key);
  });
  it("minimises, expands and restores without losing the draft", () => {
    const draft = newDraft(1);
    compose.openCompose(draft);
    compose.minimise();
    expect(compose.getCompose()).toMatchObject({
      mode: "minimised",
      initial: draft,
    });
    compose.expand();
    expect(compose.getCompose().mode).toBe("expanded");
    compose.restore();
    expect(compose.getCompose().mode).toBe("open");
  });
  it("ignores window buttons while closed", () => {
    compose.minimise();
    compose.expand();
    expect(compose.getCompose().mode).toBe("closed");
  });
  it("closes", () => {
    compose.openCompose(newDraft(1));
    compose.closeCompose();
    expect(compose.getCompose()).toMatchObject({
      mode: "closed",
      initial: null,
    });
  });
});
