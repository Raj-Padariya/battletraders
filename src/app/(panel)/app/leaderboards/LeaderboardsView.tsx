"use client";

// Leaderboards — port of the old leaderboards.js.
// Live tab: standings for every live event (top 10, values drift slowly). Past tab: custom listbox picker, podium,
// trader search and results table. Selected archived event lives in ?t=.
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Svg } from "@panel/components/Icon";
import { BTLeaderboards as L, type ArchivedEvent, type LiveEvent, type StandingRow } from "@panel/lib/data/leaderboards";
import type { TournamentType } from "@panel/lib/data/tournaments";
import { usePanel } from "@panel/lib/panel";
import { money, pad2 } from "@panel/lib/storage";

const IC = {
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  crown: '<path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 12H5z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
  coins: '<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M9 15v2c0 1.7 2.7 3 6 3s6-1.3 6-3v-5c0-1.7-2.7-3-6-3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  arrow: '<path d="M7 17 17 7M8 7h9v9"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  swords: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4-2v-4z"/>',
  chevDown: '<path d="m6 9 6 6 6-6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
};

type Tab = "live" | "past";
type TypeFilter = "all" | TournamentType;

/* ---------- formatting ---------- */
const num = (n: number, digits: number): string => Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const signedMoney = (n: number): string => (n < 0 ? "-$" : n > 0 ? "+$" : "$") + num(n, 2);
const plainMoney = (n: number): string => "$" + num(n, 2);
const fmtDay = (iso: string): string => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const fmtTime = (iso: string): string => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const dateRange = (t: ArchivedEvent): string => fmtDay(t.start) + ", " + fmtTime(t.start) + " – " + fmtTime(t.end);
const TYPE_SHORT: Record<TournamentType, string> = { main: "Main", circuit: "Circuit", mini: "Mini" };
const countdownTo = (iso: string): string => {
  const s = Math.floor(Math.max(0, new Date(iso).getTime() - Date.now()) / 1000);
  return pad2(Math.floor(s / 3600)) + ":" + pad2(Math.floor(s / 60) % 60) + ":" + pad2(s % 60);
};
const traderHref = (handle: string): string => "/app/trader/?u=" + encodeURIComponent(handle);

function Chips({ t }: { t: ArchivedEvent }) {
  return (
    <>
      <span className={"ld-chip ld-chip-" + t.type}>{TYPE_SHORT[t.type] || t.type}</span>
      <span className="ld-chip ld-chip-fmt">{t.format}</span>
    </>
  );
}

/* ---------- results table (shared by live + past) ---------- */
const COLS: [key: string, label: string][] = [
  ["rank", "Rank"], ["who", "Trader"], ["pnl", "Total P&L"], ["equity", "Equity"], ["roi", "ROI %"],
  ["lots", "Lots"], ["dd", "Max DD %"], ["trades", "Trades"], ["prize", "Prize"],
];
const LABEL: Record<string, string> = Object.fromEntries(COLS);

function Row({ r, move }: { r: StandingRow; move?: "is-up" | "is-down" }) {
  const tone = r.pnl > 0 ? "is-pos" : r.pnl < 0 ? "is-neg" : "";
  const cls = (key: string, extra?: string) => "ld-c-" + key + (extra ? " " + extra : "");
  return (
    <tr className={"ld-row" + (r.rank <= 3 ? " r" + r.rank : "") + (move ? " " + move : "")} data-handle={r.handle}>
      <td className={cls("rank")} data-label={LABEL.rank}><span className="ld-rk" aria-label={"Rank " + r.rank}>{r.rank}</span></td>
      <td className={cls("who")} data-label={LABEL.who}>
        <Link className="ld-who" href={traderHref(r.handle)}>
          <span className="ld-av" aria-hidden="true" style={{ "--av": r.color } as React.CSSProperties}>{r.initials}</span>
          <span className="ld-handle">{r.handle}</span>
        </Link>
      </td>
      <td className={cls("pnl", tone)} data-label={LABEL.pnl}>{signedMoney(r.pnl)}</td>
      <td className={cls("equity")} data-label={LABEL.equity}>{plainMoney(r.equity)}</td>
      <td className={cls("roi", tone)} data-label={LABEL.roi} aria-label={r.roi < 0 ? "minus " + num(r.roi, 2) + "%" : undefined}>
        {r.roi !== 0 && <Svg body={r.roi > 0 ? IC.up : IC.down} />}
        {num(r.roi, 2) + "%"}
      </td>
      <td className={cls("lots")} data-label={LABEL.lots}>{num(r.lots, 2)}</td>
      <td className={cls("dd")} data-label={LABEL.dd}>{num(r.maxDD, 2) + "%"}</td>
      <td className={cls("trades")} data-label={LABEL.trades}>{r.trades}</td>
      <td className={cls("prize", r.prize ? "has-prize" : "is-none")} data-label={LABEL.prize} aria-label={r.prize ? undefined : "No prize"}>
        {r.prize ? money(r.prize) : "—"}
      </td>
    </tr>
  );
}

function Table({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <table className="ld-table">
      <caption className="ld-vh">{caption}</caption>
      <thead>
        <tr>{COLS.map(([key, label]) => <th key={key} className={"ld-c-" + key} scope="col">{label}</th>)}</tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

/* ---------- live card ---------- */
interface LiveSnapshot {
  ev: LiveEvent;
  rows: StandingRow[];
  moves: Record<string, "is-up" | "is-down">;
}

function LiveCard({ snap, clock, hidden }: { snap: LiveSnapshot; clock: string; hidden: boolean }) {
  const { ev, rows, moves } = snap;
  return (
    <section className="ac ld-live" aria-labelledby={"ld-live-" + ev.id} hidden={hidden}>
      <div className="ld-live-head">
        <div className="ld-res-title">
          <h2 id={"ld-live-" + ev.id}>{ev.name}</h2>
          <p className="ld-chips"><span className="ld-live-tag"><i></i>Live</span><Chips t={ev} /></p>
        </div>
        <ul className="ld-res-meta">
          <li><Svg body={IC.users} /><span><b>{ev.traders}</b> fighters</span></li>
          <li><Svg body={IC.coins} /><span><b>{money(ev.prizePool)}</b> prize pool</span></li>
          <li><Svg body={IC.clock} /><span><b className="ld-live-clock">{clock}</b> left</span></li>
        </ul>
      </div>
      <div className="ld-table-wrap">
        <Table caption={ev.name + " live standings, top 10"}>
          {rows.slice(0, 10).map((r) => <Row key={r.handle} r={r} move={moves[r.handle]} />)}
        </Table>
      </div>
      <div className="ld-live-foot">
        <p>{"Showing top 10 of " + ev.rows.length + " fighters · updates every few seconds"}</p>
        <Link className="ab2" href={"/app/tournament/?id=" + encodeURIComponent(ev.id)}>Battle details<Svg body={IC.arrow} /></Link>
      </div>
    </section>
  );
}

export default function LeaderboardsView() {
  const { reduceMotion } = usePanel();
  const params = useSearchParams();

  // Archive is anchored to today and live events read localStorage: build after mount.
  const [archive, setArchive] = useState<ArchivedEvent[] | null>(null);
  const [live, setLive] = useState<LiveSnapshot[]>([]);
  const [now, setNow] = useState(0);
  const [tab, setTabState] = useState<Tab>("live");
  const [type, setType] = useState<TypeFilter>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typeahead = useRef({ text: "", at: 0 });
  const reduceRef = useRef(reduceMotion);
  reduceRef.current = reduceMotion;

  useEffect(() => {
    const list = L.archive();
    setArchive(list);
    setLive(L.live().map((ev) => ({ ev, rows: ev.rows.map((r) => ({ ...r })), moves: {} })));
    setNow(Date.now());
    const fromUrl = params.get("t");
    if (fromUrl && L.get(fromUrl)) {
      setSelected(fromUrl);
      setTabState("past");
    } else if (list.length) setSelected(list[0].id);
    // Only the initial ?t= matters; later changes come from this page's own replaceState.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Small random walk on P&L so the live board feels alive. Paused while the tab is hidden. */
  const hasLive = live.length > 0;
  useEffect(() => {
    if (!hasLive) return;
    const drift = () => {
      if (document.hidden) return;
      const rand = Math.random;
      setLive((list) =>
        list.map((snap) => {
          const before: Record<string, number> = {};
          const rows = snap.rows.map((prev) => {
            before[prev.handle] = prev.rank;
            const r = { ...prev };
            r.pnl = Math.round((r.pnl + (rand() - 0.47) * 38) * 100) / 100;
            r.equity = Math.round((L.START_BALANCE + r.pnl) * 100) / 100;
            r.roi = Math.round((r.pnl / L.START_BALANCE) * 10000) / 100;
            if (rand() < 0.25) {
              r.trades += 1;
              r.lots = Math.round((r.lots + rand() * 0.6) * 100) / 100;
            }
            if (r.pnl < 0) r.maxDD = Math.max(r.maxDD, Math.round(-r.roi * 100) / 100);
            return r;
          });
          L.rank(rows, snap.ev.prizes);
          const moves: Record<string, "is-up" | "is-down"> = {};
          if (!reduceRef.current) {
            rows.slice(0, 10).forEach((r) => {
              const was = before[r.handle];
              if (was && was > r.rank) moves[r.handle] = "is-up";
              else if (was && was < r.rank) moves[r.handle] = "is-down";
            });
          }
          return { ev: snap.ev, rows, moves };
        }),
      );
    };
    const driftTimer = window.setInterval(drift, 3500);
    const clockTimer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearInterval(driftTimer);
      window.clearInterval(clockTimer);
    };
  }, [hasLive]);

  const matchesType = useCallback((t: ArchivedEvent) => type === "all" || t.type === type, [type]);
  const filtered = useMemo(() => (archive || []).filter(matchesType), [archive, matchesType]);
  const liveShown = live.filter((s) => matchesType(s.ev)).length;

  // Keep the selection inside the current filter (the old renderPast did this on every render).
  const effectiveSelected = filtered.some((t) => t.id === selected) ? selected : filtered[0]?.id ?? null;
  useEffect(() => {
    if (effectiveSelected !== selected) {
      setSelected(effectiveSelected);
      setQuery("");
    }
  }, [effectiveSelected, selected]);

  /* ?t= mirrors the past-tab selection. */
  useEffect(() => {
    if (!archive) return;
    const url = new URL(window.location.href);
    if (tab === "past" && effectiveSelected) url.searchParams.set("t", effectiveSelected);
    else url.searchParams.delete("t");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }, [archive, tab, effectiveSelected]);

  const current = effectiveSelected ? L.get(effectiveSelected) : null;
  const currentRows = useMemo(() => (effectiveSelected ? L.results(effectiveSelected) : []), [effectiveSelected]);
  const q = query.trim().toLowerCase();
  const shownRows = q ? currentRows.filter((r) => r.handle.toLowerCase().includes(q)) : currentRows;
  const paid = (archive || []).reduce((sum, t) => sum + t.prizePool, 0);

  /* ---------- tabs ---------- */
  const closeList = useCallback((refocus: boolean) => {
    setListOpen(false);
    if (refocus) selectRef.current?.focus();
  }, []);

  const setTab = (name: Tab, focus?: boolean) => {
    setTabState(name);
    closeList(false);
    if (focus) tabRefs.current[name === "live" ? 0 : 1]?.focus();
  };

  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") next = 1 - i;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 1;
    if (next === null) return;
    e.preventDefault();
    setTab(next === 0 ? "live" : "past", true);
  };

  /* ---------- custom listbox ---------- */
  const openList = () => {
    if (!filtered.length) return;
    const idx = filtered.findIndex((t) => t.id === effectiveSelected);
    setActiveIndex(idx < 0 ? 0 : idx);
    setListOpen(true);
  };

  useLayoutEffect(() => {
    if (listOpen) listboxRef.current?.focus();
  }, [listOpen]);

  useEffect(() => {
    if (!listOpen || activeIndex < 0) return;
    listboxRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [listOpen, activeIndex]);

  useEffect(() => {
    if (!listOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!(e.target as Element | null)?.closest?.(".ld-combo")) closeList(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [listOpen, closeList]);

  const clampActive = (i: number) => setActiveIndex(Math.max(0, Math.min(filtered.length - 1, i)));

  const choose = (id: string) => {
    closeList(true);
    if (id !== effectiveSelected) {
      setSelected(id);
      setQuery("");
    }
  };

  const onListKey = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const key = e.key;
    if (key === "ArrowDown") clampActive(activeIndex + 1);
    else if (key === "ArrowUp") clampActive(activeIndex - 1);
    else if (key === "Home") clampActive(0);
    else if (key === "End") clampActive(filtered.length - 1);
    else if (key === "PageDown") clampActive(activeIndex + 8);
    else if (key === "PageUp") clampActive(activeIndex - 8);
    else if (key === "Enter" || key === " ") {
      if (filtered[activeIndex]) choose(filtered[activeIndex].id);
    } else if (key === "Escape") closeList(true);
    else if (key === "Tab") {
      closeList(false);
      return;
    } else if (key.length === 1 && /\S/.test(key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const stamp = Date.now();
      const ta = typeahead.current;
      ta.text = (stamp - ta.at > 700 ? "" : ta.text) + key.toLowerCase();
      ta.at = stamp;
      const names = filtered.map((t) => t.name.toLowerCase());
      // A repeated single letter cycles through matches; a longer prefix searches from the current row.
      const start = ta.text.length === 1 ? activeIndex + 1 : activeIndex;
      for (let n = 0; n < names.length; n++) {
        const i = (start + n) % names.length;
        if (names[i].startsWith(ta.text)) {
          clampActive(i);
          break;
        }
      }
    } else return;
    e.preventDefault();
  };

  const onListBlur = () => {
    window.setTimeout(() => {
      if (document.activeElement !== listboxRef.current && document.activeElement !== selectRef.current) closeList(false);
    }, 0);
  };

  const pastEmpty = !!archive && filtered.length === 0;
  const liveCount = archive ? live.filter((s) => matchesType(s.ev)).length : 0;

  return (
    <>
      <section className="ah ld-hero" aria-labelledby="ld-title">
        <div className="ah-floor" aria-hidden="true"></div>
        <div className="ah-txt">
          <div className="ld-hero-head">
            <span className="ld-hero-ico" aria-hidden="true"><Svg body={IC.trophy} /></span>
            <p className="ld-tag"><Svg body={IC.swords} />Combat standings</p>
          </div>
          <h1 id="ld-title">Leader<span>boards</span></h1>
          <p>View live tournament standings and past results</p>
          <p className="ld-hero-meta">
            <span className="ld-meta-live"><i aria-hidden="true"></i><b id="ld-hero-live">{live.length}</b> Live</span>
            <span className="ld-meta-arch"><Svg body={IC.layers} /><b id="ld-hero-archived">{archive?.length ?? 0}</b> archived</span>
          </p>
        </div>
        <dl className="ld-hero-stats" data-glass="">
          <div><dt>Live battles</dt><dd id="ld-stat-live">{live.length}</dd></div>
          <div><dt>Battles archived</dt><dd id="ld-stat-arch">{archive?.length ?? 0}</dd></div>
          <div><dt>Prize money paid</dt><dd id="ld-stat-paid">{money(paid)}</dd></div>
        </dl>
      </section>

      <div className="ld-bar">
        <div className="ld-tabs" role="tablist" aria-label="Leaderboard view">
          {(["live", "past"] as const).map((name, i) => {
            const on = tab === name;
            return (
              <button
                key={name}
                ref={(node) => {
                  tabRefs.current[i] = node;
                }}
                className="ld-tab"
                id={"ld-tab-" + name}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls={"ld-panel-" + name}
                tabIndex={on ? 0 : -1}
                onClick={() => setTab(name)}
                onKeyDown={(e) => onTabKey(e, i)}
              >
                <Svg body={name === "live" ? IC.pulse : IC.clock} />
                {name === "live" ? "Live tournaments" : "Past tournaments"}
                <b id={"ld-count-" + name}>{name === "live" ? liveCount : filtered.length}</b>
              </button>
            );
          })}
        </div>
        <span className="ld-sample">Sample data</span>
      </div>

      <section className="ac ld-filter" aria-labelledby="ld-filter-h">
        <div className="ac-h"><h2 id="ld-filter-h"><Svg body={IC.filter} />Filter by type</h2></div>
        <div className="ld-pills" role="group" aria-labelledby="ld-filter-h">
          {(["all", "main", "circuit", "mini"] as const).map((value) => (
            <button key={value} className="ld-pill" type="button" data-type={value} aria-pressed={type === value} onClick={() => setType(value)}>
              {value === "all" ? "All" : TYPE_SHORT[value]}
            </button>
          ))}
        </div>
      </section>

      <div className="ld-panel" id="ld-panel-live" role="tabpanel" aria-labelledby="ld-tab-live" tabIndex={0} hidden={tab !== "live"}>
        <div className="ld-live-list" id="ld-live-list">
          {live.map((snap) => (
            <LiveCard key={snap.ev.id} snap={snap} clock={now ? countdownTo(snap.ev.end) : "--:--:--"} hidden={!matchesType(snap.ev)} />
          ))}
        </div>
        <div className="ac ld-empty" id="ld-live-empty" hidden={!archive || liveShown > 0}>
          <span className="ld-empty-ico" aria-hidden="true"><Svg body={IC.trophy} /></span>
          <h2>No live tournaments</h2>
          <p>There are no active tournaments right now. Check back soon or browse past tournament results.</p>
          <button className="btn b-ember" id="ld-go-past" type="button" onClick={() => setTab("past", true)}><Svg body={IC.clock} />Browse past results</button>
        </div>
      </div>

      <div className="ld-panel" id="ld-panel-past" role="tabpanel" aria-labelledby="ld-tab-past" tabIndex={0} hidden={tab !== "past"}>
        <section className="ac ld-pick" aria-labelledby="ld-pick-h" hidden={pastEmpty}>
          <p className="ld-pick-h" id="ld-pick-h">Select a tournament</p>
          <div className="ld-combo">
            <button
              ref={selectRef}
              className="ld-select"
              id="ld-select"
              type="button"
              aria-haspopup="listbox"
              aria-expanded={listOpen}
              aria-controls="ld-listbox"
              aria-labelledby="ld-pick-h ld-select-name"
              onClick={() => (listOpen ? closeList(true) : openList())}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  openList();
                }
              }}
            >
              <span className="ld-select-main">
                <span className="ld-select-name" id="ld-select-name">{current ? current.name : "Choose a tournament"}</span>
                <span className="ld-select-sub" id="ld-select-sub">
                  {current && <><Chips t={current} /><small className="ld-opt-date">{fmtDay(current.start)}</small></>}
                </span>
              </span>
              <span className="ld-caret"><Svg body={IC.chevDown} /></span>
            </button>
            <ul
              ref={listboxRef}
              className="ld-listbox"
              id="ld-listbox"
              role="listbox"
              tabIndex={-1}
              aria-labelledby="ld-pick-h"
              aria-activedescendant={listOpen && filtered[activeIndex] ? "ld-opt-" + filtered[activeIndex].id : undefined}
              hidden={!listOpen}
              onKeyDown={onListKey}
              onBlur={onListBlur}
            >
              {filtered.map((t, i) => (
                <li
                  key={t.id}
                  className={"ld-opt" + (i === activeIndex ? " is-active" : "")}
                  id={"ld-opt-" + t.id}
                  role="option"
                  data-id={t.id}
                  aria-selected={t.id === effectiveSelected}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(t.id)}
                  onMouseMove={() => {
                    if (activeIndex !== i) setActiveIndex(i);
                  }}
                >
                  <span className="ld-opt-txt">
                    <b className="ld-opt-name">{t.name}</b>
                    <span className="ld-opt-sub"><Chips t={t} /><small className="ld-opt-date">{fmtDay(t.start)}</small></span>
                  </span>
                  <span className="ld-opt-tick"><Svg body={IC.check} /></span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="ac ld-empty" id="ld-past-empty" hidden={!pastEmpty}>
          <span className="ld-empty-ico" aria-hidden="true"><Svg body={IC.trophy} /></span>
          <h2>No results for this type</h2>
          <p>No archived battles match this filter yet. Show every type to see all past results.</p>
          <button
            className="btn b-ember"
            id="ld-show-all"
            type="button"
            onClick={() => {
              setType("all");
              // The picker is hidden until the filter re-renders; focus it on the next frame.
              requestAnimationFrame(() => selectRef.current?.focus());
            }}
          >
            <Svg body={IC.layers} />Show all types
          </button>
        </div>

        <section className="ac ld-result" id="ld-result" aria-labelledby="ld-res-name" hidden={pastEmpty || !current}>
          {current && (
            <>
              <div className="ld-res-head">
                <div className="ld-res-title">
                  <h2 id="ld-res-name">{current.name}</h2>
                  <p className="ld-chips" id="ld-res-chips"><span className="ld-chip ld-chip-done">Finished</span><Chips t={current} /></p>
                </div>
                <ul className="ld-res-meta">
                  <li><Svg body={IC.users} /><span><b id="ld-res-traders">{current.traders}</b> traders</span></li>
                  <li><Svg body={IC.coins} /><span><b id="ld-res-pool">{money(current.prizePool)}</b> prize pool</span></li>
                  <li><Svg body={IC.calendar} /><span id="ld-res-dates">{dateRange(current)}</span></li>
                </ul>
              </div>
              <div className="ld-sponsors" id="ld-res-sponsors">
                <span className="ld-sp-lbl">Powered by</span>
                {current.sponsors.map((name, i) => <span key={name + i} className={"ld-sp ld-sp-" + (i % 3)}>{name}</span>)}
              </div>

              <ol className="ld-podium" id="ld-podium" aria-label="Podium">
                {currentRows.slice(0, 3).map((r) => (
                  <li key={r.handle} className={"ld-pod ld-pod-" + r.rank} aria-label={["", "1st", "2nd", "3rd"][r.rank] + " place: " + r.handle + ", " + signedMoney(r.pnl)}>
                    {r.rank === 1 && <span className="ld-crown" aria-hidden="true"><Svg body={IC.crown} /></span>}
                    <Link className="ld-pod-who" href={traderHref(r.handle)}>
                      <span className="ld-pod-av" aria-hidden="true" style={{ "--av": r.color } as React.CSSProperties}>{r.initials}</span>
                      <b className="ld-pod-name">{r.handle}</b>
                    </Link>
                    <span className={"ld-pod-pnl " + (r.pnl >= 0 ? "is-pos" : "is-neg")}>{signedMoney(r.pnl)}</span>
                    {r.prize > 0 && <span className="ld-pod-prize">{money(r.prize) + " prize"}</span>}
                    <span className="ld-pod-step" aria-hidden="true">{r.rank}</span>
                  </li>
                ))}
              </ol>

              <div className="ld-tools">
                <label className="ld-search">
                  <Svg body={IC.search} />
                  <span className="ld-vh">Search trader</span>
                  <input ref={searchRef} id="ld-search" type="search" placeholder="Search trader..." autoComplete="off" aria-describedby="ld-search-count" value={query} onChange={(e) => setQuery(e.target.value)} />
                </label>
                <p className="ld-count" id="ld-search-count" aria-live="polite">
                  {q ? shownRows.length + " of " + currentRows.length + " traders" : currentRows.length + " traders"}
                </p>
              </div>
              <div className="ld-table-wrap" id="ld-past-wrap">
                <Table caption={current.name + " final results"}>
                  {shownRows.map((r) => <Row key={r.handle} r={r} />)}
                  {shownRows.length === 0 && (
                    <tr className="ld-row-empty">
                      <td colSpan={COLS.length}>
                        <div className="ld-noresult">
                          <Svg body={IC.search} />
                          <p>{"No fighter matches “" + query.trim() + "” in this battle."}</p>
                          <button
                            className="ab2"
                            type="button"
                            onClick={() => {
                              setQuery("");
                              searchRef.current?.focus();
                            }}
                          >
                            Clear search
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Table>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
