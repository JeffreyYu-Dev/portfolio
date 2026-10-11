import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { WorkLogo } from "#/components/work-logo";
import { findWork } from "#/data/work";
import { vt } from "#/lib/view-transition";

export const Route = createFileRoute("/work/$id")({
  component: RouteComponent,
  loader: ({ params }) => {
    const entry = findWork(params.id);
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
        <section style={vt("work", entry.id)}>
          <div className="flex gap-2 items-center">
            <WorkLogo
              entry={entry}
              size="lg"
              style={vt("work", entry.id, "icon")}
            />
            <h1 className="text-lg" style={vt("work", entry.id, "title")}>
              {entry.role} @ {entry.company}
            </h1>
          </div>
          <h4
            className="text-xs text-gray-500 blur-in"
            style={{ "--i": 0 } as CSSProperties}
          >
            {entry.dates}
          </h4>
          <div className="mt-2 blur-in" style={{ "--i": 1 } as CSSProperties}>
            <p className="text-xs mt-1">{entry.body}</p>
          </div>
        </section>
        <section>
          {/*i want this to be more of a blog style*/}
          <h1></h1>
        </section>
      </main>
    </>
  );
}
