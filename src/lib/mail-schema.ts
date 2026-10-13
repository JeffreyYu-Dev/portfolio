import { z } from "zod";

// one schema for the compose form and the server function, so the rules can't drift.
// line breaks in single-line fields would let someone add their own mail headers
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

export const mailSchema = z.object({
  name: z
    .string()
    .transform(oneLine)
    .pipe(
      z.string().min(1, "Add your name").max(100, "That name's a bit long"),
    ),
  email: z
    .string()
    .trim()
    .pipe(
      z
        .email("Add your email so I can reply")
        .max(254, "That email's a bit long"),
    ),
  subject: z
    .string()
    .transform(oneLine)
    .pipe(z.string().max(200, "Keep the subject under 200 characters"))
    .transform((s) => s || "(no subject)"),
  body: z
    .string()
    .trim()
    .min(1, "Write me something")
    .max(5000, "Keep it under 5000 characters"),
});

// what the server function receives: the form plus the two spam signals
export const sendSchema = mailSchema.extend({
  website: z.string().optional(),
  openedAt: z.number(),
});

export type MailFields = z.input<typeof mailSchema>;
export type Mail = z.output<typeof mailSchema>;
export type SendInput = z.output<typeof sendSchema>;
export type FieldErrors = Partial<Record<keyof MailFields, string>>;

export function checkMail(
  fields: MailFields,
): { ok: true; mail: Mail } | { ok: false; errors: FieldErrors } {
  const result = mailSchema.safeParse(fields);
  if (result.success) return { ok: true, mail: result.data };
  const errors: FieldErrors = {};
  // first message per field, that's all the form shows
  for (const [key, messages] of Object.entries(
    z.flattenError(result.error).fieldErrors,
  )) {
    if (messages?.[0]) errors[key as keyof MailFields] = messages[0];
  }
  return { ok: false, errors };
}
