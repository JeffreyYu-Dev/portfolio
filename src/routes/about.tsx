import { createFileRoute, Link } from "@tanstack/react-router";
import { Line } from "#/components/line";
import { about } from "#/data/about";
import { useLeave, usePageEnter } from "#/lib/page-transition";

export const Route = createFileRoute("/about")({ component: About });

function About() {
  const onBack = useLeave("about");
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
      {/*<main className="mt-4 flex flex-col gap-4">
        <section>
          <Line>
            <h1 className="text-lg">About me</h1>
          </Line>
          <Line>
            <h4 className="text-xs text-gray-500">{about.tagline}</h4>
          </Line>
          <div className="mt-2 flex flex-col gap-2">
            {about.bio.map((paragraph) => (
              <Line key={paragraph}>
                <p className="text-xs">{paragraph}</p>
              </Line>
            ))}
          </div>
        </section>
        <section>
          <Line>
            <h1 className="text-xs text-gray-500">Now</h1>
          </Line>
          <ul className="mt-1 flex flex-col gap-1">
            {about.now.map((item) => (
              <li key={item.label}>
                <Line>
                  <div className="flex justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="text-gray-500">{item.value}</span>
                  </div>
                </Line>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <Line>
            <h1 className="text-xs text-gray-500">Outside of code</h1>
          </Line>
          <Line>
            <p className="mt-1 text-sm">{about.interests.join(" · ")}</p>
          </Line>
        </section>
      </main>*/}
      <main>under construction</main>
    </>
  );
}
