import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { findProject } from "#/data/projects";
import { vt } from "#/lib/view-transition";

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

  return (
    <>
      <header>
        <Link to="/">
          <h1 className="text-gray-500 text-xs hover:underline">
            {"<-- home"}
          </h1>
        </Link>
      </header>
      <main className="mt-4">
        {/* vt() pairs these with the matching row on the home page */}
        <section style={vt("project", entry.id)}>
          <h1 className="text-xl" style={vt("project", entry.id, "title")}>
            {entry.name}
          </h1>
          <h4
            className="text-xs text-gray-500 blur-in"
            style={{ "--i": 0 } as CSSProperties}
          >
            {entry.summary} · {entry.year}
          </h4>
          <div className="mt-2 blur-in" style={{ "--i": 1 } as CSSProperties}>
            <p className="text-xs mt-1">{entry.body}</p>
          </div>
        </section>
      </main>
    </>
  );
}
