import { firstTrack } from "#/components/notch-player";
import { bootState, setBoot, useBoot } from "#/lib/boot";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { useEffect, useRef } from "react";

gsap.registerPlugin(CustomEase);
// the notch's own easing, so the collapse lands like the notch opening and closing
const notchEase = CustomEase.create("notch", "0.32,0.72,0,1");

// held at least this long so it never just flickers, and never longer than the max
// so a slow spotify can't keep the page hostage
const MIN_MS = 1200;
const MAX_MS = 3500;
// counter creeps toward this while waiting, then runs to 100 once the track is in
const CREEP_TO = 90;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const reducedMotion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;

// the first visit of a session starts as if the notch fills the whole screen,
// then it shrinks back into the pill while the page rises in behind it
export function Boot() {
  const state = useBoot();
  const ref = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // the hook still says booting while hydrating, the module knows better
    const el = ref.current;
    if (bootState() !== "booting" || !el) return;

    const count = { value: 0 };
    const render = () => {
      if (counterRef.current)
        counterRef.current.textContent = String(
          Math.round(count.value),
        ).padStart(3, "0");
    };
    const lines = [...el.querySelectorAll<HTMLElement>("[data-boot-line]")];
    let cancelled = false;

    const ctx = gsap.context(() => {
      if (reducedMotion()) {
        gsap.set(lines, { y: 0, yPercent: 0 });
        return;
      }
      // y: 0 overrides the hidden-before-js offset in styles.css
      gsap.fromTo(
        lines,
        { y: 0, yPercent: 110 },
        { yPercent: 0, duration: 0.6, stagger: 0.08, ease: "power4.out" },
      );
      gsap.to(count, {
        value: CREEP_TO,
        duration: MAX_MS / 1000,
        ease: "power2.out",
        onUpdate: render,
      });
    });

    const leave = () =>
      ctx.add(() => {
        gsap.killTweensOf(count);
        el.style.pointerEvents = "none";

        if (reducedMotion()) {
          setBoot("leaving");
          gsap.to(el, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => setBoot("done"),
          });
          return;
        }

        const notch = document.querySelector<HTMLElement>("[data-notch]");
        const rect = notch?.getBoundingClientRect();
        const radius = notch ? getComputedStyle(notch).borderBottomLeftRadius : "0px";
        // inset() from each edge down to the notch's box, same corners as its bottom
        const to = rect
          ? `inset(${rect.top}px ${innerWidth - rect.right}px ${innerHeight - rect.bottom}px ${rect.left}px round 0px 0px ${radius} ${radius})`
          : `inset(0px 50% 100% 50% round 0px 0px 0px 0px)`;

        gsap
          .timeline({ onComplete: () => setBoot("done") })
          .to(count, {
            value: 100,
            duration: 0.35,
            ease: "power2.out",
            onUpdate: render,
          })
          .to(lines, {
            yPercent: -110,
            duration: 0.4,
            stagger: 0.05,
            ease: "power2.in",
          })
          .fromTo(
            el,
            { clipPath: "inset(0px 0px 0px 0px round 0px 0px 0px 0px)" },
            { clipPath: to, duration: 1.1, ease: notchEase },
          )
          // the page starts rising once most of the black has cleared
          .call(() => setBoot("leaving"), undefined, "<0.25");
      });

    const started = performance.now();
    Promise.race([firstTrack(), wait(MAX_MS)])
      .then(() => wait(MIN_MS - (performance.now() - started)))
      .then(() => {
        if (!cancelled) leave();
      });

    return () => {
      cancelled = true;
      ctx.revert();
    };
  }, []);

  if (state === "done") return null;

  return (
    <div
      ref={ref}
      data-boot
      aria-hidden="true"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-1 bg-black text-white"
    >
      <span className="overflow-clip">
        <span data-boot-line className="boot-in block text-lg">
          Jeffrey Yu
        </span>
      </span>
      <span className="overflow-clip">
        <span
          ref={counterRef}
          data-boot-line
          className="boot-in block text-xs text-white/40 tabular-nums"
        >
          000
        </span>
      </span>
    </div>
  );
}
