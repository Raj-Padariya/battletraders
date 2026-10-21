import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Circuit Tournaments — BattleTrader",
  description: "A monthly championship over a full trading week, and the shortest route into the World Championship field.",
};

export default function CircuitTournamentsPage() {
  return (
    <>
      <header className="page-head">
        <div className="col pad inner">
          <p className="crumb">Circuit Tournaments</p>
          <h1>Five days. One <span className="gt">seat</span></h1>
          <p>A monthly championship over a full trading week, and the shortest route into the World Championship field.</p>
        </div>
      </header>

      <section>
        <div className="col pad">
          <div className="block">
            <h3 className="sub">A week, once a <span className="gt">month</span></h3>
            <p className="lead">The Circuit is the serious end of the online ladder. Five trading days, a larger starting balance, a 512-trader field, and the only route into the World Championship that does not require a whole season of consistency.</p>
            <div className="two">
              <div className="tbl-wrap"><table><tbody>
                <tr><td>Entry fee</td><td className="num">$50</td></tr>
                <tr><td>Starting balance</td><td className="num">$25,000</td></tr>
                <tr><td>Leverage</td><td className="num">1:100</td></tr>
                <tr><td>Window</td><td className="num">5 trading days</td></tr>
                <tr><td>Field cap</td><td className="num">512</td></tr>
                <tr><td>Minimum trades</td><td className="num">10</td></tr>
                <tr><td>Max drawdown</td><td className="num">30%</td></tr>
                <tr><td>Tier required</td><td className="num">Platinum</td></tr>
              </tbody></table></div>
              <div className="tbl-wrap"><table>
                <thead><tr><th>Finish</th><th className="num">Cash</th><th className="num">Points</th></tr></thead>
                <tbody>
                  <tr><td>1st</td><td className="num">$6,000</td><td className="num">1,200</td></tr>
                  <tr><td>2nd</td><td className="num">$3,500</td><td className="num">850</td></tr>
                  <tr><td>3rd</td><td className="num">$2,000</td><td className="num">600</td></tr>
                  <tr><td>4th &ndash; 10th</td><td className="num">$500</td><td className="num">400</td></tr>
                  <tr><td>11th &ndash; 50th</td><td className="num">&mdash;</td><td className="num">220</td></tr>
                  <tr><td>Any ranked finish</td><td className="num">&mdash;</td><td className="num">25</td></tr>
                </tbody>
              </table></div>
            </div>
          </div>

          <div className="block">
            <h3 className="sub">The road to the <span className="gt">final</span></h3>
            <p className="lead">Finish in the top 50 of any Circuit and your World Championship seat is booked for that season. You cannot win the same seat twice &mdash; qualify once and a later top-50 finish passes the seat down to the next unqualified trader.</p>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Stage</th><th>What it takes</th><th className="num">Seats</th></tr></thead>
                <tbody>
                  <tr><td>Circuits 1 &ndash; 11</td><td>Top 50 in any single Circuit</td><td className="num">Up to 50</td></tr>
                  <tr className="key"><td>Season ladder</td><td>Finish the season in the Elite tier</td><td className="num">Remainder</td></tr>
                  <tr><td><b>World Championship field</b></td><td>Played in person over 24 hours</td><td className="num"><b>100</b></td></tr>
                </tbody>
              </table>
            </div>
            <div className="note"><b>Platinum is a hard gate.</b> You need 4,000 season points before a Circuit entry opens to you &mdash; roughly a steady run of Daily Battles plus a handful of Mini finishes.</div>
          </div>

          <div className="block">
            <h3 className="sub">Circuit <span className="gt">standings</span></h3>
            <span className="sample">Sample board &middot; Season 1 opens at launch</span>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Rank</th><th>Trader</th><th className="num">Return</th><th className="num">Max DD</th><th className="num">Trades</th><th className="num">Points</th></tr></thead>
                <tbody>
                  <tr><td className="rk">01</td><td>sample_trader_a</td><td className="num">+41.2%</td><td className="num">11.4%</td><td className="num">23</td><td className="num">1,200</td></tr>
                  <tr><td className="rk">02</td><td>sample_trader_c</td><td className="num">+38.7%</td><td className="num">17.9%</td><td className="num">31</td><td className="num">850</td></tr>
                  <tr><td className="rk">03</td><td>sample_trader_b</td><td className="num">+34.1%</td><td className="num">9.2%</td><td className="num">18</td><td className="num">600</td></tr>
                  <tr><td className="rk">04</td><td>sample_trader_f</td><td className="num">+29.8%</td><td className="num">22.6%</td><td className="num">44</td><td className="num">400</td></tr>
                  <tr><td className="rk">05</td><td>sample_trader_d</td><td className="num">+27.3%</td><td className="num">14.1%</td><td className="num">26</td><td className="num">400</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="block">
            <div className="btn-row">
              <Link className="btn b-ember" href="/schedule/">See the season calendar</Link>
              <Link className="btn b-line" href="/rankings/">Check your tier</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
