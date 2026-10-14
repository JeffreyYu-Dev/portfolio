import { ComposeWindow } from "#/components/yail/compose-window";
import { Rail } from "#/components/yail/rail";
import { SentToast } from "#/components/yail/sent-toast";
import { TopBar } from "#/components/yail/top-bar";
import { useBrowser } from "#/lib/browser-store";
import { usePageEnter } from "#/lib/page-transition";
import { closeCompose, openDraft } from "#/lib/yail-compose";
import {
  createFileRoute,
  Outlet,
  useRouter,
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

  const router = useRouter();
  // /contact (and any ?compose link) arrives with compose open
  const wantsCompose = useRouterState({
    select: (s) => "compose" in (s.location.search as object),
  });
  useEffect(() => {
    if (!wantsCompose) return;
    openDraft();
    router.navigate({ href: pathname, replace: true });
  }, [wantsCompose, pathname, router]);

  return (
    <div
      // full screen puts the notch over the top bar, so it steps down with it
      className={`relative flex min-h-dvh flex-col bg-[#f6f8fc] text-xs text-[#1f1f1f] md:h-full md:min-h-0 md:transition-[padding] md:duration-[400ms] md:ease-out md:motion-reduce:transition-none! ${
        expanded ? "md:pt-9" : ""
      }`}
    >
      <TopBar onMenu={() => setDrawer((d) => !d)} />
      <div className="flex min-h-0 flex-1">
        <Rail open={drawer} onClose={() => setDrawer(false)} />
        <main className="min-w-0 flex-1 bg-white md:mr-3 md:mb-3 md:overflow-y-auto md:rounded-2xl">
          <Outlet />
        </main>
      </div>
      <ComposeWindow />
      <SentToast />
    </div>
  );
}
