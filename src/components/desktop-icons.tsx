import { useOpenInBrowser } from "#/components/browser";
import {
  DocGlyph,
  FileIcon,
  FolderGlyph,
  onIcon,
} from "#/components/file-icon";
import { openFolder } from "#/components/finder";
import { socials } from "#/data/socials";
import { UserRound } from "lucide-react";
import { type ReactNode, useState } from "react";

type Icon = { label: string; glyph: ReactNode; open: () => void };

// the icons down the left of the wallpaper, behind the windows. the folders open
// in finder, the rest in the browser
export function DesktopIcons() {
  const openPage = useOpenInBrowser();
  const [selected, setSelected] = useState<string | null>(null);

  const icons: Icon[] = [
    {
      label: "Projects",
      glyph: <FolderGlyph />,
      open: () => openFolder("projects"),
    },
    { label: "Work", glyph: <FolderGlyph />, open: () => openFolder("work") },
    {
      label: "About Me",
      glyph: (
        <DocGlyph>
          <UserRound className="size-5 text-neutral-500" />
        </DocGlyph>
      ),
      open: () => openPage("/about"),
    },
    {
      label: "Résumé.pdf",
      glyph: (
        <DocGlyph>
          <span className="rounded-sm bg-[#e5372c] px-1 text-[8px] font-bold text-white">
            PDF
          </span>
        </DocGlyph>
      ),
      // a real tab until there's a preview window for it
      open: () => window.open(socials.resume, "_blank", "noopener"),
    },
  ];

  return (
    // covers the wallpaper, so pressing anywhere empty clears the selection
    <div
      onPointerDown={(e) => !onIcon(e.target) && setSelected(null)}
      className="fixed inset-0 max-md:hidden"
    >
      <ul className="absolute top-12 left-4 flex flex-col gap-3">
        {icons.map((icon) => (
          <li key={icon.label}>
            <FileIcon
              label={icon.label}
              selected={selected === icon.label}
              onSelect={() => setSelected(icon.label)}
              onOpen={icon.open}
              onWallpaper
            >
              {icon.glyph}
            </FileIcon>
          </li>
        ))}
      </ul>
    </div>
  );
}
