import { describe, expect, it } from "vitest";
import {
  DISPLAY_HOST,
  displayAddress,
  normalizePath,
  parseAddress,
  samePath,
  sameSite,
} from "#/lib/browser-address";

describe("displayAddress", () => {
  it("shows just the host on the home page", () => {
    expect(displayAddress("/")).toBe(DISPLAY_HOST);
  });
  it("appends the path elsewhere", () => {
    expect(displayAddress("/projects/renao")).toBe(
      `${DISPLAY_HOST}/projects/renao`,
    );
  });
});

describe("normalizePath", () => {
  it.each([
    ["", "/"],
    ["/", "/"],
    ["/about/", "/about"],
    ["about", "/about"],
    ["/work/western//", "/work/western"],
  ])("%j -> %j", (input, expected) => {
    expect(normalizePath(input)).toBe(expected);
  });
});

describe("samePath", () => {
  it("ignores trailing slashes", () => {
    expect(samePath("/about/", "/about")).toBe(true);
  });
  it("tells different pages apart", () => {
    expect(samePath("/", "/about")).toBe(false);
  });
});

describe("parseAddress", () => {
  it("returns null for empty or blank input", () => {
    expect(parseAddress("")).toBeNull();
    expect(parseAddress("   ")).toBeNull();
  });
  it("returns null for text with spaces (there's no search engine)", () => {
    expect(parseAddress("about me")).toBeNull();
  });
  it("keeps a typed path in the browser", () => {
    expect(parseAddress(" /projects/renao/ ")).toEqual({
      kind: "route",
      path: "/projects/renao",
    });
  });
  it("treats a bare word as a path", () => {
    expect(parseAddress("about")).toEqual({ kind: "route", path: "/about" });
  });
  it("keeps the site's own host in the browser, with or without protocol", () => {
    expect(parseAddress(DISPLAY_HOST)).toEqual({ kind: "route", path: "/" });
    expect(parseAddress(`https://${DISPLAY_HOST}/about/`)).toEqual({
      kind: "route",
      path: "/about",
    });
    expect(parseAddress(`www.${DISPLAY_HOST.toUpperCase()}/about`)).toEqual({
      kind: "route",
      path: "/about",
    });
  });
  it("sends other hosts out, adding https when missing", () => {
    expect(parseAddress("github.com/JeffreyYu-Dev")).toEqual({
      kind: "external",
      url: "https://github.com/JeffreyYu-Dev",
    });
    expect(parseAddress("http://uwo.ca")).toEqual({
      kind: "external",
      url: "http://uwo.ca",
    });
  });
});

describe("yail.com", () => {
  it("shows yail paths under its own host", () => {
    expect(displayAddress("/yail")).toBe("yail.com");
    expect(displayAddress("/yail/")).toBe("yail.com");
    expect(displayAddress("/yail/inbox/welcome")).toBe("yail.com/inbox/welcome");
  });
  it("shows the search string", () => {
    expect(displayAddress("/yail/search", "?q=games")).toBe(
      "yail.com/search?q=games",
    );
    expect(displayAddress("/yail/search", "q=games")).toBe(
      "yail.com/search?q=games",
    );
  });
  it("leaves lookalike paths on the main host", () => {
    expect(displayAddress("/yailx")).toBe(`${DISPLAY_HOST}/yailx`);
  });
  it.each([
    ["yail.com", "/yail"],
    ["YAIL.com", "/yail"],
    ["www.yail.com/starred/", "/yail/starred"],
    ["https://yail.com/inbox/welcome", "/yail/inbox/welcome"],
    ["yail.com/search?q=games", "/yail/search?q=games"],
    ["yail.com?compose=1", "/yail?compose=1"],
  ])("%j goes to %j in the browser", (input, path) => {
    expect(parseAddress(input)).toEqual({ kind: "route", path });
  });
  it("still sends other sites to a real tab", () => {
    expect(parseAddress("notyail.com")).toEqual({
      kind: "external",
      url: "https://notyail.com",
    });
  });
});

describe("sameSite", () => {
  it("is true for two pages inside one hosted site", () => {
    expect(sameSite("/yail/inbox", "/yail/starred")).toBe(true);
    expect(sameSite("/yail", "/yail/search?q=a")).toBe(true);
  });
  it("is false across sites or for the portfolio's own pages", () => {
    expect(sameSite("/", "/yail/inbox")).toBe(false);
    expect(sameSite("/yail/inbox", "/about")).toBe(false);
    expect(sameSite("/about", "/projects/renao")).toBe(false);
  });
});
