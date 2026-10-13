import {
  type AppId,
  closeWindow,
  focusWindow,
  useWindow,
} from "#/lib/window-store";
import { type ReactNode, useEffect, useRef } from "react";

// a mac window, centred over the browser. not draggable yet (phase 3). renders
// nothing while closed, so its contents start fresh each time it opens.
// the traffic lights float over the top-left, like mail's sidebar on macos
export function AppWindow({
  id,
  title,
  children,
}: {
  id: AppId;
  title: string;
  children: ReactNode;
}) {
  const win = useWindow(id);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (win.open) ref.current?.focus();
  }, [win.open]);

  if (!win.open) return null;

  return (
    // the same insets as the desktop, so it clears the notch and the dock
    <div className="pointer-events-none fixed inset-0 z-30 hidden items-center justify-center px-10 pt-12 pb-16 md:flex">
      <div
        ref={ref}
        role="dialog"
        aria-label={title}
        tabIndex={-1}
        style={{ zIndex: win.z }}
        onPointerDown={() => focusWindow(id)}
        onKeyDown={(e) => {
          if (e.key === "Escape") closeWindow(id);
        }}
        className="pointer-events-auto relative h-full max-h-[560px] w-full max-w-[900px] overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/15 outline-none"
      >
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <button
            type="button"
            aria-label={`Close ${title}`}
            onClick={() => closeWindow(id)}
            className="size-3 rounded-full bg-[#ff5f57] ring-1 ring-black/10 ring-inset"
          />
          {/* minimize and zoom arrive with the window manager */}
          <span
            aria-hidden="true"
            className="size-3 rounded-full bg-[#febc2e] ring-1 ring-black/10 ring-inset"
          />
          <span
            aria-hidden="true"
            className="size-3 rounded-full bg-[#28c840] ring-1 ring-black/10 ring-inset"
          />
        </div>
        {children}
      </div>
    </div>
  );
}
