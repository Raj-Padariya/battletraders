"use client";

// Shared chrome of every panel page — port of panel-shell.js (markup) + panel.js (behaviour).
// Usage in a route's page.tsx (server component):
//   <PanelShell current="wallet" crumb="Wallet" after={<Modals/>}>…page body…</PanelShell>
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon from "@panel/components/Icon";
import Ticker from "@panel/components/Ticker";
import type { IconName } from "@panel/lib/icons";
import { GUEST_PROFILE, PanelContext, type PanelApi, type PanelProfile, type Wallet } from "@panel/lib/panel";
import { asset } from "@panel/lib/paths";
import { BLOCKED_KEY, PROFILE_KEY, TOUR_DONE_KEY, WALLET_KEY, countdown, money, nextAt, readJSON, writeJSON } from "@panel/lib/storage";

export type PanelPage =
  | "dashboard" | "arena" | "my-tournaments" | "browse-tournaments" | "alliances" | "achievements"
  | "wallet" | "leaderboards" | "affiliate" | "profile" | "redeem" | "";

interface PanelShellProps {
  current: PanelPage;
  crumb: string;
  skipLabel?: string;
  /** id for the top-bar "Find a battle" link (the old shell's `ctaId`, used by first-run tours). */
  ctaId?: string;
  /** Markup that sat between the shell and </body> in the old page (modals, tours). */
  after?: React.ReactNode;
  children: React.ReactNode;
}

interface StoredProfile {
  username?: string;
  countryName?: string;
  country?: string;
  timezone?: string;
  joined?: string;
  email?: string;
  fullName?: string;
  avatar?: string;
  frame?: string;
}

interface Toast {
  id: number;
  title: string;
  text: string;
  kind: string;
}

const TOURNAMENT_KEYS: PanelPage[] = ["my-tournaments", "browse-tournaments"];
const EMPTY_WALLET: Wallet = { balance: 0, credits: 0, tickets: 0 };

function loadProfile(): PanelProfile {
  const saved = readJSON<StoredProfile | null>(PROFILE_KEY, null);
  const username = saved?.username || "trader";
  return {
    username,
    countryName: saved?.countryName || "Guest",
    country: saved?.country || "",
    timezone: saved?.timezone || "",
    joined: saved?.joined || new Date().toISOString(),
    email: saved?.email || "",
    fullName: saved?.fullName || "",
    avatar: saved?.avatar || "",
    frame: saved?.frame || "",
    isGuest: !saved,
    initials: username.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "TR",
  };
}

function NavItem({ current, page, href, icon, label }: { current: PanelPage; page: PanelPage; href: string; icon: IconName; label: string }) {
  const on = current === page;
  return (
    <Link className={"ap-nav-a" + (on ? " is-on" : "")} href={href} aria-current={on ? "page" : undefined}>
      <Icon name={icon} /><span>{label}</span>
    </Link>
  );
}

/** Link to the public website (another app) — a plain <a>, never next/link. */
function SiteItem({ href, icon, label }: { href: string; icon: IconName; label: string }) {
  return <a className="ap-nav-a" href={href}><Icon name={icon} /><span>{label}</span></a>;
}

function SubItem({ current, page, href, label }: { current: PanelPage; page: PanelPage; href: string; label: string }) {
  const on = current === page;
  return <Link className={"ap-sub-a" + (on ? " is-on" : "")} href={href} aria-current={on ? "page" : undefined}>{label}</Link>;
}

export default function PanelShell({ current, crumb, skipLabel = "Skip to content", ctaId, after, children }: PanelShellProps) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<PanelProfile>(GUEST_PROFILE);
  const [wallet, setWalletState] = useState<Wallet>(EMPTY_WALLET);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [suspended, setSuspended] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isDrawerLayout, setIsDrawerLayout] = useState(false);
  const [groupOpen, setGroupOpen] = useState(TOURNAMENT_KEYS.includes(current));
  const [launchClock, setLaunchClock] = useState("--:--:--");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastHost, setToastHost] = useState(false);

  const sideRef = useRef<HTMLElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const toastSeq = useRef(0);
  // Where focus should go after the drawer state is applied (inert must be updated first).
  const pendingFocus = useRef<"close" | "burger" | null>(null);

  const reloadProfile = useCallback(() => setProfile(loadProfile()), []);

  /* Profile, wallet, suspension, motion preference — all browser-only, so after hydration. */
  useEffect(() => {
    const loaded = loadProfile();
    setProfile(loaded);
    setWalletState(readJSON<Wallet>(WALLET_KEY, EMPTY_WALLET));
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const blocked = readJSON<unknown>(BLOCKED_KEY, []);
    setSuspended(!loaded.isGuest && Array.isArray(blocked) && blocked.indexOf(loaded.username) !== -1);
    setReady(true);
  }, []);

  /* Account suspended by the admin: hide (not remove) the page so its own components keep working. */
  useEffect(() => {
    if (!suspended) return;
    document.documentElement.classList.add("is-suspended");
    const main = mainRef.current;
    if (main) {
      Array.from(main.children).forEach((child) => {
        if (!child.classList.contains("ap-suspended")) (child as HTMLElement).hidden = true;
      });
    }
    return () => document.documentElement.classList.remove("is-suspended");
  }, [suspended]);

  /* Sidebar drawer (below 1080px) */
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1080px)");
    const sync = () => {
      setIsDrawerLayout(query.matches);
      if (!query.matches) setDrawerOpen(false);
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const setDrawer = useCallback((open: boolean) => {
    const hadFocus = !!sideRef.current && sideRef.current.contains(document.activeElement);
    pendingFocus.current = open ? "close" : hadFocus ? "burger" : null;
    setDrawerOpen(open);
  }, []);

  useEffect(() => {
    // Runs after the inert attribute has been updated: inert elements cannot take focus.
    if (pendingFocus.current === "close") closeRef.current?.focus();
    else if (pendingFocus.current === "burger") burgerRef.current?.focus();
    pendingFocus.current = null;
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawer(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen, setDrawer]);

  const onSideClick = (e: React.MouseEvent<HTMLElement>) => {
    if (isDrawerLayout && (e.target as HTMLElement).closest("a")) setDrawer(false);
  };

  /* Daily battle countdown */
  useEffect(() => {
    const tick = () => setLaunchClock(countdown(nextAt(14)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  /* Glass spotlight: a soft light follows the cursor across glass cards (desktop pointers only). */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let lit: HTMLElement | null = null;
    const onMove = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const card = target && target.closest ? (target.closest(".ac, .ak, .as, [data-glass]") as HTMLElement | null) : null;
      if (lit && lit !== card) {
        lit.style.removeProperty("--mx");
        lit.style.removeProperty("--my");
      }
      lit = card;
      if (!card) return;
      const box = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - box.left + "px");
      card.style.setProperty("--my", e.clientY - box.top + "px");
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, []);

  const logout = () => {
    try {
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem(TOUR_DONE_KEY);
    } catch {
      // storage blocked: nothing was saved, nothing to clear
    }
    window.location.href = "/login/";
  };

  const setWallet = useCallback((next: Wallet) => {
    const value = { balance: next.balance, credits: next.credits, tickets: next.tickets };
    writeJSON(WALLET_KEY, value);
    setWalletState(value);
  }, []);

  const dismissToast = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const toast = useCallback((title: string, text = "", kind = "") => {
    const id = ++toastSeq.current;
    setToastHost(true);
    setToasts((list) => [...list, { id, title, text, kind }]);
    window.setTimeout(() => dismissToast(id), 5000);
  }, [dismissToast]);

  const api = useMemo<PanelApi>(
    () => ({ ready, profile, reloadProfile, reduceMotion, wallet, setWallet, toast, setDrawer }),
    [ready, profile, reloadProfile, reduceMotion, wallet, setWallet, toast, setDrawer],
  );

  const avatarStyle: React.CSSProperties | undefined =
    profile.avatar && /^data:image\//.test(profile.avatar)
      ? { backgroundImage: `url("${profile.avatar}")`, backgroundSize: "cover", backgroundPosition: "center", color: "transparent" }
      : undefined;

  return (
    <PanelContext.Provider value={api}>
      <a className="ap-skip" href="#app-main">{skipLabel}</a>

      <aside
        className={"ap-side" + (drawerOpen ? " open" : "")}
        id="ap-side"
        aria-label="Trader panel"
        ref={sideRef}
        inert={isDrawerLayout && !drawerOpen}
        onClick={onSideClick}
      >
        <div className="ap-side-top">
          <Link href="/app/dashboard/" className="logo"><img src={asset("/assets/img/battel-logo.svg")} alt="BattleTrader" width={1214} height={162} /></Link>
          <button className="ap-close" id="ap-close" type="button" aria-label="Close menu" ref={closeRef} onClick={() => setDrawer(false)}><Icon name="close" /></button>
        </div>

        <div className="ap-launch">
          <span className="ap-launch-gem" aria-hidden="true"><Icon name="swords" /></span>
          <p>Today&apos;s Daily Battle starts in <b id="ap-launch-clock">{launchClock}</b></p>
          <Link className="ap-launch-btn" href="/app/browse-tournaments/"><Icon name="bolt" />Enter battle</Link>
        </div>

        <nav className="ap-nav" aria-label="Panel">
          <p className="ap-nav-h">Menu</p>
          <NavItem current={current} page="dashboard" href="/app/dashboard/" icon="home" label="Dashboard" />
          <NavItem current={current} page="arena" href="/app/arena/" icon="swords" label="Personal arena" />
          <div className={"ap-nav-group" + (groupOpen ? " is-open" : "")}>
            <button
              className={"ap-nav-a ap-nav-toggle" + (TOURNAMENT_KEYS.includes(current) ? " is-on" : "")}
              type="button"
              aria-expanded={groupOpen}
              aria-controls="ap-sub-tourneys"
              onClick={() => setGroupOpen((open) => !open)}
            >
              <Icon name="trophy" /><span>Tournaments</span><em>Live</em><i className="ap-caret"><Icon name="chevDown" /></i>
            </button>
            <div className="ap-sub" id="ap-sub-tourneys" hidden={!groupOpen}>
              <SubItem current={current} page="my-tournaments" href="/app/my-tournaments/" label="My tournaments" />
              <SubItem current={current} page="browse-tournaments" href="/app/browse-tournaments/" label="Browse tournaments" />
            </div>
          </div>
          <NavItem current={current} page="alliances" href="/app/alliances/" icon="shield" label="Alliance" />
          <NavItem current={current} page="achievements" href="/app/achievements/" icon="medal" label="Achievements" />
          <NavItem current={current} page="wallet" href="/app/wallet/" icon="wallet" label="Wallet" />
          <NavItem current={current} page="leaderboards" href="/app/leaderboards/" icon="chart" label="Leaderboards" />
          <NavItem current={current} page="affiliate" href="/app/affiliate/" icon="gift" label="Affiliate" />
          <NavItem current={current} page="profile" href="/app/profile/" icon="user" label="Profile" />
          <NavItem current={current} page="redeem" href="/app/redeem/" icon="ticket" label="Redeem" />
          <p className="ap-nav-h">Support</p>
          <SiteItem href="/faq/" icon="help" label="Help centre" />
          <SiteItem href="/contact/" icon="users" label="Contact support" />
          <SiteItem href="/" icon="globe" label="Back to website" />
        </nav>

        <button className="ap-logout" id="ap-logout" type="button" onClick={logout}><Icon name="logout" />Log out</button>
      </aside>
      <div className="ap-scrim" id="ap-scrim" hidden={!drawerOpen} onClick={() => setDrawer(false)}></div>

      <div className="ap-shell">
        <header className="ap-top">
          <button
            className="ap-burger"
            id="ap-burger"
            type="button"
            aria-label="Open menu"
            aria-controls="ap-side"
            aria-expanded={drawerOpen}
            ref={burgerRef}
            onClick={() => setDrawer(true)}
          >
            <Icon name="menu" />
          </button>
          <nav className="ap-crumb" aria-label="Breadcrumb"><Link href="/app/dashboard/">Dashboard</Link><Icon name="chev" /><span aria-current="page">{crumb}</span></nav>
          <div className="ap-wallets" aria-label="Your balances">
            <span className="ap-pill p-bal"><Icon name="wallet" /><span>Balance</span><b data-wallet="balance">{money(wallet.balance)}</b></span>
            <span className="ap-pill p-cred"><Icon name="bolt" /><span>Credits</span><b data-wallet="credits">{money(wallet.credits)}</b></span>
            <span className="ap-pill p-tix"><Icon name="ticket" /><span>Tickets</span><b data-wallet="tickets">{String(wallet.tickets)}</b></span>
          </div>
          <Link className="ap-cta" id={ctaId} href="/app/browse-tournaments/"><Icon name="swords" /><span>Find a battle</span></Link>
          <button className="ap-icon-btn" id="ap-bell" type="button" aria-label="Notifications, 2 unread"><Icon name="bell" /><i className="ap-dot"></i></button>
          <Link className="ap-me" href="/app/profile/" aria-label="Your profile and settings">
            <span className="ap-me-av" data-initials="" style={avatarStyle}>{profile.initials}</span>
            <span className="ap-me-txt"><b data-username="">{profile.username}</b><small>Lv 1 &middot; Rookie</small></span>
          </Link>
        </header>

        <div id="app-ticker" className="ap-ticker"><Ticker /></div>

        <main className="ap-main" id="app-main" tabIndex={-1} ref={mainRef}>
          {suspended && (
            <section className="ac ap-suspended" role="alert">
              <h1>Account suspended</h1>
              <p>Your account @{profile.username} has been suspended by the BattleTrader team. You can&apos;t enter battles or use your wallet while it is suspended.</p>
              <a className="ac-btn" href="/contact/">Contact support</a>
            </section>
          )}
          {children}
        </main>
      </div>
      {after}

      {toastHost && (
        <div className="ap-toasts" role="status" aria-live="polite">
          {toasts.map((t) => (
            <div className={"ap-toast" + (t.kind ? " is-" + t.kind : "")} key={t.id}>
              <Icon name="checkCircle" />
              <p><b>{t.title}</b><span>{t.text}</span></p>
              <button type="button" aria-label="Dismiss" onClick={() => dismissToast(t.id)}><Icon name="close" /></button>
            </div>
          ))}
        </div>
      )}
    </PanelContext.Provider>
  );
}
