import { MessageList } from "#/components/yail/message-list";
import { useMail } from "#/lib/mail-store";
import { search, searchQuery } from "#/lib/yail";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/yail/search")({
  validateSearch: (raw: Record<string, unknown>): { q?: string } => {
    const q = searchQuery(raw.q);
    return q ? { q } : {};
  },
  component: Results,
});

function Results() {
  const { q = "" } = Route.useSearch();
  const items = search(q, useMail());
  return (
    <>
      <p className="border-b border-[#e0e0e0] px-4 py-3 text-[#444746]">
        {q.trim()
          ? `Results for "${q.trim()}"`
          : "Type something to search your mail"}
      </p>
      <MessageList
        items={items}
        empty={q.trim() ? "No messages matched your search." : ""}
      />
    </>
  );
}
