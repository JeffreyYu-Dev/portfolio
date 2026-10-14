import { findProject } from "#/data/projects";
import { findWork } from "#/data/work";
import { normalizePath } from "#/lib/browser-address";
import { yailTitle } from "#/lib/yail";

// the browser's tabs, like a real browser's: navigating changes the tab you're on,
// and each tab remembers its own page. they only last for the visit
export type Tab = { id: number; path: string };
export type Tabs = { tabs: Tab[]; active: number; next: number };

export function initialTabs(path: string): Tabs {
  return { tabs: [{ id: 1, path: normalizePath(path) }], active: 1, next: 2 };
}

export function activeTab(state: Tabs) {
  return state.tabs.find((tab) => tab.id === state.active) ?? state.tabs[0];
}

// the active tab moved to another page
export function navigate(state: Tabs, path: string): Tabs {
  const to = normalizePath(path);
  if (activeTab(state).path === to) return state;
  return {
    ...state,
    tabs: state.tabs.map((tab) =>
      tab.id === state.active ? { ...tab, path: to } : tab,
    ),
  };
}

export function openTab(state: Tabs, path: string): Tabs {
  const tab = { id: state.next, path: normalizePath(path) };
  return { tabs: [...state.tabs, tab], active: tab.id, next: state.next + 1 };
}

export function selectTab(state: Tabs, id: number): Tabs {
  if (!state.tabs.some((tab) => tab.id === id)) return state;
  return { ...state, active: id };
}

// the last tab can't close. closing the active one moves to its neighbour,
// the one after it if there is one
export function closeTab(state: Tabs, id: number): Tabs {
  const index = state.tabs.findIndex((tab) => tab.id === id);
  if (index === -1 || state.tabs.length === 1) return state;
  const tabs = state.tabs.filter((tab) => tab.id !== id);
  const active =
    id === state.active ? tabs[Math.min(index, tabs.length - 1)].id : state.active;
  return { ...state, tabs, active };
}

export function titleFor(path: string) {
  const to = normalizePath(path);
  if (to === "/") return "Home";
  if (to === "/about") return "About Me";
  if (to === "/contact") return "Contact";
  if (to === "/yail" || to.startsWith("/yail/")) return yailTitle(to);
  const [, section, id] = to.split("/");
  if (section === "work" && id) return findWork(id)?.company ?? to;
  if (section === "projects" && id) return findProject(id)?.name ?? to;
  return to;
}
