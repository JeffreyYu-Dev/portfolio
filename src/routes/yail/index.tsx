import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/yail/")({
  beforeLoad: () => {
    throw redirect({ to: "/yail/$box", params: { box: "inbox" } });
  },
});
