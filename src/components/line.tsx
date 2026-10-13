import type { ReactNode } from "react";

// one masked line of the page transition, animated by page-transition.ts.
// inline for a piece of a line that reveals on its own, like a row's year
export function Line({
  inline = false,
  children,
}: {
  inline?: boolean;
  children: ReactNode;
}) {
  if (inline) {
    return (
      <span data-line className="inline-block overflow-clip align-top">
        <span className="line-in inline-block">{children}</span>
      </span>
    );
  }

  return (
    <div data-line className="overflow-clip">
      <div className="line-in">{children}</div>
    </div>
  );
}
