import { MessageView } from "#/components/yail/message-view";
import { NotFound } from "#/components/yail/not-found";
import { getMail, markRead, useMail, useMailReady } from "#/lib/mail-store";
import { findItem, isBox } from "#/lib/yail";
import { openCompose } from "#/lib/yail-compose";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/yail/$box/$id")({ component: Email });

function Email() {
  const { box, id } = Route.useParams();
  const state = useMail();
  // sent mail lives in the visitor's storage, which the server can't see. wait
  // for it rather than flashing "doesn't exist"
  const ready = useMailReady();
  const navigate = useNavigate();
  const item = isBox(box) ? findItem(box, id, state) : null;

  // yail.com/drafts/draft opens the draft in compose over the drafts list
  useEffect(() => {
    if (box !== "drafts" || !ready) return;
    const draft = getMail().draft;
    if (draft) openCompose(draft);
    navigate({ to: "/yail/$box", params: { box: "drafts" }, replace: true });
  }, [box, ready, navigate]);

  useEffect(() => {
    if (item?.box === "inbox" && item.unread) markRead(item.id);
  }, [item?.box, item?.id, item?.unread]);

  if (box === "drafts") return null;
  if (!item) return ready ? <NotFound /> : null;
  return <MessageView item={item} backTo={isBox(box) ? box : "inbox"} />;
}
