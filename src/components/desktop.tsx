import type { ReactNode } from "react";

// the wallpaper everything sits on, clear of the notch at the top and the dock at
// the bottom. the gradient shows until public/wallpaper.jpg exists. on phones and
// small tablets it steps aside and the browser's page is the whole site
export function Desktop({ children }: { children: ReactNode }) {
  return (
    <div className="md:fixed md:inset-0 md:bg-[image:url(/wallpaper.jpg),linear-gradient(135deg,#c7d2fe,#fbcfe8)] md:bg-cover md:bg-center md:px-10 md:pt-12 md:pb-16">
      <div className="mx-auto h-full max-w-6xl">{children}</div>
    </div>
  );
}
