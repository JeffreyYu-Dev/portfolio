import { createFileRoute, Link } from "@tanstack/react-router";
import Lyft from "#/assets/Lyft_Logo_Pink_RGB.png";

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
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img src={src} alt={alt} className={`size-4 object-contain ${className}`} />
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
      <main className="mt-4">
        <section>
          <div className="flex gap-2 items-center">
            <Icon src={Lyft} alt="Lyft" className="size-10" />
            <h1 className="text-xl">Software Engineer Intern @ Lyft</h1>
          </div>
          <h4 className="text-xs text-gray-500">Sept. 2025 - Dec. 2025</h4>
          <div className="mt-2">
            <p className="text-xs mt-1">
              lorem ipsum dolor sit amet consectetur adipiscing elit ex nobis
              illum proident occaecat dolor deserunt id eos id in id est nam et
              sunt mollit facere culpa proident qui id nam voluptatum quo do est
              consequat imperdiet duis id cumque nam eiusmod anim adipiscing
              culpa laborum illum amet tempor provident
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
