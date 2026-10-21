import type { Metadata } from "next";
import ScheduleEvents from "./ScheduleEvents";

export const metadata: Metadata = {
  title: "Schedule — BattleTrader",
  description: "Three free Daily Battles every weekday, two Mini Tournaments a week, a Circuit every month. Times in GMT and IST.",
};

const sessions = [
  { name: "Tokyo", tone: "tokyo", start: 0, end: 9, gmt: "00:00 – 09:00", ist: "05:30 – 14:30", suits: "Range trading, JPY and AUD pairs" },
  { name: "London", tone: "london", start: 8, end: 17, gmt: "08:00 – 17:00", ist: "13:30 – 22:30", suits: "Trend days, EUR and GBP pairs" },
  { name: "New York", tone: "newyork", start: 13, end: 22, gmt: "13:00 – 22:00", ist: "18:30 – 03:30", suits: "US data releases, gold" },
  { name: "London + NY overlap", tone: "overlap", start: 13, end: 17, gmt: "13:00 – 17:00", ist: "18:30 – 22:30", suits: "Deepest liquidity, tightest spreads" },
];

export default function SchedulePage() {
  return (
    <>
      <header className="page-head">
        <div className="col pad inner">
          <h1>Tournament Schedule</h1>
          <p>Plan your competition calendar. Three free Daily Battles every weekday, two Mini Tournaments a week and a Circuit every month &mdash; times in GMT and IST.</p>
        </div>
      </header>

      <section>
        <div className="col pad">

          <div className="block">
            <ScheduleEvents />
            <div className="note"><b>Three Daily Battles a day, one per session.</b> You may enter one of them each day &mdash; whichever session suits your hours. All three pay the same points. London and New York times shift by an hour between late March and late October; Asian session times do not.</div>
          </div>

          <div className="block">
            <h3 className="sub">Session <span className="gt">windows</span></h3>
            <p className="lead">Which market is actually moving when you sit down. The London and New York overlap carries the most liquidity of the day, and most Mini Tournaments are timed to run through it.</p>

            <div className="sc-timeline" aria-hidden="true">
              <div className="sc-hours">
                {["00", "03", "06", "09", "12", "15", "18", "21", "24"].map((hour) => <span key={hour}>{hour}</span>)}
              </div>
              {sessions.map((session) => (
                <div key={session.name} className={`sc-track is-${session.tone}`}>
                  <span className="sc-track-label">{session.name}</span>
                  <span className="sc-bar" style={{ left: `${(session.start / 24) * 100}%`, width: `${((session.end - session.start) / 24) * 100}%` }} />
                </div>
              ))}
              <p className="sc-axis">Hours in GMT</p>
            </div>

            <div className="sc-sessions">
              {sessions.map((session) => (
                <article key={session.name} className={`sc-session is-${session.tone}`}>
                  <header>
                    <h4>{session.name}</h4>
                    {session.tone === "overlap" && <span className="sc-best">Best liquidity</span>}
                  </header>
                  <dl>
                    <div><dt>GMT</dt><dd>{session.gmt}</dd></div>
                    <div><dt>IST</dt><dd>{session.ist}</dd></div>
                  </dl>
                  <p>{session.suits}</p>
                </article>
              ))}
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
