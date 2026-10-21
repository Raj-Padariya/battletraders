"use client";

// #tn-browse — port of the Browse half of the old tournaments.js: counters, featured battle, filters, grid.
import Link from "next/link";
import { useRef, useState } from "react";
import { statusOf, type Tournament, type TournamentStatus } from "@panel/lib/data/tournaments";
import { money } from "@panel/lib/storage";
import { detailUrl, entryText, fmtRange, fmtShort, fmtTime, type PathName } from "./_shared/format";
import { ActionBtn, Byline, CdChip, Ico, Poster, RegPill, StatusChip, TypeChip, ViewBtn } from "./_shared/pieces";
import { useTournaments } from "./_shared/useTournaments";

const TABS = [
  { id: "tn-tab-all", type: "all", label: "All tournaments" },
  { id: "tn-tab-main", type: "main", label: "Main" },
  { id: "tn-tab-circuit", type: "circuit", label: "Circuit" },
  { id: "tn-tab-mini", type: "mini", label: "Mini" },
];
const ORDER: Record<TournamentStatus, number> = { live: 0, registering: 1, upcoming: 2, completed: 3 };

interface Filters {
  type: string;
  q: string;
  status: string;
  entry: string;
  loc: string;
}
const NO_FILTERS: Filters = { type: "all", q: "", status: "all", entry: "all", loc: "all" };

function Fact({ label, value, small, cls }: { label: string; value: string; small?: string; cls?: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={cls}>
        {value}
        {small ? <small>{small}</small> : null}
      </dd>
    </div>
  );
}

const MetaLi = ({ icon, text }: { icon: PathName; text: string }) => (
  <li>
    <Ico name={icon} />
    <span>{text}</span>
  </li>
);

const MoneyItem = ({ cls, icon, label, value }: { cls: string; icon: PathName; label: string; value: string }) => (
  <div className={cls}>
    <Ico name={icon} />
    <span>
      <small>{label}</small>
      <b>{value}</b>
    </span>
  </div>
);

export default function Browse() {
  const { snap, tick } = useTournaments();
  const now = snap.at;
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [qInput, setQInput] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const counts = { live: 0, registering: 0, upcoming: 0 };
  snap.list.forEach((t) => {
    const status = statusOf(t, now);
    if (status !== "completed") counts[status] += 1;
  });

  const active = snap.list.filter((t) => statusOf(t, now) !== "completed");
  const featured: Tournament | undefined =
    active.find((x) => x.featured) || active.slice().sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];

  const matches = (t: Tournament) => {
    if (filters.type !== "all" && t.type !== filters.type) return false;
    if (filters.q && t.name.toLowerCase().indexOf(filters.q.toLowerCase()) === -1) return false;
    if (filters.status !== "all" && statusOf(t, now) !== filters.status) return false;
    if (filters.entry === "free" && t.entryFee > 0) return false;
    if (filters.entry === "paid" && !(t.entryFee > 0)) return false;
    if (filters.loc === "online" && !t.online) return false;
    if (filters.loc === "inperson" && t.online) return false;
    return true;
  };
  const list = snap.list
    .filter(matches)
    .sort((a, b) => ORDER[statusOf(a, now)] - ORDER[statusOf(b, now)] || new Date(a.start).getTime() - new Date(b.start).getTime());

  const selectTab = (index: number, focus: boolean) => {
    setFilters((f) => ({ ...f, type: TABS[index].type }));
    if (focus) tabRefs.current[index]?.focus();
  };
  const onTabKey = (event: React.KeyboardEvent, index: number) => {
    let next = -1;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % TABS.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TABS.length - 1;
    if (next < 0) return;
    event.preventDefault();
    selectTab(next, true);
  };
  const reset = () => {
    setQInput("");
    setFilters(NO_FILTERS);
    tabRefs.current[0]?.focus();
  };
  const activeTab = TABS.find((tab) => tab.type === filters.type) || TABS[0];

  return (
    <div className="tn-page" id="tn-browse">
      <section className="ah tn-hero" aria-labelledby="tn-title">
        <div className="ah-txt">
          <div className="tn-hero-row">
            <span className="tn-hero-ico" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></svg></span>
            <h1 id="tn-title"><span>Tournaments</span></h1>
          </div>
          <p>Browse and join exciting trading competitions</p>
          <p className="tn-sample">Sample events &middot; real schedules arrive with live accounts</p>
        </div>
        <ul className="tn-counters" aria-label="Tournament counts">
          <li className="c-live"><b id="tn-n-live">{counts.live}</b><span><i></i>Active</span></li>
          <li className="c-reg"><b id="tn-n-reg">{counts.registering}</b><span>Registering</span></li>
          <li className="c-up"><b id="tn-n-up">{counts.upcoming}</b><span>Upcoming</span></li>
        </ul>
      </section>

      <section className="tn-sec" aria-labelledby="tn-feat-h" hidden={snap.loaded && !featured}>
        <h2 className="tn-sec-h" id="tn-feat-h"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" /></svg>Featured battle</h2>
        <div id="tn-featured">
          {featured ? (
            <article className={"ac tn-feat tn-t-" + featured.type} data-glass="" aria-labelledby="tn-feat-name">
              <Poster t={featured} />
              <div className="tn-feat-info">
                <div className="tn-chips">
                  <TypeChip t={featured} />
                  <StatusChip t={featured} now={now} />
                  <CdChip t={featured} now={tick} />
                </div>
                <h3 className="tn-feat-name" id="tn-feat-name">{featured.name}</h3>
                <p className="tn-feat-tag">{featured.tagline}</p>
                <dl className="tn-facts">
                  <Fact label="Prize pool" value={money(featured.prizePool)} cls="tn-violet" />
                  <Fact label="Entry fee" value={entryText(featured)} />
                  <Fact label="Starts" value={fmtShort(featured.start) + " " + new Date(featured.start).getFullYear()} small={fmtTime(featured.start)} />
                </dl>
                <Byline t={featured} />
                <div className="tn-feat-foot">
                  <RegPill t={featured} now={now} />
                  <div className="tn-actions">
                    <ViewBtn t={featured} area="feat" />
                    <ActionBtn t={featured} area="feat" now={now} enrolled={snap.enrolled} />
                  </div>
                </div>
              </div>
            </article>
          ) : null}
        </div>
      </section>

      <section className="ac tn-filters" aria-label="Filter tournaments">
        <div className="tn-filter-row">
          <div className="tn-seg" role="tablist" aria-label="Tournament type">
            {TABS.map((tab, index) => {
              const on = tab.type === filters.type;
              return (
                <button
                  key={tab.id}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  className={"tn-seg-b" + (on ? " is-on" : "")}
                  id={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={on ? "true" : "false"}
                  aria-controls="tn-grid"
                  tabIndex={on ? undefined : -1}
                  data-type={tab.type}
                  onClick={() => selectTab(index, false)}
                  onKeyDown={(event) => onTabKey(event, index)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="tn-search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <label className="tn-sr" htmlFor="tn-q">Search tournaments by name</label>
            <input
              id="tn-q"
              type="search"
              placeholder="Search by name"
              autoComplete="off"
              value={qInput}
              onChange={(event) => {
                setQInput(event.target.value);
                const q = event.target.value.trim();
                setFilters((f) => ({ ...f, q }));
              }}
            />
          </div>
          <div className="tn-select">
            <label className="tn-sr" htmlFor="tn-status">Status</label>
            <select id="tn-status" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              <option value="all">All statuses</option>
              <option value="registering">Registering</option>
              <option value="upcoming">Upcoming</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <button className="tn-more" id="tn-more-btn" type="button" aria-expanded={moreOpen ? "true" : "false"} aria-controls="tn-more" onClick={() => setMoreOpen(!moreOpen)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg><span>More</span></button>
        </div>
        <div className="tn-more-panel" id="tn-more" hidden={!moreOpen}>
          <div className="tn-select">
            <label htmlFor="tn-entry">Entry</label>
            <select id="tn-entry" value={filters.entry} onChange={(event) => setFilters({ ...filters, entry: event.target.value })}>
              <option value="all">Any entry</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div className="tn-select">
            <label htmlFor="tn-loc">Location</label>
            <select id="tn-loc" value={filters.loc} onChange={(event) => setFilters({ ...filters, loc: event.target.value })}>
              <option value="all">Anywhere</option>
              <option value="online">Online</option>
              <option value="inperson">In-person</option>
            </select>
          </div>
        </div>
      </section>

      <section className="tn-sec" aria-labelledby="tn-all-h">
        <div className="tn-grid-h">
          <h2 className="tn-sec-h" id="tn-all-h"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2" /></svg>All battles</h2>
          <p className="tn-count" id="tn-count" aria-live="polite">{snap.loaded ? list.length + (list.length === 1 ? " battle" : " battles") : ""}</p>
        </div>
        <div className="tn-grid" id="tn-grid" role="tabpanel" aria-labelledby={activeTab.id} hidden={snap.loaded && !list.length}>
          {list.map((t) => (
            <article key={t.id} className={"ac tn-card tn-t-" + t.type} id={"tn-card-" + t.id} data-glass="" aria-labelledby={"tn-card-h-" + t.id}>
              <div className="tn-chips">
                <TypeChip t={t} />
                <StatusChip t={t} now={now} />
              </div>
              <div className="tn-card-head">
                <span className="tn-card-ico" aria-hidden="true"><Ico name="trophy" /></span>
                <div className="tn-card-title">
                  <h3 className="tn-card-name" id={"tn-card-h-" + t.id}><Link href={detailUrl(t)}>{t.name}</Link></h3>
                  <CdChip t={t} now={tick} />
                </div>
              </div>
              <div className="tn-money">
                <MoneyItem cls="m-prize" icon="trophy" label="Prize pool" value={money(t.prizePool)} />
                <MoneyItem cls="m-fee" icon="ticket" label="Entry fee" value={entryText(t)} />
              </div>
              <ul className="tn-meta">
                <MetaLi icon="calendar" text={fmtRange(t)} />
                <MetaLi icon="users" text={"Max " + t.maxParticipants} />
                <MetaLi icon={t.online ? "globe" : "pin"} text={t.online ? "Online" : t.location} />
                <MetaLi icon="layers" text={/single/i.test(t.structure) ? "Single round" : "Multi-round"} />
              </ul>
              <Byline t={t} />
              <div className="tn-card-foot">
                <ViewBtn t={t} area="grid" />
                <ActionBtn t={t} area="grid" now={now} enrolled={snap.enrolled} />
              </div>
            </article>
          ))}
        </div>
        <div className="tn-empty" id="tn-empty" hidden={!snap.loaded || !!list.length}>
          <span className="tn-empty-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg></span>
          <p><b>No battles match these filters</b><span>Try another type or status, or clear the search.</span></p>
          <button className="tn-btn tn-btn-line" id="tn-reset" type="button" onClick={reset}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" /></svg>Reset filters</button>
        </div>
      </section>
    </div>
  );
}
