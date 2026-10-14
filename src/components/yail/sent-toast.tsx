import { dismiss, useToast } from "#/lib/yail-toast";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";

export function SentToast() {
  const { sentId } = useToast();
  if (!sentId) return null;
  return (
    // output: a live status region, so screen readers hear "message sent"
    <output
      className="absolute bottom-6 left-6 z-50 flex items-center gap-3 rounded bg-[#303030] py-2 pr-2 pl-4 text-xs text-white shadow-lg max-md:fixed max-md:bottom-4 max-md:left-4"
    >
      Message sent
      <Link
        to="/yail/$box/$id"
        params={{ box: "sent", id: sentId }}
        onClick={dismiss}
        className="font-medium text-[#a8c7fa] hover:underline"
      >
        View message
      </Link>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        className="grid size-6 place-items-center rounded-full hover:bg-white/10"
      >
        <X className="size-3.5" />
      </button>
    </output>
  );
}
