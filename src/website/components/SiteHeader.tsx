"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type NavLink = { href: string; label: string };
type NavGroup = { label: string; items: NavLink[] };
type NavEntry = NavLink | NavGroup;

const NAV: NavEntry[] = [
  { href: "/", label: "Home" },
  {
    label: "Tournaments",
    items: [
      { href: "/tournaments/", label: "All Tournaments" },
      { href: "/mini-tournaments/", label: "Mini Tournaments" },
      { href: "/circuit-tournaments/", label: "Circuit Tournaments" },
      { href: "/results/", label: "Results" },
    ],
  },
  { href: "/schedule/", label: "Schedule" },
  { href: "/rankings/", label: "Rankings" },
  { href: "/contact/", label: "Contact" },
];

// Pages that light up a top-level item without being in it (trader profile sits under Rankings).
const ALSO_ACTIVE: Record<string, string> = { "/profile/": "/rankings/" };

const isGroup = (entry: NavEntry): entry is NavGroup => "items" in entry;
const normalise = (path: string) => (path.endsWith("/") ? path : path + "/");

const Chevron = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
);

export default function SiteHeader() {
  const pathname = normalise(usePathname() || "/");
  const activeTop = ALSO_ACTIVE[pathname] ?? pathname;

  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [navTop, setNavTop] = useState<number | null>(null);
  const [scrimShown, setScrimShown] = useState(false);
  const [scrimOn, setScrimOn] = useState(false);

  const barRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const menuOpenRef = useRef(menuOpen);
  menuOpenRef.current = menuOpen;

  const setMenu = useCallback((open: boolean) => {
    if (open && barRef.current) setNavTop(Math.round(barRef.current.getBoundingClientRect().bottom));
    if (open) setScrimShown(true);
    setMenuOpen(open);
    if (!open) setOpenGroup(null);
  }, []);

  // Backdrop: mount it at opacity 0, then switch "on" a frame later so it fades in (old main.js forced a reflow).
  useEffect(() => {
    if (!menuOpen) {
      setScrimOn(false);
      return;
    }
    const frame = requestAnimationFrame(() => setScrimOn(true));
    return () => cancelAnimationFrame(frame);
  }, [menuOpen]);

  useEffect(() => {
    document.documentElement.classList.toggle("nav-lock", menuOpen);
  }, [menuOpen]);

  useEffect(() => () => document.documentElement.classList.remove("nav-lock"), []);

  // Route change (link tapped inside the drawer) closes everything.
  useEffect(() => {
    setMenu(false);
  }, [pathname, setMenu]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!(e.target instanceof Element) || !e.target.closest(".dd")) setOpenGroup(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenGroup(null);
      if (menuOpenRef.current) {
        setMenu(false);
        burgerRef.current?.focus();
      }
    };
    const drawerQuery = window.matchMedia("(max-width:1120px)");
    const onQuery = () => {
      if (!drawerQuery.matches && menuOpenRef.current) setMenu(false);
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    drawerQuery.addEventListener("change", onQuery);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
      drawerQuery.removeEventListener("change", onQuery);
    };
  }, [setMenu]);

  const navStyle = navTop === null ? undefined : ({ "--nav-top": `${navTop}px` } as React.CSSProperties);

  return (
    <>
      <div className="bar" ref={barRef}>
        <div className="col pad bar-in">
          <Link href="/" className="logo">
            {/* eslint-disable-next-line @next/next/no-img-element -- static export, identical markup to the old site */}
            <img src="/assets/img/battel-logo.svg" alt="BattleTrader" width={1214} height={162} />
          </Link>
          <nav id="nav" aria-label="Main" className={menuOpen ? "open" : undefined} style={navStyle}>
            {NAV.map((entry) => {
              if (!isGroup(entry)) {
                const on = entry.href === activeTop;
                return (
                  <Link key={entry.href} href={entry.href} className={on ? "on" : undefined} aria-current={on ? "page" : undefined}>
                    {entry.label}
                  </Link>
                );
              }
              const groupActive = entry.items.some((item) => item.href === pathname);
              const open = openGroup === entry.label;
              return (
                <div key={entry.label} className={open ? "dd open" : "dd"}>
                  <button
                    className={groupActive ? "ddt on" : "ddt"}
                    type="button"
                    aria-expanded={open ? "true" : "false"}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenGroup(open ? null : entry.label);
                    }}
                  >
                    {entry.label}
                    <Chevron />
                  </button>
                  <div className="ddm">
                    {entry.items.map((item) => (
                      <Link key={item.href} href={item.href} aria-current={item.href === pathname ? "page" : undefined}>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>
          <div className="bar-end">
            <Link className="login" href="/login/">Login</Link>
            {/* Admin has its own root layout: plain <a> so it does a full page load. */}
            <a className="login" href="/admin/login/">Admin</a>
          </div>
          <button
            ref={burgerRef}
            className="burger"
            id="burger"
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen ? "true" : "false"}
            aria-controls="nav"
            onClick={() => setMenu(!menuOpen)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
      <div
        className={scrimOn ? "nav-scrim on" : "nav-scrim"}
        hidden={!scrimShown}
        onClick={() => setMenu(false)}
        onTransitionEnd={() => {
          if (!menuOpenRef.current) setScrimShown(false);
        }}
      />
    </>
  );
}
