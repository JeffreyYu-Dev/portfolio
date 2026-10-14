import { createFileRoute, redirect } from "@tanstack/react-router";

// the old contact page. writing to jeffrey happens in yail now
export const Route = createFileRoute("/contact")({
  beforeLoad: () => {
    throw redirect({ href: "/yail/inbox?compose=1" });
  },
});
