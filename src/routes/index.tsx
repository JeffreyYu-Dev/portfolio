import { Window } from "#/components/window";
import { Line } from "#/components/line";
import { Socials } from "#/components/socials";
import { Availability, Listening, LocalTime } from "#/components/status-line";
import { WorkLogo } from "#/components/work-logo";
import { type Project, projects } from "#/data/projects";
import { type Work, work } from "#/data/work";
import { morph, useLeave, usePageEnter } from "#/lib/page-transition";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

// crazy quotes :crying:
const quote = "Skipped physics 'cause I already knew I had motion";
const quote2 =
  "Came in as a freshman 4 years ago, came in a freshman 4 days ago.";

function Footer() {
  // poster board?
  // photography?
  // capcha
}

// morph() pairs the logo and title with their twins on the work page
function WorkRow({ entry }: { entry: Work }) {
  const key = `work-${entry.id}`;
  const onClick = useLeave(key, {
    title: entry.company,
    icon: <WorkLogo entry={entry} size="sm" />,
  });

  return (
    <Link to="/work/$id" params={{ id: entry.id }} onClick={onClick}>
      <div className="flex justify-between text-sm hover:underline rounded">
        <span className="flex items-center gap-2 ">
          <span className="flex shrink-0" {...morph(key, "icon")}>
            <WorkLogo entry={entry} size="sm" />
          </span>
          <span {...morph(key, "title")}>{entry.company}</span>
        </span>

        <span className="text-gray-500">
          <Line inline>{entry.years}</Line>
        </span>
      </div>
    </Link>
  );
}

function ProjectRow({ entry }: { entry: Project }) {
  const key = `project-${entry.id}`;
  const onClick = useLeave(key, { title: entry.name });

  return (
    <Link to="/projects/$id" params={{ id: entry.id }} onClick={onClick}>
      <div className="flex justify-between text-sm hover:underline rounded">
        <span {...morph(key, "title")}>{entry.name}</span>
        <span className="text-gray-500">
          <Line inline>{entry.year}</Line>
        </span>
      </div>
    </Link>
  );
}

function Home() {
  usePageEnter();

  return (
    <>
      <header>
        {/* make this cooler */}
        <Line>
          <h1 className="text-lg">Jeffrey Yu</h1>
        </Line>

        {/*stuff about me*/}
        <Line>
          <p className="text-xs">
            Student at{" "}
            <Window
              href="https://www.uwo.ca/index.html"
              className="underline underline-offset-1"
            >
              Western
            </Window>
          </p>
        </Line>
        <div className="mt-1 flex flex-col gap-0.5">
          {/* raised so its hover card covers the lines below, each line is its own layer */}
          <div className="relative z-20">
            <Line>
              <Availability />
            </Line>
          </div>
          <Line>
            <LocalTime />
          </Line>
          <Line>
            <Listening />
          </Line>
        </div>
        <Line>
          <div className="mt-1">
            <Socials />
          </div>
        </Line>
      </header>
      <main className="mt-4 flex flex-col gap-4">
        <section>
          <Line>
            <h1 className="text-xs text-muted-foreground text-gray-500">
              Work
            </h1>
          </Line>
          <ul className="mt-2 flex flex-col gap-1">
            {work.map((entry) => (
              <li key={entry.id}>
                <Line>
                  <WorkRow entry={entry} />
                </Line>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <Line>
            <h1 className="text-xs text-muted-foreground text-gray-500">
              Projects
            </h1>
          </Line>
          <ul className="mt-1 flex flex-col gap-1">
            {projects.map((entry) => (
              <li key={entry.id}>
                <Line>
                  <ProjectRow entry={entry} />
                </Line>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <Line>
            <h1 className="text-xs text-muted-foreground text-gray-500">
              Posts
            </h1>
          </Line>
          <ul className="mt-1 flex flex-col gap-1"></ul>
        </section>
        <section>
          <Line>
            <h1 className="text-xs text-muted-foreground text-gray-500">
              Hackathons
            </h1>
          </Line>
          <ul className="mt-1 flex flex-col gap-1"></ul>
        </section>
        {/*<section>
          <Line>
            <h1 className="text-xs text-muted-foreground text-gray-500">
              Archived
            </h1>
          </Line>
          <ul className="mt-1 flex flex-col gap-1">
            <li>
              <Line>Jan. 2026</Line>
            </li>
          </ul>
        </section>*/}
      </main>
    </>
  );
}
