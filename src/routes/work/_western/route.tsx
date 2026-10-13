import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/work/_western")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/work/Western"!</div>;
}
