import { type ReactNode, useEffect, useState } from "react";
import { viewTransitionName } from "#/lib/view-transition";

const ease = "ease-[cubic-bezier(0.32,0.72,0,1)]";
// matches the row → window morph in styles.css
const SETTLE_DELAY = 300;

// renders as a window on first paint so the page transition captures the frame, then dissolves into the page
export function WindowChrome({
  id,
  path,
  children,
}: {
  id: string;
  path: string;
  children: ReactNode;
}) {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(true), SETTLE_DELAY);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`-mx-3 overflow-hidden rounded-lg border [view-transition-class:work-box] transition-colors duration-150 ${ease} motion-reduce:border-transparent motion-reduce:transition-none ${
        settled ? "border-transparent" : "border-gray-200"
      }`}
      style={{ viewTransitionName: viewTransitionName(id) }}
    >
      {/* title bar, same look as the hover preview in window.tsx */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-150 ${ease} motion-reduce:grid-rows-[0fr] motion-reduce:opacity-0 motion-reduce:transition-none ${
          settled ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex items-center gap-1.5 border-b border-gray-200 bg-gray-100 px-2 py-1.5">
            <span className="size-2 rounded-full bg-red-400" />
            <span className="size-2 rounded-full bg-yellow-400" />
            <span className="size-2 rounded-full bg-green-400" />
            <span className="ml-1 truncate text-[10px] text-gray-500">
              {path}
            </span>
          </div>
        </div>
      </div>

      <div className="p-3">{children}</div>
    </div>
  );
}
