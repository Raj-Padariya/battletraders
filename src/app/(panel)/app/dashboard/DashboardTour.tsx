"use client";

// First-visit tour (old dashboard.js): spotlight one panel area at a time, popover beside it. Rendered after </main>.
import { useCallback, useEffect, useRef, useState } from "react";
import { Svg } from "@panel/components/Icon";
import { usePanel } from "@panel/lib/panel";
import { TOUR_DONE_KEY, readStore, writeStore } from "@panel/lib/storage";

const TOUR_ICONS = {
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
};

const TOUR_STEPS: { target: string; icon: keyof typeof TOUR_ICONS; title: string; text: string }[] = [
  { target: "tour-welcome", icon: "compass", title: "Welcome to your dashboard", text: "This is your home base. From here you can jump into today's battle, check your account status and open your trader profile." },
  { target: "tour-stats", icon: "chart", title: "Your stats at a glance", text: "These tiles show your key numbers — active battles, total winnings, win rate and season rank. They update as you compete." },
  { target: "tour-badges", icon: "shield", title: "Level & badges", text: "Unlock badges as you play. The glowing one is your next target — finish your first battle to earn First Blood." },
  { target: "tour-compete", icon: "trophy", title: "Ready to compete?", text: "Find a battle any time from here. Daily Battles are free, Mini Tournaments are great for getting started, and the Circuit leads to the World Championship." },
];
const GAP = 14;
const EDGE = 12;

export default function DashboardTour() {
  const { reduceMotion, setDrawer } = usePanel();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const tourRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const indexRef = useRef(0);
  const returnFocus = useRef<Element | null>(null);
  // Page regions this tour made inert (the shell controls #ap-side's own inert state, so only undo what we added).
  const inerted = useRef<Element[]>([]);
  const reduceRef = useRef(reduceMotion);
  reduceRef.current = reduceMotion;
  indexRef.current = index;

  const placeTour = useCallback(() => {
    const spot = spotRef.current;
    const pop = popRef.current;
    const target = document.getElementById(TOUR_STEPS[indexRef.current].target);
    if (!spot || !pop || !target) return;
    const box = target.getBoundingClientRect();
    const pad = 6;
    spot.style.top = box.top - pad + "px";
    spot.style.left = box.left - pad + "px";
    spot.style.width = box.width + pad * 2 + "px";
    spot.style.height = box.height + pad * 2 + "px";

    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const pw = pop.offsetWidth;
    const ph = pop.offsetHeight;
    const pinned = Math.max(EDGE, vh - ph - EDGE);
    let top: number;
    // Prefer below the highlight, then above; otherwise beside it, finally pinned to the bottom edge.
    if (box.bottom + GAP + ph <= vh - EDGE) top = box.bottom + GAP;
    else if (box.top - GAP - ph >= EDGE) top = box.top - GAP - ph;
    else top = pinned;
    let left = box.left + box.width / 2 - pw / 2;
    if (top === pinned) {
      if (box.right + GAP + pw <= vw - EDGE) left = box.right + GAP;
      else if (box.left - GAP - pw >= EDGE) left = box.left - GAP - pw;
      if (left === box.right + GAP || left === box.left - GAP - pw) top = Math.max(EDGE, Math.min(pinned, box.top));
    }
    pop.style.left = Math.max(EDGE, Math.min(vw - pw - EDGE, left)) + "px";
    pop.style.top = top + "px";
  }, []);

  const closeTour = useCallback(() => {
    setOpen(false);
    inerted.current.forEach((node) => node.removeAttribute("inert"));
    inerted.current = [];
    writeStore(TOUR_DONE_KEY, "1");
    const back = returnFocus.current;
    if (back instanceof HTMLElement && document.contains(back)) back.focus();
  }, []);

  const openTour = useCallback(() => {
    returnFocus.current = document.activeElement;
    if (document.getElementById("ap-side")?.classList.contains("open")) setDrawer(false);
    const tour = tourRef.current;
    const host = tour?.parentElement;
    if (tour && host) {
      inerted.current = Array.from(host.children).filter(
        (node) => node !== tour && node.tagName !== "SCRIPT" && !node.hasAttribute("inert"),
      );
      inerted.current.forEach((node) => node.setAttribute("inert", ""));
    }
    setIndex(0);
    setOpen(true);
  }, [setDrawer]);

  /* Auto-open on the first visit; "Replay tour" button lives in the page body. */
  useEffect(() => {
    const timer = readStore(TOUR_DONE_KEY) !== "1" ? window.setTimeout(openTour, 700) : 0;
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.("#ap-replay")) openTour();
    };
    document.addEventListener("click", onClick);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("click", onClick);
    };
  }, [openTour]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeTour();
        return;
      }
      if (e.key !== "Tab" || !popRef.current) return;
      const focusable = Array.from(popRef.current.querySelectorAll("button")).filter((button) => !button.hidden);
      const first = focusable[0];
      const lastButton = focusable[focusable.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === titleRef.current)) {
        e.preventDefault();
        lastButton.focus();
      } else if (!e.shiftKey && document.activeElement === lastButton) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", placeTour);
    window.addEventListener("scroll", placeTour, { passive: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", placeTour);
      window.removeEventListener("scroll", placeTour);
    };
  }, [open, closeTour, placeTour]);

  /* Show a step: scroll target + popover into view, place them, replay the entrance animation, focus the title. */
  useEffect(() => {
    const pop = popRef.current;
    if (!open || !pop) return;
    const reduce = reduceRef.current;
    const target = document.getElementById(TOUR_STEPS[index].target);
    // The sticky top bar never scrolls, so its target needs no scrolling.
    if (target && !target.closest(".ap-top")) {
      const rect = target.getBoundingClientRect();
      const combined = rect.height + GAP + pop.offsetHeight;
      const desiredTop = combined + EDGE * 2 <= window.innerHeight ? (window.innerHeight - combined) / 2 : EDGE;
      window.scrollTo({ top: window.scrollY + rect.top - Math.max(EDGE, desiredTop), behavior: reduce ? "auto" : "smooth" });
    }
    placeTour();
    const timer = window.setTimeout(placeTour, reduce ? 0 : 450); // re-place once the smooth scroll settles
    if (!reduce) {
      pop.classList.remove("pop-in");
      void pop.offsetWidth; // restart the entrance animation
      pop.classList.add("pop-in");
    }
    titleRef.current?.focus({ preventScroll: true });
    return () => window.clearTimeout(timer);
  }, [open, index, placeTour]);

  const step = TOUR_STEPS[index];
  const last = index === TOUR_STEPS.length - 1;

  return (
    <div className="tour" id="tour" hidden={!open} ref={tourRef}>
      <div className="tour-spot" id="tour-spot" aria-hidden="true" ref={spotRef}></div>
      <div className="tour-pop" id="tour-pop" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-text" ref={popRef}>
        <div className="tour-h">
          <span className="tour-ico" id="tour-ico" aria-hidden="true">{open && <Svg body={TOUR_ICONS[step.icon]} />}</span>
          <h2 id="tour-title" tabIndex={open ? -1 : undefined} ref={titleRef}>{open ? step.title : ""}</h2>
          <button className="tour-x" id="tour-x" type="button" aria-label="Close tour" onClick={closeTour}><Svg body='<path d="M6 6l12 12M18 6 6 18"/>' /></button>
        </div>
        <p id="tour-text">{open ? step.text : ""}</p>
        <div className="tour-foot">
          <div className="tour-dots" id="tour-dots" aria-hidden="true">
            {TOUR_STEPS.map((s, i) => (
              <i key={s.target} className={open ? (i === index ? "on" : i < index ? "done" : undefined) : undefined}></i>
            ))}
          </div>
          <span className="tour-count" id="tour-count">{open ? "Step " + (index + 1) + " of " + TOUR_STEPS.length : ""}</span>
          <button className="tour-back" id="tour-back" type="button" hidden={open && index === 0} onClick={() => setIndex((i) => i - 1)}><Svg body='<path d="m15 6-6 6 6 6"/>' />Back</button>
          <button className="tour-next" id="tour-next" type="button" onClick={() => (last ? closeTour() : setIndex((i) => i + 1))}>
            {last ? "Got it!" : <>Next<Svg body='<path d="m9 6 6 6-6 6"/>' /></>}
          </button>
        </div>
<Svg body='<path d="m5 6 6 6-6 6M13 6l6 6-6 6"/>' />Skip tour
      </div>
    </div>
  );
}
