import { useSyncExternalStore } from "react";

// lets any button on the site pin the notch open. hover still peeks it open on top of that
type State = { pinned: boolean };

let state: State = { pinned: false };
const initial = state;
const listeners = new Set<() => void>();

function set(next: State) {
  state = next;
  for (const listener of listeners) listener();
}

export function openNotch() {
  set({ pinned: true });
}

export function closeNotch() {
  set({ pinned: false });
}

export function toggleNotch() {
  set({ pinned: !state.pinned });
}

export function useNotch() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => state,
    // the server always renders it closed
    () => initial,
  );
}
