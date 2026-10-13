import { useRouter } from "@tanstack/react-router";
import gsap from "gsap";
import { type MouseEvent, useLayoutEffect } from "react";
import { type Activity, announce } from "#/lib/live-activity";

// masked line reveal between pages, all in one continuous motion:
// - on click the current page is snapshotted into an overlay and the route
//   changes right away
// - the overlay's lines slide up out of their masks, top to bottom
// - elements tagged with morph() that share a key with the next page start
//   flying from where they were into their spot on the new page immediately
// - the new page's lines rise in from their masks as the old ones clear

// stagger is spread over a fixed total so long pages stay as quick as short ones:
// out in ~0.3s, in in ~0.6s
const EXIT = { duration: 0.22, stagger: { amount: 0.08 }, ease: "power2.in" };
const ENTER = { duration: 0.5, stagger: { amount: 0.12 }, ease: "power4.out" };
// the title moves the instant you click, then glides to a soft stop
const MORPH = { duration: 0.8, ease: "power2.out" };
// new lines start rising as the old ones finish clearing
const ENTER_DELAY = 0.2;

// where each morph element was when we left, keyed by its morph name
let pending: { rects: Map<string, DOMRect>; at: number } | null = null;

const reducedMotion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;

// tags an element that morphs into its twin on the other page
export function morph(key: string, part: "icon" | "title") {
  return { "data-morph": `${key}-${part}` };
}

const linesIn = (root: ParentNode) => [
  ...root.querySelectorAll<HTMLElement>("[data-line]"),
];
const inner = (line: HTMLElement) => line.firstElementChild as HTMLElement;
const pageEl = () => document.querySelector<HTMLElement>("[data-page]");

function leave(key: string) {
  const page = pageEl();
  if (!page) return;

  const kept = [...page.querySelectorAll<HTMLElement>(`[data-morph^="${key}-"]`)];
  pending = {
    rects: new Map(
      kept.map((el) => [el.dataset.morph ?? "", el.getBoundingClientRect()]),
    ),
    at: performance.now(),
  };

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
  // the real morph elements fly from these spots, so the copies step aside
  for (const el of ghost.querySelectorAll<HTMLElement>(`[data-morph^="${key}-"]`))
    el.style.visibility = "hidden";
  // no need to reload any open link previews
  for (const frame of ghost.querySelectorAll("iframe")) frame.remove();
  document.body.append(ghost);
  // hidden until the next page's first layout, see usePageEnter
  page.style.visibility = "hidden";

  const lines = linesIn(ghost).filter(
    (line) => !line.querySelector(`[data-morph^="${key}-"]`),
  );
  // re-arm the masks, they're turned off once a line has settled
  for (const line of lines) line.style.overflow = "clip";

  const targets = lines.map(inner);
  const remove = () => ghost.remove();
  if (reducedMotion()) {
    gsap.to(ghost, { opacity: 0, duration: 0.15, onComplete: remove });
  } else {
    gsap.to(targets, { yPercent: -110, ...EXIT, onComplete: remove });
  }
}

// onClick for a link that should play the page transition.
// pass an activity to have the notch show what's opening
export function useLeave(key: string, activity?: Activity) {
  const router = useRouter();

  return (e: MouseEvent<HTMLAnchorElement>) => {
    // let new-tab clicks through untouched
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;
    e.preventDefault();

    leave(key);
    if (activity) announce(activity);
    router.navigate({ href: e.currentTarget.getAttribute("href") ?? "/" });
  };
}

// call once per page: reveals its lines and flies in matching morph elements
export function usePageEnter() {
  useLayoutEffect(() => {
    const last = pending;
    // stale if the navigation took a while or came from somewhere else.
    // cleared on a timeout rather than here so a strict-mode re-run still sees it
    const fresh = last && performance.now() - last.at < 1000 ? last : null;
    setTimeout(() => {
      if (pending === last) pending = null;
    });

    const page = pageEl();
    if (page) page.style.visibility = "";
    const lines = page ? linesIn(page) : [];
    const settle = () => {
      // drop the masks so popovers (like <Window>) aren't clipped
      for (const line of lines) line.style.overflow = "visible";
    };

    const ctx = gsap.context(() => {
      if (reducedMotion()) {
        gsap.fromTo(
          lines.map(inner),
          { y: 0, yPercent: 0, opacity: 0 },
          { opacity: 1, duration: 0.15, onComplete: settle },
        );
        return;
      }

      const morphed = [
        ...document.querySelectorAll<HTMLElement>("[data-morph]"),
      ].filter((el) => fresh?.rects.has(el.dataset.morph ?? ""));

      // a line holding a morph element flies with it instead of rising.
      // settle these before measuring, or the hidden-before-js offset
      // in styles.css skews where the morph thinks it lands
      const [held, rising] = partition(lines, (line) =>
        morphed.some((el) => line.contains(el)),
      );
      for (const line of held) line.style.overflow = "visible";
      // y: 0 overrides that offset
      gsap.set(held.map(inner), { y: 0, yPercent: 0 });

      for (const el of morphed) {
        const from = fresh?.rects.get(el.dataset.morph ?? "");
        if (!from) continue;
        const to = el.getBoundingClientRect();
        gsap.from(el, {
          x: from.left - to.left,
          y: from.top - to.top,
          // both ends show the same text, so width gives an exact size match
          scale: from.width / to.width,
          transformOrigin: "0 0",
          ...MORPH,
          // drop the gpu layer when done so the text renders crisp again
          force3D: "auto",
        });
      }

      gsap.fromTo(
        rising.map(inner),
        { y: 0, yPercent: 110 },
        {
          yPercent: 0,
          ...ENTER,
          delay: fresh ? ENTER_DELAY : 0,
          onComplete: settle,
        },
      );
    });

    return () => ctx.revert();
  }, []);
}

function partition<T>(items: T[], test: (item: T) => boolean) {
  const yes: T[] = [];
  const no: T[] = [];
  for (const item of items) (test(item) ? yes : no).push(item);
  return [yes, no];
}
