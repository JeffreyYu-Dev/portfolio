import { socials } from "#/data/socials";
import {
  checkMail,
  type FieldErrors,
  type MailFields,
} from "#/lib/mail-schema";
import {
  type Draft,
  flushDraft,
  recordSent,
  type SentEmail,
  saveDraft,
} from "#/lib/mail-store";
import { SEND_FAILED } from "#/lib/send-mail";
import { sendMail } from "#/server/send-mail";
import { Trash2 } from "lucide-react";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";

// the fields of a new message to jeffrey. the draft is saved as they type, so
// closing, minimising or a failed send never loses what they wrote
export function Compose({
  initial,
  onSent,
  onDiscard,
}: {
  initial: Draft;
  onSent: (sent: SentEmail) => void;
  onDiscard: () => void;
}) {
  const [fields, setFields] = useState<MailFields>({
    name: initial.name,
    email: initial.email,
    subject: initial.subject,
    body: initial.body,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const honeypot = useRef<HTMLInputElement>(null);
  const id = useId();

  // closing mid-sentence still keeps the last few keystrokes
  useEffect(() => flushDraft, []);

  const change = (key: keyof MailFields) => (value: string) => {
    const next = { ...fields, [key]: value };
    setFields(next);
    setErrors((e) => ({ ...e, [key]: undefined }));
    saveDraft({ ...next, startedAt: initial.startedAt });
  };

  function discard() {
    const written = Object.values(fields).some((v) => v.trim());
    if (written && !confirming) {
      setConfirming(true);
      return;
    }
    onDiscard();
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    const checked = checkMail(fields);
    if (!checked.ok) {
      setErrors(checked.errors);
      return;
    }
    setSending(true);
    setFailed(false);
    try {
      const result = await sendMail({
        data: {
          ...fields,
          website: honeypot.current?.value ?? "",
          filledMs: Date.now() - initial.startedAt,
        },
      });
      if (!result.ok) {
        setFailed(true);
        return;
      }
      const sent = {
        id: crypto.randomUUID(),
        subject: checked.mail.subject,
        body: checked.mail.body,
        date: new Date().toISOString(),
      };
      recordSent(sent);
      onSent(sent);
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  }

  const line =
    "flex items-center gap-2 border-b border-[#e0e0e0] py-2 text-xs";
  const input =
    "min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#5f6368]";

  return (
    <form
      onSubmit={send}
      noValidate
      className="flex h-full min-h-0 flex-col bg-white"
    >
      <fieldset
        disabled={sending}
        className="flex min-h-0 flex-1 flex-col px-4"
      >
        <div className={line}>
          <span className="text-[#5f6368]">To</span>
          <span className="rounded-full bg-[#e8eaed] px-2 py-0.5">
            Jeffrey Yu
          </span>
        </div>
        <div className={line}>
          <span className="text-[#5f6368]">From</span>
          <label htmlFor={`${id}-name`} className="sr-only">
            Your name
          </label>
          <input
            id={`${id}-name`}
            placeholder="Your name"
            autoComplete="name"
            value={fields.name}
            onChange={(e) => change("name")(e.target.value)}
            aria-invalid={!!errors.name}
            className={`${input} max-w-28`}
          />
          <label htmlFor={`${id}-email`} className="sr-only">
            Your email
          </label>
          <input
            id={`${id}-email`}
            type="email"
            placeholder="your@email.com"
            autoComplete="email"
            value={fields.email}
            onChange={(e) => change("email")(e.target.value)}
            aria-invalid={!!errors.email}
            className={input}
          />
        </div>
        {(errors.name || errors.email) && (
          <p className="pt-1 text-[11px] text-[#d93025]">
            {errors.name ?? errors.email}
          </p>
        )}
        <div className={line}>
          <label htmlFor={`${id}-subject`} className="sr-only">
            Subject
          </label>
          <input
            id={`${id}-subject`}
            placeholder="Subject"
            value={fields.subject}
            onChange={(e) => change("subject")(e.target.value)}
            className={input}
          />
        </div>
        {errors.subject && (
          <p className="pt-1 text-[11px] text-[#d93025]">{errors.subject}</p>
        )}
        <label htmlFor={`${id}-body`} className="sr-only">
          Message
        </label>
        <textarea
          id={`${id}-body`}
          value={fields.body}
          onChange={(e) => change("body")(e.target.value)}
          aria-invalid={!!errors.body}
          className="min-h-20 flex-1 resize-none py-2 text-xs outline-none"
        />
        {errors.body && (
          <p className="pb-1 text-[11px] text-[#d93025]">{errors.body}</p>
        )}
        {/* bots fill in every field, people never see this one */}
        <input
          ref={honeypot}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] size-px"
        />
      </fieldset>

      {failed && (
        <p
          role="alert"
          className="mx-4 rounded bg-[#fce8e6] px-3 py-2 text-[11px] text-[#c5221f]"
        >
          {SEND_FAILED.replace(socials.email, "")}
          <a href={`mailto:${socials.email}`} className="underline">
            {socials.email}
          </a>
        </p>
      )}

      <div className="flex items-center gap-2 px-4 py-2">
        <button
          type="submit"
          disabled={sending}
          className="rounded-full bg-[#0b57d0] px-4 py-2 text-xs font-medium text-white hover:shadow-md disabled:bg-[#0b57d0]/60"
        >
          {sending ? "Sending…" : "Send"}
        </button>
        <span className="flex-1" />
        {confirming && (
          <span className="flex items-center gap-2 text-[11px] text-[#444746]">
            Discard draft?
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded px-2 py-1 hover:bg-black/5"
            >
              Cancel
            </button>
          </span>
        )}
        <button
          type="button"
          onClick={discard}
          aria-label={confirming ? "Discard" : "Discard draft"}
          title="Discard draft"
          className={`grid size-7 place-items-center rounded-full hover:bg-black/5 ${
            confirming ? "text-[#d93025]" : "text-[#444746]"
          }`}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </form>
  );
}
