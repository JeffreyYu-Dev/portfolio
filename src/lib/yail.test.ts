import { describe, expect, it } from "vitest";
import type { Email } from "#/data/mail";
import { emptyMail, type MailState, newDraft } from "#/lib/mail-store";
import {
  findItem,
  isBox,
  isTab,
  listFor,
  search,
  searchQuery,
  unreadByTab,
  yailTitle,
} from "#/lib/yail";

const email = (
  id: string,
  tab: Email["tab"],
  date: string,
  extra = {},
): Email => ({
  id,
  tab,
  date,
  from: "Jeffrey Yu",
  fromAddress: "jeffrey@yail.com",
  subject: `subject ${id}`,
  body: `body ${id}`,
  ...extra,
});

const emails = [
  email("old", "primary", "2026-01-01T00:00:00"),
  email("new", "primary", "2026-03-01T00:00:00"),
  email("promo", "promotions", "2026-02-01T00:00:00", { from: "Spotify" }),
  email("friend", "social", "2026-02-02T00:00:00", { body: "Come play GAMES" }),
];
const sent = {
  id: "s1",
  subject: "hello from me",
  body: "i liked the site",
  date: "2026-02-15T00:00:00",
};
const state: MailState = {
  ...emptyMail,
  read: ["old"],
  starred: ["promo", "s1"],
  sent: [sent],
};

describe("listFor", () => {
  it("shows an inbox tab newest first", () => {
    const items = listFor("inbox", "primary", state, emails);
    expect(items.map((i) => i.id)).toEqual(["new", "old"]);
    expect(items.map((i) => i.unread)).toEqual([true, false]);
  });
  it("splits the inbox by tab", () => {
    expect(listFor("inbox", "social", state, emails).map((i) => i.id)).toEqual(
      ["friend"],
    );
  });
  it("gathers starred mail from the inbox and sent", () => {
    expect(
      listFor("starred", "primary", state, emails).map((i) => i.id),
    ).toEqual(["s1", "promo"]);
  });
  it("shows sent mail to jeffrey", () => {
    const [item] = listFor("sent", "primary", state, emails);
    expect(item).toMatchObject({
      id: "s1",
      box: "sent",
      from: "To: Jeffrey Yu",
      unread: false,
    });
  });
  it("shows the draft as one item, or nothing", () => {
    expect(listFor("drafts", "primary", state, emails)).toEqual([]);
    const draft = { ...newDraft(0), body: "hey" };
    const items = listFor("drafts", "primary", { ...state, draft }, emails);
    expect(items).toMatchObject([
      { id: "draft", box: "drafts", subject: "(no subject)" },
    ]);
  });
});

describe("findItem", () => {
  it("finds seeded and sent mail in their own mailboxes", () => {
    expect(findItem("inbox", "promo", state, emails)?.starred).toBe(true);
    expect(findItem("sent", "s1", state, emails)?.subject).toBe(
      "hello from me",
    );
  });
  it("finds anything starred under starred", () => {
    expect(findItem("starred", "s1", state, emails)?.box).toBe("sent");
    expect(findItem("starred", "new", state, emails)).toBeNull();
  });
  it("misses unknown ids and the wrong mailbox", () => {
    expect(findItem("inbox", "nope", state, emails)).toBeNull();
    expect(findItem("sent", "promo", state, emails)).toBeNull();
  });
});

describe("search", () => {
  it("matches sender, subject and body regardless of case", () => {
    expect(search("spotify", state, emails).map((i) => i.id)).toEqual([
      "promo",
    ]);
    expect(search("SUBJECT NEW", state, emails).map((i) => i.id)).toEqual([
      "new",
    ]);
    expect(search("games", state, emails).map((i) => i.id)).toEqual([
      "friend",
    ]);
  });
  it("searches sent mail too, newest first", () => {
    const hits = search("e", state, emails).map((i) => i.id);
    expect(hits[0]).toBe("new");
    expect(hits).toContain("s1");
    expect(search("liked the site", state, emails).map((i) => i.id)).toEqual([
      "s1",
    ]);
  });
  it("finds nothing for a blank query", () => {
    expect(search("   ", state, emails)).toEqual([]);
  });
});

describe("unreadByTab", () => {
  it("counts unread mail per tab", () => {
    expect(unreadByTab(state, emails)).toEqual({
      primary: 1,
      promotions: 1,
      social: 1,
    });
  });
});

describe("guards", () => {
  it("knows the mailboxes and tabs", () => {
    expect(["inbox", "starred", "sent", "drafts"].every(isBox)).toBe(true);
    expect(isBox("spam")).toBe(false);
    expect(isTab("social")).toBe(true);
    expect(isTab(3)).toBe(false);
  });
});

describe("searchQuery", () => {
  it.each([
    ["games", "games"],
    [2026, "2026"],
    [undefined, ""],
    [null, ""],
    [{ a: 1 }, ""],
  ])("%j -> %j", (raw, q) => {
    expect(searchQuery(raw)).toBe(q);
  });
});

describe("yailTitle", () => {
  it.each([
    ["/yail/inbox", "Inbox – Yail"],
    ["/yail/starred", "Starred – Yail"],
    ["/yail/sent/s1", "Sent – Yail"],
    ["/yail/drafts", "Drafts – Yail"],
    ["/yail/inbox/promo", "subject promo – Yail"],
    ["/yail/starred/promo", "subject promo – Yail"],
    ["/yail/inbox/nope", "Inbox – Yail"],
    ["/yail/search", "Search results – Yail"],
    ["/yail", "Yail"],
    ["/yail/spam", "Yail"],
  ])("%j -> %j", (path, title) => {
    expect(yailTitle(path, emails)).toBe(title);
  });
});
