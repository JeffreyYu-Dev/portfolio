import { useBrowser } from "#/lib/browser-store";
import type { ReactNode } from "react";

// the wallpaper everything sits on, clear of the notch at the top and the dock at
// the bottom. the gradient shows until public/wallpaper.jpg exists. on phones and
// small tablets it steps aside and the browser's page is the whole site. when the
// browser expands, the margins animate away so it fills the screen
export function Desktop({ children }: { children: ReactNode }) {
  const { expanded } = useBrowser();

  return (
    <div
      className={`md:fixed md:inset-0 md:bg-[image:url(/wallpaper.jpg),linear-gradient(135deg,#c7d2fe,#fbcfe8)] md:bg-cover md:bg-center md:transition-[padding] md:duration-[400ms] md:ease-out md:motion-reduce:transition-none! ${
        expanded ? "md:p-0" : "md:px-10 md:pt-12 md:pb-16"
      }`}
    >
      <div
        className={`mx-auto h-full transition-[max-width] duration-[400ms] ease-out motion-reduce:transition-none! ${
          expanded ? "max-w-full" : "max-w-6xl"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
