import { useMail } from "#/lib/mail-store";
import { type Box, boxTitle, unreadByTab } from "#/lib/yail";
import { openDraft } from "#/lib/yail-compose";
import { Link, useRouterState } from "@tanstack/react-router";
import { File, Inbox, Pencil, Send, Star } from "lucide-react";

const ICONS = { inbox: Inbox, starred: Star, sent: Send, drafts: File };
const BOXES: Box[] = ["inbox", "starred", "sent", "drafts"];

// compose plus the mailboxes. on phones it's a drawer behind the menu button, on
// desktop the menu button collapses it to just the icons. the icons stay put while
// the width animates and clips the labels, like gmail
export function Rail({
  open,
  collapsed,
  onClose,
}: {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
}) {
  const state = useMail();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const unread = Object.values(unreadByTab(state)).reduce((a, b) => a + b, 0);
  const counts: Partial<Record<Box, number>> = {
    inbox: unread,
    drafts: state.draft ? 1 : 0,
  };

  // labels fade as the rail narrows, so no half letters peek out past the icons
  const label = `transition-opacity duration-200 motion-reduce:transition-none ${
    collapsed ? "md:opacity-0" : ""
  }`;

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
        className={`flex w-48 shrink-0 flex-col gap-1 pr-4 max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40 max-md:bg-white max-md:pt-4 max-md:shadow-xl md:overflow-hidden md:transition-[width] md:duration-200 md:ease-out md:motion-reduce:transition-none ${
          open ? "" : "max-md:hidden"
        } ${collapsed ? "md:w-16" : ""}`}
      >
        <button
          type="button"
          onClick={() => {
            onClose();
            openDraft();
          }}
          title="Compose"
          className={`mb-3 ml-2 flex h-10 w-28 shrink-0 items-center gap-3 overflow-hidden rounded-2xl bg-[#c2e7ff] px-4 font-medium whitespace-nowrap text-[#001d35] hover:shadow-md md:transition-[width] md:duration-200 md:ease-out md:motion-reduce:transition-none ${
            collapsed ? "md:w-12" : ""
          }`}
        >
          <Pencil className="size-4 shrink-0" />
          <span className={label}>Compose</span>
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
              title={collapsed ? boxTitle(box) : undefined}
              // collapsed, the highlight shrinks to a pill around the icon. the
              // margin and padding trade places so the icon doesn't move
              className={`flex h-7 shrink-0 items-center gap-3 overflow-hidden rounded-r-full pr-3 pl-6 whitespace-nowrap text-[#202124] hover:bg-black/5 aria-[current=page]:bg-[#d3e3fd] aria-[current=page]:font-semibold md:transition-[width,margin,padding,border-radius] md:duration-200 md:ease-out md:motion-reduce:transition-none ${
                box === "inbox" && count ? "font-semibold" : ""
              } ${collapsed ? "md:ml-3 md:w-10 md:rounded-full md:pl-3" : "md:w-44"}`}
            >
              <Icon className="size-4 shrink-0" />
              <span className={`flex-1 ${label}`}>{boxTitle(box)}</span>
              {count > 0 && (
                <span className={`text-[11px] ${label}`}>{count}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
