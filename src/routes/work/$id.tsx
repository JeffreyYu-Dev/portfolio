import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Line } from "#/components/line";
import { WorkLogo } from "#/components/work-logo";
import { findWork } from "#/data/work";
import { morph, useLeave, usePageEnter } from "#/lib/page-transition";

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
  // morph() pairs the logo and title with the matching row on the home page
  const key = `work-${entry.id}`;
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
            <div className="flex gap-2 items-center">
              <span className="flex shrink-0" {...morph(key, "icon")}>
                <WorkLogo entry={entry} size="lg" />
              </span>
              {/* only the company flies in from the row, the role rises in beside it */}
              <h1 className="text-lg">
                <Line inline>{`${entry.role} @\u00a0`}</Line>
                <span className="inline-block" {...morph(key, "title")}>
                  {entry.company}
                </span>
              </h1>
            </div>
          </Line>
          <Line>
            <h4 className="text-xs text-gray-500">{entry.dates}</h4>
          </Line>
          <Line>
            <div className="mt-2">
              <p className="text-xs mt-1">{entry.body}</p>
            </div>
          </Line>
        </section>
        <section>
          {/*i want this to be more of a blog style*/}
          <h1></h1>
        </section>
      </main>
    </>
  );
}
