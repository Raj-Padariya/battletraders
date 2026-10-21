"use client";

import Link from "next/link";
import { useRef, useState } from "react";

type EventType = "daily" | "mini" | "circuit";
type EventEntry = "free" | "paid";

type ScheduleEvent = {
  type: EventType;
  entry: EventEntry;
  featured?: boolean;
  day: string;
  time: string;
  status: React.ReactNode;
  title: React.ReactNode;
  signUpLabel: string;
  meta: React.ReactNode[];
};

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
const TagIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.5" /></svg>
);
const WalletIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M16 15h2" /></svg>
);
const PeopleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6" /></svg>
);

const daily = (time: string, ist: string, city: string): ScheduleEvent => ({
  type: "daily",
  entry: "free",
  day: "Mon–Fri",
  time,
  status: "Every weekday",
  title: <>Daily Battle &mdash; {city}</>,
  signUpLabel: "Battle now: Daily Battle - " + city,
  meta: [
    <><ClockIcon />{time} GMT &middot; {ist} IST</>,
    <><TagIcon /><strong>Free</strong> entry</>,
  ],
});

const mini = (day: string): ScheduleEvent => ({
  type: "mini",
  entry: "paid",
  day,
  time: "07:00",
  status: "Weekly",
  title: "Mini Tournament",
  signUpLabel: "Battle now: Mini Tournament",
  meta: [
    <><ClockIcon />07:00 GMT &middot; 12:30 IST</>,
    <><TagIcon /><strong>$10</strong> entry</>,
    <><WalletIcon />$10,000 balance</>,
  ],
});

const EVENTS: ScheduleEvent[] = [
  daily("01:00", "06:30", "Asia"),
  daily("09:00", "14:30", "London"),
  daily("14:00", "19:30", "New York"),
  mini("Tue"),
  mini("Thu"),
  {
    type: "circuit",
    entry: "paid",
    featured: true,
    day: "Week 1",
    time: "Mon",
    status: <>Monthly &middot; 5 days</>,
    title: "Circuit Championship",
    signUpLabel: "Battle now: Circuit Championship",
    meta: [
      <><ClockIcon />Mon 07:00 GMT &middot; 12:30 IST</>,
      <><TagIcon /><strong>$50</strong> entry</>,
      <><PeopleIcon />512 traders</>,
    ],
  },
];

// Old pages.js 4-31: every select narrows the list; the reset button clears both and refocuses the first select.
export default function ScheduleEvents() {
  const [type, setType] = useState("all");
  const [entry, setEntry] = useState("all");
  const typeRef = useRef<HTMLSelectElement>(null);

  const matches = (ev: ScheduleEvent) => (type === "all" || ev.type === type) && (entry === "all" || ev.entry === entry);
  const shown = EVENTS.filter(matches).length;

  const reset = () => {
    setType("all");
    setEntry("all");
    typeRef.current?.focus();
  };

  return (
    <>
      <div className="sched-filters">
        <div className="sel">
          <label className="sr-only" htmlFor="f-type">Tournament type</label>
          <select id="f-type" data-filter="type" ref={typeRef} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="daily">Daily Battle</option>
            <option value="mini">Mini Tournament</option>
            <option value="circuit">Circuit</option>
          </select>
        </div>
        <div className="sel">
          <label className="sr-only" htmlFor="f-entry">Entry fee</label>
          <select id="f-entry" data-filter="entry" value={entry} onChange={(e) => setEntry(e.target.value)}>
            <option value="all">Any Entry</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      <div className="events" id="events">
        {EVENTS.map((ev, index) => (
          <article key={index} className={ev.featured ? "ev feat" : "ev"} data-type={ev.type} data-entry={ev.entry} hidden={!matches(ev)}>
            <div className="ev-date"><small>{ev.day}</small><b>{ev.time}</b></div>
            <div>
              <span className="ev-status">{ev.status}</span>
              <h3>{ev.title}</h3>
              <ul className="ev-meta">
                {ev.meta.map((item, metaIndex) => <li key={metaIndex}>{item}</li>)}
              </ul>
            </div>
            <Link className="btn b-solid" href="/signup/" aria-label={ev.signUpLabel}>Battle now</Link>
          </article>
        ))}
        <div className="ev-empty" id="events-empty" hidden={shown !== 0}>
          <p>No events match these filters.</p>
          <button className="btn b-line" type="button" id="events-reset" onClick={reset}>Show all events</button>
        </div>
      </div>
    </>
  );
}
