import { GitHub, Spotify } from "#/components/brand-icons";
import { useNowPlaying } from "#/components/notch-player";
import { socials } from "#/data/socials";
import { toggleNotch } from "#/lib/notch-store";
import { useGo } from "#/lib/page-transition";
import { Link, useLocation } from "@tanstack/react-router";
import { FileUser, House, Mail, NotebookPen, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";

// a tiny frosted macOS dock pinned to the bottom edge. a dot marks what's "running"
export function Dock() {
  const track = useNowPlaying();
  const { pathname } = useLocation();
  const [copied, setCopied] = useState(false);
  const go = useGo("dock");

  const copy = async () => {
    await navigator.clipboard.writeText(socials.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <nav
      aria-label="Dock"
      className="fixed bottom-1.5 left-1/2 z-40 -translate-x-1/2 max-md:hidden"
    >
      <div
        className="flex items-center gap-1 rounded-2xl border border-white/40 bg-white/25 p-1 pb-2 shadow-[0_8px_30px_rgb(0_0_0/0.12),inset_0_1px_0_rgb(255_255_255/0.5)] ring-1 ring-black/5 backdrop-blur-xl backdrop-saturate-150"
      >
        <Item label="Home" running={pathname === "/"}>
          <Link
            to="/"
            onClick={go("/")}
            aria-label="Home"
            className={tile("from-sky-300 to-blue-600")}
          >
            <House />
          </Link>
        </Item>

        <Item label="About Me" running={pathname === "/about"}>
          <Link
            to="/about"
            onClick={go("/about")}
            aria-label="About Me"
            className={tile("from-amber-200 to-amber-400 text-amber-900")}
          >
            <NotebookPen />
          </Link>
        </Item>

        <Item label="GitHub" running>
          <a
            href={socials.github}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className={tile("from-neutral-700 to-neutral-950")}
          >
            <GitHub />
          </a>
        </Item>

        <Item label="LinkedIn">
          <a
            href={socials.linkedin}
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className={tile("from-sky-500 to-sky-800")}
          >
            <LinkedInMark />
          </a>
        </Item>

        <Item label={copied ? "Copied!" : "Copy email"} badge={1}>
          <button
            type="button"
            onClick={copy}
            aria-label="Copy email"
            className={tile("from-sky-400 to-indigo-600")}
          >
            <Mail />
          </button>
        </Item>

        <Item label="Résumé">
          <a
            href={socials.resume}
            target="_blank"
            rel="noreferrer"
            aria-label="Résumé"
            className={tile("from-rose-300 to-red-600")}
          >
            <FileUser />
          </a>
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
            className={tile("from-neutral-800 to-black text-[#1ed760]")}
          >
            <Spotify />
          </button>
        </Item>

        <hr className="mx-0.5 h-6 border-0 border-l border-black/15" />

        <Item label="Trash">
          <button
            type="button"
            aria-label="Trash"
            // not a tile(): its text-white and ring would win over these
            className="grid size-full place-items-center text-neutral-500 active:brightness-75 [&>svg]:size-[70%]"
          >
            <Trash2 />
          </button>
        </Item>
      </div>
    </nav>
  );
}

// the squircle app icon
const tile = (gradient: string) =>
  `grid size-full place-items-center rounded-[22%] bg-gradient-to-b text-white shadow-sm ring-1 ring-black/10 ring-inset active:brightness-75 [&>svg]:size-[55%] ${gradient}`;

function Item({
  label,
  running,
  badge,
  children,
}: {
  label: string;
  running?: boolean;
  badge?: number;
  children: ReactNode;
}) {
  return (
    <div
      className="group relative size-7"
    >
      {children}
      {badge ? (
        <span className="pointer-events-none absolute -top-1 -right-1 grid size-3.5 place-items-center rounded-full bg-red-500 text-[8px] font-semibold text-white shadow-sm">
          {badge}
        </span>
      ) : null}
      {running && (
        <span className="pointer-events-none absolute left-1/2 -bottom-1.5 size-[3px] -translate-x-1/2 rounded-full bg-neutral-600/70" />
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

// lucide dropped brand logos. this one's the bare "in", to sit on a blue tile
function LinkedInMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}

