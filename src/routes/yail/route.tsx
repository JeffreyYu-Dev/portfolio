import { Rail } from "#/components/yail/rail";
import { TopBar } from "#/components/yail/top-bar";
import { useBrowser } from "#/lib/browser-store";
import { usePageEnter } from "#/lib/page-transition";
import { closeCompose } from "#/lib/yail-compose";
import {
  createFileRoute,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/yail")({ component: Yail });

// yail.com: gmail, recreated. the shell stays put while the pages inside change
function Yail() {
  usePageEnter();
  const { expanded } = useBrowser();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [drawer, setDrawer] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: close the drawer whenever the page changes
  useEffect(() => setDrawer(false), [pathname]);
  // compose belongs to yail, leaving the site closes it (the draft is kept)
  useEffect(() => () => closeCompose(), []);

  return (
    <div
      // full screen puts the notch over the top bar, so it steps down with it
      className={`relative flex min-h-dvh flex-col bg-[#f6f8fc] text-sm text-[#1f1f1f] md:h-full md:min-h-0 md:transition-[padding] md:duration-[400ms] md:ease-out md:motion-reduce:transition-none! ${
        expanded ? "md:pt-9" : ""
      }`}
    >
      <TopBar onMenu={() => setDrawer((d) => !d)} />
      <div className="flex min-h-0 flex-1">
        <Rail open={drawer} onClose={() => setDrawer(false)} />
        <main className="min-w-0 flex-1 bg-white md:mr-4 md:mb-4 md:overflow-y-auto md:rounded-2xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
