import { Window } from "#/components/window";
import { createFileRoute, Link } from "@tanstack/react-router";
import Lyft from "#/assets/Lyft_Logo_Pink_RGB.png";
export const Route = createFileRoute("/")({ component: Home });

function Icon({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img src={src} alt={alt} className={`size-4 object-contain ${className}`} />
  );
}

function Footer() {
  // poster board?
  // photography?
  // capcha
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
          <ul className="mt-1">
            <li>
              <Link to="/work/$id" params={{ id: "Lyft" }}>
                <div className="flex justify-between text-sm hover:underline hover:bg-stone-200/30 rounded font-">
                  <span className="flex items-center gap-2 ">
                    <Icon src={Lyft} alt="Lyft logo" />
                    Lyft
                  </span>

                  <span className="text-gray-500">2026-2027</span>
                </div>
              </Link>
            </li>
          </ul>
        </section>
      </main>
    </>
  );
}
