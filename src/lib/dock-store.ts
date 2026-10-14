import { BROWSER, useWindows } from "#/lib/window-store";
import { useSyncExternalStore } from "react";

// whether the dock is tucked away. the browser filling the screen hides it, like
// a full-screen mac app, until the mouse peeks it back from the bottom edge.
// minimized windows sit in the dock, so they hide with it
let peek = false;
const listeners = new Set<() => void>();

export function setDockPeek(next: boolean) {
  if (next === peek) return;
  peek = next;
  for (const listener of listeners) listener();
}

function usePeek() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => peek,
    () => false,
  );
}

// the browser filling the screen, and not minimized out of the way
export function useBrowserFullScreen() {
  const browser = useWindows().windows[BROWSER];
  return !!browser?.zoomed && !browser.minimized;
}

export function useDockHidden() {
  const fullScreen = useBrowserFullScreen();
  const peeking = usePeek();
  return fullScreen && !peeking;
}
