import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mini Tournaments — BattleTrader",
  description: "Ten dollars in, a full trading day, $1,500 to the podium. The first paid rung on the ladder.",
};

export default function MiniTournamentsPage() {
  return (
    <>
      <header className="page-head">
        <div className="col pad inner">
          <p className="crumb">Mini Tournaments</p>
          <h1>A day, a field of <span className="gt">256</span></h1>
          <p>Ten dollars in, a full trading day, $1,500 to the podium. The first paid rung on the ladder.</p>
        </div>
      </header>

      <section>
        <div className="col pad">
          <div className="block">
            <h3 className="sub">What a Mini <span className="gt">is</span></h3>
            <p className="lead">A full trading day against a capped field of 256. It is the first paid step on the ladder and the one most traders use to find out whether their Daily Battle form holds up over a longer window.</p>
            <div className="two">
              <div className="tbl-wrap"><table><tbody>
                <tr><td>Entry fee</td><td className="num">$10</td></tr>
                <tr><td>Starting balance</td><td className="num">$10,000</td></tr>
                <tr><td>Leverage</td><td className="num">1:100</td></tr>
                <tr><td>Window</td><td className="num">1 trading day</td></tr>
                <tr><td>Field cap</td><td className="num">256</td></tr>
                <tr><td>Minimum trades</td><td className="num">5</td></tr>
                <tr><td>Max drawdown</td><td className="num">30%</td></tr>
                <tr><td>Tier required</td><td className="num">Silver</td></tr>
              </tbody></table></div>
              <div className="tbl-wrap"><table>
                <thead><tr><th>Finish</th><th className="num">Cash</th><th className="num">Points</th></tr></thead>
                <tbody>
                  <tr><td>1st</td><td className="num">$750</td><td className="num">400</td></tr>
                  <tr><td>2nd</td><td className="num">$450</td><td className="num">280</td></tr>
                  <tr><td>3rd</td><td className="num">$300</td><td className="num">200</td></tr>
                  <tr><td>4th &ndash; 10th</td><td className="num">&mdash;</td><td className="num">120</td></tr>
                  <tr><td>11th &ndash; 50th</td><td className="num">&mdash;</td><td className="num">30</td></tr>
                  <tr><td>Any ranked finish</td><td className="num">&mdash;</td><td className="num">5</td></tr>
                </tbody>
              </table></div>
            </div>
            <div className="note"><b>The whole $1,500 is paid out whatever the field size.</b> A Mini that fills to 60 pays the same three cheques as one that fills to 256.</div>
          </div>

          <div className="block">
            <h3 className="sub">When they <span className="gt">run</span></h3>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Day</th><th>Opens (GMT)</th><th>Opens (IST)</th><th>Entries close</th></tr></thead>
                <tbody>
                  <tr><td><b>Tuesday</b></td><td className="num">07:00</td><td className="num">12:30</td><td>At the bell, or when the field fills</td></tr>
                  <tr><td><b>Thursday</b></td><td className="num">07:00</td><td className="num">12:30</td><td>At the bell, or when the field fills</td></tr>
                </tbody>
              </table>
            </div>
            <p className="lead mt-16">Both run through the London open and into the New York overlap, which is where most of the day&apos;s range gets made. The window closes at the end of the trading day.</p>
          </div>

          <div className="block">
            <h3 className="sub">What tends to <span className="gt">win</span></h3>
            <p className="lead">Scoring is percentage return with a 30% drawdown cut-off, so the field splits into two kinds of trader very quickly.</p>
            <div className="rules">
              <div className="rl"><b>A day is long enough to recover</b><span>Unlike a one-hour Daily, a bad opening hour is not fatal. Traders who blow up early usually did it chasing, not waiting.</span></div>
              <div className="rl"><b>Five trades is a low bar</b><span>You do not need volume. Several past winners took six or seven positions all day.</span></div>
              <div className="rl"><b>The drawdown rule bites</b><span>Going for a top-three finish with one oversized position is the single commonest way to finish unranked.</span></div>
              <div className="rl"><b>Points reward showing up</b><span>A 40th place still pays 30 points. Entering consistently beats entering only when you feel sharp.</span></div>
            </div>
          </div>

          <div className="block">
            <div className="btn-row">
              <Link className="btn b-ember" href="/#join">Enter the next Mini</Link>
              <Link className="btn b-line" href="/rules/">Read the rulebook</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
