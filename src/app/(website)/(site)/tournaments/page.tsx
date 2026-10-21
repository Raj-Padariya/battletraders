import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Tournaments — BattleTrader",
  description: "Free daily sprints, paid tournaments, a monthly circuit and one championship a year. Same engine, same rules — what changes is the clock and the stakes.",
};

export default function TournamentsPage() {
  return (
    <>
      <header className="page-head">
        <div className="col pad inner">
          <p className="crumb">All Tournaments</p>
          <h1>Four ways to <span className="gt">compete</span></h1>
          <p>Free daily sprints, paid tournaments, a monthly circuit and one championship a year. Same engine, same rules &mdash; what changes is the clock and the stakes.</p>
        </div>
      </header>

      <section>
        <div className="col pad">
          <div className="block">
            <h3 className="sub">Side by <span className="gt">side</span></h3>
            <p className="lead">Every format runs the same engine, the same instruments and the same rules. Entry, clock and stakes are what change.</p>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Format</th><th>Entry</th><th>Duration</th><th className="num">Field</th><th className="num">Prize pool</th><th className="num">Winner points</th></tr></thead>
                <tbody>
                  <tr><td><b>Daily Battle</b></td><td>Free</td><td>1 hour</td><td className="num">Unlimited</td><td className="num">&mdash;</td><td className="num">100</td></tr>
                  <tr><td><b>Mini Tournament</b></td><td>$10</td><td>1 trading day</td><td className="num">256</td><td className="num">$1,500</td><td className="num">400</td></tr>
                  <tr><td><b>Circuit Championship</b></td><td>$50</td><td>5 trading days</td><td className="num">512</td><td className="num">$15,000</td><td className="num">1,200</td></tr>
                  <tr><td><b>World Championship</b></td><td>Invite</td><td>24 hours</td><td className="num">100</td><td className="num">$250,000+</td><td className="num">&mdash;</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="block">
            <h3 className="sub">Daily Battle</h3>
            <p className="lead">A one-hour sprint, every weekday. Free to enter, no cap on the field, and the fastest way to move up the ladder. Most traders use it to build points between paid events.</p>
            <div className="two">
              <div className="tbl-wrap"><table><tbody>
                <tr><td>Starting balance</td><td className="num">$10,000</td></tr>
                <tr><td>Leverage</td><td className="num">1:100</td></tr>
                <tr><td>Window</td><td className="num">60 minutes</td></tr>
                <tr><td>Runs</td><td className="num">Mon &ndash; Fri</td></tr>
                <tr><td>Minimum trades</td><td className="num">3</td></tr>
                <tr><td>Entry closes</td><td className="num">At the bell</td></tr>
              </tbody></table></div>
              <div className="tbl-wrap"><table>
                <thead><tr><th>Finish</th><th className="num">Points</th></tr></thead>
                <tbody>
                  <tr><td>1st</td><td className="num">100</td></tr>
                  <tr><td>2nd</td><td className="num">70</td></tr>
                  <tr><td>3rd</td><td className="num">50</td></tr>
                  <tr><td>4th &ndash; 10th</td><td className="num">30</td></tr>
                  <tr><td>11th &ndash; 50th</td><td className="num">8</td></tr>
                  <tr><td>Any ranked finish</td><td className="num">1</td></tr>
                </tbody>
              </table></div>
            </div>
            <div className="note"><b>Minimum trades drop to 3</b> in a one-hour window. Every other rule is unchanged.</div>
          </div>

          <div className="block">
            <h3 className="sub">Mini Tournament</h3>
            <p className="lead">A full trading day against a capped field of 256. Cash to the podium, points to everyone who finishes ranked. Entry closes when the field fills or the window opens, whichever comes first.</p>
            <div className="two">
              <div className="tbl-wrap"><table><tbody>
                <tr><td>Entry fee</td><td className="num">$10</td></tr>
                <tr><td>Starting balance</td><td className="num">$10,000</td></tr>
                <tr><td>Window</td><td className="num">1 trading day</td></tr>
                <tr><td>Field cap</td><td className="num">256</td></tr>
                <tr><td>Minimum trades</td><td className="num">5</td></tr>
                <tr><td>Runs</td><td className="num">Twice a week</td></tr>
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
          </div>

          <div className="block">
            <h3 className="sub">Circuit Championship</h3>
            <p className="lead">One a month, over a full trading week. The largest paid field and the route most traders take to the final &mdash; finish in the top 50 and your World Championship seat is booked.</p>
            <div className="two">
              <div className="tbl-wrap"><table><tbody>
                <tr><td>Entry fee</td><td className="num">$50</td></tr>
                <tr><td>Starting balance</td><td className="num">$25,000</td></tr>
                <tr><td>Window</td><td className="num">5 trading days</td></tr>
                <tr><td>Field cap</td><td className="num">512</td></tr>
                <tr><td>Minimum trades</td><td className="num">10</td></tr>
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
            <div className="note"><b>Top 50 qualify for the World Championship.</b> A seat earned in one Circuit cannot be earned twice &mdash; qualify once and later finishes pass the seat down the list.</div>
          </div>

          <div className="block">
            <h3 className="sub">World Championship</h3>
            <p className="lead">One hundred traders, one room, twenty-four hours. Played in person over two days, on supervised terminals, with the leaderboard on the wall. No remote entries.</p>
            <div className="two">
              <div className="tbl-wrap"><table><tbody>
                <tr><td>Entry</td><td className="num">By qualification</td></tr>
                <tr><td>Starting balance</td><td className="num">$10,000</td></tr>
                <tr><td>Window</td><td className="num">24 hours</td></tr>
                <tr><td>Field</td><td className="num">100</td></tr>
                <tr><td>Minimum trades</td><td className="num">5</td></tr>
                <tr><td>Held</td><td className="num">Once a year</td></tr>
              </tbody></table></div>
              <div className="tbl-wrap"><table>
                <thead><tr><th>Finish</th><th className="num">Cash</th><th className="num">Funded account</th></tr></thead>
                <tbody>
                  <tr><td>1st</td><td className="num">$5,000</td><td className="num">$100,000</td></tr>
                  <tr><td>2nd</td><td className="num">$2,500</td><td className="num">$50,000</td></tr>
                  <tr><td>3rd</td><td className="num">$1,000</td><td className="num">$25,000</td></tr>
                  <tr><td>4th &ndash; 10th</td><td className="num">&mdash;</td><td className="num">$10,000</td></tr>
                  <tr><td>11th &ndash; 25th</td><td className="num">&mdash;</td><td className="num">Evaluation pass</td></tr>
                </tbody>
              </table></div>
            </div>
            <div className="note"><b>Two ways in:</b> finish top 50 in any Circuit Championship, or end the season in the Elite tier. Travel and accommodation for qualified traders are covered.</div>
          </div>
        </div>
      </section>
    </>
  );
}
