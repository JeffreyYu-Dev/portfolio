# macOS Desktop Portfolio

Date: 2026-10-13
Status: Approved vision (portfolio lives in the browser window). Each phase
below gets its own spec → plan → build cycle

## Intent

Turn the site into a macOS desktop simulator modelled on Jeffrey's actual Mac
setup. **The portfolio is the main focus and lives in a browser window** that is
open and focused on load. The desktop around it (menu bar, dock, icons, other
apps) is the "this is my Mac" layer for people who want to explore.

What he said:
- Build a macOS desktop sim: draggable windows, a menu bar, desktop icons.
- The portfolio could be the browser, and it should be the main focus.
- The site is inspired by his real setup: boring.notch (already built), a dock
  on the **right** side, Zed as the editor, Ghostty as the terminal.
- The About page should cover what he likes and knows. He has played games all
  his life, watches TV shows, anime and true crime, likes going out, snowboards
  and travels, and likes coding and computers.
- It should be a way to connect personally: Instagram, Discord, or playing a
  game together.
- He wants it more colourful and inspiring, per the scrapbook references.
- Animations should be minimal (stated about the dock, applies site-wide).

Assumptions (correct these):
- It's a fixed-size desktop like a real screen, not an infinite pan/zoom canvas.
- Phones get the browser content full-screen, not a shrunken desktop.
- Every portfolio page keeps its real URL, so `/about` and `/projects/renao`
  can be shared and load straight into the browser window.

Success criteria:
- A first-time visitor sees the portfolio immediately, without exploring.
- It feels like his Mac rather than a generic "macOS in the browser" demo.
- Content is reachable without the window manager: deep links, phones, no JS.
- Motion stays minimal. Windows open and close near-instantly, no genie or
  bounce effects, and `prefers-reduced-motion` is respected.

## Layout

```
┌──────────────────────────── menu bar ─────────[notch]──────────── clock ┐
│                                                                    ┌──┐ │
│  [Projects]    ┌──────── Browser ─────────────┐                   │  │ │
│  [Work]        │ ● ● ●  jeffreyyu.dev/        │                   │D │ │
│  [About Me]    │                              │   ┌─ Ghostty ─┐   │o │ │
│  [Résumé.pdf]  │   the portfolio (routes)     │   │ $ whoami  │   │c │ │
│                │                              │   └───────────┘   │k │ │
│                └──────────────────────────────┘                   └──┘ │
└──────────────────────────────── wallpaper ──────────────────────────────┘
```

## The bridge: Apple chrome, scrapbook content

The references solve the "colourful vs. macOS" tension the same way. A clean
Apple UI surface (a Calendar window, a contact card, a captcha) acts as the
backdrop, and polaroids, binder clips, washi tape and stickers are layered over
it, slightly rotated and overlapping. So the window frames, menu bar and dock
stay crisp and neutral, and colour comes from photos and stickers in the
content. The desktop wallpaper is the other place colour can live.

## Mapping the real setup to the site

| On his Mac       | On the site | Shows |
|------------------|-------------|-------|
| Browser          | **Browser window (main)** | The portfolio. Open and focused on load. Address bar shows the real URL, back/forward drive the router |
| boring.notch     | `Notch` (done) | Now playing (Spotify), live activities |
| Dock (right side)| `Dock` (built at bottom, **move to right** to match) | App launchers, running dots |
| Menu bar         | New `MenuBar` | Apple menu, focused app name + menus, clock and status icons on the right. The notch sits in the middle like a real notched MacBook |
| Desktop          | New `Desktop` | Wallpaper + icons: `Projects`, `Work`, `About Me`, `Résumé.pdf`. Double-click navigates the browser |
| Ghostty          | Ghostty window | Fake shell: `whoami`, `ls projects`, `open renao` (navigates the browser), easter eggs |
| Zed              | Zed window | A project's source/README in a Zed-styled editor, the "I code" angle |
| Preview          | Résumé.pdf | The PDF in a Preview-styled window |
| Finder           | Optional | Less needed now that the browser holds the portfolio |

## Architecture

### Browser window

- Renders the router's `<Outlet />` directly inside the window frame, **not an
  iframe**. An iframe would load the whole app again inside itself, and its URL
  would drift from the real one.
- Address bar shows a display domain plus the current path. Typing a path
  navigates. Back/forward call the router's history.
- Existing pages, data and page transitions (`page-transition.ts`) keep working
  unchanged inside it. Its `[data-page]` container moves from `__root.tsx` into
  the browser window.
- External links (Western, GitHub, live demos) can open as extra tabs using an
  iframe, as the existing `Window` hover preview already does, or as a real new tab
  for sites that block framing.

### Browser look: Zen-inspired

Modelled on Zen Browser rather than Safari:
- A vertical sidebar on the left holds the traffic lights, back/forward/reload,
  the URL field, an "Essentials" grid of pinned icons (GitHub, LinkedIn, Mail,
  Résumé) and a vertical tab list (Home, Work, Projects, About...).
- The page sits in a rounded content card inset from the frame, with a small gap
  around it.
- The frame is tinted with a soft workspace gradient instead of flat grey.
- Tabs map to routes: clicking one navigates. The active tab follows the URL.

### Wallpaper

His own image, served from `/public` (e.g. `public/wallpaper.jpg`), set as the
desktop background with `object-fit: cover`.

### Window manager

A small external store in the style of `src/lib/notch-store.ts`
(`useSyncExternalStore`, no new dependency):

```ts
type Win = {
  id: string;        // e.g. "browser", "ghostty"
  app: AppId;
  title: string;
  x: number; y: number; w: number; h: number;
  z: number;         // focus order
  minimized: boolean;
};
// openWindow, closeWindow, focusWindow, moveWindow, resizeWindow, minimize
```

- Dragging by the title bar uses pointer events, clamped below the menu bar.
- Traffic lights: close, minimize (to the dock), zoom (fill the desktop).
- The focused window sets the app name in the menu bar.
- Positions persist in `localStorage` so a revisit looks the same.
- Closing the browser leaves it in the dock. Clicking it reopens on the same URL.

### App registry

`src/data/apps.ts` lists each app: `{ id, name, icon, component, defaultSize,
dock: boolean }`. The dock, the desktop icons and the window manager all read
from this list instead of hard-coding apps. That replaces the hand-written
items in today's `dock.tsx`.

### Routing

- Routes stay the source of truth and only ever describe what the **browser**
  shows. Other windows (Ghostty, Zed) are not in the URL.
- Any route loads the desktop with the browser open on that page.
- On phones and with JS off, the desktop chrome is skipped and the route renders
  as a plain page (today's layout).

## About Me (the scrapbook)

Placement is open (see Open questions): a page inside the browser like the
others, or its own Photos-style app on the desktop. Either way it's built from
topic "boards". Each board pairs an Apple app card as its base with polaroids
and stickers layered on top:

- **Places**: a Calendar or Maps card with trip photos clipped on, plus
  snowboarding shots.
- **Games**: a Game Center card listing what he plays and how long, plus
  screenshots, ranks or mastery cards.
- **Shows**: a TV app "Up Next" card covering TV, anime and true crime.
- **Me & code**: his setup, Zed and Ghostty, what he's into building.
- **Meet Me**: a contact card (as in the reference) with Instagram, Discord
  and gamer tags, the "come play with me" call to action.
- **Captcha game**: "select all squares with things I like", a playful
  interactive grid built from his photos.

Content lives in `src/data/about.ts` (already exists with placeholder text) and
will grow to list boards, photos and stickers.

## Phases

Each phase ships on its own and is useful without the next one.

1. **Desktop + browser window**: wallpaper, the portfolio inside a fixed
   browser window with a working address bar and back/forward. Not draggable yet.
2. **Menu bar + dock on the right**: menu bar around the notch, dock moved to
   the right and driven by the app registry.
3. **Window manager**: dragging, focus order, traffic lights, minimize to dock.
   Desktop icons.
4. **About Me scrapbook**: boards, polaroid/sticker components, Meet Me card.
5. **Ghostty**: fake shell with commands that drive the browser.
6. **Zed**: project code/README viewer.
7. **Preview + external tabs**: résumé window, iframe tabs for external links.
8. **Phone layout pass**: make sure every route degrades cleanly.

## Open questions

- **About Me placement**: a page in the browser (seen by every visitor) or its
  own desktop app (a reward for exploring)?
- **Photos**: does he have his own snowboarding, travel, game and setup
  photos, or start with placeholders? The scrapbook depends on these.
- **Stickers**: hand-picked image assets (PNG/SVG) or drawn in CSS? Licensing
  matters if they're taken from elsewhere.
- **Display domain** in the address bar: his real domain once he has one?
