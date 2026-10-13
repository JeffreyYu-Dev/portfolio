import { getTrack, type Track } from "#/lib/spotify";
import { useEffect, useState, useSyncExternalStore } from "react";

// one spotify poller shared by everything showing the track (the notch, the home page).
// it runs while anything is subscribed, and ticks progress between polls so the bar moves smoothly
let current: Track | null = null;
const subscribers = new Set<() => void>();
let stopPolling: (() => void) | null = null;

function emit(track: Track | null) {
  current = track;
  for (const subscriber of subscribers) subscriber();
}

function startPolling() {
  const load = () => getTrack().then(emit, () => {});
  load();
  const poll = setInterval(load, 30_000);
  const tick = setInterval(() => {
    if (current?.playing && current.progressMs !== undefined) {
      emit({
        ...current,
        progressMs: Math.min(current.progressMs + 1000, current.durationMs),
      });
    }
  }, 1000);
  return () => {
    clearInterval(poll);
    clearInterval(tick);
  };
}

function subscribe(subscriber: () => void) {
  subscribers.add(subscriber);
  if (subscribers.size === 1) stopPolling = startPolling();
  return () => {
    subscribers.delete(subscriber);
    if (subscribers.size === 0) {
      stopPolling?.();
      stopPolling = null;
    }
  };
}

export function useNowPlaying() {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
}

// a colour pulled from the album cover, like boring notch tints the artist and timeline.
// null until the cover loads, or if there's no cover. remembered per cover, so the
// notch and home page share one read
const accents = new Map<string, string | null>();

export function useAccent(src: string | undefined) {
  const [accent, setAccent] = useState<string | null>(null);

  useEffect(() => {
    if (!src) {
      setAccent(null);
      return;
    }
    const known = accents.get(src);
    if (known !== undefined) {
      setAccent(known);
      return;
    }
    let live = true;
    const img = new Image();
    // spotify's image cdn allows this, so the canvas can read the pixels back
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const read = accentFrom(img);
      accents.set(src, read);
      if (live) setAccent(read);
    };
    img.src = src;
    return () => {
      live = false;
    };
  }, [src]);

  return accent;
}

function accentFrom(img: HTMLImageElement) {
  const size = 24;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, size, size);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, size, size).data;
  } catch {
    // the image host didn't allow reading pixels
    return null;
  }

  // weight each pixel by how colourful and bright it is, so a splash of colour
  // wins over a big grey or black background
  let r = 0;
  let g = 0;
  let b = 0;
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    const max = Math.max(data[i], data[i + 1], data[i + 2]);
    const min = Math.min(data[i], data[i + 1], data[i + 2]);
    const saturation = max ? (max - min) / max : 0;
    const weight = saturation ** 2 * (max / 255) + 0.001;
    r += data[i] * weight;
    g += data[i + 1] * weight;
    b += data[i + 2] * weight;
    total += weight;
  }

  const [h, s, l] = toHsl(r / total, g / total, b / total);
  // light enough to read on the black notch, never neon
  return `hsl(${Math.round(h)} ${Math.round(Math.min(s, 0.7) * 100)}% ${Math.round(Math.min(Math.max(l, 0.65), 0.8) * 100)}%)`;
}

function toHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r
      ? ((g - b) / d + (g < b ? 6 : 0)) * 60
      : max === g
        ? ((b - r) / d + 2) * 60
        : ((r - g) / d + 4) * 60;
  return [h, s, l];
}

// what you're listening to, read-only. tinted by --accent, set on the notch

export function Player({ track }: { track: Track | null }) {
  if (!track) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-white/40">
        Nothing playing
      </div>
    );
  }

  const progress = track.progressMs ?? 0;
  const ratio = track.durationMs ? Math.min(progress / track.durationMs, 1) : 0;

  return (
    <div className="flex h-full gap-5">
      {/* the cover itself is <Cover>, which grows here from the closed pill */}
      <span className="size-32 shrink-0" />

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold">{track.title}</span>
        <span className="truncate text-sm text-(--accent) transition-colors duration-700">
          {track.artist}
        </span>
        <span className="truncate text-xs text-white/35">{track.album}</span>

        <div className="mt-auto">
          <div className="h-1.5 rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-(--accent) transition-colors duration-700"
              style={{ width: `${ratio * 100}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-(--accent)/60 tabular-nums transition-colors duration-700">
            <span>{clock(progress)}</span>
            <span>{clock(track.durationMs)}</span>
          </div>
        </div>

        <span className="mt-2 text-center text-[11px] text-white/35">
          {track.playing ? "What I'm listening to" : "What I last listened to"}
        </span>
      </div>
    </div>
  );
}

// the album cover, shared by the closed pill and the open player so it can
// grow from one spot into the other as the notch opens. positioned by the notch
export function Cover({
  track,
  open,
  className,
}: {
  track: Track;
  open: boolean;
  className: string;
}) {
  return (
    <a
      href={track.url}
      target="_blank"
      rel="noreferrer"
      aria-label="Open in Spotify"
      tabIndex={open ? 0 : -1}
      className={className}
    >
      <span className="relative block size-full rounded-[inherit]">
        {track.art ? (
          <img
            src={track.art}
            alt={`${track.album} cover`}
            className="size-full rounded-[inherit] object-cover"
          />
        ) : (
          <span className="block size-full rounded-[inherit] bg-white/10" />
        )}
        <span
          className={`absolute -right-1.5 -bottom-1.5 rounded-lg bg-black p-1 transition-opacity duration-200 ${open ? "opacity-100 delay-300" : "opacity-0"}`}
        >
          <SpotifyLogo />
        </span>
      </span>
    </a>
  );
}

// m:ss
function clock(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function SpotifyLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#1ED760" />
      <g fill="none" stroke="black" strokeLinecap="round">
        <path d="M6.2 9.2c3.8-1.1 8.4-.8 11.6 1.1" strokeWidth="1.9" />
        <path d="M6.8 12.5c3.2-.9 6.9-.6 9.6 1" strokeWidth="1.6" />
        <path d="M7.4 15.6c2.6-.7 5.3-.5 7.4.7" strokeWidth="1.3" />
      </g>
    </svg>
  );
}

// the little equalizer boring notch shows while music plays, tinted by --accent
export function Bars() {
  return (
    <span className="flex h-3 items-end gap-0.5">
      {[0, 0.2, 0.4].map((delay) => (
        <span
          key={delay}
          className="notch-bar w-0.5 rounded-full bg-(--accent) transition-colors duration-700"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </span>
  );
}
