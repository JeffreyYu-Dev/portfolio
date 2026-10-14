import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";
import { WindowLayer } from "#/components/app-window";
import { Boot } from "#/components/boot";
import { Browser } from "#/components/browser";
import { Desktop } from "#/components/desktop";
import { Dock } from "#/components/dock";
import { Finder } from "#/components/finder";
import { Notch } from "#/components/notch";
import { bootScript } from "#/lib/boot";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
});

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      <Boot />
      <Notch />
      <Dock />
      <Desktop>
        <WindowLayer>
          <Browser>
            {/* data-page: what page-transition.ts snapshots when leaving. yail is a
                whole web app, so it gets the full card instead of the page column */}
            <div
              data-page
              className={
                pathname === "/yail" || pathname.startsWith("/yail/")
                  ? "min-h-dvh md:h-full md:min-h-0"
                  : "mx-auto w-md pt-20 md:py-12"
              }
            >
              <Outlet />
            </div>
          </Browser>
          <Finder folder="projects" />
          <Finder folder="work" />
        </WindowLayer>
      </Desktop>
    </>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    // the boot script below adds data-booted before hydration
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static string, runs before first paint */}
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
