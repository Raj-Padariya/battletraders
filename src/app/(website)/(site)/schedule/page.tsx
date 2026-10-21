import type { Metadata } from "next";
import ScheduleEvents from "./ScheduleEvents";

export const metadata: Metadata = {
  title: "Schedule — BattleTrader",
  description: "Three free Daily Battles every weekday, two Mini Tournaments a week, a Circuit every month. Times in GMT and IST.",
};

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
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Session</th><th>GMT</th><th>IST</th><th>What it suits</th></tr></thead>
                <tbody>
                  <tr><td><b>Tokyo</b></td><td className="num">00:00 &ndash; 09:00</td><td className="num">05:30 &ndash; 14:30</td><td>Range trading, JPY and AUD pairs</td></tr>
                  <tr><td><b>London</b></td><td className="num">08:00 &ndash; 17:00</td><td className="num">13:30 &ndash; 22:30</td><td>Trend days, EUR and GBP pairs</td></tr>
                  <tr><td><b>New York</b></td><td className="num">13:00 &ndash; 22:00</td><td className="num">18:30 &ndash; 03:30</td><td>US data releases, gold</td></tr>
                  <tr className="key"><td><b>London + NY overlap</b></td><td className="num">13:00 &ndash; 17:00</td><td className="num">18:30 &ndash; 22:30</td><td>Deepest liquidity, tightest spreads</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="block">
            <h3 className="sub">Season <span className="gt">calendar</span></h3>
            <p className="lead">Twelve Circuit Championships across the season, then the World Championship. Qualification closes at the end of the eleventh Circuit, which leaves a month to confirm the field and arrange travel.</p>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Month</th><th>Circuit</th><th>Notes</th></tr></thead>
                <tbody>
                  <tr><td className="num">1 &ndash; 10</td><td>Circuit 1 &ndash; 10</td><td>One a month, first full week. Top 50 of each qualifies.</td></tr>
                  <tr className="key"><td className="num">11</td><td>Circuit 11</td><td>Final qualifier. Season ladder closes at the end of this month.</td></tr>
                  <tr><td className="num">12</td><td>&mdash;</td><td>Field confirmed, travel arranged, World Championship played.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="note"><b>Daily Battles and Mini Tournaments keep running</b> through the final month. They no longer affect qualification, but they still pay points toward the next season&apos;s opening tier.</div>
          </div>

        </div>
      </section>
    </>
  );
}
