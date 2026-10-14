import { useSyncExternalStore } from "react";

// gmail's "message sent" box in the corner. it goes away on its own
export const TOAST_MS = 6000;

type ToastState = { sentId: string | null };
const hidden: ToastState = { sentId: null };
let state = hidden;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function set(next: ToastState) {
  state = next;
  for (const listener of listeners) listener();
}

export const getToast = () => state;

export function showSent(id: string) {
  clearTimeout(timer);
  set({ sentId: id });
  timer = setTimeout(dismiss, TOAST_MS);
}

export function dismiss() {
  clearTimeout(timer);
  set(hidden);
}

export function useToast() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => state,
    () => hidden,
  );
}
