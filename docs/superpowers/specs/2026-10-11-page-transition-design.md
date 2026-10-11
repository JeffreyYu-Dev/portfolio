# Page Transition: "The Row Opens Into a Window"

Date: 2026-10-11
Status: Approved design, pending spec review

## Intent

An awwwards-quality transition between the home page (`/`) and a work page
(`/work/$id`) that matches the portfolio's quiet, minimal aesthetic and reuses
its existing motifs: the macOS-style `Window` hover preview and the Notch
easing curve.

Success criteria:
- Feels like one continuous motion: the clicked row physically becomes the page.
- Fast: forward ≤ ~700ms including the frame dissolve, back ~400ms.
- Back is the same motion reversed.
- Respects `prefers-reduced-motion`; degrades to instant navigation where the
  View Transitions API is unsupported.
- No new dependencies.

## Choreography

Easing everywhere: `cubic-bezier(0.32, 0.72, 0, 1)` (the Notch curve).

### Forward: `/` → `/work/$id` (~700ms)

| Time        | What happens |
|-------------|--------------|
| 0–80ms      | Everything except the clicked row fades out with a slight blur (root old snapshot). |
| 80–450ms    | Row's box morphs into the work page's content box; corners round to `rounded-lg`. A gray title bar with traffic lights is part of the new snapshot, so it fades in as the box grows. |
| 80–450ms    | Logo flies from row (16px) to header (40px). Row label "Lyft" crossfades into the full title. |
| 450–700ms   | Live page shows; `WindowChrome` fades its title bar (height → 0) and border to transparent. Body paragraphs blur-in with a 40ms stagger. |

### Back: `/work/$id` → `/` (~400ms)

The shared elements morph in reverse (page box → row, 40px logo → 16px, title →
"Lyft"). The window chrome is not re-shown on back; it's a shrink, not a
re-open. The home page's other content fades in.

### Other navigations

Anything without a transition type (typed URL, `/posts/*`, initial load) gets
the browser default crossfade at 150ms, or nothing on initial load.

## Architecture

Built on the View Transitions API via TanStack Router's built-in support.

### Transition types

- Links from `/` to a work page: `viewTransition={{ types: ["forward"] }}`.
- Back link on the work page: `viewTransition={{ types: ["back"] }}`.
- CSS selects per-direction animations with
  `html:active-view-transition-type(forward)` / `(back)`.

### Shared element names

Names derive from the work `id` so the system works for every future work item:

| Name                  | Home page element        | Work page element             |
|-----------------------|--------------------------|-------------------------------|
| `work-{id}`           | The row `<div>`          | `WindowChrome` container      |
| `work-{id}-icon`      | Row icon `<img>`         | Header icon `<img>`           |
| `work-{id}-title`     | Row label `<span>`       | Header `<h1>`                 |

Set via inline `style={{ viewTransitionName: ... }}`. Names must be unique on a
page; one row per id guarantees that.

### Units

1. **`src/styles.css`**: all transition CSS:
   - `::view-transition-group(*)` easing + duration defaults.
   - Forward/back timing for `::view-transition-old(root)` / `new(root)`.
   - Morph groups (`work-*`) use `animation-duration` 370ms forward, 400ms back.
   - Title groups: old/new snapshots keep their natural size
     (`::view-transition-old/new(work-*-title) { height: 100%; width: auto;
     object-fit: none; object-position: left center; }`) so the text crossfades
     instead of stretching.
   - `.blur-in` keyframe + `--i` custom property for stagger delay.
   - `@media (prefers-reduced-motion: reduce)`: all `::view-transition-*`
     animations become a 150ms opacity crossfade; `.blur-in` disabled.
2. **`src/components/window-chrome.tsx`** (new): wraps work page content.
   - Props: `id: string`, `title: string` (shown in the title bar, e.g. `/work/lyft`), `children`.
   - On mount renders border + title bar (traffic lights, path text) fully
     visible, so the View Transitions new-state snapshot captures them.
   - After 450ms (`useEffect` timeout), sets `settled` state; CSS transitions
     collapse the title bar (`grid-template-rows: 1fr → 0fr`) and fade the
     border to transparent over 250ms.
   - If reduced motion is preferred, starts settled.
   - Visual styling mirrors `Window`'s title bar (same classes) for continuity.
3. **`src/routes/index.tsx`**: add `viewTransition` + names to the work row link.
4. **`src/routes/work/$id.tsx`**: wrap content in `WindowChrome`; add names to
   header icon/title; back link gets `viewTransition={{ types: ["back"] }}`;
   body paragraphs get `.blur-in` with `--i`.

`router.tsx` is not changed: transitions are opt-in per link so only work
navigation gets the full effect.

## Edge cases

- **Unsupported browsers**: `document.startViewTransition` missing → router
  navigates normally; `WindowChrome` still does its dissolve, which reads as a
  subtle intro on its own.
- **Direct load of `/work/$id`**: no view transition; `WindowChrome` dissolve +
  blur-in act as the page intro.
- **Rapid clicks / interrupted transition**: browser skips the in-flight
  transition and jumps to the new state; `WindowChrome` timeout is cleared on
  unmount.
- **Hover preview open on click**: the `Window` popup (if a row uses it) would
  be in the old snapshot. Not an issue today (the work row uses `Link`, not
  `Window`); if a row later uses `Window`, hide the popup on click.
- **Scroll position**: the column sits near the top; `scrollRestoration` is
  already on. No special handling.

## Verification

No test framework exists; verification is manual in the browser via `npm run dev`:
1. Forward `/` → `/work/Lyft`: row morphs, logo flies, chrome appears then dissolves, body staggers in.
2. Back: reverse shrink, no chrome flash.
3. Rapid back/forward clicks: no stuck states or duplicated names errors in console.
4. Reduced motion (DevTools rendering emulation): plain crossfade only.
5. Direct load of `/work/Lyft`: intro dissolve plays, no errors.
6. `npm run check` (Biome) and `npm run build` pass.

## Out of scope (possible follow-ups)

- Text scramble on the title.
- Sound.
- Transitions for `/posts/*`.
