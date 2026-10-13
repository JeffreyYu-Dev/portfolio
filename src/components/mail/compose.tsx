import { Avatar } from "#/components/mail/avatar";
import { type Template, templates } from "#/data/mail";
import { socials } from "#/data/socials";
import {
  fromReady,
  replacesWriting,
  withTemplate,
} from "#/lib/compose-fields";
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
import { FileText, Send, X } from "lucide-react";
import {
  type FocusEvent,
  type FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

// a new message to me, as a floating card. the draft is saved as they type, so
// closing it or a failed send never loses what they wrote
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
  // name + email fold into a chip once they look right, and unfold to edit
  const [editingFrom, setEditingFrom] = useState(() => !fromReady(fields));
  const honeypot = useRef<HTMLInputElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const focusName = useRef(false);
  const id = useId();

  // closing mid-sentence still keeps the last few keystrokes
  useEffect(() => flushDraft, []);

  useEffect(() => {
    if (editingFrom && focusName.current) nameInput.current?.focus();
    focusName.current = false;
  }, [editingFrom]);

  function update(next: MailFields) {
    setFields(next);
    saveDraft({ ...next, startedAt: initial.startedAt });
  }

  const change = (key: keyof MailFields) => (value: string) => {
    update({ ...fields, [key]: value });
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  // fold once focus leaves both from inputs, not when moving between them
  function leaveFrom(e: FocusEvent<HTMLFieldSetElement>) {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (fromReady(fields)) setEditingFrom(false);
  }

  function applyTemplate(template: Template) {
    update(withTemplate(fields, template));
    setErrors((e) => ({ ...e, subject: undefined, body: undefined }));
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    const checked = checkMail(fields);
    if (!checked.ok) {
      setErrors(checked.errors);
      if (checked.errors.name || checked.errors.email) setEditingFrom(true);
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
      className="flex h-full flex-col rounded-2xl bg-white/90 text-sm text-neutral-900 shadow-xl ring-1 ring-black/5 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <span className="font-semibold">New email</span>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="rounded-md p-1 text-neutral-500 hover:bg-black/5 hover:text-neutral-900"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <fieldset
        disabled={sending}
        className="flex min-h-0 flex-1 flex-col px-6"
      >
        <div className="flex items-center gap-3 py-1.5">
          <span className="w-10 shrink-0 text-neutral-400">To</span>
          <span className="flex items-center gap-2 rounded-full bg-white py-1 pr-3 pl-1 shadow-sm ring-1 ring-black/5">
            <Avatar name="Jeffrey Yu" me />
            Jeffrey Yu
          </span>
        </div>

        <fieldset
          aria-label="From"
          className="flex min-w-0 items-center gap-3 py-1.5"
          onBlur={leaveFrom}
        >
          <span className="w-10 shrink-0 text-neutral-400">From</span>
          {editingFrom ? (
            <div className="flex min-w-0 flex-1 gap-3">
              <label htmlFor={`${id}-name`} className="sr-only">
                Your name
              </label>
              <input
                ref={nameInput}
                id={`${id}-name`}
                placeholder="Your name"
                autoComplete="name"
                value={fields.name}
                onChange={(e) => change("name")(e.target.value)}
                aria-invalid={!!errors.name}
                className={`${input} w-32`}
              />
              <label htmlFor={`${id}-email`} className="sr-only">
                Your email
              </label>
              <input
                id={`${id}-email`}
                type="email"
                placeholder="you@email.com"
                autoComplete="email"
                value={fields.email}
                onChange={(e) => change("email")(e.target.value)}
                aria-invalid={!!errors.email}
                className={`${input} min-w-0 flex-1`}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                focusName.current = true;
                setEditingFrom(true);
              }}
              aria-label={`From ${fields.name}, ${fields.email.trim()}. Edit`}
              className="flex min-w-0 items-center gap-2 rounded-full bg-white py-1 pr-3 pl-1 shadow-sm ring-1 ring-black/5 hover:bg-neutral-50"
            >
              <Avatar name={fields.name} />
              <span className="truncate">{fields.email.trim()}</span>
            </button>
          )}
        </fieldset>
        {(errors.name || errors.email) && (
          <p className="pl-[3.25rem] text-xs text-red-600">
            {errors.name ?? errors.email}
          </p>
        )}

        <label htmlFor={`${id}-subject`} className="sr-only">
          Subject
        </label>
        <input
          id={`${id}-subject`}
          placeholder="Subject"
          value={fields.subject}
          onChange={(e) => change("subject")(e.target.value)}
          className={`${input} mt-4 text-2xl font-semibold tracking-tight`}
        />
        {errors.subject && (
          <p className="text-xs text-red-600">{errors.subject}</p>
        )}

        <label htmlFor={`${id}-body`} className="sr-only">
          Message
        </label>
        <textarea
          id={`${id}-body`}
          placeholder="Write me something…"
          value={fields.body}
          onChange={(e) => change("body")(e.target.value)}
          aria-invalid={!!errors.body}
          className="mt-3 min-h-24 flex-1 resize-none bg-transparent leading-relaxed outline-none placeholder:text-neutral-400"
        />
        {errors.body && <p className="text-xs text-red-600">{errors.body}</p>}

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
          className="mx-6 mt-2 rounded-full bg-red-50 px-4 py-2 text-xs text-red-700"
        >
          {SEND_FAILED.replace(socials.email, "")}
          <a href={`mailto:${socials.email}`} className="underline">
            {socials.email}
          </a>
        </p>
      )}

      <div className="flex items-center justify-between px-4 pt-3 pb-4">
        <TemplateMenu
          writing={replacesWriting(fields)}
          disabled={sending}
          onPick={applyTemplate}
        />
        <button
          type="submit"
          disabled={sending}
          className="flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-neutral-700 disabled:bg-neutral-500"
        >
          {sending ? "Sending…" : "Send"}
          <Send className="size-4" />
        </button>
      </div>
    </form>
  );
}

const input =
  "bg-transparent outline-none placeholder:text-neutral-400 aria-[invalid=true]:placeholder:text-red-300";

// starter messages. asks first if it would replace something they've written
function TemplateMenu({
  writing,
  disabled,
  onPick,
}: {
  writing: boolean;
  disabled: boolean;
  onPick: (template: Template) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Template | null>(null);

  function close() {
    setOpen(false);
    setPending(null);
  }

  function pick(template: Template) {
    if (writing) {
      setPending(template);
      return;
    }
    onPick(template);
    close();
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: only catches focus leaving and esc from the menu inside
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) close();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          // close the menu, not the whole mail window
          e.stopPropagation();
          close();
        }
      }}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label="Use template"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        className="peer grid size-10 place-items-center rounded-xl text-neutral-500 hover:bg-black/5 hover:text-neutral-900 aria-expanded:bg-black/5"
      >
        <FileText className="size-5" />
      </button>
      {!open && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-full left-0 mb-2 hidden rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white peer-hover:block peer-focus-visible:block"
        >
          Use template
        </span>
      )}
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-60 rounded-xl bg-white p-1.5 text-sm shadow-lg ring-1 ring-black/10">
          {pending ? (
            <div className="p-2">
              <p className="text-neutral-700">Replace your message?</p>
              <div className="mt-2 flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setPending(null)}
                  className="rounded-lg px-2.5 py-1 text-neutral-600 hover:bg-black/5"
                >
                  Keep
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onPick(pending);
                    close();
                  }}
                  className="rounded-lg bg-neutral-900 px-2.5 py-1 text-white hover:bg-neutral-700"
                >
                  Replace
                </button>
              </div>
            </div>
          ) : (
            templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => pick(template)}
                className="block w-full rounded-lg px-2.5 py-1.5 text-left hover:bg-black/5"
              >
                {template.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
