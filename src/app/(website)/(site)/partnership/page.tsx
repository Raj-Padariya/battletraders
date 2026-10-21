import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Partnership — BattleTrader",
  description: "Season-long sponsorship, white-label events for brokers, and a referral programme that pays on traders who stay.",
};

export default function PartnershipPage() {
  return (
    <>
      <header className="page-head">
        <div className="col pad inner">
          <p className="crumb">Partnership</p>
          <h1>Put your brand on the <span className="gt">floor</span></h1>
          <p>Season-long sponsorship, white-label events for brokers, and a referral programme that pays on traders who stay.</p>
        </div>
      </header>

      <section>
        <div className="col pad">

          <div className="block">
            <h3 className="sub">Why partner with <span className="gt">BattleTrader</span></h3>
            <p className="lead">Tournament traders are the hardest audience in retail finance to reach with advertising and the easiest to reach with competition. They show up every weekday, they compare brokers openly, and they talk. A season on BattleTrader puts a brand in front of them every single day, not once.</p>
            <div className="steps">
              <div className="st"><span className="n">01</span><h3>Daily attention</h3><p>Three free events a day means traders open the platform out of habit, not campaign timing.</p></div>
              <div className="st"><span className="n">02</span><h3>Self-selected</h3><p>Everyone on the leaderboard already trades. There is no awareness stage to pay for.</p></div>
              <div className="st"><span className="n">03</span><h3>A year of content</h3><p>Twelve Circuits and one live final generate footage, results and stories the whole season.</p></div>
            </div>
          </div>

          <div className="block" id="sponsor">
            <h3 className="sub">Sponsorship <span className="gt">tiers</span></h3>
            <p className="lead">Three tiers, each with a fixed inventory so the branding never gets crowded. Season-long, not per-event.</p>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>What you get</th><th>Supporting</th><th>Circuit</th><th>Title</th></tr></thead>
                <tbody>
                  <tr><td>Slots available</td><td className="num">6</td><td className="num">3</td><td className="num">1</td></tr>
                  <tr><td>Logo on the platform</td><td>Footer</td><td>Leaderboard</td><td>Header + leaderboard</td></tr>
                  <tr><td>Named event</td><td>&mdash;</td><td>One Circuit</td><td>The World Championship</td></tr>
                  <tr><td>Branding at the live final</td><td>Delegate pack</td><td>Floor and stage</td><td>Stage, backdrop, trophy</td></tr>
                  <tr><td>Seats at the final</td><td className="num">1</td><td className="num">3</td><td className="num">8</td></tr>
                  <tr><td>Content and footage rights</td><td>Highlights</td><td>Highlights + Circuit</td><td>Full season library</td></tr>
                  <tr className="key"><td><b>Season commitment</b></td><td className="num">On request</td><td className="num">On request</td><td className="num">On request</td></tr>
                </tbody>
              </table>
            </div>
            <div className="note"><b>Inventory is capped on purpose.</b> Six supporting slots and three Circuit slots for a whole season &mdash; a sponsor logo that sits beside twenty others is worth nothing to anyone.</div>
          </div>

          <div className="block" id="brokers">
            <h3 className="sub">Brokers and <span className="gt">IBs</span></h3>
            <p className="lead">Two ways to work with us that are not sponsorship.</p>
            <div className="two">
              <div className="fmt">
                <span className="lv">For brokers</span>
                <h3>White-label events</h3>
                <p>Run a branded tournament for your own client base on our engine. Your entry rules, your prize pool, your branding; our platform, scoring and audit. Results stay inside your event and do not touch the public ladder.</p>
                <dl>
                  <dt>Setup</dt><dd>2 &ndash; 3 weeks</dd>
                  <dt>Field size</dt><dd>No cap</dd>
                  <dt>Scoring</dt><dd>Audited by us</dd>
                </dl>
              </div>
              <div className="fmt">
                <span className="lv">For IBs and affiliates</span>
                <h3>Referral programme</h3>
                <p>Bring traders to the platform and earn on every paid entry they make, for as long as they keep competing. Free Daily Battles do not pay out, so the programme rewards traders who stay, not sign-ups that never return.</p>
                <dl>
                  <dt>Paid on</dt><dd>Paid entries</dd>
                  <dt>Duration</dt><dd>Lifetime</dd>
                  <dt>Payout</dt><dd>Monthly</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="block">
            <h3 className="sub">Next <span className="gt">step</span></h3>
            <p className="lead">Tell us which of the three interests you and we will send the season deck and current availability. Sponsorship inventory is allocated in the order enquiries arrive.</p>
            <Link className="btn b-ember" href="/contact/">Talk to partnerships</Link>
          </div>

        </div>
      </section>
    </>
  );
}
