import { Bars, useAccent, useNowPlaying } from "#/components/notch-player";
import { routine, status } from "#/data/status";
import { toggleNotch } from "#/lib/notch-store";
import { type CSSProperties, useEffect, useState } from "react";

// the green dot and what you're open to. hovering shows a card with the details
export function Availability() {
  return (
    <p className="group relative flex w-fit items-center gap-1.5 text-xs text-gray-500">
      <button
        type="button"
        aria-label="What I'm looking for"
        aria-describedby="looking-for"
        className="relative flex size-3 items-center justify-center"
      >
        <span className="absolute size-1.5 rounded-full bg-green-500 motion-safe:animate-ping" />
        <span className="relative size-1.5 rounded-full bg-green-500" />
      </button>
      <span>{status.availability}</span>

      <span
        id="looking-for"
        role="tooltip"
        className="pointer-events-none absolute top-full left-0 z-10 mt-2 w-60 translate-y-1 rounded-xl border border-gray-200 bg-white p-3 opacity-0 shadow-lg transition duration-200 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
      >
        <span className="mb-2 block text-[10px] tracking-wide text-gray-400 uppercase">
          Looking for
        </span>
        {status.lookingFor.map((row) => (
          <span key={row.label} className="flex justify-between gap-4 py-0.5">
            <span className="text-gray-400">{row.label}</span>
            <span className="text-right text-gray-900">{row.value}</span>
          </span>
        ))}
      </span>
    </p>
  );
}

// your local time with a blinking colon, and what you're probably doing at that hour
export function LocalTime() {
  const time = useClock(status.timeZone);

  // empty until mounted so the server and client render the same thing
  if (!time) return <p className="text-xs">&nbsp;</p>;

  const doing = routine.find(
    (r) =>
      time.hour24 >= r.from &&
      time.hour24 < r.to &&
      (!r.weekdays || time.weekday),
  )?.text;

  return (
    <p className="text-xs text-gray-500 tabular-nums">
      {time.hour}
      <span className="status-colon">:</span>
      {time.minute} {time.period} in {status.location}
      {doing && <span className="text-gray-400"> — {doing}</span>}
    </p>
  );
}

// what's playing, tinted by the cover. clicking it opens the notch's player
export function Listening() {
  const track = useNowPlaying();
  const accent = useAccent(track?.art);

  if (!track?.playing) return null;

  return (
    <button
      type="button"
      onClick={() => toggleNotch()}
      // the accent is picked to read on the black notch, so it's darkened for the white page
      style={
        {
          "--accent": accent
            ? `color-mix(in oklab, ${accent}, black 35%)`
            : "rgb(107 114 128)",
        } as CSSProperties
      }
      className="flex max-w-full items-center gap-1.5 text-xs text-(--accent) transition-colors duration-700 hover:underline"
    >
      <Bars />
      <span className="truncate">
        Listening to {track.title} · {track.artist}
      </span>
    </button>
  );
}

function useClock(timeZone: string) {
  const [time, setTime] = useState<{
    hour: string;
    minute: string;
    period: string;
    hour24: number;
    weekday: boolean;
  } | null>(null);

  useEffect(() => {
    const format = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
      weekday: "short",
    });
    const format24 = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      hourCycle: "h23",
    });
    const tick = () => {
      const now = new Date();
      const parts = format.formatToParts(now);
      const part = (type: string) =>
        parts.find((p) => p.type === type)?.value ?? "";
      setTime({
        hour: part("hour"),
        minute: part("minute"),
        period: part("dayPeriod"),
        hour24: Number(format24.format(now)),
        weekday: !["Sat", "Sun"].includes(part("weekday")),
      });
    };
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, [timeZone]);

  return time;
}
