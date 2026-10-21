"use client";

// Port of the old my-tournaments.js list half: stats, Upcoming/Live/Completed tabs, cards, recommendations, countdowns.
// Withdraw opens the dialog in PanelShell's `after` slot through WITHDRAW_OPEN; it answers with WITHDRAW_DONE.
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Svg } from "@panel/components/Icon";
import { BTTournaments, statusOf, type Enrollment, type Tournament } from "@panel/lib/data/tournaments";
import { usePanel } from "@panel/lib/panel";
import { money, pad2 } from "@panel/lib/storage";

export const WITHDRAW_OPEN = "bt-mt-withdraw-open";
export const WITHDRAW_DONE = "bt-mt-withdraw-done";

const ICON = {
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  swords: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2"/>',
  out: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l-5-5 5-5M5 12h11"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
};

type Group = "upcoming" | "live" | "completed";
const TABS: Group[] = ["upcoming", "live", "completed"];
const TAB_LABEL: Record<Group, string> = { upcoming: "Upcoming", live: "Live", completed: "Completed" };
const STATUS_LABEL: Record<string, string> = { registering: "Registering", upcoming: "Upcoming", live: "Live", completed: "Completed" };
const EMPTY_TEXT: Record<Group, string> = { upcoming: "No upcoming tournaments", live: "No live tournaments", completed: "No completed tournaments" };
const PAID_LABEL: Record<string, string> = { wallet: "Wallet", credits: "Credits", voucher: "Voucher", coupon: "Coupon", free: "Free" };

interface Row {
  id: string;
  t: Tournament;
  e: Enrollment;
}

const groupOf = (t: Tournament, now: number): Group => {
  const s = statusOf(t, now);
  return s === "registering" || s === "upcoming" ? "upcoming" : s;
};

function span(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d) return d + "d " + h + "h";
  if (h) return h + "h " + pad2(m) + "m " + pad2(s % 60) + "s";
  return m + "m " + pad2(s % 60) + "s";
}

function countdownText(t: Tournament, now: number): string {
  const start = new Date(t.start).getTime();
  const end = new Date(t.end).getTime();
  if (now < start) return "Starts in " + span(start - now);
  if (now < end) return "Ends in " + span(end - now);
  return "Finished " + span(now - end) + " ago";
}

function roundText(t: Tournament, group: Group, now: number): string {
  const total = t.rounds.length;
  if (group === "completed") return total + " of " + total + " played";
  if (group === "upcoming") return "Round 1 of " + total;
  let index = 0;
  t.rounds.forEach((r, i) => {
    if (now >= new Date(r.start).getTime()) index = i;
  });
  return "Round " + (index + 1) + " of " + total;
}

const paidText = (e: Enrollment): string => (!e.amount ? "Free entry" : money(e.amount) + " \u00b7 " + (PAID_LABEL[e.paidWith] || e.paidWith));
const entryText = (t: Tournament): string => (t.entryLabel ? t.entryLabel : t.entryFee ? money(t.entryFee) : "Free");
const detailHref = (t: Tournament): string => "/app/tournament/?id=" + encodeURIComponent(t.id);

function readRows(): Row[] {
  const all = BTTournaments.enrollments();
  return Object.keys(all)
    .map((id) => ({ id, t: BTTournaments.get(id), e: all[id] }))
    .filter((row): row is Row => !!row.t)
    .sort((a, b) => new Date(a.t.start).getTime() - new Date(b.t.start).getTime());
}

function Fact({ cls, label, value, valueCls }: { cls: string; label: string; value: string; valueCls?: string }) {
  return (
    <div className={cls}>
      <dt>{label}</dt>
      <dd className={valueCls || undefined}>{value}</dd>
    </div>
  );
}

function makeFormat(opts: Intl.DateTimeFormatOptions, timeZone?: string): Intl.DateTimeFormat {
  try {
    if (timeZone) return new Intl.DateTimeFormat("en-GB", { ...opts, timeZone });
  } catch {
    // unknown time zone: fall back to the browser's
  }
  return new Intl.DateTimeFormat("en-GB", opts);
}

function dayTile(fmt: Intl.DateTimeFormat, iso: string): { day: string; month: string } {
  const parts = fmt.formatToParts(new Date(iso));
  return {
    day: parts.find((p) => p.type === "day")?.value ?? "",
    month: parts.find((p) => p.type === "month")?.value ?? "",
  };
}

export default function MyTournaments() {
  const { profile } = usePanel();
  const [loaded, setLoaded] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [recPicks, setRecPicks] = useState<Tournament[]>([]);
  const [now, setNow] = useState(0);
  const [current, setCurrent] = useState<Group>("upcoming");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const reload = useCallback(() => {
    const at = Date.now();
    setRows(readRows());
    setRecPicks(
      BTTournaments.list()
        .filter((t) => statusOf(t, at) === "registering" && !BTTournaments.isEnrolled(t.id))
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .slice(0, 2),
    );
    setNow(at);
    setLoaded(true);
  }, []);

  useEffect(() => {
    reload();
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    window.addEventListener(WITHDRAW_DONE, reload);
    return () => {
      window.clearInterval(id);
      window.removeEventListener(WITHDRAW_DONE, reload);
    };
  }, [reload]);

  const dateFmt = useMemo(
    () => makeFormat({ weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }, profile.timezone),
    [profile.timezone],
  );
  const dayFmt = useMemo(() => makeFormat({ day: "2-digit", month: "short" }, profile.timezone), [profile.timezone]);

  const groups: Record<Group, Row[]> = { upcoming: [], live: [], completed: [] };
  rows.forEach((row) => groups[groupOf(row.t, now)].push(row));
  const shown = groups[current];

  const select = (index: number, focus: boolean) => {
    setCurrent(TABS[index]);
    if (focus) tabRefs.current[index]?.focus();
  };
  const onTabKey = (event: React.KeyboardEvent, i: number) => {
    let next = -1;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (i + 1) % TABS.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (i - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TABS.length - 1;
    if (next < 0) return;
    event.preventDefault();
    select(next, true);
  };

  const openWithdraw = (id: string, button: HTMLButtonElement) => {
    window.dispatchEvent(new CustomEvent(WITHDRAW_OPEN, { detail: { id, opener: button } }));
  };


  return (
    <>
      <section className="ah mt-hero" aria-labelledby="mt-title">
        <div className="ah-txt mt-hero-txt">
          <span className="mt-hero-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></svg></span>
          <p className="ah-tag mt-tag"><i></i>Member roster</p>
          <h1 id="mt-title">My <span>tournaments</span></h1>
          <p>Track your tournament participation</p>
        </div>
        <ul className="mt-stats" aria-label="Your tournament summary">
          <li className="mt-stat">
            <small className="mt-stat-lbl"><span className="mt-stat-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3s5 4.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 1.5-4S9 12 11 12c0-4 1-9 1-9z" /></svg></span>Active</small>
            <b className="mt-stat-val" id="mt-n-active">{String(groups.live.length)}</b>
          </li>
          <li className="mt-stat">
            <small className="mt-stat-lbl"><span className="mt-stat-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg></span>Upcoming</small>
            <b className="mt-stat-val" id="mt-n-upcoming">{String(groups.upcoming.length)}</b>
          </li>
          <li className="mt-stat">
            <small className="mt-stat-lbl"><span className="mt-stat-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m8 12.5 3 3 5-6" /></svg></span>Completed</small>
            <b className="mt-stat-val" id="mt-n-completed">{String(groups.completed.length)}</b>
          </li>
          <li className="mt-stat">
            <small className="mt-stat-lbl"><span className="mt-stat-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M3 10h18M16 15h2" /></svg></span>Earnings</small>
            <b className="mt-stat-val" id="mt-n-earnings">{money(0)}</b>
          </li>
        </ul>
      </section>

      <section className="mt-board" aria-label="Your tournaments">
        <div className="mt-bar">
          <div className="mt-tabs" role="tablist" aria-label="Tournament status">
            {TABS.map((key, i) => {
              const on = key === current;
              const n = groups[key].length;
              return (
                <button
                  key={key}
                  ref={(node) => {
                    tabRefs.current[i] = node;
                  }}
                  type="button"
                  className="mt-tab"
                  role="tab"
                  id={"mt-tab-" + key}
                  data-tab={key}
                  aria-controls="mt-panel"
                  aria-selected={on ? "true" : "false"}
                  aria-label={loaded ? TAB_LABEL[key] + ", " + n + " tournament" + (n === 1 ? "" : "s") : undefined}
                  tabIndex={on ? 0 : -1}
                  onClick={() => select(i, false)}
                  onKeyDown={(event) => onTabKey(event, i)}
                >
                  <span className="mt-tab-lbl">{TAB_LABEL[key]}</span>
                  <span className={"mt-count" + (n > 0 ? " has" : "")} id={"mt-c-" + key}>{String(n)}</span>
                </button>
              );
            })}
          </div>
          <Link className="mt-btn mt-btn-line mt-bar-link" href="/app/browse-tournaments/"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg><span>Browse tournaments</span></Link>
        </div>

        <div className="mt-panel" id="mt-panel" role="tabpanel" aria-labelledby={"mt-tab-" + current} tabIndex={0}>
          <ul className="mt-list" id="mt-list" hidden={loaded && shown.length === 0}>
            {shown.map(({ t, e }) => {
              const group = current;
              const status = statusOf(t, now);
              const tile = dayTile(dayFmt, t.start);
              return (
                <li key={t.id} className={"mt-card mt-t-" + t.type} data-id={t.id}>
                  <span className="mt-day" aria-hidden="true"><b>{tile.day}</b><small>{tile.month}</small></span>
                  <div className="mt-main">
                    <div className="mt-top">
                      <span className="mt-chip">{BTTournaments.typeLabel(t.type)}</span>
                      {status === "live" ? (
                        <span className="mt-chip mt-live"><i></i>Live</span>
                      ) : (
                        <span className={"mt-chip mt-st s-" + status}><i></i>{STATUS_LABEL[status]}</span>
                      )}
                    </div>
                    <h3 className="mt-name">{t.name}</h3>
                    <div className="mt-when">
                      <span className="mt-date"><Svg body={ICON.calendar} /><span>{dateFmt.format(new Date(t.start))}</span></span>
                      <span className={"mt-chip mt-cd" + (group === "live" ? " is-live" : group === "completed" ? " is-done" : "")}>
                        <Svg body={ICON.clock} />
                        <span className="mt-cd-txt" data-cd={t.id}>{countdownText(t, now)}</span>
                      </span>
                    </div>
                    {group === "completed" ? (
                      <p className="mt-result"><Svg body={ICON.info} /><span>Results publish when the backend goes live.</span></p>
                    ) : null}
                  </div>
                  <dl className="mt-facts">
                    <Fact cls="f-prize" label="Prize pool" value={money(t.prizePool)} />
                    <Fact cls="f-paid" label="You paid" value={paidText(e)} valueCls={e.amount ? "" : "is-free"} />
                    <Fact cls="f-round" label="Rounds" value={roundText(t, group, now)} />
                  </dl>
                  <div className="mt-actions">
                    <Link className="mt-btn mt-btn-line" href={detailHref(t)}><Svg body={ICON.eye} /><span>View details</span></Link>
                    {group === "upcoming" ? (
                      <button
                        className="mt-btn mt-btn-danger mt-withdraw"
                        type="button"
                        data-withdraw={t.id}
                        aria-label={"Withdraw from " + t.name}
                        onClick={(event) => openWithdraw(t.id, event.currentTarget)}
                      >
                        <Svg body={ICON.out} /><span>Withdraw</span>
                      </button>
                    ) : group === "live" ? (
                      <Link className="mt-btn mt-btn-live" href="/app/arena/"><Svg body={ICON.swords} /><span>Enter battle</span></Link>
                    ) : (
                      <Link className="mt-btn mt-btn-grad" href="/app/leaderboards/"><Svg body={ICON.chart} /><span>View leaderboard</span></Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-empty" id="mt-empty" hidden={!loaded || shown.length > 0}>
            <span className="mt-empty-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></svg></span>
            <h2 className="mt-empty-h">No tournaments found</h2>
            <p className="mt-empty-txt" id="mt-empty-txt">{EMPTY_TEXT[current]}</p>
            <Link className="mt-btn mt-btn-grad" href="/app/browse-tournaments/"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg><span>Browse tournaments</span></Link>
          </div>

          <section className="mt-rec" id="mt-rec" aria-labelledby="mt-rec-h" hidden={!loaded || shown.length > 0 || recPicks.length === 0}>
            <h2 className="mt-rec-h" id="mt-rec-h"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" /></svg>Recommended for you</h2>
            <ul className="mt-rec-list" id="mt-rec-list">
              {recPicks.map((t) => (
                <li key={t.id}>
                  <Link className={"mt-rec-a mt-t-" + t.type} href={detailHref(t)} data-glass="">
                    <b>{t.name}</b>
                    <small><span data-cd={t.id}>{countdownText(t, now)}</span>{" \u00b7 Entry " + entryText(t)}</small>
                    <Svg body={ICON.chev} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <p className="mt-note"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg><span>Sample data. Your enrollments are kept in this browser until accounts go live.</span></p>
      </section>
    </>
  );
}
