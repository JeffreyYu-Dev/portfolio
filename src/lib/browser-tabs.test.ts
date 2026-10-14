import { describe, expect, it } from "vitest";
import { projects } from "#/data/projects";
import { work } from "#/data/work";
import {
  activeTab,
  closeTab,
  initialTabs,
  navigate,
  openTab,
  selectTab,
  titleFor,
} from "#/lib/browser-tabs";

describe("initialTabs", () => {
  it("starts with one tab on the visited page", () => {
    const state = initialTabs("/projects/renao/");
    expect(state.tabs).toHaveLength(1);
    expect(activeTab(state).path).toBe("/projects/renao");
  });
});

describe("navigate", () => {
  it("changes the active tab's page instead of adding a tab", () => {
    const state = navigate(initialTabs("/"), "/about");
    expect(state.tabs).toHaveLength(1);
    expect(activeTab(state).path).toBe("/about");
  });
  it("leaves other tabs alone", () => {
    const two = openTab(initialTabs("/about"), "/");
    const moved = navigate(two, "/projects/renao");
    expect(moved.tabs.map((t) => t.path)).toEqual(["/about", "/projects/renao"]);
  });
  it("returns the same state when the page didn't change", () => {
    const state = initialTabs("/about");
    expect(navigate(state, "/about/")).toBe(state);
  });
});

describe("openTab", () => {
  it("adds a tab at the end and makes it active", () => {
    const state = openTab(initialTabs("/about"), "/");
    expect(state.tabs).toHaveLength(2);
    expect(activeTab(state)).toBe(state.tabs[1]);
    expect(activeTab(state).path).toBe("/");
  });
  it("gives every tab its own id", () => {
    const state = openTab(openTab(initialTabs("/"), "/"), "/");
    expect(new Set(state.tabs.map((t) => t.id)).size).toBe(3);
  });
});

describe("selectTab", () => {
  it("activates the tab with that id", () => {
    const two = openTab(initialTabs("/about"), "/");
    const first = two.tabs[0];
    expect(activeTab(selectTab(two, first.id))).toBe(first);
  });
  it("ignores ids that don't exist", () => {
    const state = initialTabs("/");
    expect(selectTab(state, 999)).toBe(state);
  });
});

describe("closeTab", () => {
  it("never closes the last tab", () => {
    const state = initialTabs("/");
    expect(closeTab(state, state.tabs[0].id)).toBe(state);
  });
  it("closing a background tab keeps the active one", () => {
    const three = openTab(openTab(initialTabs("/a"), "/b"), "/c");
    const closed = closeTab(three, three.tabs[0].id);
    expect(closed.tabs.map((t) => t.path)).toEqual(["/b", "/c"]);
    expect(activeTab(closed).path).toBe("/c");
  });
  it("closing the active tab activates the one after it", () => {
    const three = selectTab(
      openTab(openTab(initialTabs("/a"), "/b"), "/c"),
      2,
    );
    const middle = three.tabs[1];
    expect(activeTab(three)).toBe(middle);
    expect(activeTab(closeTab(three, middle.id)).path).toBe("/c");
  });
  it("closing the active last tab activates the one before it", () => {
    const two = openTab(initialTabs("/a"), "/b");
    expect(activeTab(closeTab(two, two.tabs[1].id)).path).toBe("/a");
  });
});

describe("titleFor", () => {
  it("names yail pages like gmail", () => {
    expect(titleFor("/yail/inbox")).toBe("Inbox – Yail");
    expect(titleFor("/yail/inbox/welcome/")).toBe(
      "hey, thanks for stopping by – Yail",
    );
  });
  it("names the contact page", () => {
    expect(titleFor("/contact")).toBe("Contact");
    expect(titleFor("/contact/")).toBe("Contact");
  });
  it("names the fixed pages", () => {
    expect(titleFor("/")).toBe("Home");
    expect(titleFor("/about/")).toBe("About Me");
  });
  it("uses the project or company name", () => {
    expect(titleFor(`/projects/${projects[0].id}`)).toBe(projects[0].name);
    expect(titleFor(`/work/${work[0].id}`)).toBe(work[0].company);
  });
  it("falls back to the path for unknown pages", () => {
    expect(titleFor("/projects/nope")).toBe("/projects/nope");
    expect(titleFor("/posts/hello")).toBe("/posts/hello");
  });
});
