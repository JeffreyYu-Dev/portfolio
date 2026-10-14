import { useSyncExternalStore } from "react";

// whether the browser has grown to fill the screen, and zen's sidebar. scrolling
// into a page expands it, which tucks the sidebar away like zen's compact mode
export type BrowserState = {
  expanded: boolean;
  sidebar: boolean;
  // the sidebar as it was before expanding, put back on shrinking
  sidebarBefore: boolean | null;
};

// px scrolled before it expands. it only shrinks again right at the top, so
// hovering around this line doesn't flip it back and forth
export const EXPAND_AT = 40;

export const initialBrowser: BrowserState = {
  expanded: false,
  sidebar: true,
  sidebarBefore: null,
};

export function nextExpanded(isExpanded: boolean, scrollTop: number) {
  if (!isExpanded) return scrollTop > EXPAND_AT;
  return scrollTop > 0;
}

// a smaller wheel delta is trackpad jitter, not someone scrolling
const WHEEL_MIN = 4;

// the scroll gesture itself, so short pages that can't move still expand.
// scrolling up only shrinks from the top, mid-page it just scrolls
export function wheelExpanded(
  isExpanded: boolean,
  deltaY: number,
  scrollTop: number,
) {
  if (deltaY >= WHEEL_MIN) return true;
  if (deltaY <= -WHEEL_MIN && scrollTop <= 0) return false;
  return isExpanded;
}

export function expanded(state: BrowserState): BrowserState {
  if (state.expanded) return state;
  return { expanded: true, sidebar: false, sidebarBefore: state.sidebar };
}

export function shrunk(state: BrowserState): BrowserState {
  if (!state.expanded) return state;
  return {
    expanded: false,
    sidebar: state.sidebarBefore ?? state.sidebar,
    sidebarBefore: null,
  };
}

export function toggledSidebar(state: BrowserState): BrowserState {
  return { ...state, sidebar: !state.sidebar };
}

let state = initialBrowser;
const listeners = new Set<() => void>();

function set(next: BrowserState) {
  if (next === state) return;
  state = next;
  for (const listener of listeners) listener();
}

// called from the page's scroll handler
export function scrolledTo(scrollTop: number) {
  const want = nextExpanded(state.expanded, scrollTop);
  set(want ? expanded(state) : shrunk(state));
}

// called from the page's wheel handler
export function wheeled(deltaY: number, scrollTop: number) {
  const want = wheelExpanded(state.expanded, deltaY, scrollTop);
  set(want ? expanded(state) : shrunk(state));
}

export function toggleSidebar() {
  set(toggledSidebar(state));
}

export function useBrowser() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => state,
    // the server always renders the window at its normal size
    () => initialBrowser,
  );
}
