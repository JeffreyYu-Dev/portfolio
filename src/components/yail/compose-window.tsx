import { Compose } from "#/components/mail/compose";
import { discardDraft } from "#/lib/mail-store";
import {
  closeCompose,
  expand,
  minimise,
  restore,
  useCompose,
} from "#/lib/yail-compose";
import { showSent } from "#/lib/yail-toast";
import { Maximize2, Minimize2, Minus, X } from "lucide-react";
import type { ReactNode } from "react";

// gmail's new message window, docked bottom-right of yail. minimised it's just the
// header bar. the form stays mounted (hidden) so nothing typed is lost meanwhile
export function ComposeWindow() {
  const { mode, initial, key } = useCompose();
  if (mode === "closed" || !initial) return null;
  const min = mode === "minimised";
  const big = mode === "expanded";

  const box = min
    ? "absolute right-6 bottom-0 w-60"
    : big
      ? "absolute inset-x-[5%] top-[5%] bottom-[5%] md:inset-x-[10%]"
      : "absolute right-6 bottom-0 h-[min(460px,calc(100%-1rem))] w-[min(420px,calc(100%-3rem))]";

  return (
    <>
      {big && (
        <button
          type="button"
          aria-label="Exit full screen"
          onClick={restore}
          className="absolute inset-0 z-30 bg-black/40 max-md:hidden"
        />
      )}
      <section
        aria-label="New Message"
        className={`${box} z-40 flex flex-col overflow-hidden rounded-t-lg shadow-[0_8px_10px_1px_rgba(0,0,0,.14),0_3px_14px_2px_rgba(0,0,0,.12)] max-md:fixed ${
          min
            ? ""
            : "max-md:inset-0 max-md:h-auto max-md:w-auto max-md:rounded-none"
        } ${big ? "rounded-b-lg" : ""}`}
      >
        <header className="flex h-8 shrink-0 items-center bg-[#404040] pl-4 text-xs font-medium text-white">
          <button
            type="button"
            onClick={min ? restore : minimise}
            className="h-full flex-1 truncate text-left"
          >
            New Message
          </button>
          <HeaderButton
            label={min ? "Restore" : "Minimise"}
            onClick={min ? restore : minimise}
          >
            <Minus />
          </HeaderButton>
          <HeaderButton
            label={big ? "Exit full screen" : "Full screen"}
            onClick={big ? restore : expand}
          >
            {big ? <Minimize2 /> : <Maximize2 />}
          </HeaderButton>
          <HeaderButton label="Save & close" onClick={closeCompose}>
            <X />
          </HeaderButton>
        </header>
        <div className={min ? "hidden" : "min-h-0 flex-1"}>
          <Compose
            key={key}
            initial={initial}
            onSent={(sent) => {
              closeCompose();
              showSent(sent.id);
            }}
            onDiscard={() => {
              discardDraft();
              closeCompose();
            }}
          />
        </div>
      </section>
    </>
  );
}

function HeaderButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-full w-7 place-items-center hover:bg-white/10 [&>svg]:size-3.5"
    >
      {children}
    </button>
  );
}
