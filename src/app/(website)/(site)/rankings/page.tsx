import type { Metadata } from "next";
import Leaderboard from "./Leaderboard";
import RankingTabs, { type TabDef } from "./RankingTabs";

export const metadata: Metadata = {
  title: "Rankings — BattleTrader",
  description:
    "Every ranked finish earns points. Points set your tier, tiers unlock formats, and the season decides who walks into the World Championship.",
};

const TABS: TabDef[] = [
  {
    id: "tab-board",
    panelId: "panel-board",
    label: "Top Traders",
    icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 12H5z" /></svg>,
    panel: (
      <>
        <p className="lb-note"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" /></svg><span>Ranked by <b>season points</b> &mdash; every ranked finish in a Daily Battle, Mini Tournament or Circuit adds to your total.</span><span className="lb-sample">Sample board &middot; Season 1 opens at launch</span></p>
        <Leaderboard />
      </>
    ),
  },
  {
    id: "tab-points",
    panelId: "panel-points",
    label: "Points",
    icon: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></svg>,
    panel: (
      <>
        <h3 className="sub">How points <span className="gt">work</span></h3>
        <p className="lead">Every ranked finish earns points. Larger formats pay roughly four times the tier below, so a single Circuit result is worth more than a month of Daily Battles &mdash; but the Daily Battles are free and run every weekday.</p>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Finish</th><th className="num">Daily Battle</th><th className="num">Mini Tournament</th><th className="num">Circuit Championship</th></tr></thead>
            <tbody>
              <tr><td>1st</td><td className="num">100</td><td className="num">400</td><td className="num">1,200</td></tr>
              <tr><td>2nd</td><td className="num">70</td><td className="num">280</td><td className="num">850</td></tr>
              <tr><td>3rd</td><td className="num">50</td><td className="num">200</td><td className="num">600</td></tr>
              <tr><td>4th &ndash; 10th</td><td className="num">30</td><td className="num">120</td><td className="num">400</td></tr>
              <tr><td>11th &ndash; 50th</td><td className="num">8</td><td className="num">30</td><td className="num">220</td></tr>
              <tr><td>51st &ndash; 100th</td><td className="num">3</td><td className="num">15</td><td className="num">60</td></tr>
              <tr><td>Any other ranked finish</td><td className="num">1</td><td className="num">5</td><td className="num">25</td></tr>
            </tbody>
          </table>
        </div>
        <div className="note"><b>Unranked finishes earn nothing.</b> Miss the minimum trade count or breach the drawdown limit and the event pays no points, whatever your balance was.</div>
      </>
    ),
  },
  {
    id: "tab-tiers",
    panelId: "panel-tiers",
    label: "Tiers",
    icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z" /></svg>,
    panel: (
      <>
        <h3 className="sub">The five <span className="gt">tiers</span></h3>
        <p className="lead">Your tier is set by your season points total and updates the moment an event settles. Tiers unlock formats; they are not cosmetic.</p>
        <div className="ladder">
          <div className="tier"><div className="bar-i tier-bronze"></div><b>Bronze</b><span>0 &ndash; 499</span></div>
          <div className="tier"><div className="bar-i tier-silver"></div><b>Silver</b><span>500 &ndash; 1,499</span></div>
          <div className="tier"><div className="bar-i tier-gold"></div><b>Gold</b><span>1,500 &ndash; 3,999</span></div>
          <div className="tier"><div className="bar-i tier-platinum"></div><b>Platinum</b><span>4,000 &ndash; 7,999</span></div>
          <div className="tier"><div className="bar-i tier-elite"></div><b>Elite</b><span>8,000 +</span></div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Tier</th><th>What it unlocks</th></tr></thead>
            <tbody>
              <tr><td><b>Bronze</b></td><td>Daily Battles</td></tr>
              <tr><td><b>Silver</b></td><td>Daily Battles, Mini Tournaments</td></tr>
              <tr><td><b>Gold</b></td><td>As above, plus a seeded start in Mini Tournaments</td></tr>
              <tr><td><b>Platinum</b></td><td>Circuit Championship entry</td></tr>
              <tr><td><b>Elite</b></td><td>Direct seat in the World Championship at season end</td></tr>
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: "tab-season",
    panelId: "panel-season",
    label: "Season",
    icon: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>,
    panel: (
      <>
        <h3 className="sub">The <span className="gt">season</span></h3>
        <p className="lead">A season runs twelve months. Points reset to zero at the start of the next one; tiers reset with them, so every season is winnable from scratch. Your best season and your career totals stay on your profile permanently.</p>
        <div className="two">
          <div className="tbl-wrap"><table><tbody>
            <tr><td>Season length</td><td className="num">12 months</td></tr>
            <tr><td>Points reset</td><td className="num">Season start</td></tr>
            <tr><td>Circuit events</td><td className="num">12 per season</td></tr>
            <tr><td>World Championship</td><td className="num">1 per season</td></tr>
          </tbody></table></div>
          <div className="tbl-wrap"><table>
            <thead><tr><th>Route to the final</th><th className="num">Seats</th></tr></thead>
            <tbody>
              <tr><td>Circuit Championship top 50</td><td className="num">Up to 50</td></tr>
              <tr><td>Season Elite tier</td><td className="num">Remainder</td></tr>
              <tr><td><b>Total field</b></td><td className="num"><b>100</b></td></tr>
            </tbody>
          </table></div>
        </div>
      </>
    ),
  },
];

export default function RankingsPage() {
  return (
    <>
      <header className="page-head rank-head">
        <div className="col pad inner">
          <h1>Global<br />Rankings</h1>
          <p>See who is dominating the arena. Every ranked finish earns points, points set your tier, and the season decides who walks into the World Championship.</p>
        </div>
      </header>

      <section>
        <div className="col pad">
          <RankingTabs label="Rankings" tabs={TABS} />
        </div>
      </section>
    </>
  );
}
