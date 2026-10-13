import { describe, expect, it } from "vitest";
import {
  fromReady,
  initials,
  replacesWriting,
  withTemplate,
} from "#/lib/compose-fields";

const empty = { name: "", email: "", subject: "", body: "" };
const template = { id: "hi", label: "Just saying hi", subject: "hey", body: "hi!" };

describe("withTemplate", () => {
  it("fills the subject and body and keeps who it's from", () => {
    const fields = { ...empty, name: "Ada", email: "ada@x.com" };
    expect(withTemplate(fields, template)).toEqual({
      name: "Ada",
      email: "ada@x.com",
      subject: "hey",
      body: "hi!",
    });
  });
});

describe("replacesWriting", () => {
  it("is false when there's nothing written yet", () => {
    expect(replacesWriting({ ...empty, body: "  \n" })).toBe(false);
  });
  it("is true once they've written something", () => {
    expect(replacesWriting({ ...empty, body: "hello" })).toBe(true);
  });
  it("ignores a subject on its own", () => {
    expect(replacesWriting({ ...empty, subject: "Re: hi" })).toBe(false);
  });
});

describe("fromReady", () => {
  it("needs a name and a valid email", () => {
    expect(fromReady({ ...empty, name: "Ada", email: "ada@x.com" })).toBe(true);
    expect(fromReady({ ...empty, name: " ", email: "ada@x.com" })).toBe(false);
    expect(fromReady({ ...empty, name: "Ada", email: "ada@" })).toBe(false);
  });
  it("allows spaces around the email", () => {
    expect(fromReady({ ...empty, name: "Ada", email: " ada@x.com " })).toBe(true);
  });
});

describe("initials", () => {
  it("takes the first letters of the first two words", () => {
    expect(initials("Jeffrey Yu")).toBe("JY");
    expect(initials("ada lovelace byron")).toBe("AL");
  });
  it("handles one word, extra spaces and nothing", () => {
    expect(initials("  ada ")).toBe("A");
    expect(initials("")).toBe("?");
  });
});
