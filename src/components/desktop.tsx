import { DesktopIcons } from "#/components/desktop-icons";
import { useBrowserFullScreen } from "#/lib/dock-store";
import type { ReactNode } from "react";

// the wallpaper everything sits on, with its icons and the windows over it. the gradient shows
// until public/wallpaper.jpg exists. on phones and small tablets it steps aside
// and the browser's page is the whole site. when the browser fills the screen,
// the notch-high strip of wallpaper above it dims
export function Desktop({ children }: { children: ReactNode }) {
  const zoomed = useBrowserFullScreen();

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-[image:url(/wallpaper.jpg),linear-gradient(135deg,#c7d2fe,#fbcfe8)] bg-cover bg-center max-md:hidden"
      />
      {/* full screen: the wallpaper beside the notch dims, so the page reads as in front */}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-x-0 top-0 h-9 bg-black/50 transition-opacity duration-[400ms] ease-out motion-reduce:transition-none! max-md:hidden ${
          zoomed ? "opacity-100" : "opacity-0"
        }`}
      />
      <DesktopIcons />
      {children}
    </>
  );
}
