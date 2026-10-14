import { type Email, inbox, type MailTab } from "#/data/mail";
import type { MailState, SentEmail } from "#/lib/mail-store";

// what yail shows: the seeded inbox plus the visitor's own sent mail and draft,
// sorted and filtered the way gmail does. pure, the routes just render it
export type Box = "inbox" | "starred" | "sent" | "drafts";
export const BOXES: Box[] = ["inbox", "starred", "sent", "drafts"];
export const TABS: MailTab[] = ["primary", "promotions", "social"];

export type Item = {
  id: string;
  box: "inbox" | "sent" | "drafts";
  from: string;
  fromAddress: string;
  subject: string;
  date: string;
  body: string;
  tab?: MailTab;
  unread: boolean;
  starred: boolean;
};

const TITLES: Record<Box, string> = {
  inbox: "Inbox",
  starred: "Starred",
  sent: "Sent",
  drafts: "Drafts",
};

export const isBox = (s: unknown): s is Box => BOXES.includes(s as Box);
export const isTab = (s: unknown): s is MailTab => TABS.includes(s as MailTab);
export const boxTitle = (box: Box) => TITLES[box];

const newestFirst = (a: Item, b: Item) =>
  Date.parse(b.date) - Date.parse(a.date);

function fromInbox(email: Email, state: MailState): Item {
  return {
    ...email,
    box: "inbox",
    unread: !state.read.includes(email.id),
    starred: state.starred.includes(email.id),
  };
}

function fromSent(email: SentEmail, state: MailState): Item {
  return {
    ...email,
    box: "sent",
    from: "To: Jeffrey Yu",
    fromAddress: "",
    unread: false,
    starred: state.starred.includes(email.id),
  };
}

function everything(state: MailState, emails: Email[]) {
  return [
    ...emails.map((e) => fromInbox(e, state)),
    ...state.sent.map((e) => fromSent(e, state)),
  ];
}

export function listFor(
  box: Box,
  tab: MailTab,
  state: MailState,
  emails: Email[] = inbox,
): Item[] {
  if (box === "drafts") {
    const draft = state.draft;
    if (!draft) return [];
    return [
      {
        id: "draft",
        box: "drafts",
        from: "Draft",
        fromAddress: "",
        subject: draft.subject.trim() || "(no subject)",
        date: new Date(draft.startedAt).toISOString(),
        body: draft.body,
        unread: false,
        starred: false,
      },
    ];
  }
  const all = everything(state, emails);
  const items =
    box === "inbox"
      ? all.filter((i) => i.box === "inbox" && i.tab === tab)
      : box === "sent"
        ? all.filter((i) => i.box === "sent")
        : all.filter((i) => i.starred);
  return items.sort(newestFirst);
}

export function findItem(
  box: Box,
  id: string,
  state: MailState,
  emails: Email[] = inbox,
): Item | null {
  if (box === "drafts") return null;
  const item = everything(state, emails).find((i) => i.id === id);
  if (!item) return null;
  if (box === "starred") return item.starred ? item : null;
  return item.box === box ? item : null;
}

export function search(
  query: string,
  state: MailState,
  emails: Email[] = inbox,
): Item[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return everything(state, emails)
    .filter((i) =>
      [i.from, i.subject, i.body].some((text) =>
        text.toLowerCase().includes(q),
      ),
    )
    .sort(newestFirst);
}

export function unreadByTab(
  state: MailState,
  emails: Email[] = inbox,
): Record<MailTab, number> {
  const counts = { primary: 0, promotions: 0, social: 0 };
  for (const email of emails)
    if (!state.read.includes(email.id)) counts[email.tab]++;
  return counts;
}

// the router parses ?q=2026 into a number, and a hand-typed url can be anything
export function searchQuery(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (typeof raw === "number") return String(raw);
  return "";
}

// tab titles like gmail's. pure, so it only knows seeded subjects, a sent
// email's tab says "Sent"
export function yailTitle(path: string, emails: Email[] = inbox): string {
  const [, , box, id] = path.split("/");
  if (box === "search") return "Search results – Yail";
  if (!isBox(box)) return "Yail";
  const seeded =
    id && (box === "inbox" || box === "starred")
      ? emails.find((e) => e.id === id)
      : undefined;
  return `${seeded ? seeded.subject : boxTitle(box)} – Yail`;
}
