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

describe("openDraft", () => {
  it("opens with text typed moments ago, not the last saved draft", async () => {
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => storage.set(k, v),
    });
    const store = await import("#/lib/mail-store");
    store.saveDraft({ ...store.newDraft(1), body: "thanks" });
    store.flushDraft();
    // still inside the 500ms save delay
    store.saveDraft({ ...store.newDraft(1), body: "thanks!!" });
    compose.openDraft({ subject: "Re: hi" });
    expect(compose.getCompose().initial).toMatchObject({
      body: "thanks!!",
      subject: "Re: hi",
    });
    vi.unstubAllGlobals();
  });
  it("starts a new draft when there isn't one", () => {
    compose.openDraft();
    expect(compose.getCompose().initial).toMatchObject({ body: "", subject: "" });
  });
});
