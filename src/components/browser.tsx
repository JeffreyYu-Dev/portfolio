import { GitHub, LinkedIn } from "#/components/brand-icons";
import { socials } from "#/data/socials";
import {
  displayAddress,
  parseAddress,
  samePath,
} from "#/lib/browser-address";
import {
  activeTab,
  closeTab,
  initialTabs,
  navigate,
  openTab,
  selectTab,
  titleFor,
} from "#/lib/browser-tabs";
import { useGo } from "#/lib/page-transition";
import {
  useCanGoBack,
  useHydrated,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  FileUser,
  Mail,
  Plus,
  RotateCw,
  X,
} from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";

// the portfolio's window, styled after zen browser: a tinted frame with tabs down
// a left sidebar and the page in a rounded card. on phones and small tablets the
// frame and sidebar drop away and the card is the whole page
export function Browser({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="h-full gap-2 md:flex md:rounded-xl md:border md:border-white/30 md:bg-gradient-to-br md:from-rose-200/60 md:via-violet-200/60 md:to-sky-200/60 md:p-2 md:shadow-2xl md:ring-1 md:ring-black/10 md:backdrop-blur-2xl">
      <Sidebar pathname={pathname} />
      {/* relative + isolate: page-transition.ts parks its exit copy in here at z -1,
          outside the scroller so it doesn't scroll with the content */}
      <div
        data-ghost-host
        className="relative isolate flex-1 bg-white md:overflow-hidden md:rounded-lg md:shadow-sm md:ring-1 md:ring-black/5"
      >
        <div
          data-browser-content
          data-scroll-restoration-id="browser-content"
          className="md:h-full md:overflow-y-auto"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function Sidebar({ pathname }: { pathname: string }) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  // the server can't see the history, so back starts disabled until hydrated,
  // or the server's disabled attribute would stick
  const hydrated = useHydrated();

  return (
    <nav
      aria-label="Browser"
      className="flex w-52 shrink-0 flex-col gap-3 max-md:hidden"
    >
      <div className="flex items-center justify-between px-1 pt-1">
        <TrafficLights />
        <div className="flex items-center text-neutral-600">
          <NavButton
            label="Back"
            disabled={!hydrated || !canGoBack}
            onClick={() => router.history.back()}
          >
            <ArrowLeft />
          </NavButton>
          <NavButton label="Forward" onClick={() => router.history.forward()}>
            <ArrowRight />
          </NavButton>
          <NavButton label="Reload" onClick={() => router.invalidate()}>
            <RotateCw />
          </NavButton>
        </div>
      </div>

      <AddressBar pathname={pathname} />
      <Essentials />

      <TabList pathname={pathname} />
    </nav>
  );
}

// lives in the sidebar, which stays mounted across navigations, so the tabs last
// for the visit. whatever the router shows is the active tab's page
function TabList({ pathname }: { pathname: string }) {
  const router = useRouter();
  const go = useGo("browser");
  const [state, setState] = useState(() => initialTabs(pathname));

  // links, the dock, the address bar and back/forward all move the active tab
  useEffect(() => setState((s) => navigate(s, pathname)), [pathname]);

  // shows the active tab's page after opening, switching or closing
  const show = (path: string) => {
    if (!samePath(path, pathname)) router.navigate({ href: path });
  };

  const close = (id: number) => {
    const next = closeTab(state, id);
    setState(next);
    show(activeTab(next).path);
  };

  const open = () => {
    setState((s) => openTab(s, "/"));
    show("/");
  };

  return (
    <ul className="flex flex-col gap-0.5">
      {state.tabs.map((tab) => (
        <li key={tab.id} className="group relative">
          <a
            href={tab.path}
            onClick={(e) => {
              setState((s) => selectTab(s, tab.id));
              go(tab.path)(e);
            }}
            aria-current={tab.id === state.active ? "page" : undefined}
            className="block truncate rounded-md py-1.5 pr-7 pl-2 text-xs text-neutral-700 hover:bg-white/40 aria-[current=page]:bg-white/70 aria-[current=page]:text-neutral-900 aria-[current=page]:shadow-sm"
          >
            {titleFor(tab.path)}
          </a>
          {state.tabs.length > 1 && (
            <button
              type="button"
              aria-label={`Close ${titleFor(tab.path)}`}
              onClick={() => close(tab.id)}
              className="absolute top-1/2 right-1 grid size-5 -translate-y-1/2 place-items-center rounded text-neutral-500 opacity-0 group-hover:opacity-100 hover:bg-black/5 focus-visible:opacity-100 [&>svg]:size-3"
            >
              <X />
            </button>
          )}
        </li>
      ))}
      <li>
        <button
          type="button"
          onClick={open}
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-neutral-600 hover:bg-white/40 [&>svg]:size-3.5"
        >
          <Plus />
          New Tab
        </button>
      </li>
    </ul>
  );
}

// decorative for now, the window manager wires them up later
function TrafficLights() {
  return (
    <div aria-hidden="true" className="flex gap-1.5">
      <span className="size-3 rounded-full bg-[#ff5f57] ring-1 ring-black/10 ring-inset" />
      <span className="size-3 rounded-full bg-[#febc2e] ring-1 ring-black/10 ring-inset" />
      <span className="size-3 rounded-full bg-[#28c840] ring-1 ring-black/10 ring-inset" />
    </div>
  );
}

function NavButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-6 place-items-center rounded-md hover:bg-white/40 disabled:opacity-40 disabled:hover:bg-transparent [&>svg]:size-3.5"
    >
      {children}
    </button>
  );
}

// shows the current address until focused, then it's a text field. paths and this
// site's host navigate in place, other sites open in a real tab
function AddressBar({ pathname }: { pathname: string }) {
  const router = useRouter();
  // null while not editing, so the field follows the route
  const [draft, setDraft] = useState<string | null>(null);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const address = parseAddress(draft ?? "");
    e.currentTarget.querySelector("input")?.blur();
    if (!address) return;
    if (address.kind === "external")
      window.open(address.url, "_blank", "noopener,noreferrer");
    else if (!samePath(address.path, pathname))
      router.navigate({ href: address.path });
  };

  return (
    <form onSubmit={submit}>
      <input
        aria-label="Address"
        spellCheck={false}
        value={draft ?? displayAddress(pathname)}
        onFocus={(e) => {
          setDraft(displayAddress(pathname));
          e.currentTarget.select();
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => setDraft(null)}
        onKeyDown={(e) => e.key === "Escape" && e.currentTarget.blur()}
        className="w-full rounded-lg bg-white/50 px-2.5 py-1.5 text-xs text-neutral-800 ring-1 ring-black/5 outline-none focus:bg-white/80"
      />
    </form>
  );
}

const essentials = [
  { label: "GitHub", href: socials.github, icon: <GitHub /> },
  { label: "LinkedIn", href: socials.linkedin, icon: <LinkedIn /> },
  { label: "Email", href: `mailto:${socials.email}`, icon: <Mail /> },
  { label: "Résumé", href: socials.resume, icon: <FileUser /> },
];

// zen's pinned-site grid at the top of the sidebar
function Essentials() {
  return (
    <ul className="grid grid-cols-4 gap-1.5">
      {essentials.map((item) => (
        <li key={item.label}>
          <a
            href={item.href}
            target="_blank"
            rel="noreferrer"
            aria-label={item.label}
            title={item.label}
            className="grid h-10 place-items-center rounded-lg bg-white/40 text-neutral-700 ring-1 ring-black/5 hover:bg-white/70 [&>svg]:size-4"
          >
            {item.icon}
          </a>
        </li>
      ))}
    </ul>
  );
}
