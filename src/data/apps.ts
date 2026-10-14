import { BROWSER } from "#/lib/window-store";

// the apps that open windows. the dock lists them with a running dot, and a
// minimized window's thumbnail wears its app's icon
export type App = {
  name: string;
  icon: string;
  // whether a window id belongs to this app
  owns: (windowId: string) => boolean;
  // what a window is called, for its minimized thumbnail in the dock
  title: (windowId: string) => string;
};

export const zen: App = {
  name: "Zen",
  icon: "/zen-browser.png",
  owns: (id) => id === BROWSER,
  title: () => "Zen",
};

// a window per folder, ids like "finder-projects"
export const finder: App = {
  name: "Finder",
  icon: "/finder.svg",
  owns: (id) => id.startsWith("finder-"),
  title: (id) => {
    const folder = id.slice("finder-".length);
    return folder.charAt(0).toUpperCase() + folder.slice(1);
  },
};

export const apps = [finder, zen];

export function appOf(windowId: string) {
  return apps.find((app) => app.owns(windowId)) ?? zen;
}
