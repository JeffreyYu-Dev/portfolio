import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Line } from "#/components/line";
import { findProject } from "#/data/projects";
import { morph, useLeave, usePageEnter } from "#/lib/page-transition";

export const Route = createFileRoute("/projects/$id")({
  component: RouteComponent,
  loader: ({ params }) => {
    const entry = findProject(params.id);
    if (!entry) throw notFound();
    return entry;
  },
});

function RouteComponent() {
  const entry = Route.useLoaderData();
  // morph() pairs the title with the matching row on the home page
  const key = `project-${entry.id}`;
  const onBack = useLeave(key);
  usePageEnter();

  return (
    <>
      <header>
        <Line>
          <Link to="/" onClick={onBack}>
            <h1 className="text-gray-500 text-xs hover:underline">
              {"<-- home"}
            </h1>
          </Link>
        </Line>
      </header>
      <main className="mt-4">
        <section>
          <Line>
            <h1 className="text-lg">
              <span className="inline-block" {...morph(key, "title")}>
                {entry.name}
              </span>
            </h1>
          </Line>
          <Line>
            <h4 className="text-xs text-gray-500">
              {entry.summary} · {entry.year}
            </h4>
          </Line>
          <Line>
            <div className="mt-2">
              <p className="text-xs mt-1">{entry.body}</p>
            </div>
          </Line>
        </section>
      </main>
    </>
  );
}
