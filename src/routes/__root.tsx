import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { Boot } from "#/components/boot";
import { Browser } from "#/components/browser";
import { Desktop } from "#/components/desktop";
import { Dock } from "#/components/dock";
import { MailApp } from "#/components/mail/mail-app";
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
  return (
    <>
      <Boot />
      <Notch />
      <Dock />
      <MailApp />
      <Desktop>
        <Browser>
          {/* data-page: what page-transition.ts snapshots when leaving */}
          <div data-page className="mx-auto w-md pt-20 md:py-12">
            <Outlet />
          </div>
        </Browser>
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
