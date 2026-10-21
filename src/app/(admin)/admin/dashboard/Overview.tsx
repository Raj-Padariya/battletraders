"use client";

// Dashboard body — port of admin/assets/js/overview.js with the markup of build-admin-overview.js.
// Numbers start as the old static placeholders and are filled in useEffect (BTAdmin is browser-only).
import Link from "next/link";
import { useEffect, useState } from "react";
import Icon, { Svg } from "@admin/components/Icon";
import { useAdminSession } from "@admin/components/AdminShell";
import { useAdminUi } from "@admin/components/AdminUi";
import type { IconName } from "@admin/lib/icons";
import { BTAdmin } from "@admin/lib/store";
import { ago, cap, date, money, num } from "@admin/lib/ui";

type FeedKind = "user" | "lead" | "tx" | "kyc" | "battle";

const FEED_ICON: Record<FeedKind, string> = {
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  lead: '<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5 5h14l2 8v6H3v-6z"/>',
  tx: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 13h2M3 10h18"/>',
  kyc: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16a3 3 0 0 1 6 0M14 10h4M14 14h3"/>',
  battle: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2"/>',
};

/* ---------- Decorative illustrations (static strings, same as the generator) ---------- */
const coin = (cx: number, top: number, rx: number, ry: number, grad: string) =>
  `<ellipse cx="${cx}" cy="${top + 8}" rx="${rx}" ry="${ry}" fill="#9A6608"/><rect x="${cx - rx}" y="${top}" width="${rx * 2}" height="8" fill="#B47A0B"/><ellipse cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}" fill="url(#${grad})"/><ellipse cx="${cx}" cy="${top}" rx="${rx * 0.68}" ry="${ry * 0.62}" fill="none" stroke="#FFF2C4" stroke-opacity=".55" stroke-width="1.4"/>`;
const goldGrad = (id: string) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE7A3"/><stop offset=".55" stop-color="#FFC433"/><stop offset="1" stop-color="#C98A0C"/></linearGradient>`;

type Art = "coins" | "growth" | "cashout" | "people";

const ILLU: Record<Art, string> = {
  coins: `<defs>${goldGrad("dh-gold")}</defs>`
    + '<ellipse cx="44" cy="81" rx="30" ry="5" fill="#FFC433" opacity=".22"/>'
    + coin(44, 70, 26, 7, "dh-gold") + coin(44, 61, 26, 7, "dh-gold") + coin(44, 52, 26, 7, "dh-gold") + coin(44, 43, 26, 7, "dh-gold"),
  growth: '<defs><linearGradient id="dh-green" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7CFFC8"/><stop offset="1" stop-color="#0E9F66"/></linearGradient></defs>'
    + '<ellipse cx="44" cy="81" rx="32" ry="5" fill="#22E39A" opacity=".2"/>'
    + '<rect x="12" y="56" width="13" height="22" rx="3" fill="url(#dh-green)" opacity=".5"/>'
    + '<rect x="29" y="46" width="13" height="32" rx="3" fill="url(#dh-green)" opacity=".68"/>'
    + '<rect x="46" y="35" width="13" height="43" rx="3" fill="url(#dh-green)" opacity=".85"/>'
    + '<rect x="63" y="22" width="13" height="56" rx="3" fill="url(#dh-green)"/>'
    + '<path d="M10 46 30 31l14 8 26-25" fill="none" stroke="#C9FFE9" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M60 13h11v11" fill="none" stroke="#C9FFE9" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>',
  cashout: `<defs>${goldGrad("dh-gold2")}<linearGradient id="dh-red" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF9DB0"/><stop offset="1" stop-color="#E0204A"/></linearGradient></defs>`
    + '<ellipse cx="44" cy="81" rx="32" ry="5" fill="#FF4D6D" opacity=".2"/>'
    + coin(30, 68, 19, 5.5, "dh-gold2") + coin(30, 59, 19, 5.5, "dh-gold2") + coin(63, 70, 17, 5, "dh-gold2")
    + '<path d="M12 16c22-6 44 2 52 26" fill="none" stroke="url(#dh-red)" stroke-width="7" stroke-linecap="round"/>'
    + '<path d="M53 40l11 11 8-14" fill="none" stroke="#E0204A" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>',
  people: '<defs><linearGradient id="dh-cyan" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#A8ECFF"/><stop offset="1" stop-color="#2C8FD6"/></linearGradient><linearGradient id="dh-violet" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D9AEFF"/><stop offset="1" stop-color="#7A2BD9"/></linearGradient></defs>'
    + '<ellipse cx="44" cy="81" rx="32" ry="5" fill="#33CCFF" opacity=".2"/>'
    + '<circle cx="20" cy="42" r="9" fill="url(#dh-violet)" opacity=".85"/><path d="M6 76a14 14 0 0 1 28 0z" fill="url(#dh-violet)" opacity=".85"/>'
    + '<circle cx="68" cy="42" r="9" fill="url(#dh-violet)" opacity=".85"/><path d="M54 76a14 14 0 0 1 28 0z" fill="url(#dh-violet)" opacity=".85"/>'
    + '<circle cx="44" cy="34" r="12" fill="url(#dh-cyan)"/><path d="M23 79a21 21 0 0 1 42 0z" fill="url(#dh-cyan)"/>',
};

/* ---------- View model ---------- */
interface Delta { cls: string; text: string }
interface Pill { text: string; tone: string }
interface FeedEntry { key: string; href: string; kind: FeedKind; title: string; sub: string; at: string; time: string }

interface View {
  name: string;
  initial: string;
  dateIso: string;
  dateText: string;
  users: string;
  live: string;
  pool: string;
  weekStart: string;
  weekEnd: string;
  weekNew: string;
  session: string;
  source: string;
  storage: string;
  held: string;
  topups: string;
  cashoutAmt: string;
  usersCount: string;
  heldD: Delta;
  topupsD: Delta;
  cashD: Delta;
  usersD: Delta;
  kyc: string;
  cashouts: string;
  leads: string;
  kycAlert: boolean;
  cashoutsAlert: boolean;
  leadsAlert: boolean;
  attnPill: Pill;
  ovLive: string;
  ovUpcoming: string;
  ovPool: string;
  battlesPill: Pill;
  fees: string;
  prizes: string;
  refunds: string;
  moneyPill: Pill;
  feed: FeedEntry[];
  battles: FeedEntry[];
}

/** "+12.5% vs last week" style delta. */
const delta = (current: number, previous: number, upIsGood = true): Delta => {
  if (!current && !previous) return { cls: "is-flat", text: "No change this week" };
  if (!previous) return { cls: upIsGood ? "is-up" : "is-down", text: "New this week" };
  const pct = Math.round(((current - previous) / previous) * 1000) / 10;
  return {
    cls: pct === 0 ? "is-flat" : (pct > 0) === upIsGood ? "is-up" : "is-down",
    text: (pct > 0 ? "+" : "") + pct + "% vs last week",
  };
};

function buildView(session: { email: string; expiresAt: number }): View {
  const s = BTAdmin.stats();
  const txs = BTAdmin.transactions();
  const accounts = BTAdmin.users();
  const battles = BTAdmin.tournaments().map((t) => ({ t, status: BTAdmin.statusOf(t) }));
  const DAY = BTAdmin.DAY_MS;
  const now = Date.now();
  const weekAgo = now - 7 * DAY;
  const twoWeeksAgo = now - 14 * DAY;
  const inRange = (iso: string, from: number, to: number) => {
    const t = new Date(iso).getTime();
    return t >= from && t < to;
  };
  const sumTx = (type: string, status: string, from: number, to: number) =>
    txs.filter((t) => t.type === type && t.status === status && inRange(t.at, from, to))
      .reduce((total, t) => total + Number(t.amount || 0), 0);

  const email = session.email;
  const name = email.split("@")[0].replace(/[._-]+/g, " ");
  const poolInPlay = battles.filter((b) => b.status !== "completed").reduce((total, b) => total + Number(b.t.prizePool || 0), 0);

  // Monday-to-Sunday week, like the user panel's weekly leaderboard.
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const sunday = new Date(monday.getTime() + 6 * DAY);
  const shortDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const newThisWeek = accounts.filter((u) => u.joined && new Date(u.joined).getTime() >= monday.getTime()).length;
  const bytes = BTAdmin.storageUsed();

  const cashoutPendingAmt = txs.filter((t) => t.type === "cashout" && t.status === "pending")
    .reduce((total, t) => total + Number(t.amount || 0), 0);
  const joinedIn = (from: number, to: number) => accounts.filter((u) => u.joined && inRange(u.joined, from, to)).length;

  const todo = s.kycPending + s.cashoutPending + s.leadsNew;
  const allTime = (type: string) => sumTx(type, "completed", 0, Infinity);

  const feed: FeedEntry[] = BTAdmin.activity(10).map((item, i) => ({
    key: i + "-" + item.at,
    href: item.href,
    kind: item.kind,
    title: item.title,
    sub: item.sub || "",
    at: item.at,
    time: ago(item.at),
  }));

  // Next battles: live first, then by start date.
  const order: Record<string, number> = { live: 0, registering: 1, upcoming: 2 };
  const next: FeedEntry[] = battles
    .filter((x) => x.status !== "completed")
    .sort((a, b) => order[a.status] - order[b.status] || new Date(a.t.start).getTime() - new Date(b.t.start).getTime())
    .slice(0, 5)
    .map((x) => ({
      key: x.t.id,
      href: "/admin/battles/?id=" + encodeURIComponent(x.t.id),
      kind: "battle",
      title: x.t.name,
      sub: cap(x.status) + " · starts " + date(x.t.start) + " · " + money(x.t.prizePool) + " pool",
      at: x.t.start,
      time: "",
    }));

  return {
    name: name.charAt(0).toUpperCase() + name.slice(1),
    initial: name.charAt(0).toUpperCase() || "A",
    dateIso: new Date(now).toISOString().slice(0, 10),
    dateText: new Date(now).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
    users: num(s.users),
    live: num(s.battlesLive),
    pool: money(poolInPlay),
    weekStart: shortDate(monday),
    weekEnd: shortDate(sunday),
    weekNew: num(newThisWeek),
    session: new Date(session.expiresAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    source: BTAdmin.demoEnabled() ? "Real + " + s.demoUsers + " demo" : "Real data only",
    storage: bytes < 1048576 ? (bytes / 1024).toFixed(1) + " KB of ~5 MB" : (bytes / 1048576).toFixed(2) + " MB of ~5 MB",
    held: money(s.balanceHeld),
    topups: money(s.topupTotal),
    cashoutAmt: money(cashoutPendingAmt),
    usersCount: num(s.users),
    heldD: delta(
      sumTx("topup", "completed", weekAgo, now) + sumTx("reward", "completed", weekAgo, now),
      sumTx("topup", "completed", twoWeeksAgo, weekAgo) + sumTx("reward", "completed", twoWeeksAgo, weekAgo),
    ),
    topupsD: delta(sumTx("topup", "completed", weekAgo, now), sumTx("topup", "completed", twoWeeksAgo, weekAgo)),
    cashD: {
      cls: s.cashoutPending ? "is-flat" : "",
      text: s.cashoutPending ? s.cashoutPending + (s.cashoutPending === 1 ? " request" : " requests") : "",
    },
    usersD: delta(joinedIn(weekAgo, now), joinedIn(twoWeeksAgo, weekAgo)),
    kyc: num(s.kycPending),
    cashouts: num(s.cashoutPending),
    leads: num(s.leadsNew),
    kycAlert: !!s.kycPending,
    cashoutsAlert: !!s.cashoutPending,
    leadsAlert: !!s.leadsNew,
    attnPill: { text: todo ? todo + " to do" : "All clear", tone: todo ? "warn" : "ok" },
    ovLive: num(s.battlesLive),
    ovUpcoming: num(s.battlesUpcoming),
    ovPool: money(poolInPlay),
    battlesPill: {
      text: s.battlesLive ? "Live now" : s.battlesUpcoming ? "Upcoming" : "Quiet",
      tone: s.battlesLive ? "live" : s.battlesUpcoming ? "ok" : "",
    },
    fees: money(allTime("entry")),
    prizes: money(allTime("reward")),
    refunds: money(allTime("refund")),
    moneyPill: { text: "All time", tone: "" },
    feed,
    battles: next,
  };
}

/* ---------- Pieces (same markup as the generator) ---------- */
const deltaClass = (d?: Delta) => "dh-delta" + (d && d.cls ? " " + d.cls : "");
const pillClass = (p?: Pill) => "dh-pill" + (p && p.tone ? " is-" + p.tone : "");

function Chip({ ico, label, id, value }: { ico: IconName; label: string; id: string; value?: string }) {
  return (
    <li className="dh-chip">
      <span className="dh-chip-ic"><Icon name={ico} /></span>
      <span><small>{label}</small><b id={id}>{value ?? "—"}</b></span>
    </li>
  );
}

function Stat({ id, href, ico, title, label, art, hot = false, value, d }: {
  id: string; href: string; ico: IconName; title: string; label: string; art: Art; hot?: boolean; value?: string; d?: Delta;
}) {
  return (
    <Link className={"dh-stat" + (hot ? " is-hot" : "")} href={href}>
      <span className="dh-stat-h"><span className="dh-stat-ic"><Icon name={ico} /></span>{title}</span>
      <small>{label}</small>
      <b id={id}>{value ?? "0"}</b>
      <span className={deltaClass(d)} id={id + "-d"}>{d ? d.text : ""}</span>
      <svg className="dh-illu" viewBox="0 0 88 88" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: ILLU[art] }} />
    </Link>
  );
}

function Row({ href, ico, label, id, value, alert }: { href: string; ico: IconName; label: string; id: string; value?: string; alert?: boolean }) {
  return (
    <li>
      <Link className={"dh-row" + (alert ? " is-alert" : "")} href={href}>
        <span className="dh-row-ic"><Icon name={ico} /></span>
        <span className="dh-row-t"><small>{label}</small><b id={id}>{value ?? "0"}</b></span>
        <span className="dh-row-go" aria-hidden="true"><Icon name="arrowUpRight" /></span>
      </Link>
    </li>
  );
}

function Panel({ id, ico, title, pill, children }: { id: string; ico: IconName; title: string; pill?: Pill; children: React.ReactNode }) {
  return (
    <section className="ad-card dh-panel" aria-labelledby={id + "-h"}>
      <div className="ad-card-h"><h2 id={id + "-h"}><Icon name={ico} />{title}</h2><span className={pillClass(pill)} id={id + "-pill"}>{pill ? pill.text : ""}</span></div>
      <ul className="dh-rows">{children}</ul>
    </section>
  );
}

function FeedItem({ item }: { item: FeedEntry }) {
  return (
    <li>
      <Link href={item.href}>
        <span className={"ad-feed-ic is-" + item.kind}><Svg body={FEED_ICON[item.kind]} /></span>
        <span className="ad-feed-t"><b>{item.title}</b><small>{item.sub}</small></span>
        {item.time ? <time dateTime={item.at}>{item.time}</time> : null}
      </Link>
    </li>
  );
}

export default function Overview() {
  const session = useAdminSession();
  const { toast } = useAdminUi();
  const [v, setV] = useState<View | null>(null);

  useEffect(() => {
    setV(buildView(session));
  }, [session]);

  const copyEmail = () => {
    const done = () => toast("Email copied.");
    const fail = () => toast("Couldn't copy — select the email instead.", "warn");
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(session.email).then(done, fail);
    else fail();
  };

  return (
    <>
      <section className="ad-card dh-hero" aria-labelledby="dh-h">
        <div className="dh-main">
          <div className="dh-id">
            <span className="dh-av" id="dh-av" aria-hidden="true">{v ? v.initial : "A"}</span>
            <div className="dh-id-t">
              <h2 id="dh-h">Welcome back, <span id="dh-name">{v ? v.name : "Admin"}</span></h2>
              <p>You&apos;re running BattleTrader &mdash; here&apos;s today at a glance.</p>
            </div>
            <span className="dh-date"><Icon name="calendar" /><time id="dh-date" dateTime={v?.dateIso}>{v?.dateText}</time></span>
          </div>
          <ul className="dh-chips" aria-label="Headline numbers">
            <Chip ico="users" label="Users" id="dh-users" value={v?.users} />
            <Chip ico="swords" label="Live battles" id="dh-live" value={v?.live} />
            <Chip ico="trophy" label="Prize pools in play" id="dh-pool" value={v?.pool} />
          </ul>
          <p className="dh-mini-h"><span className="dh-chip-ic"><Icon name="pulse" /></span>This week</p>
          <ul className="dh-chips" aria-label="This week">
            <Chip ico="calendar" label="Week starts" id="dh-week-start" value={v?.weekStart} />
            <Chip ico="calendar" label="Week ends" id="dh-week-end" value={v?.weekEnd} />
            <Chip ico="userPlus" label="New sign-ups" id="dh-week-new" value={v?.weekNew} />
          </ul>
        </div>
        <div className="dh-side">
          <p className="dh-mini-h"><span className="dh-chip-ic"><Icon name="shield" /></span>Admin details</p>
          <div className="dh-fields">
            <div className="dh-field">
              <small>Signed in as</small><b><span data-admin-email="">{session.email}</span></b>
              <button className="ad-icon-btn" type="button" id="dh-copy" aria-label="Copy admin email" title="Copy email" onClick={copyEmail}><Icon name="copy" /></button>
            </div>
            <div className="dh-field"><small>Session ends</small><b><span id="dh-session">{v ? v.session : "—"}</span></b></div>
            <Link className="dh-field" href="/admin/settings/"><small>Data shown</small><b><span id="dh-source">{v ? v.source : "—"}</span></b></Link>
            <Link className="dh-field" href="/admin/settings/"><small>Browser storage used</small><b><span id="dh-storage">{v ? v.storage : "—"}</span></b></Link>
          </div>
        </div>
      </section>

      <div className="dh-stats" aria-label="Key numbers">
        <Stat id="ov-held" href="/admin/transactions/" ico="dollar" title="Wallets" label="Money held by users" art="coins" hot value={v?.held} d={v?.heldD} />
        <Stat id="ov-topups" href="/admin/transactions/" ico="trend" title="Top-ups" label="Total paid in" art="growth" value={v?.topups} d={v?.topupsD} />
        <Stat id="ov-cashout-amt" href="/admin/transactions/" ico="trendDown" title="Cash-outs" label="Waiting for approval" art="cashout" value={v?.cashoutAmt} d={v?.cashD} />
        <Stat id="ov-users" href="/admin/users/" ico="users" title="Users" label="Accounts" art="people" value={v?.usersCount} d={v?.usersD} />
      </div>

      <div className="dh-panels">
        <Panel id="dp-attn" ico="alert" title="Needs your attention" pill={v?.attnPill}>
          <Row href="/admin/kyc/" ico="idCard" label="KYC to review" id="ov-kyc" value={v?.kyc} alert={v?.kycAlert} />
          <Row href="/admin/transactions/" ico="clock" label="Cash-outs to approve" id="ov-cashouts" value={v?.cashouts} alert={v?.cashoutsAlert} />
          <Row href="/admin/leads/" ico="inbox" label="New leads" id="ov-leads" value={v?.leads} alert={v?.leadsAlert} />
        </Panel>
        <Panel id="dp-battles" ico="swords" title="Battles" pill={v?.battlesPill}>
          <Row href="/admin/battles/" ico="flame" label="Live now" id="ov-live" value={v?.ovLive} />
          <Row href="/admin/battles/" ico="calendar" label="Upcoming & registering" id="ov-upcoming" value={v?.ovUpcoming} />
          <Row href="/admin/battles/" ico="trophy" label="Prize pool in play" id="ov-pool" value={v?.ovPool} />
        </Panel>
        <Panel id="dp-money" ico="coins" title="Money flow" pill={v?.moneyPill}>
          <Row href="/admin/transactions/" ico="ticket" label="Entry fees collected" id="ov-fees" value={v?.fees} />
          <Row href="/admin/transactions/" ico="medal" label="Prizes paid" id="ov-prizes" value={v?.prizes} />
          <Row href="/admin/transactions/" ico="replay" label="Refunds" id="ov-refunds" value={v?.refunds} />
        </Panel>
      </div>

      <div className="ad-grid ad-grid-2">
        <section className="ad-card" aria-labelledby="ov-feed-h">
          <div className="ad-card-h"><h2 id="ov-feed-h"><Icon name="pulse" />Recent activity</h2></div>
          <ul className="ad-feed" id="ov-feed" hidden={v ? !v.feed.length : false}>
            {v?.feed.map((item) => <FeedItem key={item.key} item={item} />)}
          </ul>
          <div className="ad-empty" id="ov-feed-empty" hidden={v ? v.feed.length > 0 : true}><Icon name="inbox" /><p>No activity yet. Signups, form messages and payments made on the website will show up here.</p></div>
        </section>
        <section className="ad-card" aria-labelledby="ov-battles-h">
          <div className="ad-card-h"><h2 id="ov-battles-h"><Icon name="swords" />Next battles</h2><Link href="/admin/battles/">All battles</Link></div>
          <ul className="ad-feed" id="ov-battles" hidden={v ? !v.battles.length : false}>
            {v?.battles.map((item) => <FeedItem key={item.key} item={item} />)}
          </ul>
          <div className="ad-empty" id="ov-battles-empty" hidden={v ? v.battles.length > 0 : true}><Icon name="swords" /><p>No upcoming battles. Add one to open registration.</p></div>
        </section>
      </div>
    </>
  );
}
