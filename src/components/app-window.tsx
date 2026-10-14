import {
  clampedPosition,
  closeWindow,
  focusWindow,
  MENU_BAR,
  minimizeWindow,
  moveWindow,
  screen,
  toggleZoom,
  topmost,
  useWindows,
  type Rect,
  type Win,
} from "#/lib/window-store";
import { Minus, Plus, X } from "lucide-react";
import {
  type CSSProperties,
  createContext,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useContext,
} from "react";

// each app draws its own chrome, like real mac apps do. anything marked
// data-window-drag is a handle: drag it to move the window, double-click to zoom.
// controls inside a handle stay clickable
const NOT_DRAG = "button, a, input, textarea, select, [data-no-drag]";
// px a press has to travel before it counts as a drag
const DRAG_FROM = 3;
// tailwind's md, where the desktop starts
const DESKTOP = "(min-width: 48rem)";

const Current = createContext<{ id: string; focused: boolean } | null>(null);

// windows stack among themselves in here, always under the dock and the notch
// however high their focus order climbs. on phones there's no desktop: the
// browser is the page, and other apps hide themselves
export function WindowLayer({ children }: { children: ReactNode }) {
  return <div className="md:relative md:z-30">{children}</div>;
}

// a window's four edges, so every move between placed, css-placed and zoomed is
// the same four values changing and can ease between them
function edges(win: Win): CSSProperties {
  if (win.zoomed)
    return edgeVars("0px", `${MENU_BAR}px`, "0px", "0px");
  if (!win.rect)
    // clear of the notch and the dock, at most 72rem wide and centred
    return edgeVars(CENTRED, "3rem", CENTRED, "4rem");
  return rectVars(win.rect);
}

const CENTRED = "max(2.5rem, calc((100% - 72rem) / 2))";

function rectVars({ x, y, w, h }: Rect) {
  return edgeVars(
    `${x}px`,
    `${y}px`,
    `calc(100% - ${x + w}px)`,
    `calc(100% - ${y + h}px)`,
  );
}

function edgeVars(left: string, top: string, right: string, bottom: string) {
  return {
    "--left": left,
    "--top": top,
    "--right": right,
    "--bottom": bottom,
  } as CSSProperties;
}

export function AppWindow({
  id,
  label,
  className = "",
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const state = useWindows();
  const win = state.windows[id];
  if (!win) return null;
  const focused = topmost(state) === id;

  function onPointerDown(e: PointerEvent<HTMLElement>) {
    focusWindow(id);
    const target = e.target;
    if (
      !win ||
      win.zoomed ||
      e.button !== 0 ||
      // on phones the windows are plain pages, with nothing to drag
      !matchMedia(DESKTOP).matches ||
      !(target instanceof Element) ||
      !target.closest("[data-window-drag]") ||
      target.closest(NOT_DRAG)
    )
      return;

    // stop the press from selecting text as it drags
    e.preventDefault();
    const frame = e.currentTarget;
    // measured, since a window css placed has no rect yet
    const box = frame.getBoundingClientRect();
    const start = { x: box.left, y: box.top, w: box.width, h: box.height };
    const startX = e.clientX;
    const startY = e.clientY;
    const bounds = screen();
    let at = start;
    let dragging = false;

    // the frame follows the pointer by itself and the store hears about it once,
    // on letting go, so nothing re-renders mid-drag
    function move(ev: globalThis.PointerEvent) {
      // a press that barely moves is a click. capturing it would retarget the
      // click and double-click onto the whole frame
      if (!dragging) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < DRAG_FROM)
          return;
        dragging = true;
        frame.setPointerCapture(ev.pointerId);
        // the edges ease when zooming, but a drag has to stick to the pointer
        frame.dataset.dragging = "";
      }
      at = {
        ...start,
        ...clampedPosition(
          start.w,
          start.x + ev.clientX - startX,
          start.y + ev.clientY - startY,
          bounds,
        ),
      };
      for (const [name, value] of Object.entries(rectVars(at)))
        frame.style.setProperty(name, value);
    }
    // on window, so letting go outside the frame before the drag starts still ends it
    function end() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      if (!dragging) return;
      moveWindow(id, at);
      delete frame.dataset.dragging;
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }

  function onDoubleClick(e: MouseEvent<HTMLElement>) {
    const target = e.target;
    if (
      target instanceof Element &&
      target.closest("[data-window-drag]") &&
      !target.closest(NOT_DRAG)
    )
      toggleZoom(id);
  }

  return (
    <Current.Provider value={{ id, focused }}>
      <section
        aria-label={label}
        // minimized windows stay mounted so they come back as they were
        hidden={win.minimized}
        inert={win.minimized}
        onPointerDown={onPointerDown}
        onDoubleClick={onDoubleClick}
        style={{ ...edges(win), zIndex: win.z }}
        // all placement is md and up. on phones it's a plain block in the page
        className={`md:fixed md:top-(--top) md:right-(--right) md:bottom-(--bottom) md:left-(--left) md:flex md:flex-col md:overflow-hidden md:transition-[top,right,bottom,left,border-radius] md:duration-[400ms] md:ease-out md:motion-reduce:transition-none! md:data-dragging:transition-none! ${
          win.zoomed
            ? "md:rounded-none"
            : "md:rounded-xl md:shadow-2xl md:ring-1 md:ring-black/10"
        } ${className}`}
      >
        {children}
      </section>
    </Current.Provider>
  );
}

// close, minimize and zoom for the window they're in. grey while another window
// is in front, and the glyphs show on hover, like macos
export function TrafficLights() {
  const current = useContext(Current);
  if (!current) return null;
  const { id, focused } = current;

  return (
    <div className="group flex items-center gap-2">
      <Light
        label="Close"
        color="bg-[#ff5f57]"
        hover="group-hover:bg-[#ff5f57]"
        lit={focused}
        onClick={() => closeWindow(id)}
      >
        <X strokeWidth={3} />
      </Light>
      <Light
        label="Minimize"
        color="bg-[#febc2e]"
        hover="group-hover:bg-[#febc2e]"
        lit={focused}
        onClick={() => minimizeWindow(id)}
      >
        <Minus strokeWidth={3} />
      </Light>
      <Light
        label="Zoom"
        color="bg-[#28c840]"
        hover="group-hover:bg-[#28c840]"
        lit={focused}
        onClick={() => toggleZoom(id)}
      >
        <Plus strokeWidth={3} />
      </Light>
    </div>
  );
}

function Light({
  label,
  color,
  hover,
  lit,
  onClick,
  children,
}: {
  label: string;
  color: string;
  // the same colour, spelled out in full so tailwind generates it
  hover: string;
  lit: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={`${label} window`}
      title={label}
      onClick={onClick}
      // hovering the group lights them up even in a background window
      className={`grid size-3 place-items-center rounded-full ring-1 ring-black/10 ring-inset ${
        lit ? color : `bg-neutral-300 ${hover}`
      }`}
    >
      <span className="text-black/60 opacity-0 group-hover:opacity-100 [&>svg]:size-2">
        {children}
      </span>
    </button>
  );
}
