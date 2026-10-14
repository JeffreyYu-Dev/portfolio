import { useSyncExternalStore } from "react";
import type { Draft } from "#/lib/mail-store";

// gmail's floating new message window. module state, so it stays open while the
// visitor moves between yail pages. the text itself lives in mail-store's draft
export type ComposeMode = "closed" | "open" | "minimised" | "expanded";
type ComposeState = { mode: ComposeMode; initial: Draft | null; key: number };

const closed: ComposeState = { mode: "closed", initial: null, key: 0 };
let state = closed;
const listeners = new Set<() => void>();

function set(next: ComposeState) {
  state = next;
  for (const listener of listeners) listener();
}

export const getCompose = () => state;

// a new key remounts the form, so a reply opened over another message starts fresh
export function openCompose(draft: Draft) {
  set({ mode: "open", initial: draft, key: state.key + 1 });
}

function mode(next: ComposeMode) {
  if (state.mode !== "closed") set({ ...state, mode: next });
}

export const minimise = () => mode("minimised");
export const expand = () => mode("expanded");
export const restore = () => mode("open");

export function closeCompose() {
  set({ ...closed, key: state.key });
}

export function useCompose() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => state,
    () => closed,
  );
}
