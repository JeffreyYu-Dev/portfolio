import { type Activity, onActivity } from "#/lib/live-activity";
import { closeNotch, useNotch } from "#/lib/notch-store";
import {
  Cover,
  Bars,
  Player,
  useAccent,
  useNowPlaying,
} from "#/components/notch-player";
import { type CSSProperties, useEffect, useRef, useState } from "react";

// the black shell plus the two curved "ears" where it meets the top edge.
// data-state widens it a little for a live activity, or fully when open
const styles =
  "fixed top-0 left-1/2 z-50 -translate-x-1/2 bg-black text-white w-3xs h-9 rounded-b-xl overflow-visible transition-[width,height,border-radius] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] data-[state=activity]:w-80 data-[state=open]:w-[38rem] data-[state=open]:h-42 data-[state=open]:rounded-b-3xl before:absolute before:top-0 before:-left-3 before:size-3 before:content-[''] before:bg-[radial-gradient(circle_at_0_100%,transparent_12px,black_12.5px)] after:absolute after:top-0 after:-right-3 after:size-3 after:content-[''] after:bg-[radial-gradient(circle_at_100%_100%,transparent_12px,black_12.5px)]";

// open spot matches the open panel's p-5. timing lives in .notch-cover
const coverStyles = "notch-cover absolute block";

export function Notch() {
  // pinned comes from notch-store.ts so buttons anywhere on the site can open it
  const { pinned } = useNotch();
  const [hovered, setHovered] = useState(false);
  // touch has no hover, so a tap opens it until a tap lands somewhere else
  const [tapped, setTapped] = useState(false);
  const open = pinned || hovered || tapped;
  const track = useNowPlaying();
  // tints the artist, timeline and equalizer. plain white until a cover's been read
  const accent = useAccent(track?.art) ?? "rgb(255 255 255 / 0.7)";
  const activity = useActivity();
  const ref = useRef<HTMLDivElement>(null);
  // opening it yourself wins over a passing activity
  const state = open ? "open" : activity ? "activity" : "closed";
  // the cover peeks from the closed pill while music plays, and is the big art when open
  const coverVisible = open || (state === "closed" && !!track?.playing);

  // a press anywhere else lets go of a tapped or pinned notch. buttons that toggle
  // it are left alone, or the press would close it and their click reopen it
  useEffect(() => {
    if (!tapped && !pinned) return;
    const close = (e: PointerEvent) => {
      const target = e.target as Element;
      if (
        ref.current?.contains(target) ||
        target.closest("[data-notch-toggle]")
      )
        return;
      setTapped(false);
      closeNotch();
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [tapped, pinned]);

  // escape lets go of a pinned notch
  useEffect(() => {
    if (!pinned) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeNotch();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pinned]);

  return (
    <div
      ref={ref}
      // the boot screen collapses onto this
      data-notch
      className={styles}
      style={{ "--accent": accent } as CSSProperties}
      data-state={state}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
      onPointerUp={(e) => e.pointerType !== "mouse" && setTapped(true)}
    >
      {/* closed: a peek at what's playing */}
      <div
        className={`absolute inset-0 flex items-center justify-end px-3 transition-opacity duration-200 ${state === "closed" ? "opacity-100 delay-200" : "opacity-0"}`}
      >
        {track?.playing && <Bars />}
      </div>

      {/* activity: what the page transition is opening */}
      <div
        aria-live="polite"
        className={`absolute inset-0 flex items-center justify-between gap-4 px-3 transition-opacity duration-200 ${state === "activity" ? "opacity-100 delay-150" : "opacity-0"}`}
      >
        {activity && (
          <>
            <span className="flex shrink-0">
              {activity.icon ?? (
                <span className="size-2 animate-pulse rounded-full bg-white" />
              )}
            </span>
            <span className="flex min-w-0 items-baseline gap-1.5 text-xs">
              <span className="text-white/40">Opening</span>
              <span className="truncate">{activity.title}</span>
            </span>
          </>
        )}
      </div>

      {/* open: the player. a soft light from the top left, like boring notch */}
      <div
        className={`absolute inset-0 rounded-b-3xl bg-[radial-gradient(ellipse_at_top_left,rgb(255_255_255/0.07),transparent_60%)] p-5 transition-opacity duration-200 ${open ? "opacity-100 delay-200" : "pointer-events-none opacity-0"}`}
      >
        <Player track={track} />
      </div>

      {/* after the panels so it sits on top of them */}
      {track && (
        <Cover
          track={track}
          open={open}
          className={`${coverStyles} ${open ? "top-5 left-5 size-32 rounded-2xl" : "top-2.5 left-3 size-5 rounded"} ${coverVisible ? "opacity-100" : "pointer-events-none opacity-0"}`}
        />
      )}
    </div>
  );
}

// the latest announced activity, cleared once the page transition has played out.
// a new one restarts the clock
function useActivity() {
  const [activity, setActivity] = useState<Activity | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const off = onActivity((next) => {
      setActivity(next);
      clearTimeout(timer);
      timer = setTimeout(() => setActivity(null), 1600);
    });
    return () => {
      off();
      clearTimeout(timer);
    };
  }, []);

  return activity;
}
