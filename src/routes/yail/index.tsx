import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/yail/")({
  // keeps the query, so yail.com?compose=1 still arrives with compose open
  beforeLoad: ({ location }) => {
    throw redirect({ href: `/yail/inbox${location.searchStr}` });
  },
});
