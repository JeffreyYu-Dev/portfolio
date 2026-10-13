import { useSyncExternalStore } from "react";

// the black boot screen on a tab's first visit, see src/components/boot.tsx.
// booting: covering the page while the track loads
// leaving: collapsing into the notch, pages may start revealing
// done: gone for the rest of the session
export type Boot = "booting" | "leaving" | "done";

const KEY = "booted";

function seen() {
  try {
    return sessionStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

let state: Boot = typeof window !== "undefined" && seen() ? "done" : "booting";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setBoot(next: Boot) {
  state = next;
  if (next === "done") {
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {}
  }
  for (const listener of listeners) listener();
}

// read straight from the module, the hook below says "booting" while hydrating
export const bootState = () => state;

export function useBoot() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    // the server always renders the boot screen, the head script hides it for return visits
    () => "booting" as const,
  );
}

// runs fn once the page may reveal: right away, or when the boot screen starts leaving.
// returns a cancel, so it drops straight into an effect
export function afterBoot(fn: () => void) {
  if (state !== "booting") {
    fn();
    return () => {};
  }
  const off = subscribe(() => {
    if (state === "booting") return;
    off();
    fn();
  });
  return off;
}

// inlined in <head> so a session that's already booted never paints the black screen
export const bootScript = `try{sessionStorage.getItem("${KEY}")!==null&&(document.documentElement.dataset.booted="")}catch(e){}`;
