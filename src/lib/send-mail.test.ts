import { describe, expect, it, vi } from "vitest";
import type { SendInput } from "#/lib/mail-schema";
import { handleSend, SEND_FAILED, type Sender } from "#/lib/send-mail";

const input: SendInput = {
  name: "Ada",
  email: "ada@example.com",
  subject: "hi",
  body: "hello there",
  website: "",
  filledMs: 10_000,
};

function deps(send: Sender | null = vi.fn(async () => {})) {
  return { send, to: "me@x.com", from: "Portfolio <p@x.com>" };
}

describe("handleSend", () => {
  it("sends the message to me with the visitor as reply-to", async () => {
    const d = deps();
    expect(await handleSend(input, d)).toEqual({ ok: true });
    expect(d.send).toHaveBeenCalledWith({
      to: "me@x.com",
      from: "Portfolio <p@x.com>",
      replyTo: "ada@example.com",
      subject: "[portfolio] hi",
      text: "hello there\n\n— Ada <ada@example.com>",
    });
  });
  it("pretends to send when the honeypot is filled", async () => {
    const d = deps();
    const result = await handleSend({ ...input, website: "http://spam" }, d);
    expect(result).toEqual({ ok: true });
    expect(d.send).not.toHaveBeenCalled();
  });
  it("pretends to send when it was filled in under 3 seconds", async () => {
    const d = deps();
    const result = await handleSend({ ...input, filledMs: 2999 }, d);
    expect(result).toEqual({ ok: true });
    expect(d.send).not.toHaveBeenCalled();
  });
  it("sends a draft started long ago even if sent right after reopening", async () => {
    const d = deps();
    await handleSend({ ...input, filledMs: 86_400_000 }, d);
    expect(d.send).toHaveBeenCalledOnce();
  });
  it("sends at exactly 3 seconds", async () => {
    const d = deps();
    await handleSend({ ...input, filledMs: 3000 }, d);
    expect(d.send).toHaveBeenCalledOnce();
  });
  it("fails with the generic message when the sender rejects", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const d = deps(vi.fn(async () => Promise.reject(new Error("resend down"))));
    expect(await handleSend(input, d)).toEqual({ ok: false, message: SEND_FAILED });
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
  it("fails with the generic message when there's no API key", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await handleSend(input, deps(null))).toEqual({
      ok: false,
      message: SEND_FAILED,
    });
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining("RESEND_API_KEY"),
    );
    error.mockRestore();
  });
});
