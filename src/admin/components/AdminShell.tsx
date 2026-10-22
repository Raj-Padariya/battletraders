"use client";

// Shared chrome of every signed-in admin page — port of admin-shell.js `start`/`end` (markup) and admin.js initShell
// (session guard, drawer, log out, sidebar counters, theme toggle). Usage from a route's page.tsx (server component):
//   <AdminShell current="users" heading="Users" lead="…" actions={<Buttons/>} after={<Dialogs/>}>…body…</AdminShell>
// Page client components get toast/confirm from useAdminUi() and the session from useAdminSession().
import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import Icon from "@admin/components/Icon";
import "../../app/(admin)/admin/_community/register"; // fills BTAdmin's alliances/achievements data on every page (dashboard counts, user detail)
import { AdminUiProvider } from "@admin/components/AdminUi";
import ThemeButton from "@admin/components/ThemeButton";
import type { IconName } from "@admin/lib/icons";
import { BTAdmin, BTAdminAuth, type AdminSession } from "@admin/lib/store";
import { asset } from "@admin/lib/ui";

export type AdminPage =
  | "overview" | "users" | "leads" | "goa" | "battles" | "transactions" | "vouchers" | "kyc"
  | "alliances" | "affiliates" | "achievements" | "settings";

type NavEntry = [key: AdminPage, href: string, icon: IconName, label: string];

const PAGES: NavEntry[] = [
  ["overview", "/admin/dashboard/", "home", "Dashboard"],
  ["users", "/admin/users/", "users", "Users"],
  ["leads", "/admin/leads/", "inbox", "Leads"],
  ["goa", "/admin/goa/", "calendar", "Goa event passes"],
  ["battles", "/admin/battles/", "swords", "Battles"],
  ["transactions", "/admin/transactions/", "wallet", "Wallet & transactions"],
  ["vouchers", "/admin/vouchers/", "ticket", "Vouchers"],
  ["kyc", "/admin/kyc/", "idCard", "KYC"],
  ["alliances", "/admin/alliances/", "shield", "Alliances"],
  ["affiliates", "/admin/affiliates/", "gift", "Affiliates"],
  ["achievements", "/admin/achievements/", "medal", "Achievements"],
  ["settings", "/admin/settings/", "settings", "Settings"],
];

const SessionContext = createContext<AdminSession | null>(null);

/** Signed-in admin session. Only inside AdminShell, where children render only once a session exists. */
export function useAdminSession(): AdminSession {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useAdminSession() must be used inside <AdminShell>");
  return session;
}

function NavItem({ entry: [key, href, icon, label], current, count }: { entry: NavEntry; current: AdminPage; count?: number }) {
  const on = current === key;
  return (
    <Link className={"ad-nav-a" + (on ? " is-on" : "")} href={href} aria-current={on ? "page" : undefined}>
      <Icon name={icon} />
      <span>{label}</span>
      <em className="ad-nav-count" data-count={key} hidden={!count} aria-label={count ? count + " need attention" : undefined}>
        {count ? (count > 99 ? "99+" : String(count)) : ""}
      </em>
    </Link>
  );
}

interface AdminShellProps {
  current: AdminPage;
  heading: string;
  lead?: React.ReactNode;
  actions?: React.ReactNode;
  /** Dialogs that sat after </main> in the old page. */
  after?: React.ReactNode;
  children: React.ReactNode;
}

export default function AdminShell({ current, heading, lead, actions, after, children }: AdminShellProps) {
  // null = not checked yet (server render + first browser render). The page body renders only with a session,
  // so signed-out visitors never see admin data — the old pre-paint guard script did the same.
  const [session, setSession] = useState<AdminSession | null>(null);
  const [counts, setCounts] = useState<{ leads: number; kyc: number }>({ leads: 0, kyc: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const sideRef = useRef<HTMLElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const active = BTAdminAuth.session();
    if (!active) {
      window.location.replace(asset("/login/"));
      return;
    }
    setSession(active);
    const stats = BTAdmin.stats();
    setCounts({ leads: stats.leadsNew, kyc: stats.kycPending });
  }, []);

  const setMenu = (open: boolean) => {
    setMenuOpen(open);
    document.body.classList.toggle("ad-lock", open);
    if (open) {
      // Focus after the class change has rendered (the drawer slides in).
      window.requestAnimationFrame(() => sideRef.current?.querySelector<HTMLElement>("a, button")?.focus());
    } else if (sideRef.current?.contains(document.activeElement)) {
      burgerRef.current?.focus();
    }
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  useEffect(() => () => document.body.classList.remove("ad-lock"), []);

  const logout = () => {
    if (session) BTAdmin.log("Logged out", session.email);
    BTAdminAuth.endSession();
    window.location.replace(asset("/login/"));
  };

  return (
    <AdminUiProvider>
      <a className="ad-skip" href="#ad-main">Skip to content</a>

      <aside className={"ad-side" + (menuOpen ? " is-open" : "")} id="ad-side" aria-label="Admin" ref={sideRef}>
        <div className="ad-side-top">
          <Link href="/admin/dashboard/" className="ad-logo">
            <img className="is-dark-logo" src={asset("/assets/img/battel-logo.svg")} alt="BattleTrader" width={1214} height={162} />
            <img className="is-light-logo" src={asset("/assets/img/battel-logo-light.svg")} alt="BattleTrader" width={1214} height={162} />
            <span>Admin</span>
          </Link>
          <button className="ad-close" id="ad-close" type="button" aria-label="Close menu" onClick={() => setMenu(false)}><Icon name="close" /></button>
        </div>
        <nav className="ad-nav" aria-label="Admin sections">
          {PAGES.slice(0, 7).map((entry) => (
            <NavItem key={entry[0]} entry={entry} current={current} count={entry[0] === "leads" ? counts.leads : entry[0] === "kyc" ? counts.kyc : undefined} />
          ))}
          <p className="ad-nav-h">Community</p>
          {PAGES.slice(7, 10).map((entry) => <NavItem key={entry[0]} entry={entry} current={current} />)}
          <p className="ad-nav-h">System</p>
          <NavItem entry={PAGES[10]} current={current} />
          {/* The public website is another app — a plain link, never next/link. */}
          <a className="ad-nav-a" href="/"><Icon name="globe" /><span>View website</span></a>
        </nav>
        <p className="ad-demo-note"><Icon name="info" /><span>Demo data &mdash; this browser only</span></p>
      </aside>
      <div className="ad-scrim" id="ad-scrim" hidden={!menuOpen} onClick={() => setMenu(false)}></div>

      <div className="ad-shell">
        <header className="ad-top">
          <Link className="ad-top-logo" href="/admin/dashboard/" aria-label="BattleTrader Admin dashboard">
            <img src={asset("/assets/img/favicon.svg?v=2")} alt="" width={30} height={30} />
          </Link>
          <p className="ad-top-title">BattleTrader <b>Admin</b></p>
          <span className="ad-top-me">
            <span className="ad-top-av" aria-hidden="true"><Icon name="user" /></span>
            <span className="ad-top-email" data-admin-email="">{session ? session.email : "admin"}</span>
          </span>
          <ThemeButton />
          <button className="ad-btn ad-btn-ghost" id="ad-logout" type="button" onClick={logout}><Icon name="logout" /><span>Log out</span></button>
          <button
            className="ad-burger"
            id="ad-burger"
            type="button"
            aria-label="Open menu"
            aria-controls="ad-side"
            aria-expanded={menuOpen}
            ref={burgerRef}
            onClick={() => setMenu(true)}
          >
            <Icon name="menu" />
          </button>
        </header>

        <main className="ad-main" id="ad-main" tabIndex={-1}>
          <div className="ad-head">
            <div>
              <h1>{heading}</h1>
              {lead ? <p className="ad-lead">{lead}</p> : null}
            </div>
            {actions ? <div className="ad-head-actions">{actions}</div> : null}
          </div>
          {session && <SessionContext.Provider value={session}>{children}</SessionContext.Provider>}
        </main>
      </div>
      {session && <SessionContext.Provider value={session}>{after}</SessionContext.Provider>}
    </AdminUiProvider>
  );
}
