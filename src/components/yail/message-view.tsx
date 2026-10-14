import { Avatar } from "#/components/yail/avatar";
import { MailTime } from "#/components/yail/mail-time";
import { type Piece, paragraphs } from "#/lib/mail-body";
import { toggleStar } from "#/lib/mail-store";
import type { Box, Item } from "#/lib/yail";
import { openDraft } from "#/lib/yail-compose";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Reply, Star } from "lucide-react";

export function MessageView({ item, backTo }: { item: Item; backTo: Box }) {
  const sent = item.box === "sent";
  const reply = () => openDraft({ subject: `Re: ${item.subject}` });

  return (
    <article className="px-4 pb-10">
      <div className="flex h-12 items-center">
        <Link
          to="/yail/$box"
          params={{ box: backTo }}
          search={backTo === "inbox" && item.tab ? { tab: item.tab } : {}}
          aria-label={`Back to ${backTo}`}
          className="grid size-10 place-items-center rounded-full text-[#444746] hover:bg-black/5"
        >
          <ArrowLeft className="size-5" />
        </Link>
      </div>
      <h1 className="py-3 pl-14 text-[22px] text-[#1f1f1f]">{item.subject}</h1>
      <div className="flex items-start gap-4">
        <Avatar name={sent ? "You" : item.from} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-1">
            <span className="font-bold">{sent ? "You" : item.from}</span>
            {!sent && (
              <span className="text-xs text-[#5f6368]">
                &lt;{item.fromAddress}&gt;
              </span>
            )}
          </p>
          <p className="text-xs text-[#5f6368]">
            to {sent ? "Jeffrey Yu" : "me"}
          </p>
        </div>
        <span className="shrink-0 text-xs text-[#5f6368]">
          <MailTime iso={item.date} full />
        </span>
        <button
          type="button"
          aria-label={item.starred ? "Starred" : "Not starred"}
          aria-pressed={item.starred}
          onClick={() => toggleStar(item.id)}
          className="grid size-8 place-items-center rounded-full hover:bg-black/5"
        >
          <Star
            className={`size-5 ${item.starred ? "fill-[#fbbc04] text-[#fbbc04]" : "text-[#444746]"}`}
          />
        </button>
      </div>
      <div className="flex flex-col gap-4 py-6 pl-14 text-sm leading-relaxed whitespace-pre-line text-[#222]">
        {paragraphs(item.body).map((pieces, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: paragraphs never reorder
          <Paragraph key={i} pieces={pieces} />
        ))}
      </div>
      {!sent && (
        <div className="pl-14">
          <button
            type="button"
            onClick={reply}
            className="flex items-center gap-2 rounded-full border border-[#747775] px-6 py-2 font-medium text-[#444746] hover:bg-black/5"
          >
            <Reply className="size-4" /> Reply
          </button>
        </div>
      )}
    </article>
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
      className="text-[#0b57d0] underline"
    >
      {piece.href}
    </a>
  );
}
