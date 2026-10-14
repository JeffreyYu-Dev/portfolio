import { useMail } from "#/lib/mail-store";
import { type Box, boxTitle, unreadByTab } from "#/lib/yail";
import { openDraft } from "#/lib/yail-compose";
import { Link, useRouterState } from "@tanstack/react-router";
import { File, Inbox, Pencil, Send, Star } from "lucide-react";

const ICONS = { inbox: Inbox, starred: Star, sent: Send, drafts: File };
const BOXES: Box[] = ["inbox", "starred", "sent", "drafts"];

// compose plus the mailboxes. on phones it's a drawer behind the menu button
export function Rail({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state = useMail();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const unread = Object.values(unreadByTab(state)).reduce((a, b) => a + b, 0);
  const counts: Partial<Record<Box, number>> = {
    inbox: unread,
    drafts: state.draft ? 1 : 0,
  };

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
        />
      )}
      <nav
        aria-label="Mailboxes"
        className={`flex w-64 shrink-0 flex-col gap-1 pr-4 max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40 max-md:bg-white max-md:pt-4 max-md:shadow-xl ${
          open ? "" : "max-md:hidden"
        }`}
      >
        <button
          type="button"
          onClick={() => {
            onClose();
            openDraft();
          }}
          className="mb-3 ml-2 flex h-14 w-36 items-center gap-3 rounded-2xl bg-[#c2e7ff] px-5 font-medium text-[#001d35] hover:shadow-md"
        >
          <Pencil className="size-5" />
          Compose
        </button>
        {BOXES.map((box) => {
          const Icon = ICONS[box];
          const active =
            pathname === `/yail/${box}` || pathname.startsWith(`/yail/${box}/`);
          const count = counts[box] ?? 0;
          return (
            <Link
              key={box}
              to="/yail/$box"
              params={{ box }}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={`flex h-8 items-center gap-4 rounded-r-full pr-3 pl-6 text-[#202124] hover:bg-black/5 aria-[current=page]:bg-[#d3e3fd] aria-[current=page]:font-semibold ${
                box === "inbox" && count ? "font-semibold" : ""
              }`}
            >
              <Icon className="size-5" />
              <span className="flex-1">{boxTitle(box)}</span>
              {count > 0 && <span className="text-xs">{count}</span>}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
