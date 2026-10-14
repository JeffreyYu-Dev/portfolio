import type { MailTab } from "#/data/mail";
import { toggleStar, useMail } from "#/lib/mail-store";
import { type Box, type Item, unreadByTab } from "#/lib/yail";
import { openDraft } from "#/lib/yail-compose";
import { MailTime } from "#/components/yail/mail-time";
import { Link } from "@tanstack/react-router";
import { Inbox, Star, Tag, Users } from "lucide-react";

const TAB_INFO: {
  tab: MailTab;
  label: string;
  icon: typeof Inbox;
  color: string;
}[] = [
  { tab: "primary", label: "Primary", icon: Inbox, color: "#0b57d0" },
  { tab: "promotions", label: "Promotions", icon: Tag, color: "#188038" },
  { tab: "social", label: "Social", icon: Users, color: "#5e35b1" },
];

export function InboxTabs({ active }: { active: MailTab }) {
  const unread = unreadByTab(useMail());
  return (
    <div role="tablist" className="flex border-b border-[#e0e0e0]">
      {TAB_INFO.map(({ tab, label, icon: Icon, color }) => (
        <Link
          key={tab}
          role="tab"
          aria-selected={tab === active}
          to="/yail/$box"
          params={{ box: "inbox" }}
          search={{ tab }}
          style={tab === active ? { color, borderColor: color } : undefined}
          className="flex h-14 flex-1 items-center gap-4 border-b-[3px] border-transparent px-4 text-[#444746] hover:bg-black/5 md:max-w-64"
        >
          <Icon className="size-5" />
          <span className="font-medium">{label}</span>
          {tab !== "primary" && unread[tab] > 0 && (
            <span
              className="rounded-full px-2 text-xs text-white"
              style={{ backgroundColor: color }}
            >
              {unread[tab]} new
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

// one line per conversation like gmail, two on phones. the star sits outside the
// link so it's its own button
export function MessageList({
  items,
  linkBox,
  empty,
}: {
  items: Item[];
  // the mailbox to open emails under, so back returns there. defaults to the item's own
  linkBox?: Box;
  empty: string;
}) {
  if (items.length === 0)
    return <p className="p-10 text-center text-[#444746]">{empty}</p>;

  return (
    <ul>
      {items.map((item) => (
        <li
          key={item.id}
          className={`group relative flex items-center border-b border-[#f1f3f4] hover:z-10 hover:shadow-[inset_1px_0_0_#dadce0,inset_-1px_0_0_#dadce0,0_1px_2px_0_rgba(60,64,67,.3),0_1px_3px_1px_rgba(60,64,67,.15)] ${
            item.unread ? "bg-white" : "bg-[#f2f6fc]"
          }`}
        >
          {item.box !== "drafts" && (
            <button
              type="button"
              aria-label={item.starred ? "Starred" : "Not starred"}
              aria-pressed={item.starred}
              onClick={() => toggleStar(item.id)}
              className="grid size-10 shrink-0 place-items-center pl-2"
            >
              <Star
                className={`size-5 ${item.starred ? "fill-[#fbbc04] text-[#fbbc04]" : "text-[#c4c7c5]"}`}
              />
            </button>
          )}
          {item.box === "drafts" ? (
            <button
              type="button"
              onClick={() => openDraft()}
              className="flex min-w-0 flex-1 items-center gap-4 py-2.5 pr-4 pl-12 text-left"
            >
              <Row item={item} />
            </button>
          ) : (
            <Link
              to="/yail/$box/$id"
              params={{ box: linkBox ?? item.box, id: item.id }}
              className="flex min-w-0 flex-1 items-center gap-4 py-2.5 pr-4"
            >
              <Row item={item} />
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

function Row({ item }: { item: Item }) {
  const weight = item.unread ? "font-bold text-[#1f1f1f]" : "text-[#444746]";
  return (
    <span className="flex min-w-0 flex-1 gap-1 max-md:flex-col md:items-center md:gap-4">
      <span
        className={`flex items-center justify-between md:w-48 md:shrink-0 ${weight}`}
      >
        <span
          className={`truncate ${item.box === "drafts" ? "text-[#d93025]" : ""}`}
        >
          {item.from}
        </span>
        <span className={`shrink-0 text-xs md:hidden ${weight}`}>
          <MailTime iso={item.date} />
        </span>
      </span>
      <span className="min-w-0 flex-1 truncate">
        <span className={weight}>{item.subject}</span>
        <span className="text-[#5f6368]">
          {" "}
          – {item.body.replace(/\s+/g, " ")}
        </span>
      </span>
      <span className={`shrink-0 text-xs max-md:hidden ${weight}`}>
        <MailTime iso={item.date} />
      </span>
    </span>
  );
}
