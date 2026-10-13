import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  emptyMail,
  newDraft,
  parseStored,
  type SentEmail,
  unreadCount,
  withDraft,
  withRead,
  withSent,
} from "#/lib/mail-store";

const sent = (n: number): SentEmail => ({
  id: `s${n}`,
  subject: `subject ${n}`,
  body: "b",
  date: new Date(2026, 0, n).toISOString(),
});

describe("parseStored", () => {
  it("returns empty state for nothing, junk or the wrong shape", () => {
    for (const raw of [null, "", "{", "null", "[]", "42", '{"read":"x"}']) {
      expect(parseStored(raw)).toEqual(emptyMail);
    }
  });
  it("keeps the valid parts of an older shape", () => {
    const raw = JSON.stringify({ read: ["welcome", 3], sent: "nope" });
    expect(parseStored(raw)).toEqual({
      read: ["welcome"],
      sent: [],
      draft: null,
    });
  });
  it("drops malformed sent emails and drafts", () => {
    const raw = JSON.stringify({
      read: [],
      sent: [sent(1), { id: 1 }],
      draft: { name: "x" },
    });
    expect(parseStored(raw)).toEqual({
      read: [],
      sent: [sent(1)],
      draft: null,
    });
  });
  it("round-trips a full state", () => {
    const state = {
      read: ["a"],
      sent: [sent(1)],
      draft: { ...newDraft(5), body: "hi" },
    };
    expect(parseStored(JSON.stringify(state))).toEqual(state);
  });
});

describe("withRead / unreadCount", () => {
  it("counts inbox ids that haven't been read", () => {
    const state = withRead(emptyMail, "a");
    expect(unreadCount(state, ["a", "b", "c"])).toBe(2);
  });
  it("doesn't duplicate an id", () => {
    const once = withRead(emptyMail, "a");
    expect(withRead(once, "a")).toBe(once);
  });
  it("ignores read ids that are no longer in the inbox", () => {
    expect(unreadCount(withRead(emptyMail, "gone"), ["a"])).toBe(1);
  });
});

describe("withSent", () => {
  it("adds newest first and clears the draft", () => {
    const state = withSent({ ...emptyMail, draft: newDraft() }, sent(1));
    expect(withSent(state, sent(2))).toEqual({
      read: [],
      sent: [sent(2), sent(1)],
      draft: null,
    });
  });
  it("keeps only the newest 20", () => {
    let state = emptyMail;
    for (let n = 1; n <= 25; n++) state = withSent(state, sent(n));
    expect(state.sent).toHaveLength(20);
    expect(state.sent[0].id).toBe("s25");
    expect(state.sent.at(-1)?.id).toBe("s6");
  });
});

describe("withDraft", () => {
  it("stores an all-empty draft as null", () => {
    expect(
      withDraft(emptyMail, { ...newDraft(), subject: "  " }).draft,
    ).toBeNull();
  });
  it("keeps when the draft was started", () => {
    const draft = { ...newDraft(123), body: "hi" };
    expect(withDraft(emptyMail, draft).draft?.startedAt).toBe(123);
  });
});

describe("store", () => {
  let storage: Map<string, string>;

  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    storage = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => storage.set(k, v),
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("saves the draft after the delay and persists it", async () => {
    const store = await import("#/lib/mail-store");
    store.saveDraft({ ...store.newDraft(1), body: "h" });
    expect(store.getMail().draft).toBeNull();
    vi.advanceTimersByTime(store.DRAFT_DELAY_MS);
    expect(store.getMail().draft?.body).toBe("h");
    expect(
      JSON.parse(storage.get(store.STORAGE_KEY) ?? "{}").draft.body,
    ).toBe("h");
  });

  it("flushDraft saves a pending draft right away", async () => {
    const store = await import("#/lib/mail-store");
    store.saveDraft({ ...store.newDraft(1), body: "h" });
    store.flushDraft();
    expect(store.getMail().draft?.body).toBe("h");
  });

  it("a pending draft save can't bring back a draft after sending", async () => {
    const store = await import("#/lib/mail-store");
    store.saveDraft({ ...store.newDraft(1), body: "h" });
    store.recordSent(sent(1));
    vi.advanceTimersByTime(store.DRAFT_DELAY_MS * 2);
    expect(store.getMail().draft).toBeNull();
    expect(store.getMail().sent).toEqual([sent(1)]);
  });

  it("loads what was stored before", async () => {
    storage.set(
      "mail:v1",
      JSON.stringify({ read: ["welcome"], sent: [], draft: null }),
    );
    const store = await import("#/lib/mail-store");
    store.markRead("play");
    expect(store.getMail().read).toEqual(["welcome", "play"]);
  });

  it("keeps working when storage throws", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("full");
      },
    });
    const store = await import("#/lib/mail-store");
    store.markRead("a");
    expect(store.getMail().read).toEqual(["a"]);
  });
});
