# Desktop + Zen Browser (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the existing portfolio inside a fixed, Zen-inspired browser window that sits on Jeffrey's own wallpaper, with a working address bar, back/forward/reload, an Essentials grid and vertical tabs mapped to routes.

**Architecture:** `__root.tsx` wraps `<Outlet />` in `<Desktop>` (wallpaper) → `<Browser>` (Zen sidebar + rounded content card). The routes render directly in the card, with no iframe, so real URLs, loaders and the existing page transitions keep working. Two pure modules hold the logic that can break quietly (`browser-address.ts` for parsing what's typed, `browser-tabs.ts` for which tabs show) and are unit-tested with Vitest. Below the `sm` breakpoint the desktop chrome is turned off with CSS, and the page renders as it does today.

**Tech Stack:** TanStack Start / Router 1.170, React 19, Tailwind v4, GSAP (existing transitions), lucide-react, Vitest 5 (new dev dependency), npm.

**Spec:** `docs/superpowers/specs/2026-10-13-macos-desktop-design.md` (phase 1, plus the "Browser window", "Browser look: Zen-inspired", "Wallpaper" and "Routing" sections)

## Global Constraints

- Window is **fixed, not draggable** in this phase. Traffic lights are decorative (phase 3 wires them).
- Routes render via `<Outlet />` inside the browser, **not an iframe**.
- Motion stays minimal: no new transitions or animations. Existing page transitions stay.
- Phones (`< sm`, 640px) and no-JS get the plain page. The desktop chrome must not depend on JS to lay out.
- No new runtime dependencies. Vitest is dev-only.
- Match repo style: **2-space indentation** and short lowercase comments explaining *why*. Do **not** run `biome format --write`: `biome.json` says tabs, but the codebase uses spaces. Use `npx biome lint <files>` only.
- Package manager is **npm** (`package-lock.json`). `pnpm` is not installed.
- The working tree has uncommitted work from Jeffrey (including `__root.tsx`, `page-transition.ts`, `socials.tsx`, `router.tsx` neighbours and the untracked `dock.tsx`). **Before the first commit, ask him** whether to commit his work first. Commits in this plan stage only the files each task lists.
- Display host in the address bar is `jeffreyyu.dev` (placeholder until he has a domain, defined once in `browser-address.ts`).
- Wallpaper is his own image at `public/wallpaper.jpg`. A gradient shows if the file is missing.

## Review Focus

1. **Clicking the tab (or dock icon) for the page you're already on** must do nothing. Today `leave()` hides the page and the same route never remounts, so the page would stay blank. Pinned by `samePath` tests (Task 1) and the shared `useGo` guard (Task 3).
2. **Typed addresses in every shape**: full URLs with `https://`, the own host with a trailing slash, bare words like `about`, leading/trailing spaces, empty input, external sites. Pinned by `parseAddress` tests (Task 1).
3. **Deep links to unknown or dynamic pages** (`/projects/nope`, `/posts/x`) must still get a sensible tab title and render the not-found page inside the card. Pinned by `tabsFor` tests (Task 2) and a manual check (Task 5).
4. **Navigating while scrolled down inside the card**: the new page starts at the top and back restores the old position. Router `scrollToTopSelectors` / `data-scroll-restoration-id` (Task 5), manual check.
5. **The exit transition's ghost copy must be visible inside the card.** Today it's `position: fixed; z-index: -1` on `<body>`, which would land behind the wallpaper. It's re-parented into the card (Task 5), with a manual check. Hover popovers (Western preview, availability card) must not be clipped by the card. Manual check, Task 5.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `vitest.config.ts` (create) | Test runner config, kept separate from `vite.config.ts` so the Start plugin doesn't load in tests |
| `src/lib/browser-address.ts` (create) | `DISPLAY_HOST`, `displayAddress`, `parseAddress`, `normalizePath`, `samePath`. Pure |
| `src/lib/browser-address.test.ts` (create) | Tests for the above |
| `src/lib/browser-tabs.ts` (create) | `Tab`, `fixedTabs`, `tabsFor(pathname)`. Pure, reads work/project data for titles |
| `src/lib/browser-tabs.test.ts` (create) | Tests for the above |
| `src/lib/page-transition.ts` (modify) | Add `useGo`. Re-parent the exit ghost into the page's container |
| `src/components/brand-icons.tsx` (create) | `GitHub`, `LinkedIn`, `Spotify` SVGs, today duplicated in `socials.tsx` and `dock.tsx` |
| `src/components/socials.tsx`, `src/components/dock.tsx` (modify) | Import brand icons. Dock uses `useGo` |
| `src/components/browser.tsx` (create) | Zen frame: sidebar (traffic lights, nav buttons, address bar, Essentials, tabs) + content card |
| `src/components/desktop.tsx` (create) | Wallpaper layer that hosts the browser |
| `src/routes/__root.tsx` (modify) | Wrap `data-page` in `<Desktop><Browser>` |
| `src/router.tsx` (modify) | Scroll the card to top on navigation |
| `package.json` (modify) | `vitest` dev dependency + `test` script |

---

### Task 1: Vitest + address parsing

**Files:**
- Create: `vitest.config.ts`, `src/lib/browser-address.ts`, `src/lib/browser-address.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces:
  - `DISPLAY_HOST: string`
  - `type Address = { kind: "route"; path: string } | { kind: "external"; url: string }`
  - `displayAddress(pathname: string): string`
  - `parseAddress(input: string): Address | null`
  - `normalizePath(path: string): string`
  - `samePath(a: string, b: string): boolean`

- [ ] **Step 1: Install Vitest and add the script**

```bash
npm install -D vitest@^5
npm pkg set scripts.test="vitest run"
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

// separate from vite.config.ts so tests don't boot the tanstack start plugin
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: { include: ["src/**/*.test.ts"] },
});
```

- [ ] **Step 2: Write the failing tests**

`src/lib/browser-address.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  DISPLAY_HOST,
  displayAddress,
  normalizePath,
  parseAddress,
  samePath,
} from "#/lib/browser-address";

describe("displayAddress", () => {
  it("shows just the host on the home page", () => {
    expect(displayAddress("/")).toBe(DISPLAY_HOST);
  });
  it("appends the path elsewhere", () => {
    expect(displayAddress("/projects/renao")).toBe(
      `${DISPLAY_HOST}/projects/renao`,
    );
  });
});

describe("normalizePath", () => {
  it.each([
    ["", "/"],
    ["/", "/"],
    ["/about/", "/about"],
    ["about", "/about"],
    ["/work/western//", "/work/western"],
  ])("%j -> %j", (input, expected) => {
    expect(normalizePath(input)).toBe(expected);
  });
});

describe("samePath", () => {
  it("ignores trailing slashes", () => {
    expect(samePath("/about/", "/about")).toBe(true);
  });
  it("tells different pages apart", () => {
    expect(samePath("/", "/about")).toBe(false);
  });
});

describe("parseAddress", () => {
  it("returns null for empty or blank input", () => {
    expect(parseAddress("")).toBeNull();
    expect(parseAddress("   ")).toBeNull();
  });
  it("returns null for text with spaces (there's no search engine)", () => {
    expect(parseAddress("about me")).toBeNull();
  });
  it("keeps a typed path in the browser", () => {
    expect(parseAddress(" /projects/renao/ ")).toEqual({
      kind: "route",
      path: "/projects/renao",
    });
  });
  it("treats a bare word as a path", () => {
    expect(parseAddress("about")).toEqual({ kind: "route", path: "/about" });
  });
  it("keeps the site's own host in the browser, with or without protocol", () => {
    expect(parseAddress(DISPLAY_HOST)).toEqual({ kind: "route", path: "/" });
    expect(parseAddress(`https://${DISPLAY_HOST}/about/`)).toEqual({
      kind: "route",
      path: "/about",
    });
    expect(parseAddress(`www.${DISPLAY_HOST.toUpperCase()}/about`)).toEqual({
      kind: "route",
      path: "/about",
    });
  });
  it("sends other hosts out, adding https when missing", () => {
    expect(parseAddress("github.com/JeffreyYu-Dev")).toEqual({
      kind: "external",
      url: "https://github.com/JeffreyYu-Dev",
    });
    expect(parseAddress("http://uwo.ca")).toEqual({
      kind: "external",
      url: "http://uwo.ca",
    });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, `Failed to resolve import "#/lib/browser-address"`.

- [ ] **Step 4: Implement**

`src/lib/browser-address.ts`:

```ts
// the address bar shows this in front of the path. placeholder until there's a real domain
export const DISPLAY_HOST = "jeffreyyu.dev";

export type Address =
  | { kind: "route"; path: string }
  | { kind: "external"; url: string };

// what the address bar shows for the current route
export function displayAddress(pathname: string) {
  const path = normalizePath(pathname);
  return path === "/" ? DISPLAY_HOST : `${DISPLAY_HOST}${path}`;
}

// "", "about" and "/about/" become "/" and "/about", matching the router's pathnames
export function normalizePath(path: string) {
  const trimmed = path.replace(/\/+$/, "");
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function samePath(a: string, b: string) {
  return normalizePath(a) === normalizePath(b);
}

// turns what was typed into the address bar into somewhere to go. paths, bare
// words and this site's own host stay in the browser, anything else with a dot
// is another website. there's no search engine, so text with spaces goes nowhere
export function parseAddress(input: string): Address | null {
  const text = input.trim();
  if (!text || /\s/.test(text)) return null;

  const hasProtocol = /^https?:\/\//i.test(text);
  const bare = text.replace(/^https?:\/\//i, "");
  const host = bare.split(/[/?#]/)[0].toLowerCase();

  if (host === DISPLAY_HOST || host === `www.${DISPLAY_HOST}`)
    return { kind: "route", path: normalizePath(bare.slice(host.length)) };
  if (text.startsWith("/")) return { kind: "route", path: normalizePath(text) };
  if (host.includes("."))
    return { kind: "external", url: hasProtocol ? text : `https://${text}` };
  return { kind: "route", path: normalizePath(text) };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS, all `browser-address` tests green.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/browser-address.ts src/lib/browser-address.test.ts
git commit -m "feat: address parsing for the desktop browser"
```

---

### Task 2: Tabs mapped to routes

**Files:**
- Create: `src/lib/browser-tabs.ts`, `src/lib/browser-tabs.test.ts`

**Interfaces:**
- Consumes: `normalizePath` from Task 1. `findWork(id)` from `src/data/work.ts` and `findProject(id)` from `src/data/projects.ts` (both return the entry or `undefined`).
- Produces:
  - `type Tab = { path: string; title: string }`
  - `fixedTabs: Tab[]`
  - `tabsFor(pathname: string): Tab[]`

- [ ] **Step 1: Write the failing tests**

`src/lib/browser-tabs.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { projects } from "#/data/projects";
import { work } from "#/data/work";
import { fixedTabs, tabsFor } from "#/lib/browser-tabs";

describe("tabsFor", () => {
  it("is just the fixed tabs on a fixed page", () => {
    expect(tabsFor("/")).toEqual(fixedTabs);
    expect(tabsFor("/about/")).toEqual(fixedTabs);
  });
  it("adds a tab titled after the project you're on", () => {
    const project = projects[0];
    expect(tabsFor(`/projects/${project.id}`).at(-1)).toEqual({
      path: `/projects/${project.id}`,
      title: project.name,
    });
  });
  it("adds a tab titled after the company you're on", () => {
    const entry = work[0];
    expect(tabsFor(`/work/${entry.id}/`).at(-1)).toEqual({
      path: `/work/${entry.id}`,
      title: entry.company,
    });
  });
  it("falls back to the path for unknown or untitled pages", () => {
    expect(tabsFor("/projects/nope").at(-1)).toEqual({
      path: "/projects/nope",
      title: "/projects/nope",
    });
    expect(tabsFor("/posts/hello").at(-1)?.title).toBe("/posts/hello");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, `Failed to resolve import "#/lib/browser-tabs"`.

- [ ] **Step 3: Implement**

`src/lib/browser-tabs.ts`:

```ts
import { findProject } from "#/data/projects";
import { findWork } from "#/data/work";
import { normalizePath } from "#/lib/browser-address";

export type Tab = { path: string; title: string };

// always in the sidebar, like zen's pinned tabs
export const fixedTabs: Tab[] = [
  { path: "/", title: "Home" },
  { path: "/about", title: "About Me" },
];

// the fixed tabs, plus one for the page you're on when it isn't one of them
export function tabsFor(pathname: string): Tab[] {
  const path = normalizePath(pathname);
  if (fixedTabs.some((tab) => tab.path === path)) return fixedTabs;
  return [...fixedTabs, { path, title: titleFor(path) }];
}

function titleFor(path: string) {
  const [, section, id] = path.split("/");
  if (section === "work" && id) return findWork(id)?.company ?? path;
  if (section === "projects" && id) return findProject(id)?.name ?? path;
  return path;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS. If importing `#/data/work` fails because of an image import in that file (e.g. a logo `.svg`/`.png`), that's Vitest not handling the asset. Vite resolves assets to URL strings by default, so this should pass. If it doesn't, add `test: { ..., environment: "node" }` and report the exact error rather than mocking the data.

- [ ] **Step 5: Commit**

```bash
git add src/lib/browser-tabs.ts src/lib/browser-tabs.test.ts
git commit -m "feat: browser tabs derived from the current route"
```

---

### Task 3: Shared `useGo` + brand icons

Pulls the "don't leave the page you're on" guard out of the dock so the browser tabs can share it, and moves the duplicated brand SVGs into one file.

**Files:**
- Create: `src/components/brand-icons.tsx`
- Modify: `src/lib/page-transition.ts` (add `useGo` after `useLeave`), `src/components/dock.tsx`, `src/components/socials.tsx`

**Interfaces:**
- Consumes: `samePath` (Task 1). `useLeave(key)` (existing).
- Produces:
  - `useGo(key: string): (path: string) => (e: MouseEvent<HTMLAnchorElement>) => void`
  - `GitHub`, `LinkedIn`, `Spotify`: `() => JSX.Element`, `fill="currentColor"`, `aria-hidden`

- [ ] **Step 1: Add `useGo` to `src/lib/page-transition.ts`**

Add `useRouterState` to the router import and `samePath` to the imports:

```ts
import { useRouter, useRouterState } from "@tanstack/react-router";
import { samePath } from "#/lib/browser-address";
```

Add below `useLeave`:

```ts
// useLeave for links that can point at the page you're already on (dock, browser tabs).
// leaving hides the page until the next one mounts, and the same page never
// remounts, so clicking the current page does nothing instead
export function useGo(key: string) {
  const leave = useLeave(key);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (path: string) => (e: MouseEvent<HTMLAnchorElement>) =>
    samePath(pathname, path) ? e.preventDefault() : leave(e);
}
```

- [ ] **Step 2: Create `src/components/brand-icons.tsx`**

Move `GitHub` and `LinkedIn` verbatim from `socials.tsx`, and `Spotify` verbatim from `dock.tsx`, exporting each, under the comment:

```tsx
// lucide dropped brand logos, so these are drawn by hand
export function GitHub() { /* body copied unchanged from socials.tsx */ }
export function LinkedIn() { /* body copied unchanged from socials.tsx */ }
export function Spotify() { /* body copied unchanged from dock.tsx */ }
```

The shared `LinkedIn` is the **socials.tsx** version (the "in" inside a square). The dock's version has the square removed so it can sit on a blue tile. Leave that one in `dock.tsx`, renamed to `LinkedInMark`, so the dock looks unchanged.

- [ ] **Step 3: Use them**

- `socials.tsx`: delete the local `GitHub`/`LinkedIn` and the comment above them. Add `import { GitHub, LinkedIn } from "#/components/brand-icons";`.
- `dock.tsx`: delete local `GitHub` and `Spotify`. Rename the local `LinkedIn` to `LinkedInMark` and update its usage. Import `{ GitHub, Spotify }` from `#/components/brand-icons`. Replace

```ts
  const leave = useLeave("dock");

  // plays the page transition, unless you're already there: leaving hides the
  // page until the next one mounts, and the same page never remounts
  const go = (path: string) => (e: MouseEvent<HTMLAnchorElement>) =>
    pathname === path ? e.preventDefault() : leave(e);
```

with

```ts
  const go = useGo("dock");
```

and change the import to `import { useGo } from "#/lib/page-transition";`. Drop `MouseEvent` from the React import.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit -p . && npx biome lint src/lib/page-transition.ts src/components/dock.tsx src/components/socials.tsx src/components/brand-icons.tsx && npm test`
Expected: no type errors, no new lint errors (import-order notices already exist repo-wide), tests pass.
Manual (dev server on :3000): the home page's social icons and the dock look unchanged. Clicking the dock's Home icon while on `/` leaves the page visible.

- [ ] **Step 5: Commit**

```bash
git add src/lib/page-transition.ts src/components/brand-icons.tsx src/components/dock.tsx src/components/socials.tsx
git commit -m "refactor: shared useGo guard and brand icons"
```

---

### Task 4: Zen browser component

**Files:**
- Create: `src/components/browser.tsx`

**Interfaces:**
- Consumes: `displayAddress`, `parseAddress`, `samePath` (Task 1). `tabsFor` (Task 2). `useGo`, `GitHub`, `LinkedIn` (Task 3). `socials` from `#/data/socials`.
- Produces: `Browser({ children }: { children: ReactNode })`. Renders the content card as `<div data-browser-content data-scroll-restoration-id="browser-content" ...>` so Task 5 can target it.

- [ ] **Step 1: Write the component**

`src/components/browser.tsx`:

```tsx
import { GitHub, LinkedIn } from "#/components/brand-icons";
import { socials } from "#/data/socials";
import {
  displayAddress,
  parseAddress,
  samePath,
} from "#/lib/browser-address";
import { tabsFor } from "#/lib/browser-tabs";
import { useGo } from "#/lib/page-transition";
import {
  useCanGoBack,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  FileUser,
  Mail,
  RotateCw,
} from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";

// the portfolio's window, styled after zen browser: a tinted frame with tabs down
// a left sidebar and the page in a rounded card. on phones the frame and sidebar
// drop away and the card is the whole page
export function Browser({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="h-full gap-2 sm:flex sm:rounded-xl sm:border sm:border-white/30 sm:bg-gradient-to-br sm:from-rose-200/60 sm:via-violet-200/60 sm:to-sky-200/60 sm:p-2 sm:shadow-2xl sm:ring-1 sm:ring-black/10 sm:backdrop-blur-2xl">
      <Sidebar pathname={pathname} />
      {/* relative + isolate: page-transition.ts parks its exit copy in here at z -1 */}
      <div
        data-browser-content
        data-scroll-restoration-id="browser-content"
        className="relative isolate flex-1 bg-white sm:overflow-y-auto sm:rounded-lg sm:shadow-sm sm:ring-1 sm:ring-black/5"
      >
        {children}
      </div>
    </div>
  );
}

function Sidebar({ pathname }: { pathname: string }) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const go = useGo("browser");

  return (
    <nav
      aria-label="Browser"
      className="flex w-52 shrink-0 flex-col gap-3 max-sm:hidden"
    >
      <div className="flex items-center justify-between px-1 pt-1">
        <TrafficLights />
        <div className="flex items-center text-neutral-600">
          <NavButton
            label="Back"
            disabled={!canGoBack}
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

      <ul className="flex flex-col gap-0.5">
        {tabsFor(pathname).map((tab) => (
          <li key={tab.path}>
            <a
              href={tab.path}
              onClick={go(tab.path)}
              aria-current={samePath(tab.path, pathname) ? "page" : undefined}
              className="block truncate rounded-md px-2 py-1.5 text-xs text-neutral-700 hover:bg-white/40 aria-[current=page]:bg-white/70 aria-[current=page]:text-neutral-900 aria-[current=page]:shadow-sm"
            >
              {tab.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
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
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit -p . && npx biome lint src/components/browser.tsx`
Expected: no type errors, no lint errors beyond import ordering. (Not mounted yet, so nothing to see in the browser.)

- [ ] **Step 3: Commit**

```bash
git add src/components/browser.tsx
git commit -m "feat: zen-inspired browser window component"
```

---

### Task 5: Desktop, mounting, transitions and scroll

**Files:**
- Create: `src/components/desktop.tsx`
- Modify: `src/routes/__root.tsx` (`RootLayout`), `src/lib/page-transition.ts` (`leave()`), `src/router.tsx`
- Asset: `public/wallpaper.jpg` (Jeffrey supplies it)

**Interfaces:**
- Consumes: `Browser` and its `data-browser-content` card (Task 4).
- Produces: `Desktop({ children }: { children: ReactNode })`.

- [ ] **Step 1: Create `src/components/desktop.tsx`**

```tsx
import type { ReactNode } from "react";

// the wallpaper everything sits on, clear of the notch at the top and the dock at
// the bottom. the gradient shows until public/wallpaper.jpg exists. on phones it
// steps aside and the browser's page is the whole site
export function Desktop({ children }: { children: ReactNode }) {
  return (
    <div className="sm:fixed sm:inset-0 sm:bg-[image:url(/wallpaper.jpg),linear-gradient(135deg,#c7d2fe,#fbcfe8)] sm:bg-cover sm:bg-center sm:px-10 sm:pt-12 sm:pb-16">
      <div className="mx-auto h-full max-w-6xl">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Mount it in `src/routes/__root.tsx`**

Add imports:

```tsx
import { Browser } from "#/components/browser";
import { Desktop } from "#/components/desktop";
```

Replace in `RootLayout`:

```tsx
      {/* data-page: what page-transition.ts snapshots when leaving */}
      <div data-page className="mx-auto w-md mt-20">
        <Outlet />
      </div>
```

with

```tsx
      <Desktop>
        <Browser>
          {/* data-page: what page-transition.ts snapshots when leaving */}
          <div data-page className="mx-auto w-md pt-20 sm:py-12">
            <Outlet />
          </div>
        </Browser>
      </Desktop>
```

Keep `<Boot />`, `<Notch />` and `<Dock />` where they are.

- [ ] **Step 3: Re-parent the exit ghost in `leave()` (`src/lib/page-transition.ts`)**

The ghost is currently `position: fixed` on `<body>` at `z-index: -1`, which now sits behind the wallpaper. Replace:

```ts
  // a frozen copy of the page plays the exit while the next page mounts underneath
  const rect = page.getBoundingClientRect();
  const ghost = page.cloneNode(true) as HTMLElement;
  ghost.removeAttribute("data-page");
  ghost.setAttribute("aria-hidden", "true");
  Object.assign(ghost.style, {
    position: "fixed",
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    margin: "0",
    pointerEvents: "none",
    // behind the new page so the flying title passes over the exiting lines
    zIndex: "-1",
  });
```

with

```ts
  // a frozen copy of the page plays the exit while the next page mounts underneath.
  // it lives in the page's container (the browser's content card) at the page's
  // spot, so it scrolls and clips with the content
  const container = page.parentElement ?? document.body;
  const ghost = page.cloneNode(true) as HTMLElement;
  ghost.removeAttribute("data-page");
  ghost.setAttribute("aria-hidden", "true");
  Object.assign(ghost.style, {
    position: "absolute",
    top: `${page.offsetTop}px`,
    left: `${page.offsetLeft}px`,
    width: `${page.offsetWidth}px`,
    margin: "0",
    pointerEvents: "none",
    // behind the new page so the flying title passes over the exiting lines.
    // the card's isolate keeps it above the card's own white background
    zIndex: "-1",
  });
```

and change `document.body.append(ghost);` to `container.append(ghost);`.

- [ ] **Step 4: Scroll the card on navigation (`src/router.tsx`)**

Add to the `createTanStackRouter` options:

```ts
    // the page scrolls inside the browser window's card, not the window
    scrollToTopSelectors: ['[data-browser-content]'],
```

(Back/forward restore its position through the card's `data-scroll-restoration-id`, set in Task 4.)

- [ ] **Step 5: Add the wallpaper**

Ask Jeffrey for his wallpaper file and copy it to `public/wallpaper.jpg`. If it's a `.png`/`.heic`, convert it or change the extension in `desktop.tsx`. A 2560px-wide JPEG at ~80% quality is plenty. Until then the gradient shows.

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit -p . && npm test && npm run build`
Expected: no type errors, tests pass, build succeeds.

Server render (dev server on :3000):

```bash
curl -s localhost:3000/ | grep -c 'data-browser-content'      # 1
curl -s localhost:3000/projects/renao | grep -o 'aria-current="page"[^>]*>[^<]*' # the Renao tab
```

Manual, in a desktop-width browser:
1. Wallpaper (or gradient) fills the screen. The browser window sits between the notch and the dock, with the sidebar on the left and the page in a white rounded card.
2. Click a project row: the exit lines slide out **visibly inside the card**, the title morphs, and a new tab with the project's name appears and is highlighted. The address shows `jeffreyyu.dev/projects/<id>`.
3. Click the highlighted tab: nothing happens, and the page stays visible.
4. Back and forward work. Back is disabled on a fresh load.
5. Address bar: type `about` + Enter goes to About. `jeffreyyu.dev/` goes Home. `github.com` opens a real new tab. Escape restores the address. Blank + Enter does nothing.
6. Scroll down the home page inside the card, open a project: it starts at the top. Press Back: the home page returns to where you were.
7. Visit `/projects/nope`: the not-found page renders inside the card, with a tab titled `/projects/nope`.
8. Hover "Western" and the green availability dot: the popovers aren't clipped by the card.
9. Hard-refresh in a new session: the boot screen still collapses into the notch, and the page lines rise in inside the card.
10. Narrow the window below 640px: no wallpaper, frame or sidebar. The page looks like it did before this phase, and the window scrolls normally.
11. With JS disabled: the layout still renders and tabs/Essentials are plain working links.

- [ ] **Step 7: Commit**

```bash
git add src/components/desktop.tsx src/routes/__root.tsx src/lib/page-transition.ts src/router.tsx public/wallpaper.jpg
git commit -m "feat: portfolio inside a zen browser on the desktop"
```
