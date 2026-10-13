import type { Template } from "#/data/mail";
import { type MailFields, mailSchema } from "#/lib/mail-schema";

// a template only fills in what to say, who it's from stays
export function withTemplate(fields: MailFields, template: Template): MailFields {
  return { ...fields, subject: template.subject, body: template.body };
}

// worth asking before a template wipes it. a subject alone (like a reply's
// "Re: …") isn't writing anyone would miss
export function replacesWriting(fields: MailFields) {
  return fields.body.trim() !== "";
}

// once both look right the from fields fold into a chip, like the to chip
export function fromReady(fields: MailFields) {
  return (
    mailSchema.shape.name.safeParse(fields.name).success &&
    mailSchema.shape.email.safeParse(fields.email).success
  );
}

export function initials(name: string) {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
  return letters || "?";
}
