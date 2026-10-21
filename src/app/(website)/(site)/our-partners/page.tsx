import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our Partners — BattleTrader",
  description: "Fifteen slots across six categories, none taken yet. What is available, and what we look for before it is.",
};

export default function OurPartnersPage() {
  return (
    <>
      <header className="page-head">
        <div className="col pad inner">
          <p className="crumb">Our Partners</p>
          <h1>Season 1 partners, <span className="gt">unallocated</span></h1>
          <p>Fifteen slots across six categories, none taken yet. What is available, and what we look for before it is.</p>
        </div>
      </header>

      <section>
        <div className="col pad">
          <div className="block">
            <h3 className="sub">Season 1 slots are <span className="gt">open</span></h3>
            <p className="lead">BattleTrader is in its first season, and partner inventory has not been allocated yet. Rather than fill this page with logos, here is exactly what is available and what we are looking for. Partners confirmed for Season 1 will be listed here as they sign.</p>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Category</th><th>What the partner provides</th><th className="num">Slots</th><th className="num">Taken</th></tr></thead>
                <tbody>
                  <tr><td><b>Title partner</b></td><td>Names the World Championship; header and stage branding</td><td className="num">1</td><td className="num">0</td></tr>
                  <tr><td><b>Circuit partner</b></td><td>Names one Circuit Championship; leaderboard branding</td><td className="num">3</td><td className="num">0</td></tr>
                  <tr><td><b>Supporting partner</b></td><td>Footer branding and a delegate seat at the final</td><td className="num">6</td><td className="num">0</td></tr>
                  <tr><td><b>Liquidity</b></td><td>Pricing feed for the simulation engine</td><td className="num">2</td><td className="num">0</td></tr>
                  <tr><td><b>Venue</b></td><td>Hosts the live World Championship</td><td className="num">1</td><td className="num">0</td></tr>
                  <tr><td><b>Media</b></td><td>Broadcast, footage and distribution for the final</td><td className="num">2</td><td className="num">0</td></tr>
                </tbody>
              </table>
            </div>
            <div className="note"><b>Fifteen slots for a whole season, across six categories.</b> The cap is the point. A sponsor whose logo sits beside twenty others has bought nothing, and the traders stop seeing any of them.</div>
          </div>

          <div className="block">
            <h3 className="sub">What we look <span className="gt">for</span></h3>
            <p className="lead">Partner enquiries are assessed on three things before availability is even discussed.</p>
            <div className="rules">
              <div className="rl"><b>You can serve the audience</b><span>Our traders are spread across many countries. A partner who can only onboard in one of them creates more frustration than value.</span></div>
              <div className="rl"><b>Your claims hold up</b><span>Anything a partner states on our platform &mdash; spreads, execution, payout times, regulatory standing &mdash; has to be true and checkable. Traders will test it publicly and we will not defend it for you.</span></div>
              <div className="rl"><b>You are in for a season</b><span>Partnerships run the full season. Single-event sponsorship does not build recognition, and swapping logos mid-season reads as instability.</span></div>
            </div>
          </div>

          <div className="block">
            <h3 className="sub">Take the next <span className="gt">step</span></h3>
            <p className="lead">The Partnership page sets out tiers, inventory and what each one includes. Enquiries are handled in the order they arrive, and slots are allocated the same way.</p>
            <div className="btn-row">
              <Link className="btn b-ember" href="/partnership/">See partnership tiers</Link>
              <Link className="btn b-line" href="/contact/">Talk to partnerships</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
