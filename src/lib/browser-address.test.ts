import { describe, expect, it } from "vitest";
import {
  DISPLAY_HOST,
  displayAddress,
  normalizePath,
  parseAddress,
  samePath,
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
