import { useSyncExternalStore } from "react";
import { z } from "zod";

// every open window on the desktop: where it sits, what's in front, and whether
// it's tucked in the dock or filling the screen. the browser's route stays in the
// url, this only knows about frames

export type Rect = { x: number; y: number; w: number; h: number };

export type Win = Rect & {
  // focus order, highest is in front
  z: number;
  minimized: boolean;
  // fills the desktop. x/y/w/h are left alone so unzooming puts it back
  zoomed: boolean;
};

export type WindowsState = {
  windows: Record<string, Win>;
  // the highest z handed out so far
  top: number;
};

export type Bounds = { width: number; height: number };

// the notch-high strip at the top a window can't be dragged under
export const MENU_BAR = 36;
// how much of the title bar has to stay on screen, so it can always be grabbed again
const KEEP_X = 80;
const KEEP_Y = 28;

export const initialWindows: WindowsState = { windows: {}, top: 0 };

function patched(
  state: WindowsState,
  id: string,
  change: (win: Win) => Partial<Win>,
): WindowsState {
  const win = state.windows[id];
  if (!win) return state;
  return {
    ...state,
    windows: { ...state.windows, [id]: { ...win, ...change(win) } },
  };
}

// opens it in front at `rect`, or if it's already open, brings it back as it was
export function opened(
  state: WindowsState,
  id: string,
  rect: Rect,
): WindowsState {
  const top = state.top + 1;
  const win = state.windows[id] ?? {
    ...rect,
    z: top,
    minimized: false,
    zoomed: false,
  };
  return {
    top,
    windows: { ...state.windows, [id]: { ...win, z: top, minimized: false } },
  };
}

export function closed(state: WindowsState, id: string): WindowsState {
  if (!state.windows[id]) return state;
  const { [id]: _, ...windows } = state.windows;
  return { ...state, windows };
}

export function focused(state: WindowsState, id: string): WindowsState {
  const win = state.windows[id];
  if (!win || win.z === state.top) return state;
  const top = state.top + 1;
  return { ...patched(state, id, () => ({ z: top })), top };
}

export function moved(
  state: WindowsState,
  id: string,
  x: number,
  y: number,
  bounds: Bounds,
): WindowsState {
  return patched(state, id, (win) => ({
    x: Math.min(Math.max(x, KEEP_X - win.w), bounds.width - KEEP_X),
    y: Math.min(Math.max(y, MENU_BAR), bounds.height - KEEP_Y),
  }));
}

export function minimized(state: WindowsState, id: string): WindowsState {
  return patched(state, id, () => ({ minimized: true }));
}

export function toggledZoom(state: WindowsState, id: string): WindowsState {
  return patched(state, id, (win) => ({ zoomed: !win.zoomed }));
}

// the front window you can see, for the menu bar's app name
export function topmost(state: WindowsState): string | null {
  let best: string | null = null;
  let bestZ = -1;
  for (const [id, win] of Object.entries(state.windows)) {
    if (!win.minimized && win.z > bestZ) {
      best = id;
      bestZ = win.z;
    }
  }
  return best;
}

const saved = z.object({
  windows: z.record(
    z.string(),
    z.object({
      x: z.number(),
      y: z.number(),
      w: z.number(),
      h: z.number(),
      z: z.number(),
      minimized: z.boolean(),
      zoomed: z.boolean(),
    }),
  ),
  top: z.number(),
});

// a save from an older version, or one someone edited, just starts fresh
export function loaded(raw: string | null): WindowsState {
  if (!raw) return initialWindows;
  try {
    const result = saved.safeParse(JSON.parse(raw));
    return result.success ? result.data : initialWindows;
  } catch {
    return initialWindows;
  }
}

const STORAGE_KEY = "windows";

let state =
  typeof window === "undefined"
    ? initialWindows
    : loaded(localStorage.getItem(STORAGE_KEY));
const listeners = new Set<() => void>();

function set(next: WindowsState) {
  if (next === state) return;
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // private mode or full storage, positions just won't survive a reload
  }
  for (const listener of listeners) listener();
}

function screen(): Bounds {
  return { width: window.innerWidth, height: window.innerHeight };
}

export function openWindow(id: string, rect: Rect) {
  set(opened(state, id, rect));
}

export function closeWindow(id: string) {
  set(closed(state, id));
}

export function focusWindow(id: string) {
  set(focused(state, id));
}

// called once when a drag ends. during the drag the frame moves itself
export function moveWindow(id: string, x: number, y: number) {
  set(moved(state, id, x, y, screen()));
}

export function minimizeWindow(id: string) {
  set(minimized(state, id));
}

export function toggleZoom(id: string) {
  set(toggledZoom(state, id));
}

export function useWindows() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => state,
    // the server has no saved positions, so nothing is open yet
    () => initialWindows,
  );
}
