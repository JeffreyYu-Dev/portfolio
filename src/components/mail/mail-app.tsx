import { AppWindow } from "#/components/app-window";
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
    <div className="flex h-full text-xs">
      <nav
        aria-label="Mailboxes"
        className="w-44 shrink-0 border-r border-black/10 bg-neutral-100/80 px-2 pt-12"
      >
        <p className="px-2 pb-1 text-[10px] font-semibold text-neutral-400">
          Favourites
        </p>
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

      {composing ? (
        <div className="min-w-0 flex-1">
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
      ) : (
        <>
          <section
            aria-label="Messages"
            className="flex w-64 shrink-0 flex-col border-r border-black/10"
          >
            <header className="flex h-12 shrink-0 items-center justify-between border-b border-black/10 px-3">
              <div>
                <h2 className="font-semibold text-neutral-900 capitalize">
                  {box}
                </h2>
                <p className="text-[10px] text-neutral-400">
                  {rows.length} {rows.length === 1 ? "message" : "messages"}
                </p>
              </div>
              <button
                type="button"
                aria-label="New message"
                onClick={() => compose()}
                className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              >
                <SquarePen className="size-4" />
              </button>
            </header>
            <ul className="min-h-0 flex-1 overflow-y-auto">
              {rows.length === 0 && (
                <li className="p-6 text-center text-neutral-400">
                  No Messages
                </li>
              )}
              {rows.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => select(row)}
                    aria-current={row.id === selected}
                    className="relative block w-full border-b border-black/5 py-2 pr-3 pl-6 text-left aria-[current=true]:bg-sky-500 aria-[current=true]:text-white"
                  >
                    {row.unread && (
                      <>
                        <span
                          aria-hidden="true"
                          className="absolute top-3 left-2 size-2 rounded-full bg-sky-500"
                        />
                        <span className="sr-only">Unread: </span>
                      </>
                    )}
                    <span className="flex justify-between gap-2">
                      <span className="truncate font-semibold">{row.from}</span>
                      <span className="shrink-0 opacity-60">
                        {mailDate(row.date)}
                      </span>
                    </span>
                    <span className="block truncate">{row.subject}</span>
                    <span className="line-clamp-2 opacity-60">{row.body}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <article className="min-w-0 flex-1 overflow-y-auto">
            {current ? (
              <Message
                row={current}
                box={box}
                onReply={() => compose(`Re: ${current.subject}`)}
              />
            ) : (
              <p className="grid h-full place-items-center text-neutral-400">
                No Message Selected
              </p>
            )}
          </article>
        </>
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
    <>
      <header className="flex items-start justify-between gap-4 border-b border-black/10 px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-neutral-900">
            {row.subject}
          </h3>
          <p className="text-neutral-500">
            {box === "inbox"
              ? `From: ${row.from} · To: you`
              : "From: you · To: Jeffrey Yu"}
          </p>
          <p className="text-neutral-400">
            {new Date(row.date).toLocaleString()}
          </p>
        </div>
        {box === "inbox" && (
          <button
            type="button"
            onClick={onReply}
            className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-neutral-600 hover:bg-neutral-100"
          >
            <Reply className="size-4" /> Reply
          </button>
        )}
      </header>
      <div className="flex flex-col gap-3 px-5 py-4 leading-relaxed whitespace-pre-line text-neutral-800">
        {paragraphs(row.body).map((pieces, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: paragraphs never reorder
          <Paragraph key={i} pieces={pieces} />
        ))}
      </div>
    </>
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
      className="text-sky-600 underline"
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
      className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-neutral-700 aria-[current=true]:bg-black/10 [&>svg]:size-3.5 [&>svg]:text-sky-500"
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {count > 0 && <span className="text-neutral-400">{count}</span>}
    </button>
  );
}
