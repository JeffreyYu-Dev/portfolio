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
import { Send } from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

// a new message to me. the draft is saved as they type, so closing the window or
// a failed send never loses what they wrote
export function Compose({
  initial,
  onSent,
  onCancel,
}: {
  initial: Draft;
  onSent: (sent: SentEmail, replyTo: string) => void;
  onCancel?: () => void;
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
      onSent(sent, checked.mail.email);
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      onSubmit={send}
      noValidate
      className="flex h-full flex-col bg-white text-xs"
    >
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-black/10 px-4">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-neutral-500 hover:text-neutral-900"
          >
            Cancel
          </button>
        ) : (
          <span />
        )}
        <span className="font-semibold text-neutral-800">New Message</span>
        <button
          type="submit"
          disabled={sending}
          aria-label="Send"
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sky-600 hover:bg-sky-50 disabled:text-neutral-400"
        >
          {sending ? "Sending…" : <Send className="size-4" />}
        </button>
      </div>

      {failed && (
        <p
          role="alert"
          className="border-b border-black/10 bg-red-50 px-4 py-2 text-red-700"
        >
          {SEND_FAILED.replace(socials.email, "")}
          <a href={`mailto:${socials.email}`} className="underline">
            {socials.email}
          </a>
        </p>
      )}

      <fieldset disabled={sending} className="flex min-h-0 flex-1 flex-col">
        <Row label="To:">
          <span className="text-neutral-800">Jeffrey Yu</span>
        </Row>
        <Field id={`${id}-name`} label="Name:" error={errors.name}>
          <input
            id={`${id}-name`}
            autoComplete="name"
            value={fields.name}
            onChange={(e) => change("name")(e.target.value)}
            className={input}
          />
        </Field>
        <Field id={`${id}-email`} label="Email:" error={errors.email}>
          <input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            value={fields.email}
            onChange={(e) => change("email")(e.target.value)}
            className={input}
          />
        </Field>
        <Field id={`${id}-subject`} label="Subject:" error={errors.subject}>
          <input
            id={`${id}-subject`}
            value={fields.subject}
            onChange={(e) => change("subject")(e.target.value)}
            className={input}
          />
        </Field>
        {/* bots fill in every field, people never see this one */}
        <input
          ref={honeypot}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] size-px"
        />
        <label htmlFor={`${id}-body`} className="sr-only">
          Message
        </label>
        <textarea
          id={`${id}-body`}
          value={fields.body}
          onChange={(e) => change("body")(e.target.value)}
          aria-invalid={!!errors.body}
          aria-describedby={errors.body ? `${id}-body-error` : undefined}
          className="min-h-0 flex-1 resize-none px-4 py-3 text-neutral-900 outline-none"
        />
        {errors.body && (
          <p id={`${id}-body-error`} className="px-4 pb-2 text-red-600">
            {errors.body}
          </p>
        )}
      </fieldset>
    </form>
  );
}

const input = "min-w-0 flex-1 bg-transparent text-neutral-900 outline-none";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-black/10 px-4 py-2">
      <span className="w-14 shrink-0 text-neutral-500">{label}</span>
      {children}
    </div>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-black/10 px-4 py-2">
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="w-14 shrink-0 text-neutral-500">
          {label}
        </label>
        {children}
      </div>
      {error && <p className="mt-1 pl-16 text-red-600">{error}</p>}
    </div>
  );
}
