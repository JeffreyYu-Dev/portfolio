import { openFolder } from "#/components/finder";
import { useNowPlaying } from "#/components/notch-player";
import { appOf, finder } from "#/data/apps";
import {
  setDockPeek,
  useBrowserFullScreen,
  useDockHidden,
} from "#/lib/dock-store";
import { toggleNotch } from "#/lib/notch-store";
import { useGo } from "#/lib/page-transition";
import {
  BROWSER,
  focusWindow,
  openWindow,
  useWindows,
} from "#/lib/window-store";
import { Link } from "@tanstack/react-router";
import { type ReactNode, useEffect, useRef } from "react";

// a tiny frosted macOS dock pinned to the bottom edge. a dot marks what's
// running, minimized windows included. those windows also shrink into their own
// spot after the divider, where the window itself is drawn as the thumbnail
export function Dock() {
  const track = useNowPlaying();
  const go = useGo("dock");
  const { windows } = useWindows();
  const browser = windows[BROWSER];
  const finders = Object.keys(windows).filter(finder.owns);
  // newest last, like the mac
  const minimized = Object.keys(windows)
    .filter((id) => windows[id].minimized)
    .sort((a, b) => windows[a].z - windows[b].z);
  const expanded = useBrowserFullScreen();
  const hidden = useDockHidden();
  const dockRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!expanded) setDockPeek(false);
  }, [expanded]);

  // like clicking finder in the dock: the front finder window, back from the
  // dock if it has to be, or a new one
  function showFinder() {
    const front = [...finders].sort((a, b) => windows[b].z - windows[a].z)[0];
    if (!front) openFolder("projects");
    else if (windows[front].minimized) openWindow(front);
    else focusWindow(front);
  }

  return (
    <>
      {expanded && (
        <div
          aria-hidden="true"
          onPointerEnter={() => setDockPeek(true)}
          // moving off the edge anywhere but up into the dock hides it again
          onPointerLeave={(e) => {
            const into = e.relatedTarget;
            if (!(into instanceof Node && dockRef.current?.contains(into)))
              setDockPeek(false);
          }}
          className="fixed inset-x-0 bottom-0 z-40 h-2 max-md:hidden"
        />
      )}
      <nav
        ref={dockRef}
        aria-label="Dock"
        data-dock
        // slides away while the browser fills the screen, like a full-screen mac app
        inert={hidden}
        onPointerLeave={() => expanded && setDockPeek(false)}
        className={`fixed bottom-1.5 left-1/2 z-40 -translate-x-1/2 transition-[translate,opacity] duration-300 ease-out motion-reduce:transition-none! max-md:hidden ${
          hidden ? "translate-y-[150%] opacity-0" : ""
        }`}
      >
        <div
          // even padding all round, plus a little extra at the bottom for the running
          // dots. the radius is the icons' corner plus the padding, so the curves nest
          className="flex items-center gap-1.5 rounded-xl border border-white/40 bg-white/25 p-1.5 pb-2.5 shadow-[0_8px_30px_rgb(0_0_0/0.12),inset_0_1px_0_rgb(255_255_255/0.5)] ring-1 ring-black/5 backdrop-blur-xl backdrop-saturate-150"
        >
          <Item label="Finder" running={finders.length > 0}>
            <button
              type="button"
              onClick={showFinder}
              aria-label="Finder"
              className={tile}
            >
              <img src={finder.icon} alt="" className="size-full" />
            </button>
          </Item>

          {/* the portfolio lives in the browser. closed or minimized, clicking it
              brings the window back on the page it was showing. otherwise it goes home */}
          <Item label="Zen" running={!!browser}>
            <Link
              to="/"
              onClick={(e) => {
                if (browser && !browser.minimized) return go("/")(e);
                e.preventDefault();
                openWindow(BROWSER);
              }}
              aria-label="Zen"
              className={tile}
            >
              <img src="/zen-browser.png" alt="" className="size-full" />
            </Link>
          </Item>

          <Item
            label={track?.playing ? track.title : "Spotify"}
            running={!!track?.playing}
          >
            {/* data-notch-toggle so the notch's outside-press handler leaves this alone */}
            <button
              type="button"
              data-notch-toggle
              onClick={toggleNotch}
              aria-label="Now playing"
              // the logo on a black squircle, like spotify's mac app icon
              className={`${tile} grid place-items-center rounded-[22%] bg-black`}
            >
              <img src="/spotify.png" alt="" className="size-[70%]" />
            </button>
          </Item>

          {minimized.length > 0 && (
            <>
              <span
                aria-hidden="true"
                className="mx-0.5 h-6 w-px self-center bg-black/15"
              />
              {minimized.map((id) => {
                const title = appOf(id).title(id);
                return (
                  <Item key={id} label={title}>
                    {/* an empty spot the minimized window shrinks into. the window
                        lets clicks through, so this is what gets pressed */}
                    <button
                      type="button"
                      data-dock-slot={id}
                      onClick={() => openWindow(id)}
                      aria-label={`Show ${title}`}
                      className={tile}
                    />
                  </Item>
                );
              })}
            </>
          )}
        </div>
      </nav>
    </>
  );
}

// the icon images bring their own shape, this just makes them pressable
const tile = "block size-full active:brightness-75";

function Item({
  label,
  running,
  children,
}: {
  label: string;
  running?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="group relative size-7">
      {children}
      {running && (
        <span className="pointer-events-none absolute left-1/2 -bottom-[7px] size-[3px] -translate-x-1/2 rounded-full bg-neutral-600/70" />
      )}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-full left-1/2 mb-2.5 -translate-x-1/2 rounded-md border border-white/40 bg-white/60 px-1.5 py-0.5 text-[10px] whitespace-nowrap text-neutral-800 opacity-0 shadow-sm backdrop-blur-md group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </div>
  );
}
