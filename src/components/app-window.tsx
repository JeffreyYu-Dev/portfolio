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

const Current = createContext<{ id: string; focused: boolean } | null>(null);

// windows stack among themselves in here, always under the dock and the notch
// however high their focus order climbs
export function WindowLayer({ children }: { children: ReactNode }) {
  return <div className="relative z-30 max-md:hidden">{children}</div>;
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
      !(target instanceof Element) ||
      !target.closest("[data-window-drag]") ||
      target.closest(NOT_DRAG)
    )
      return;

    // stop the press from selecting text as it drags
    e.preventDefault();
    const frame = e.currentTarget;
    const offsetX = e.clientX - win.x;
    const offsetY = e.clientY - win.y;
    const startX = e.clientX;
    const startY = e.clientY;
    const bounds = screen();
    let at = { x: win.x, y: win.y };
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
      }
      at = clampedPosition(
        win.w,
        ev.clientX - offsetX,
        ev.clientY - offsetY,
        bounds,
      );
      frame.style.left = `${at.x}px`;
      frame.style.top = `${at.y}px`;
    }
    // on window, so letting go outside the frame before the drag starts still ends it
    function end() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      if (dragging) moveWindow(id, at.x, at.y);
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

  // zoomed fills the desktop below the notch strip. the saved spot is kept for later
  const place: CSSProperties = win.zoomed
    ? { left: 0, top: MENU_BAR, right: 0, bottom: 0 }
    : { left: win.x, top: win.y, width: win.w, height: win.h };

  return (
    <Current.Provider value={{ id, focused }}>
      <section
        aria-label={label}
        // minimized windows stay mounted so they come back as they were
        hidden={win.minimized}
        inert={win.minimized}
        onPointerDown={onPointerDown}
        onDoubleClick={onDoubleClick}
        style={{ ...place, zIndex: win.z }}
        className={`fixed flex flex-col overflow-hidden ${
          win.zoomed ? "" : "rounded-xl shadow-2xl ring-1 ring-black/10"
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
      aria-label={label}
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
