import { createServerFn } from "@tanstack/react-start";
import { Resend } from "resend";
import { socials } from "#/data/socials";
import { sendSchema } from "#/lib/mail-schema";
import { handleSend, type Sender } from "#/lib/send-mail";

// the only place resend and the key are touched. the start compiler swaps this
// handler for a fetch on the client, so neither ends up in the browser bundle
export const sendMail = createServerFn({ method: "POST" })
  .validator(sendSchema)
  .handler(({ data }) => {
    const key = process.env.RESEND_API_KEY;
    return handleSend(data, {
      send: key ? resendSender(key) : null,
      to: process.env.MAIL_TO || socials.email,
      // resend's shared sender only delivers to the account owner, which is me
      from: process.env.MAIL_FROM || "Portfolio <onboarding@resend.dev>",
    });
  });

function resendSender(key: string): Sender {
  const resend = new Resend(key);
  return async (mail) => {
    // resend returns its errors rather than throwing them
    const { error } = await resend.emails.send(mail);
    if (error) throw new Error(`${error.name}: ${error.message}`);
  };
}
