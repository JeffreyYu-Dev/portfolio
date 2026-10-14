import { AppWindow, TrafficLights } from "#/components/app-window";
import { useOpenInBrowser } from "#/components/browser";
import { DocGlyph, FileIcon, onIcon } from "#/components/file-icon";
import { WorkLogo } from "#/components/work-logo";
import { projects } from "#/data/projects";
import { work } from "#/data/work";
import { openWindow, type Rect } from "#/lib/window-store";
import { type ReactNode, useState } from "react";

export type Folder = "projects" | "work";

const titles: Record<Folder, string> = { projects: "Projects", work: "Work" };

type Item = { key: string; name: string; path: string; icon: ReactNode };

function itemsIn(folder: Folder): Item[] {
  if (folder === "projects")
    return projects.map((p) => ({
      key: p.id,
      name: p.name,
      path: `/projects/${p.id}`,
      icon: <DocGlyph />,
    }));
  return work.map((w) => ({
    key: w.id,
    name: w.company,
    path: `/work/${w.id}`,
    icon: <WorkLogo entry={w} size="lg" />,
  }));
}

const finderId = (folder: Folder) => `finder-${folder}`;

// each folder gets its own window, a little down and right of the last, beside
// the desktop icons
const startAt: Record<Folder, Rect> = {
  projects: { x: 120, y: 80, w: 560, h: 340 },
  work: { x: 150, y: 110, w: 560, h: 340 },
};

export function openFolder(folder: Folder) {
  openWindow(finderId(folder), startAt[folder]);
}

// a plain finder window showing a folder's contents as icons. opening one shows
// its page in the browser
export function Finder({ folder }: { folder: Folder }) {
  const open = useOpenInBrowser();
  const [selected, setSelected] = useState<string | null>(null);
  const items = itemsIn(folder);

  return (
    <AppWindow
      id={finderId(folder)}
      label={titles[folder]}
      className="bg-white max-md:hidden"
    >
      <div
        data-window-drag
        className="flex h-12 shrink-0 items-center gap-5 border-b border-black/10 bg-neutral-100 px-4"
      >
        <TrafficLights />
        <h2 className="text-sm font-semibold text-neutral-700">
          {titles[folder]}
        </h2>
      </div>
      {/* pressing the empty space clears the selection, like finder */}
      <div
        onPointerDown={(e) => !onIcon(e.target) && setSelected(null)}
        className="grid min-h-0 flex-1 grid-cols-[repeat(auto-fill,5rem)] content-start gap-x-3 gap-y-4 overflow-auto p-4"
      >
        {items.map((item) => (
          <FileIcon
            key={item.key}
            label={item.name}
            selected={selected === item.key}
            onSelect={() => setSelected(item.key)}
            onOpen={() => open(item.path)}
          >
            {item.icon}
          </FileIcon>
        ))}
      </div>
      <p className="shrink-0 border-t border-black/10 bg-neutral-50 py-1 text-center text-[11px] text-neutral-500">
        {items.length} {items.length === 1 ? "item" : "items"}
      </p>
    </AppWindow>
  );
}
