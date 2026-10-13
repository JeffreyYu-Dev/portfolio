import { AppWindow } from "#/components/app-window";
import { Avatar } from "#/components/mail/avatar";
import { Compose } from "#/components/mail/compose";
import { inbox } from "#/data/mail";
import { type Piece, paragraphs } from "#/lib/mail-body";
import { mailDate } from "#/lib/mail-date";
import {
  type Draft,
  markRead,
  newDraft,
  unreadCount,
  useMail,
} from "#/lib/mail-store";
import { FileText, Inbox, Reply, Send, SquarePen } from "lucide-react";
import { type ReactNode, useState } from "react";

type Box = "inbox" | "sent" | "drafts";
// one row in the message list, whichever mailbox it came from
type Row = {
  id: string;
  from: string;
  subject: string;
  date: string;
  body: string;
  unread?: boolean;
};

const ids = inbox.map((email) => email.id);
const titles: Record<Box, string> = {
  inbox: "Inbox",
  sent: "Sent",
  drafts: "Drafts",
};

export function MailApp() {
  return (
    <AppWindow id="mail" title="Mail">
      <Mail />
    </AppWindow>
  );
}

// lives inside the window, so it resets to the inbox each time mail opens
function Mail() {
  const state = useMail();
  const [box, setBox] = useState<Box>("inbox");
  const [selected, setSelected] = useState<string | null>(null);
  const [composing, setComposing] = useState<Draft | null>(null);

  const rows: Row[] =
    box === "inbox"
      ? inbox.map((e) => ({ ...e, unread: !state.read.includes(e.id) }))
      : box === "sent"
        ? state.sent.map((e) => ({ ...e, from: "To: Jeffrey Yu" }))
        : state.draft
          ? [
              {
                id: "draft",
                from: "Draft",
                subject: state.draft.subject || "(no subject)",
                date: new Date(state.draft.startedAt).toISOString(),
                body: state.draft.body,
              },
            ]
          : [];
  const current = rows.find((r) => r.id === selected) ?? null;

  function open(next: Box) {
    setBox(next);
    setSelected(null);
    setComposing(null);
  }

  function select(row: Row) {
    if (box === "drafts" && state.draft) {
      setComposing(state.draft);
      return;
    }
    setSelected(row.id);
    if (box === "inbox") markRead(row.id);
  }

  function compose(subject?: string) {
    const draft = state.draft ?? newDraft();
    setComposing(subject ? { ...draft, subject } : draft);
  }

  return (
    <div className="relative flex h-full text-sm text-neutral-900">
      <nav
        aria-label="Mailboxes"
        className="flex w-48 shrink-0 flex-col gap-0.5 px-3 pt-14"
      >
        <BoxButton
          icon={<Inbox />}
          label="Inbox"
          count={unreadCount(state, ids)}
          active={box === "inbox"}
          onClick={() => open("inbox")}
        />
        <BoxButton
          icon={<Send />}
          label="Sent"
          active={box === "sent"}
          onClick={() => open("sent")}
        />
        <BoxButton
          icon={<FileText />}
          label="Drafts"
          count={state.draft ? 1 : 0}
          active={box === "drafts"}
          onClick={() => open("drafts")}
        />
      </nav>

      <section
        aria-label="Messages"
        className="flex w-80 shrink-0 flex-col py-3"
      >
        <header className="flex items-center justify-between px-3 pt-1 pb-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {titles[box]}
            </h2>
            <p className="text-xs text-neutral-500">
              {rows.length} {rows.length === 1 ? "message" : "messages"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => compose()}
            className="flex items-center gap-1.5 rounded-full bg-neutral-900 px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-neutral-700"
          >
            <SquarePen className="size-3.5" />
            New email
          </button>
        </header>
        <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2">
          {rows.length === 0 && (
            <li className="p-8 text-center text-neutral-400">No messages</li>
          )}
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => select(row)}
                aria-current={row.id === selected}
                className="flex w-full gap-3 rounded-xl p-3 text-left hover:bg-white/50 aria-[current=true]:bg-white aria-[current=true]:shadow-sm"
              >
                <Avatar name="Jeffrey Yu" me />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-xs text-neutral-500">
                      {row.unread && (
                        <>
                          <span
                            aria-hidden="true"
                            className="mr-1.5 inline-block size-1.5 -translate-y-px rounded-full bg-violet-500 align-middle"
                          />
                          <span className="sr-only">Unread: </span>
                        </>
                      )}
                      {row.from}
                    </span>
                    <span className="shrink-0 text-xs text-neutral-400">
                      {mailDate(row.date)}
                    </span>
                  </span>
                  <span className="block truncate font-semibold">
                    {row.subject}
                  </span>
                  <span className="line-clamp-2 text-xs text-neutral-500">
                    {row.body}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <article className="m-2 ml-0 min-w-0 flex-1 overflow-y-auto rounded-xl bg-white/90 shadow-sm ring-1 ring-black/5">
        {current ? (
          <Message
            row={current}
            box={box}
            onReply={() => compose(`Re: ${current.subject}`)}
          />
        ) : (
          <p className="grid h-full place-items-center text-neutral-400">
            No message selected
          </p>
        )}
      </article>

      {composing && (
        // the inbox stays in view behind, dimmed, with the card floating on it
        <div className="absolute inset-0 z-20 grid place-items-center bg-neutral-900/10 p-8 backdrop-blur-sm">
          <div className="h-full max-h-[500px] w-full max-w-xl">
            <Compose
              initial={composing}
              onCancel={() => setComposing(null)}
              onSent={(sent) => {
                setComposing(null);
                setBox("sent");
                setSelected(sent.id);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Message({
  row,
  box,
  onReply,
}: {
  row: Row;
  box: Box;
  onReply: () => void;
}) {
  return (
    <div className="px-8 py-7">
      <h3 className="text-2xl font-semibold tracking-tight">{row.subject}</h3>
      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="flex items-center gap-2">
          <Avatar name="Jeffrey Yu" me />
          <span className="text-xs">
            <span className="block font-medium">
              {box === "inbox" ? row.from : "You"}
            </span>
            <span className="text-neutral-500">
              {box === "inbox" ? "to you" : "to Jeffrey Yu"} ·{" "}
              {new Date(row.date).toLocaleString()}
            </span>
          </span>
        </span>
        {box === "inbox" && (
          <button
            type="button"
            onClick={onReply}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-black/5 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-black/10"
          >
            <Reply className="size-3.5" /> Reply
          </button>
        )}
      </div>
      <div className="mt-6 flex flex-col gap-4 leading-relaxed whitespace-pre-line text-neutral-800">
        {paragraphs(row.body).map((pieces, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: paragraphs never reorder
          <Paragraph key={i} pieces={pieces} />
        ))}
      </div>
    </div>
  );
}

function Paragraph({ pieces }: { pieces: Piece[] }) {
  return (
    <p>
      {pieces.map((piece, j) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: pieces never reorder
        <Text key={j} piece={piece} />
      ))}
    </p>
  );
}

function Text({ piece }: { piece: Piece }) {
  if (!("href" in piece)) return piece.text;
  return (
    <a
      href={piece.href}
      target="_blank"
      rel="noreferrer"
      className="text-violet-600 underline underline-offset-2"
    >
      {piece.href}
    </a>
  );
}

function BoxButton({
  icon,
  label,
  count = 0,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active}
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-neutral-600 hover:bg-white/50 aria-[current=true]:bg-white aria-[current=true]:text-neutral-900 aria-[current=true]:shadow-sm [&>svg]:size-4"
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {count > 0 && <span className="text-xs text-neutral-400">{count}</span>}
    </button>
  );
}
