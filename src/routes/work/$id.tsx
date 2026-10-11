import { createFileRoute, Link } from "@tanstack/react-router";
import Lyft from "#/assets/Lyft_Logo_Pink_RGB.png";
import type { CSSProperties } from "react";
import { WindowChrome } from "#/components/window-chrome";
import { viewTransitionName } from "#/lib/view-transition";

export const Route = createFileRoute("/work/$id")({
  component: RouteComponent,
  loader: async ({ params }) => {
    return params.id;
  },
});

function Icon({
  src,
  alt,
  className = "",
  style,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={`size-4 object-contain ${className}`}
      style={style}
    />
  );
}

function RouteComponent() {
  const { id } = Route.useParams();

  return (
    <>
      <header>
        <Link to="/">
          <h1 className="text-gray-500 text-xs hover:underline">
            {"<-- home"}
          </h1>
        </Link>
      </header>
      <main className="mt-1">
        <WindowChrome id={id} path={`/work/${id}`}>
          <section>
            <div className="flex gap-2 items-center">
              <Icon
                src={Lyft}
                alt="Lyft"
                className="size-10 [view-transition-class:work-icon]"
                style={{ viewTransitionName: viewTransitionName(id, "icon") }}
              />
              <h1
                className="text-xl [view-transition-class:work-title]"
                style={{ viewTransitionName: viewTransitionName(id, "title") }}
              >
                Software Engineer Intern @ Lyft
              </h1>
            </div>
            <h4
              className="text-xs text-gray-500 blur-in"
              style={{ "--i": 0 } as CSSProperties}
            >
              Sept. 2025 - Dec. 2025
            </h4>
            <div className="mt-2 blur-in" style={{ "--i": 1 } as CSSProperties}>
              <p className="text-xs mt-1">
                lorem ipsum dolor sit amet consectetur adipiscing elit ex nobis
                illum proident occaecat dolor deserunt id eos id in id est nam et
                sunt mollit facere culpa proident qui id nam voluptatum quo do est
                consequat imperdiet duis id cumque nam eiusmod anim adipiscing
                culpa laborum illum amet tempor provident
              </p>
            </div>
          </section>
        </WindowChrome>
      </main>
    </>
  );
}
