import { BROWSER, windowsState, zoomWindow } from "#/lib/window-store";
import { useSyncExternalStore } from "react";

// zen's sidebar. the browser filling the screen is its window zooming, which
// scrolling into a page does too. full screen keeps its own sidebar setting and
// starts with it tucked away, like zen's compact mode
export type BrowserState = {
  sidebar: boolean;
  sidebarZoomed: boolean;
};

// px scrolled before it expands. it only shrinks again right at the top, so
// hovering around this line doesn't flip it back and forth
export const EXPAND_AT = 40;

export const initialBrowser: BrowserState = {
  sidebar: true,
  sidebarZoomed: false,
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

export function sidebarShown(state: BrowserState, zoomed: boolean) {
  return zoomed ? state.sidebarZoomed : state.sidebar;
}

// flips the setting for the size the window is at, leaving the other alone
export function toggledSidebar(
  state: BrowserState,
  zoomed: boolean,
): BrowserState {
  return zoomed
    ? { ...state, sidebarZoomed: !state.sidebarZoomed }
    : { ...state, sidebar: !state.sidebar };
}

let state = initialBrowser;
const listeners = new Set<() => void>();

function set(next: BrowserState) {
  if (next === state) return;
  state = next;
  for (const listener of listeners) listener();
}

function browserZoomed() {
  return windowsState().windows[BROWSER]?.zoomed ?? false;
}

// called from the page's scroll handler
export function scrolledTo(scrollTop: number) {
  zoomWindow(BROWSER, nextExpanded(browserZoomed(), scrollTop));
}

// called from the page's wheel handler
export function wheeled(deltaY: number, scrollTop: number) {
  zoomWindow(BROWSER, wheelExpanded(browserZoomed(), deltaY, scrollTop));
}

export function toggleSidebar() {
  set(toggledSidebar(state, browserZoomed()));
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
    () => initialBrowser,
  );
}
