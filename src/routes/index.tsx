import { Window } from "#/components/window";
import { WorkLogo } from "#/components/work-logo";
import { type Project, projects } from "#/data/projects";
import { type Work, work } from "#/data/work";
import { vt } from "#/lib/view-transition";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

const quote = "Skipped physics 'cause I already knew I had motion";
const quote2 =
  "Came in as a freshman 4 years ago, came in a freshman 4 days ago.";

function Footer() {
  // poster board?
  // photography?
  // capcha
}

// vt() pairs the row, logo and title with their twins on the work page
function WorkRow({ entry }: { entry: Work }) {
  return (
    <Link to="/work/$id" params={{ id: entry.id }}>
      <div
        className="flex justify-between text-sm hover:underline hover:bg-stone-200/30 rounded"
        style={vt("work", entry.id)}
      >
        <span className="flex items-center gap-2 ">
          <WorkLogo
            entry={entry}
            size="sm"
            style={vt("work", entry.id, "icon")}
          />
          <span style={vt("work", entry.id, "title")}>{entry.company}</span>
        </span>

        <span className="text-gray-500">{entry.years}</span>
      </div>
    </Link>
  );
}

function ProjectRow({ entry }: { entry: Project }) {
  return (
    <Link to="/projects/$id" params={{ id: entry.id }}>
      <div
        className="flex justify-between text-sm hover:underline hover:bg-stone-200/30 rounded"
        style={vt("project", entry.id)}
      >
        <span style={vt("project", entry.id, "title")}>{entry.name}</span>
        <span className="text-gray-500">{entry.year}</span>
      </div>
    </Link>
  );
}

function Home() {
  return (
    <>
      <header>
        {/* make this cooler */}
        <h1 className="text-lg">Jeffrey Yu</h1>

        {/*stuff about me*/}
        <p className="text-xs">
          Student at{" "}
          <Window
            href="https://www.uwo.ca/index.html"
            className="underline underline-offset-1"
          >
            Western
          </Window>
        </p>
      </header>
      <main className="mt-4 flex flex-col gap-6">
        <section>
          <h1 className="text-xs text-muted-foreground text-gray-500">Work</h1>
          <ul className="mt-1 flex flex-col gap-1">
            {work.map((entry) => (
              <li key={entry.id}>
                <WorkRow entry={entry} />
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h1 className="text-xs text-muted-foreground text-gray-500">
            Projects
          </h1>
          <ul className="mt-1 flex flex-col gap-1">
            {projects.map((entry) => (
              <li key={entry.id}>
                <ProjectRow entry={entry} />
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h1 className="text-xs text-muted-foreground text-gray-500">
            Archived
          </h1>
          <ul className="mt-1 flex flex-col gap-1">
            <li>Jan. 2026</li>
          </ul>
        </section>
      </main>
    </>
  );
}
