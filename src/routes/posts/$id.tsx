import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/posts/$id")({
  component: RouteComponent,
  loader: async ({ params }) => {
    return params.id;
  },
});

function RouteComponent() {
  const { id } = Route.useParams();

  return <div>{id}</div>;
}
