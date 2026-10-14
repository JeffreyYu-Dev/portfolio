import { InboxTabs, MessageList } from "#/components/yail/message-list";
import { NotFound } from "#/components/yail/not-found";
import type { MailTab } from "#/data/mail";
import { useMail } from "#/lib/mail-store";
import { isBox, isTab, listFor } from "#/lib/yail";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/yail/$box/")({
  validateSearch: (search: Record<string, unknown>): { tab?: MailTab } =>
    isTab(search.tab) ? { tab: search.tab } : {},
  component: Mailbox,
});

function Mailbox() {
  const { box } = Route.useParams();
  const { tab = "primary" } = Route.useSearch();
  const state = useMail();
  if (!isBox(box)) return <NotFound />;

  const empty =
    box === "starred"
      ? "No starred messages. Stars let you give messages a special status to make them easier to find."
      : box === "drafts"
        ? "You don't have any saved drafts."
        : box === "sent"
          ? "No sent messages! Send one now!"
          : "Your inbox is empty.";

  return (
    <>
      {box === "inbox" && <InboxTabs active={tab} />}
      <MessageList
        items={listFor(box, tab, state)}
        linkBox={box}
        empty={empty}
      />
    </>
  );
}
