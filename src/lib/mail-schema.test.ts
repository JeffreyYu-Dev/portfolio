import { describe, expect, it } from "vitest";
import { checkMail, sendSchema } from "#/lib/mail-schema";

const valid = {
  name: "Ada",
  email: "ada@example.com",
  subject: "hi",
  body: "hello there",
};

describe("checkMail", () => {
  it("accepts a normal message", () => {
    const result = checkMail(valid);
    expect(result).toEqual({ ok: true, mail: valid });
  });
  it("collapses line breaks in the name and subject", () => {
    const result = checkMail({
      ...valid,
      name: "Ada\r\nBcc: x@evil.com",
      subject: "a\nb",
    });
    expect(result.ok && result.mail.name).toBe("Ada Bcc: x@evil.com");
    expect(result.ok && result.mail.subject).toBe("a b");
  });
  it("fills in an empty subject", () => {
    const result = checkMail({ ...valid, subject: "  " });
    expect(result.ok && result.mail.subject).toBe("(no subject)");
  });
  it("trims the body and email", () => {
    const result = checkMail({
      ...valid,
      email: " ada@example.com ",
      body: "\n hi \n",
    });
    expect(result.ok && result.mail.body).toBe("hi");
    expect(result.ok && result.mail.email).toBe("ada@example.com");
  });
  it("rejects a whitespace-only name and body with their messages", () => {
    const result = checkMail({ ...valid, name: " \n ", body: "   " });
    expect(result).toEqual({
      ok: false,
      errors: { name: "Add your name", body: "Write me something" },
    });
  });
  it("rejects a bad email", () => {
    const result = checkMail({ ...valid, email: "nope" });
    expect(!result.ok && result.errors.email).toBe(
      "Add your email so I can reply",
    );
  });
  it("enforces the length limits", () => {
    const long = (n: number) => "a".repeat(n);
    const result = checkMail({
      name: long(101),
      email: `${long(250)}@x.co`,
      subject: long(201),
      body: long(5001),
    });
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual([
      "body",
      "email",
      "name",
      "subject",
    ]);
  });
  it("accepts exactly the limits", () => {
    const long = (n: number) => "a".repeat(n);
    const result = checkMail({
      name: long(100),
      email: `${long(248)}@x.co`,
      subject: long(200),
      body: long(5000),
    });
    expect(result.ok).toBe(true);
  });
});

describe("sendSchema", () => {
  it("adds the honeypot and opened time", () => {
    const parsed = sendSchema.parse({ ...valid, website: "", filledMs: 1 });
    expect(parsed).toEqual({ ...valid, website: "", filledMs: 1 });
  });
  it("requires filledMs", () => {
    expect(sendSchema.safeParse(valid).success).toBe(false);
  });
});
