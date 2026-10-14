import { AppWindow, TrafficLights } from "#/components/app-window";
import { GitHub, LinkedIn } from "#/components/brand-icons";
import { socials } from "#/data/socials";
import {
  displayAddress,
  normalizePath,
  parseAddress,
  samePath,
} from "#/lib/browser-address";
import { WorkLogo } from "#/components/work-logo";
import { YailIcon } from "#/components/yail/mark";
import { findWork } from "#/data/work";
import {
  activeTab,
  closeTab,
  initialTabs,
  navigate,
  openTab,
  pinnedTabs,
  selectTab,
  strayed,
  type Tab,
  titleFor,
  unpinnedTabs,
} from "#/lib/browser-tabs";
import { furthestEntry } from "#/lib/browser-history";
import {
  scrolledTo,
  sidebarShown,
  toggleSidebar,
  useBrowser,
  wheeled,
} from "#/lib/browser-store";
import { BROWSER, useWindows } from "#/lib/window-store";
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
  Check,
  FileUser,
  Link2,
  LoaderCircle,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RotateCw,
  Undo2,
  X,
} from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  type Ref,
  useEffect,
  useRef,
  useState,
} from "react";

// the portfolio's window, styled after zen browser's multiple toolbars layout: a
// tinted frame with tabs down a left sidebar, a toolbar with the address bar
// across the top, and the page in a rounded card. scrolling into a page zooms it
// to fill the screen, the same as its green button. drag it by the toolbar. on
// phones and small tablets the frame, sidebar and toolbar drop away and the card
// is the whole page
export function Browser({ children }: { children: ReactNode }) {
  return (
    <AppWindow id={BROWSER} label="Zen">
      <Frame>{children}</Frame>
    </AppWindow>
  );
}

function Frame({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const expanded = useWindows().windows[BROWSER]?.zoomed ?? false;
  const sidebar = sidebarShown(useBrowser(), expanded);
  // the collapsed sidebar sliding out over the page, like zen's compact mode
  const [peek, setPeek] = useState(false);
  const shown = sidebar || peek;
  const sidebarRef = useRef<HTMLElement>(null);
  const tabs = useTabs(pathname);

  useEffect(() => {
    if (sidebar) setPeek(false);
  }, [sidebar]);

  return (
    <div
      // the window itself brings the corners and shadow. like zen, the frame's empty
      // space, toolbar and sidebar included, drags it. the page doesn't
      data-window-drag
      className={`relative h-full md:flex md:flex-col md:overflow-hidden md:border md:bg-gradient-to-br md:from-rose-200/60 md:via-violet-200/60 md:to-sky-200/60 md:backdrop-blur-2xl md:transition-[padding,border-color] md:duration-[400ms] md:ease-out md:motion-reduce:transition-none! ${
        expanded
          ? "md:border-transparent md:p-0"
          : "md:rounded-xl md:border-white/30 md:px-2 md:pt-1 md:pb-2"
      }`}
    >
      <Toolbar pathname={pathname} sidebar={sidebar} expanded={expanded} />
      {!sidebar && (
        // bumping the left edge peeks the sidebar out
        <div
          aria-hidden="true"
          onPointerEnter={() => setPeek(true)}
          // moving off the strip onto the page, not into the sidebar, puts it away
          onPointerLeave={(e) => {
            const into = e.relatedTarget;
            if (!(into instanceof Node && sidebarRef.current?.contains(into)))
              setPeek(false);
          }}
          className="absolute bottom-0 left-0 top-10 z-10 w-2 max-md:hidden"
        />
      )}
      <Sidebar
        ref={sidebarRef}
        shown={shown}
        floating={!sidebar}
        tabs={tabs}
        onPeek={setPeek}
      />
      <div className="md:flex md:min-h-0 md:flex-1">
        {/* holds the docked sidebar's space. animating its width slides the page over.
            full screen drops the frame's padding, so it adds the sidebar's inset itself */}
        <div
          aria-hidden="true"
          className={`shrink-0 transition-[width,margin] duration-300 ease-out motion-reduce:transition-none! max-md:hidden ${
            !sidebar ? "mr-0 ml-0 w-0" : expanded ? "mr-2 ml-2 w-52" : "mr-2 ml-0 w-52"
          }`}
        />
        {/* relative + isolate: page-transition.ts parks its exit copy in here at z -1,
          outside the scroller so it doesn't scroll with the content */}
        <div
          data-ghost-host
          data-no-drag
          className={`relative isolate flex-1 bg-white md:min-w-0 md:overflow-hidden md:shadow-sm md:transition-[border-radius] md:duration-[400ms] md:motion-reduce:transition-none! ${
            expanded
              ? "md:rounded-none"
              : "md:rounded-lg md:ring-1 md:ring-black/5"
          }`}
        >
          <div
            data-browser-content
            data-scroll-restoration-id="browser-content"
            onScroll={(e) => scrolledTo(e.currentTarget.scrollTop)}
            onWheel={(e) => wheeled(e.deltaY, e.currentTarget.scrollTop)}
            className="md:h-full md:overflow-y-auto"
          >
            {children}
          </div>
          {tabs.loading === tabs.state.active && (
            <div
              key={tabs.loading}
              aria-hidden="true"
              className="tab-loading pointer-events-none absolute top-0 left-0 z-10 h-0.5 bg-[#4285f4]"
              style={{ animationDuration: `${LOAD_MS}ms` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// zen's top toolbar, across the whole window. the part over the sidebar holds the
// window controls and navigation, and the address bar lines up with the page.
// with the sidebar tucked away that part narrows and the address bar follows
function Toolbar({
  pathname,
  sidebar,
  expanded,
}: {
  pathname: string;
  sidebar: boolean;
  expanded: boolean;
}) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const canGoForward = useCanGoForward();
  // the server can't see the history, so back starts disabled until hydrated,
  // or the server's disabled attribute would stick
  const hydrated = useHydrated();

  return (
    <div
      className={`mb-1 flex h-8 shrink-0 items-center text-neutral-600 max-md:hidden ${
        expanded ? "mt-1 px-2" : ""
      }`}
    >
      <div
        className={`flex shrink-0 items-center gap-3 pl-1 transition-[width,margin] duration-300 ease-out motion-reduce:transition-none! ${
          sidebar ? "mr-2 w-52" : "mr-1 w-44"
        }`}
      >
        <TrafficLights />
        <div className="flex items-center">
          <NavButton
            label={sidebar ? "Hide sidebar" : "Show sidebar"}
            onClick={toggleSidebar}
          >
            {sidebar ? <PanelLeftClose /> : <PanelLeftOpen />}
          </NavButton>
          <NavButton
            label="Back"
            disabled={!hydrated || !canGoBack}
            onClick={() => router.history.back()}
          >
            <ArrowLeft />
          </NavButton>
          <NavButton
            label="Forward"
            disabled={!canGoForward}
            onClick={() => router.history.forward()}
          >
            <ArrowRight />
          </NavButton>
          <NavButton label="Reload" onClick={() => router.invalidate()}>
            <RotateCw />
          </NavButton>
        </div>
      </div>
      <AddressBar pathname={pathname} />
    </div>
  );
}

// lit only when there's a page ahead. starts off on the server and after a reload,
// since only this visit's moves are known
function useCanGoForward() {
  const router = useRouter();
  const [can, setCan] = useState(false);

  useEffect(() => {
    let furthest = router.history.location.state.__TSR_index;
    return router.history.subscribe(({ location, action }) => {
      const index = location.state.__TSR_index;
      furthest = furthestEntry(furthest, index, action.type);
      setCan(index < furthest);
    });
  }, [router]);

  return can;
}

function Sidebar({
  ref,
  shown,
  floating,
  tabs,
  onPeek,
}: {
  ref: Ref<HTMLElement>;
  shown: boolean;
  // collapsed, so it slides out over the page instead of sitting beside it
  floating: boolean;
  tabs: TabsApi;
  onPeek: (peek: boolean) => void;
}) {
  return (
    // one sidebar that docks or floats, so its tabs keep their state either way.
    // inert while tucked away, so tabbing skips it. it starts below the toolbar
    <nav
      ref={ref}
      aria-label="Browser"
      inert={!shown}
      onPointerLeave={() => floating && onPeek(false)}
      onFocus={() => floating && onPeek(true)}
      onBlur={(e) => {
        if (floating && !e.currentTarget.contains(e.relatedTarget))
          onPeek(false);
      }}
      className={`absolute top-10 bottom-2 left-2 z-20 flex w-52 flex-col gap-3 transition-[translate,background-color,box-shadow] duration-300 ease-out motion-reduce:transition-none! max-md:hidden ${shown ? "translate-x-0" : "-translate-x-[calc(100%+1rem)]"} ${
        floating
          ? // the window's tint over a muted base standing in for the blurred
          // wallpaper, so it matches the docked sidebar over the white page
          "rounded-lg bg-[#b4a4b8] bg-gradient-to-br from-rose-200/60 via-violet-200/60 to-sky-200/60 p-2 shadow-xl ring-1 ring-black/10"
          : ""
      }`}
    >
      <Essentials onMail={() => tabs.open("/yail/inbox")} />

      <TabList tabs={tabs} />
    </nav>
  );
}

// how long a tab pretends to load after switching to it
const LOAD_MS = 500;

type TabsApi = ReturnType<typeof useTabs>;

// lives in the browser, which stays mounted across navigations, so the tabs last
// for the visit. whatever the router shows is the active tab's page
function useTabs(pathname: string) {
  const router = useRouter();
  const [state, setState] = useState(() => initialTabs(pathname));
  // the tab showing its loading screen, if any
  const [loading, setLoading] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // links, the dock, the address bar and back/forward all move the active tab
  useEffect(() => setState((s) => navigate(s, pathname)), [pathname]);
  useEffect(() => () => clearTimeout(timer.current), []);

  // shows the active tab's page after opening, switching or closing
  const show = (path: string) => {
    if (!samePath(path, pathname)) router.navigate({ href: path });
  };

  // a tab just switched to shows a spinner and a bar across the page for a moment
  const load = (id: number) => {
    setLoading(id);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setLoading(null), LOAD_MS);
  };

  return {
    state,
    loading,
    select: (id: number) => {
      if (id !== state.active) load(id);
      setState((s) => selectTab(s, id));
    },
    close: (id: number) => {
      const next = closeTab(state, id);
      setState(next);
      if (next.active !== state.active) load(next.active);
      show(activeTab(next).path);
    },
    open: (path: string) => {
      const next = openTab(state, path);
      setState(next);
      load(next.active);
      show(path);
    },
  };
}

// pinned tabs on top, like zen, split from the rest by a line. new tab sits right
// under the line, above the tabs it opens
function TabList({ tabs }: { tabs: TabsApi }) {
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-0.5">
        {pinnedTabs(tabs.state).map((tab) => (
          <TabRow key={tab.id} tab={tab} tabs={tabs} />
        ))}
      </ul>
      <hr className="mx-2 border-black/10" />
      <ul className="flex flex-col gap-0.5">
        <li>
          <button
            type="button"
            onClick={() => tabs.open("/")}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-neutral-600 hover:bg-white/40 [&>svg]:size-3.5"
          >
            <Plus />
            New Tab
          </button>
        </li>
        {unpinnedTabs(tabs.state).map((tab) => (
          <TabRow key={tab.id} tab={tab} tabs={tabs} />
        ))}
      </ul>
    </div>
  );
}

function TabRow({ tab, tabs }: { tab: Tab; tabs: TabsApi }) {
  const go = useGo("browser");
  const title = titleFor(tab.path);
  const pinned = tab.pinned !== undefined;
  // a pin only offers to go back to its page, and only once it's left it
  const closable = pinned ? strayed(tab) : true;
  const closeLabel = pinned
    ? `Back to ${titleFor(tab.pinned ?? "/")}`
    : `Close ${title}`;

  return (
    <li className="group relative">
      <a
        href={tab.path}
        onClick={(e) => {
          tabs.select(tab.id);
          go(tab.path)(e);
        }}
        aria-current={tab.id === tabs.state.active ? "page" : undefined}
        className="flex items-center gap-2 truncate rounded-md py-1.5 pr-7 pl-2 text-xs text-neutral-700 group-hover:bg-white/40 aria-[current=page]:bg-white/70 aria-[current=page]:text-neutral-900 aria-[current=page]:shadow-sm"
      >
        {tabs.loading === tab.id ? (
          <LoaderCircle
            aria-label="Loading"
            className="size-3.5 shrink-0 animate-spin text-neutral-500 motion-reduce:animate-none"
          />
        ) : (
          <Favicon path={tab.path} />
        )}
        <span className="truncate">{title}</span>
      </a>
      {closable && (
        <button
          type="button"
          aria-label={closeLabel}
          title={closeLabel}
          onClick={() => tabs.close(tab.id)}
          className="absolute top-1/2 right-1 grid size-5 -translate-y-1/2 place-items-center rounded text-neutral-500 opacity-0 group-hover:opacity-100 hover:bg-black/5 focus-visible:opacity-100 [&>svg]:size-3"
        >
          {pinned ? <Undo2 /> : <X />}
        </button>
      )}
    </li>
  );
}

// the site's icon in front of the tab's title. pages without one get a plain grey
// rounded square, like a browser's blank favicon
function Favicon({ path }: { path: string }) {
  const to = normalizePath(path);
  if (to === "/yail" || to.startsWith("/yail/"))
    return <YailIcon className="size-3.5 shrink-0" />;
  const [, section, id] = to.split("/");
  const entry = section === "work" && id ? findWork(id) : undefined;
  if (entry)
    return (
      <span className="shrink-0 [&>*]:size-3.5!">
        <WorkLogo entry={entry} size="sm" />
      </span>
    );
  return (
    <span
      aria-hidden="true"
      className="size-3.5 shrink-0 rounded-[4px] bg-black/15"
    />
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
      className="grid size-6 place-items-center rounded-md hover:bg-white/40 disabled:text-neutral-400 disabled:hover:bg-transparent [&>svg]:size-4"
    >
      {children}
    </button>
  );
}

// shows the current address until focused, then it's a text field. paths and this
// site's host navigate in place, other sites open in a real tab
function AddressBar({ pathname }: { pathname: string }) {
  const router = useRouter();
  const search = useRouterState({ select: (s) => s.location.searchStr });
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
    <form
      onSubmit={submit}
      // the field's padding is part of the field, not something to drag by
      data-no-drag
      className="flex h-8 min-w-0 flex-1 items-center gap-1 rounded-lg bg-white/50 pr-3 pl-1 ring-1 ring-black/5 focus-within:bg-white/80"
    >
      <CopyAddress />
      <input
        aria-label="Address"
        spellCheck={false}
        value={draft ?? displayAddress(pathname, search)}
        onFocus={(e) => {
          setDraft(displayAddress(pathname, search));
          e.currentTarget.select();
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => setDraft(null)}
        onKeyDown={(e) => e.key === "Escape" && e.currentTarget.blur()}
        className="h-full min-w-0 flex-1 bg-transparent text-xs font-medium text-neutral-500 outline-none focus:text-neutral-800"
      />
    </form>
  );
}

// copies the page's real url, showing a check for a moment after
function CopyAddress() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : "Copy link"}
      title="Copy link"
      onClick={copy}
      className="grid size-6 shrink-0 place-items-center rounded-md text-neutral-500 hover:bg-black/5 [&>svg]:size-3.5"
    >
      {copied ? <Check /> : <Link2 />}
    </button>
  );
}

const essentials: {
  label: string;
  href?: string;
  yail?: boolean;
  icon: ReactNode;
}[] = [
  { label: "GitHub", href: socials.github, icon: <GitHub /> },
  { label: "LinkedIn", href: socials.linkedin, icon: <LinkedIn /> },
  // opens yail in a new browser tab rather than an outside mail app
  { label: "Yail", yail: true, icon: <Mail /> },
  { label: "Résumé", href: socials.resume, icon: <FileUser /> },
];

const tileClass =
  "grid h-10 place-items-center rounded-lg bg-white/40 text-neutral-700 ring-1 ring-black/5 hover:bg-white/70 [&>svg]:size-4";

// zen's pinned-site grid at the top of the sidebar
function Essentials({ onMail }: { onMail: () => void }) {
  return (
    <ul className="grid grid-cols-4 gap-1.5">
      {essentials.map((item) => (
        <li key={item.label}>
          {item.yail ? (
            // a fresh tab every time, with a loading screen first
            <a
              href="/yail/inbox"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)
                  return;
                e.preventDefault();
                onMail();
              }}
              aria-label={item.label}
              title={item.label}
              className={tileClass}
            >
              {item.icon}
            </a>
          ) : (
            <a
              href={item.href}
              target="_blank"
              rel="noreferrer"
              aria-label={item.label}
              title={item.label}
              className={tileClass}
            >
              {item.icon}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
