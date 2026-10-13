import { useSyncExternalStore } from "react";

// which app windows are open and which is in front. phase 3 adds position, size
// and minimizing to this same store (see the macos desktop spec)
export type AppId = "mail";
export type Win = { id: AppId; open: boolean; z: number };
export type Windows = Record<AppId, Win>;

export const initialWindows: Windows = {
  mail: { id: "mail", open: false, z: 0 },
};

export function focused(state: Windows, id: AppId): Windows {
  const others = Object.values(state).filter((w) => w.id !== id);
  const top = Math.max(0, ...others.map((w) => w.z));
  // already in front: same state, so repeated clicks don't re-render or climb forever
  if (state[id].z > top) return state;
  return { ...state, [id]: { ...state[id], z: top + 1 } };
}

export function opened(state: Windows, id: AppId): Windows {
  const open = state[id].open
    ? state
    : { ...state, [id]: { ...state[id], open: true } };
  return focused(open, id);
}

export function closed(state: Windows, id: AppId): Windows {
  if (!state[id].open) return state;
  return { ...state, [id]: { ...state[id], open: false } };
}

let state = initialWindows;
const listeners = new Set<() => void>();

function set(next: Windows) {
  if (next === state) return;
  state = next;
  for (const listener of listeners) listener();
}

export function openWindow(id: AppId) {
  set(opened(state, id));
}

export function closeWindow(id: AppId) {
  set(closed(state, id));
}

export function focusWindow(id: AppId) {
  set(focused(state, id));
}

export function useWindow(id: AppId) {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => state[id],
    // the server always renders windows closed
    () => initialWindows[id],
  );
}
