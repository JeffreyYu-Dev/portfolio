import { describe, expect, it } from "vitest";
import { paragraphs } from "#/lib/mail-body";

describe("paragraphs", () => {
  it("splits on blank lines and drops empty ones", () => {
    expect(paragraphs("one\n\n\n two \n\n")).toEqual([
      [{ text: "one" }],
      [{ text: "two" }],
    ]);
  });
  it("keeps single line breaks inside a paragraph", () => {
    expect(paragraphs("a\nb")).toEqual([[{ text: "a\nb" }]]);
  });
  it("turns urls into links", () => {
    expect(paragraphs("see https://x.com/a?b=1 ok")).toEqual([
      [{ text: "see " }, { href: "https://x.com/a?b=1" }, { text: " ok" }],
    ]);
  });
  it("leaves trailing punctuation out of the link", () => {
    expect(paragraphs("go to https://x.com.")).toEqual([
      [{ text: "go to " }, { href: "https://x.com" }, { text: "." }],
    ]);
  });
  it("handles windows line endings", () => {
    expect(paragraphs("a\r\n\r\nb")).toEqual([[{ text: "a" }], [{ text: "b" }]]);
  });
});
