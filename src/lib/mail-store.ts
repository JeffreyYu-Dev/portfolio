import { useSyncExternalStore } from "react";

// what a visitor has done in mail: which emails they've opened, what they've sent
// me and an unsent draft. kept in their browser only, replies go to their real inbox
export type SentEmail = {
  id: string;
  subject: string;
  body: string;
  date: string;
};
export type Draft = {
  name: string;
  email: string;
  subject: string;
  body: string;
  // when they started writing it. sent as the spam check's start time, so
  // reopening an old draft and sending straight away isn't mistaken for a bot
  startedAt: number;
};
export type MailState = {
  read: string[];
  sent: SentEmail[];
  draft: Draft | null;
};

export const STORAGE_KEY = "mail:v1";
export const DRAFT_DELAY_MS = 500;
const MAX_SENT = 20;

export const emptyMail: MailState = { read: [], sent: [], draft: null };

export function newDraft(now = Date.now()): Draft {
  return { name: "", email: "", subject: "", body: "", startedAt: now };
}

// --- pure updates ---

export function withRead(state: MailState, id: string): MailState {
  if (state.read.includes(id)) return state;
  return { ...state, read: [...state.read, id] };
}

export function withSent(state: MailState, email: SentEmail): MailState {
  return {
    ...state,
    sent: [email, ...state.sent].slice(0, MAX_SENT),
    draft: null,
  };
}

export function withDraft(state: MailState, draft: Draft | null): MailState {
  const empty =
    !draft ||
    [draft.name, draft.email, draft.subject, draft.body].every(
      (f) => !f.trim(),
    );
  return { ...state, draft: empty ? null : draft };
}

export function unreadCount(state: MailState, ids: string[]) {
  return ids.filter((id) => !state.read.includes(id)).length;
}

// whatever is in storage may be from an older version or hand-edited,
// so keep only the parts that still have the right shape
export function parseStored(raw: string | null): MailState {
  let data: unknown;
  try {
    data = JSON.parse(raw ?? "");
  } catch {
    return emptyMail;
  }
  if (!isRecord(data)) return emptyMail;
  return {
    read: Array.isArray(data.read)
      ? data.read.filter((id): id is string => typeof id === "string")
      : [],
    sent: Array.isArray(data.sent)
      ? data.sent.filter(isSent).slice(0, MAX_SENT)
      : [],
    draft: isDraft(data.draft) ? data.draft : null,
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isSent = (v: unknown): v is SentEmail =>
  isRecord(v) &&
  ["id", "subject", "body", "date"].every((k) => typeof v[k] === "string");

const isDraft = (v: unknown): v is Draft =>
  isRecord(v) &&
  ["name", "email", "subject", "body"].every((k) => typeof v[k] === "string") &&
  typeof v.startedAt === "number";

// --- the store ---

let state = emptyMail;
let loaded = false;
let pending: ReturnType<typeof setTimeout> | undefined;
let pendingDraft: Draft | null = null;
const listeners = new Set<() => void>();

// read lazily on first use, after hydration, so the server render and the
// first client render agree (everything unread, nothing sent)
function load() {
  if (loaded) return;
  try {
    // inside the try: with site data blocked, even reading localStorage throws
    if (typeof localStorage === "undefined") return;
    loaded = true;
    state = parseStored(localStorage.getItem(STORAGE_KEY));
  } catch {
    // storage blocked (private mode, permissions). mail still works for the visit
    loaded = true;
  }
}

function set(next: MailState) {
  if (next === state) return;
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // full or blocked, same as above
  }
  for (const listener of listeners) listener();
}

export function getMail() {
  load();
  return state;
}

export function markRead(id: string) {
  set(withRead(getMail(), id));
}

// called on every keystroke, so it waits for a pause before writing
export function saveDraft(draft: Draft) {
  pendingDraft = draft;
  clearTimeout(pending);
  pending = setTimeout(flushDraft, DRAFT_DELAY_MS);
}

export function flushDraft() {
  clearTimeout(pending);
  pending = undefined;
  if (!pendingDraft) return;
  const draft = pendingDraft;
  pendingDraft = null;
  set(withDraft(getMail(), draft));
}

export function recordSent(email: SentEmail) {
  // a save still waiting would otherwise bring the draft back after sending
  clearTimeout(pending);
  pending = undefined;
  pendingDraft = null;
  set(withSent(getMail(), email));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useMail() {
  return useSyncExternalStore(subscribe, getMail, () => emptyMail);
}

// false on the server and during hydration, true once saved state is readable
export function useMailReady() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
