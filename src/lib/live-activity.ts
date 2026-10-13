import type { ReactNode } from "react";

// what the notch briefly shows while a page transition plays, like an iOS live activity
export type Activity = { title: string; icon?: ReactNode };

type Listener = (activity: Activity) => void;
const listeners = new Set<Listener>();

export function announce(activity: Activity) {
  for (const listener of listeners) listener(activity);
}

// returns an unsubscribe, so it drops straight into a useEffect
export function onActivity(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
