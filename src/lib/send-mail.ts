import { socials } from "#/data/socials";
import type { SendInput } from "#/lib/mail-schema";

export type Outgoing = {
  to: string;
  from: string;
  replyTo: string;
  subject: string;
  text: string;
};
// rejects when the email didn't go out
export type Sender = (mail: Outgoing) => Promise<void>;
export type SendResult = { ok: true } | { ok: false; message: string };

export const SEND_FAILED = `Couldn't send. Try again, or email me directly at ${socials.email}`;
// people take longer than this to write anything. bots usually don't
export const MIN_FILL_MS = 3000;

export async function handleSend(
  input: SendInput,
  deps: { send: Sender | null; now: () => number; to: string; from: string },
): Promise<SendResult> {
  // a caught bot gets the same answer as a person, so it learns nothing
  if (input.website || deps.now() - input.openedAt < MIN_FILL_MS) {
    return { ok: true };
  }
  if (!deps.send) {
    console.error("send-mail: RESEND_API_KEY is not set");
    return { ok: false, message: SEND_FAILED };
  }
  try {
    await deps.send({
      to: deps.to,
      from: deps.from,
      replyTo: input.email,
      subject: `[portfolio] ${input.subject}`,
      text: `${input.body}\n\n— ${input.name} <${input.email}>`,
    });
    return { ok: true };
  } catch (error) {
    console.error("send-mail: couldn't send", error);
    return { ok: false, message: SEND_FAILED };
  }
}
