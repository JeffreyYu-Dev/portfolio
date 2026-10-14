import type { KeyboardEvent, ReactNode } from "react";

// an icon you can select and open, like on the mac desktop and in finder. a click
// selects it, a double-click or enter opens it
export function FileIcon({
  label,
  selected,
  onSelect,
  onOpen,
  // on the wallpaper the label needs a shadow to stay readable
  onWallpaper = false,
  children,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onWallpaper?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onDoubleClick={onOpen}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        onOpen();
      }}
      aria-pressed={selected}
      data-file-icon
      className="flex w-20 flex-col items-center gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#0a5fd8]/60"
    >
      <span
        className={`grid size-14 place-items-center rounded-md ${
          selected ? "bg-black/20" : ""
        }`}
      >
        {children}
      </span>
      <span
        className={`max-w-full rounded px-1 text-center text-[11px] leading-tight break-words ${
          selected
            ? "bg-[#0a5fd8] text-white"
            : onWallpaper
              ? "text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.6)]"
              : "text-neutral-800"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

// the blue mac folder, its tab behind and the front a lighter blue
export function FolderGlyph() {
  return (
    <svg viewBox="0 0 64 50" aria-hidden="true" className="w-12">
      <path
        d="M4 8a4 4 0 0 1 4-4h14l5 5h29a4 4 0 0 1 4 4v31a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"
        fill="#3e9fe8"
      />
      <path
        d="M4 16a4 4 0 0 1 4-4h48a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"
        fill="#6cc0f8"
      />
      <path
        d="M4 17a4 4 0 0 1 4-4h48a4 4 0 0 1 4 4"
        stroke="#a6dbff"
        fill="none"
      />
    </svg>
  );
}

// a page with its corner folded, with whatever goes on it, e.g. a pdf badge
export function DocGlyph({ children }: { children?: ReactNode }) {
  return (
    <span className="relative grid h-14 w-11 place-items-center">
      <svg viewBox="0 0 44 56" aria-hidden="true" className="absolute inset-0">
        <path
          d="M2 4a3 3 0 0 1 3-3h24l13 13v37a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3z"
          fill="white"
          stroke="rgb(0 0 0 / 0.15)"
        />
        <path
          d="M29 1v10a3 3 0 0 0 3 3h10"
          fill="#e5e5e5"
          stroke="rgb(0 0 0 / 0.15)"
        />
      </svg>
      <span className="relative mt-2">{children}</span>
    </span>
  );
}

// for clearing the selection on a press anywhere that isn't an icon
export function onIcon(target: EventTarget) {
  return target instanceof Element && !!target.closest("[data-file-icon]");
}
