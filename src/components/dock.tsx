import { useNowPlaying } from "#/components/notch-player";
import { useBrowser } from "#/lib/browser-store";
import { toggleNotch } from "#/lib/notch-store";
import { useGo } from "#/lib/page-transition";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

// a tiny frosted macOS dock pinned to the bottom edge. a dot marks what's "running"
export function Dock() {
  const track = useNowPlaying();
  const go = useGo("dock");
  const { expanded } = useBrowser();

  return (
    <nav
      aria-label="Dock"
      // slides away while the browser fills the screen, like a full-screen mac app
      inert={expanded}
      className={`fixed bottom-1.5 left-1/2 z-40 -translate-x-1/2 transition-[translate,opacity] duration-300 ease-out motion-reduce:transition-none! max-md:hidden ${
        expanded ? "translate-y-[150%] opacity-0" : ""
      }`}
    >
      <div
        // even padding all round, plus a little extra at the bottom for the running
        // dots. the radius is the icons' corner plus the padding, so the curves nest
        className="flex items-center gap-1.5 rounded-xl border border-white/40 bg-white/25 p-1.5 pb-2.5 shadow-[0_8px_30px_rgb(0_0_0/0.12),inset_0_1px_0_rgb(255_255_255/0.5)] ring-1 ring-black/5 backdrop-blur-xl backdrop-saturate-150"
      >
        {/* the portfolio lives in the browser, so it's always running */}
        <Item label="Zen" running>
          <Link to="/" onClick={go("/")} aria-label="Zen" className={tile}>
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
      </div>
    </nav>
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
