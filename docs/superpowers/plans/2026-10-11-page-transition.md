# Page Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clicking a work row on `/` morphs it into a macOS-style window that becomes `/work/$id`, and going back shrinks it into the row again.

**Architecture:** The browser View Transitions API, driven by TanStack Router's `defaultViewTransition` with a `types` function that labels each navigation `forward` / `back` / `fade`. Shared elements are paired with `view-transition-name`s derived from the work id and styled through `view-transition-class`es. A `WindowChrome` component renders the window frame on mount (so it's in the new-page snapshot) and dissolves it 300ms later.

**Tech Stack:** TanStack Start / Router 1.170, React 19, Tailwind v4, plain CSS for `::view-transition-*`, `node --test` (Node 24 runs `.ts` natively) for the one pure helper module.

**Spec:** `docs/superpowers/specs/2026-10-11-page-transition-design.md`

**Deviations from the spec (decided during planning):**
1. **`router.tsx` *is* changed.** It uses `defaultViewTransition: { types: transitionTypes }` instead of per-link `viewTransition` props. Reason: router-core applies `defaultViewTransition` to history pops too, so the browser back button gets the `back` animation for free. Per-link props would not.
2. **Title snapshots scale by height** (`block-size: 100%; inline-size: auto`) rather than `object-fit: none`. "Lyft" grows smoothly into the larger title instead of popping. It still doesn't stretch.
3. **Initial page load has no view transition** (the `types` function returns `false` when there's no previous location). This matches the spec's "nothing on initial load".

## Global Constraints

- Easing everywhere: `cubic-bezier(0.32, 0.72, 0, 1)`.
- Forward: root old fade-out 60ms, morph 300ms, root new fade-in 150ms, chrome dissolve 150ms starting at 300ms, body blur-in 120ms each with a 25ms stagger.
- Back: morph 280ms. The chrome is not re-shown.
- Other navigations (`fade` type): 120ms crossfade.
- Reduced motion: no geometry animation, 100ms opacity crossfade only, no blur-in, no chrome.
- No new runtime dependencies. No new dev dependencies.
- Match the surrounding code style: 2-space indent, double quotes, Tailwind classes inline, sparse lowercase comments.
- Baseline repo state: `npx tsc --noEmit` already reports 4 errors (`NotchTab`, `Notch`, `Footer`, `id` in `work/$id.tsx`). Do not add new ones. The `id` error goes away in Task 3. `npm run check` already fails on formatting (tabs vs spaces in existing files), so don't use it as a gate. Use `npx biome lint <files>` on touched files instead.

## Review Focus

1. **Browser back/forward buttons**: they must play the `back`/`forward` animation, not jump. Covered by unit tests for `transitionTypes` (Task 1) and the manual check in Task 4.
2. **Initial load / refresh on `/work/Lyft`**: no view transition. The chrome shows briefly and dissolves as an intro, with no hydration warning. Covered by a unit test (`fromLocation` undefined → `false`) and the manual check in Task 4.
3. **Work ids that aren't valid CSS identifiers** (spaces, leading digits, `&`): `view-transition-name` must still be valid, otherwise the whole transition silently aborts. Covered by unit tests in Task 1.
4. **Rapid clicks back and forth mid-transition**: there must be no stuck half-transparent chrome and no "duplicate view-transition-name" console error. Covered by the manual check in Task 4.
5. **Reduced motion on**: no movement, no blur, no window frame flash. Covered by the manual check in Task 4.

---

### Task 1: Transition helpers + router wiring

**Files:**
- Create: `src/lib/view-transition.ts`
- Create: `src/lib/view-transition.test.ts`
- Modify: `src/router.tsx`
- Modify: `package.json` (add `test` script)

**Interfaces:**
- Produces:
  - `viewTransitionName(id: string, part?: "icon" | "title"): string`, which returns `work-<safe-id>` or `work-<safe-id>-<part>`.
  - `transitionTypes(info: { fromLocation?: { pathname: string }; toLocation: { pathname: string } }): string[] | false`

- [ ] **Step 1: Write the failing tests**

`src/lib/view-transition.test.ts`:
```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { transitionTypes, viewTransitionName } from "./view-transition.ts";

const at = (pathname: string) => ({ pathname });

test("names are derived from the work id", () => {
  assert.equal(viewTransitionName("Lyft"), "work-Lyft");
  assert.equal(viewTransitionName("Lyft", "icon"), "work-Lyft-icon");
  assert.equal(viewTransitionName("Lyft", "title"), "work-Lyft-title");
});

test("names are always valid css identifiers", () => {
  assert.equal(viewTransitionName("Big Co & Sons"), "work-Big-Co---Sons");
  assert.equal(viewTransitionName("3m", "icon"), "work-3m-icon");
});

test("home to work is forward", () => {
  assert.deepEqual(
    transitionTypes({ fromLocation: at("/"), toLocation: at("/work/Lyft") }),
    ["forward"],
  );
});

test("work to home is back", () => {
  assert.deepEqual(
    transitionTypes({ fromLocation: at("/work/Lyft"), toLocation: at("/") }),
    ["back"],
  );
});

test("everything else is a fade", () => {
  assert.deepEqual(
    transitionTypes({ fromLocation: at("/"), toLocation: at("/posts/1") }),
    ["fade"],
  );
  assert.deepEqual(
    transitionTypes({ fromLocation: at("/work/A"), toLocation: at("/work/B") }),
    ["fade"],
  );
});

test("no transition on first load or same-page navigation", () => {
  assert.equal(transitionTypes({ toLocation: at("/work/Lyft") }), false);
  assert.equal(
    transitionTypes({ fromLocation: at("/"), toLocation: at("/") }),
    false,
  );
});
```

Add to `package.json` `scripts`:
```json
"test": "node --test \"src/**/*.test.ts\"",
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm test`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `./view-transition.ts`.

- [ ] **Step 3: Implement**

`src/lib/view-transition.ts`:
```ts
type Location = { pathname: string };

// view-transition-name must be a valid css identifier, so anything odd in the id becomes "-"
export function viewTransitionName(id: string, part?: "icon" | "title") {
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "-");
  return part ? `work-${safe}-${part}` : `work-${safe}`;
}

// labels each navigation so styles.css can pick the matching animation
export function transitionTypes({
  fromLocation,
  toLocation,
}: {
  fromLocation?: Location;
  toLocation: Location;
}): string[] | false {
  // first load, nothing to animate from
  if (!fromLocation) return false;

  const from = fromLocation.pathname;
  const to = toLocation.pathname;
  if (from === to) return false;
  if (from === "/" && to.startsWith("/work/")) return ["forward"];
  if (from.startsWith("/work/") && to === "/") return ["back"];
  return ["fade"];
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test`
Expected: 6 tests pass.

- [ ] **Step 5: Wire into the router**

`src/router.tsx`: add the import and the option (keep the existing style of this file: single quotes, no semicolons):
```ts
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { transitionTypes } from './lib/view-transition'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    // also applies to the browser back/forward buttons
    defaultViewTransition: { types: transitionTypes },
  })
```

- [ ] **Step 6: Typecheck and lint**

Run: `npx tsc --noEmit; npx biome lint src/lib src/router.tsx`
Expected: tsc shows only the 4 baseline errors. Biome shows no lint errors in these files.

- [ ] **Step 7: Commit**

```bash
git add src/lib package.json src/router.tsx
git commit -m "feat: label navigations for view transitions"
```

---

### Task 2: WindowChrome component on the work page

**Files:**
- Create: `src/components/window-chrome.tsx`
- Modify: `src/routes/work/$id.tsx`

**Interfaces:**
- Consumes: `viewTransitionName(id)` from Task 1.
- Produces: `<WindowChrome id={string} path={string}>{children}</WindowChrome>`. The root element carries `view-transition-name: work-<id>` and `view-transition-class: work-box`.

- [ ] **Step 1: Create the component**

`src/components/window-chrome.tsx`:
```tsx
import { type ReactNode, useEffect, useState } from "react";
import { viewTransitionName } from "#/lib/view-transition";

const ease = "ease-[cubic-bezier(0.32,0.72,0,1)]";
// matches the row → window morph in styles.css
const SETTLE_DELAY = 300;

// renders as a window on first paint so the page transition captures the frame, then dissolves into the page
export function WindowChrome({
  id,
  path,
  children,
}: {
  id: string;
  path: string;
  children: ReactNode;
}) {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(true), SETTLE_DELAY);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`-mx-3 overflow-hidden rounded-lg border [view-transition-class:work-box] transition-colors duration-150 ${ease} motion-reduce:border-transparent motion-reduce:transition-none ${
        settled ? "border-transparent" : "border-gray-200"
      }`}
      style={{ viewTransitionName: viewTransitionName(id) }}
    >
      {/* title bar, same look as the hover preview in window.tsx */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-150 ${ease} motion-reduce:grid-rows-[0fr] motion-reduce:opacity-0 motion-reduce:transition-none ${
          settled ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex items-center gap-1.5 border-b border-gray-200 bg-gray-100 px-2 py-1.5">
            <span className="size-2 rounded-full bg-red-400" />
            <span className="size-2 rounded-full bg-yellow-400" />
            <span className="size-2 rounded-full bg-green-400" />
            <span className="ml-1 truncate text-[10px] text-gray-500">
              {path}
            </span>
          </div>
        </div>
      </div>

      <div className="p-3">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Wrap the work page content**

In `src/routes/work/$id.tsx`, import it and wrap the `<section>`. Change `mt-4` to `mt-1` to compensate for the new `p-3`:
```tsx
import { WindowChrome } from "#/components/window-chrome";
```
```tsx
      <main className="mt-1">
        <WindowChrome id={id} path={`/work/${id}`}>
          <section>
            {/* ...existing section content unchanged... */}
          </section>
        </WindowChrome>
      </main>
```

- [ ] **Step 3: Verify in the browser**

Run: `npm run dev`, then open `http://localhost:3000/work/Lyft` directly.
Expected:
- The window frame (border plus traffic-light title bar with `/work/Lyft`) is visible for about 300ms, then the title bar collapses and the border fades.
- The text stays left-aligned with the `<-- home` link.
- The console shows no hydration warnings.

Run: `npx tsc --noEmit; npx biome lint src/components/window-chrome.tsx "src/routes/work/\$id.tsx"`
Expected: 3 baseline tsc errors. The `id` one is gone now that it's used.

- [ ] **Step 4: Commit**

```bash
git add src/components/window-chrome.tsx "src/routes/work/\$id.tsx"
git commit -m "feat: window chrome that dissolves into the work page"
```

---

### Task 3: Shared elements + transition choreography

**Files:**
- Modify: `src/routes/index.tsx`
- Modify: `src/routes/work/$id.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes:
  - `viewTransitionName(id, part?)` from Task 1.
  - The `forward`/`back`/`fade` types from Task 1.
  - The `work-box` class from Task 2.
- Produces: the CSS classes `work-icon` and `work-title` (view-transition classes), and the utility class `.blur-in` using the `--i` custom property.

- [ ] **Step 1: Name the shared elements on the home row**

In `src/routes/index.tsx`, give `Icon` a `style` prop, define the id once, and split the label into its own span:
```tsx
import type { CSSProperties } from "react";
import { viewTransitionName } from "#/lib/view-transition";
```
```tsx
function Icon({
  src,
  alt,
  className = "",
  style,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={`size-4 object-contain ${className}`}
      style={style}
    />
  );
}
```
Row:
```tsx
            <li>
              <Link to="/work/$id" params={{ id: "Lyft" }}>
                <div
                  className="flex justify-between text-sm hover:underline hover:bg-stone-200/30 rounded [view-transition-class:work-box]"
                  style={{ viewTransitionName: viewTransitionName("Lyft") }}
                >
                  <span className="flex items-center gap-2 ">
                    <Icon
                      src={Lyft}
                      alt="Lyft logo"
                      className="[view-transition-class:work-icon]"
                      style={{ viewTransitionName: viewTransitionName("Lyft", "icon") }}
                    />
                    <span
                      className="[view-transition-class:work-title]"
                      style={{ viewTransitionName: viewTransitionName("Lyft", "title") }}
                    >
                      Lyft
                    </span>
                  </span>

                  <span className="text-gray-500">2026-2027</span>
                </div>
              </Link>
            </li>
```
(This also drops the stray `font-` class from the old row.)

- [ ] **Step 2: Name the matching elements on the work page and stagger the body**

In `src/routes/work/$id.tsx`, apply the same `Icon` `style` prop change as in Step 1, plus the `CSSProperties` and `viewTransitionName` imports. Then:
```tsx
          <section>
            <div className="flex gap-2 items-center">
              <Icon
                src={Lyft}
                alt="Lyft"
                className="size-10 [view-transition-class:work-icon]"
                style={{ viewTransitionName: viewTransitionName(id, "icon") }}
              />
              <h1
                className="text-xl [view-transition-class:work-title]"
                style={{ viewTransitionName: viewTransitionName(id, "title") }}
              >
                Software Engineer Intern @ Lyft
              </h1>
            </div>
            <h4
              className="text-xs text-gray-500 blur-in"
              style={{ "--i": 0 } as CSSProperties}
            >
              Sept. 2025 - Dec. 2025
            </h4>
            <div className="mt-2 blur-in" style={{ "--i": 1 } as CSSProperties}>
              {/* existing <p> unchanged */}
            </div>
          </section>
```

- [ ] **Step 3: Add the choreography CSS**

Append to `src/styles.css`:
```css
/* page transitions, see docs/superpowers/specs/2026-10-11-page-transition-design.md */

:root {
  --ease-notch: cubic-bezier(0.32, 0.72, 0, 1);
}

::view-transition-group(*) {
  animation-duration: 120ms;
  animation-timing-function: var(--ease-notch);
}

/* row → window morph */
::view-transition-group(.work-box),
::view-transition-group(.work-icon),
::view-transition-group(.work-title) {
  animation-duration: 300ms;
}

::view-transition-group(.work-box) {
  overflow: clip;
  border-radius: var(--radius-lg);
}

::view-transition-old(.work-box) {
  animation: 100ms var(--ease-notch) both vt-fade-out;
}

::view-transition-new(.work-box) {
  animation: 200ms var(--ease-notch) both vt-fade-in;
}

/* scale text by height so "Lyft" grows into the title instead of stretching */
::view-transition-old(.work-title),
::view-transition-new(.work-title) {
  block-size: 100%;
  inline-size: auto;
}

html:active-view-transition-type(forward)::view-transition-old(root) {
  animation: 60ms var(--ease-notch) both vt-blur-out;
}

html:active-view-transition-type(forward)::view-transition-new(root) {
  animation: 150ms var(--ease-notch) both vt-fade-in;
}

html:active-view-transition-type(back)::view-transition-group(.work-box),
html:active-view-transition-type(back)::view-transition-group(.work-icon),
html:active-view-transition-type(back)::view-transition-group(.work-title) {
  animation-duration: 280ms;
}

@keyframes vt-fade-in {
  from {
    opacity: 0;
  }
}

@keyframes vt-fade-out {
  to {
    opacity: 0;
  }
}

@keyframes vt-blur-out {
  to {
    opacity: 0;
    filter: blur(4px);
  }
}

/* body text settling in while the morph finishes */
@keyframes blur-in {
  from {
    opacity: 0;
    filter: blur(4px);
    translate: 0 4px;
  }
}

.blur-in {
  animation: blur-in 120ms var(--ease-notch) both;
  animation-delay: calc(150ms + var(--i, 0) * 25ms);
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*) {
    animation: none !important;
  }

  ::view-transition-old(*) {
    animation: 100ms ease both vt-fade-out !important;
  }

  ::view-transition-new(*) {
    animation: 100ms ease both vt-fade-in !important;
  }

  .blur-in {
    animation: none;
  }
}
```

- [ ] **Step 4: Verify in the browser (Chrome)**

Run: `npm run dev` and open `http://localhost:3000/`. Click Lyft.
Expected:
- The home header fades and blurs out almost immediately.
- The row grows into a bordered window with a title bar.
- The logo flies and grows. "Lyft" scales into the full title.
- The date and paragraph blur in.
- The frame dissolves. Total time is about 450ms.

Click `<-- home`.
Expected: the page shrinks back into the row with no title bar in about 280ms, and the logo returns.

Slow it down to inspect: DevTools → Animations panel → playback 10%.

Run: `npx tsc --noEmit; npx biome lint src/routes`
Expected: only the 3 remaining baseline tsc errors, and no new lint errors.

- [ ] **Step 5: Commit**

```bash
git add src/routes src/styles.css
git commit -m "feat: row-to-window page transition"
```

---

### Task 4: Edge-case verification

**Files:** none expected. Fix anything found here in the file that owns it and commit it with the fix.

- [ ] **Step 1: Browser buttons.** Go `/` → Lyft, then press the browser Back button, then Forward. Expected: the Back button plays the `back` animation and the Forward button plays the `forward` animation.
- [ ] **Step 2: Rapid clicks.** Click Lyft, then immediately `<-- home`, about 5 times quickly. Expected:
  - No console errors (in particular, no `Unexpected duplicate view-transition-name`).
  - The chrome never stays stuck visible.
  - The final page looks normal.
- [ ] **Step 3: Direct load.** Hard-refresh on `/work/Lyft`. Expected: no view transition, the chrome dissolves as an intro, and there are no hydration warnings.
- [ ] **Step 4: Reduced motion.** DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce". Navigate both ways. Expected: about a 100ms crossfade, no movement, no blur, and no title bar ever visible.
- [ ] **Step 5: Unsupported browser fallback.** In Firefox (or another browser without View Transitions), navigate both ways. Expected: navigation works. In browsers without the API it's instant, apart from the chrome intro.
- [ ] **Step 6: Unit tests and build.** Run `npm test && npm run build`. Expected: the tests pass and the build succeeds.
- [ ] **Step 7: Commit any fixes.**

```bash
git add -A src
git commit -m "fix: page transition edge cases"
```
(Skip this if there was nothing to fix.)
