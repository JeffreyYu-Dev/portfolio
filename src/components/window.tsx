import { Link } from "@tanstack/react-router";
import { type ReactNode, useRef, useState } from "react";

// the page renders at this size, then gets scaled down into the window
const PAGE_WIDTH = 1280;
const PAGE_HEIGHT = 800;
const SCALE = 0.25;

export function Window({
  href,
  children,
  className = "",
  block = false,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  // stretch to fill the parent's width, e.g. for a whole list row
  block?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // only start loading the page once it's been hovered, then keep it around
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function show() {
    clearTimeout(timer.current);
    // small delay so skimming over a link doesn't flash the window
    timer.current = setTimeout(() => {
      setLoaded(true);
      setOpen(true);
    }, 150);
  }

  function hide() {
    clearTimeout(timer.current);
    setOpen(false);
  }

  // paths like "/posts/1" are pages on this site
  const internal = href.startsWith("/");
  const linkProps = {
    className: `${block ? "block" : ""} ${className}`,
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
    children,
  };

  return (
    <span className={`relative ${block ? "block" : "inline-block"}`}>
      {internal ? (
        <Link to={href} {...linkProps} />
      ) : (
        <a href={href} target="_blank" rel="noopener" {...linkProps} />
      )}

      <span
        aria-hidden
        className={`pointer-events-none absolute top-full left-0 z-50 mt-2 block origin-top-left overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl transition-[opacity,scale] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* title bar */}
        <span className="flex items-center gap-1.5 border-b border-gray-200 bg-gray-100 px-2 py-1.5">
          <span className="size-2 rounded-full bg-red-400" />
          <span className="size-2 rounded-full bg-yellow-400" />
          <span className="size-2 rounded-full bg-green-400" />
          <span className="ml-1 truncate text-[10px] text-gray-500">
            {internal ? href : URL.parse(href)?.hostname}
          </span>
        </span>

        <span
          className="block"
          style={{ width: PAGE_WIDTH * SCALE, height: PAGE_HEIGHT * SCALE }}
        >
          {loaded && (
            <iframe
              src={href}
              title={`Preview of ${href}`}
              tabIndex={-1}
              className="origin-top-left"
              style={{
                width: PAGE_WIDTH,
                height: PAGE_HEIGHT,
                transform: `scale(${SCALE})`,
              }}
            />
          )}
        </span>
      </span>
    </span>
  );
}
