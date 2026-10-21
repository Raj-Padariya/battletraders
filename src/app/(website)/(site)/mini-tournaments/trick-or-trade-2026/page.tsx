import type { Metadata } from "next";
import Link from "next/link";
import { upcomingMini } from "@site/components/HomeTournamentSections";
import { ICON, Icon } from "@site/components/TournamentUi";
import Countdown from "./Countdown";

export const metadata: Metadata = {
  title: `${upcomingMini.name} — BattleTrader`,
  description: "A one-day Mini Tournament: $10 entry, a field of 256 and $1,500 to the podium.",
};

const details = [
  { icon: ICON.calendar, label: "Start", value: "30 Oct 2026 · 09:00 UTC" },
  { icon: ICON.calendar, label: "End", value: "30 Oct 2026 · 17:00 UTC" },
  { icon: ICON.clock, label: "Registration closes", value: "30 Oct 2026 · 09:00 UTC" },
  { icon: ICON.users, label: "Entrants", value: upcomingMini.entrants },
  { icon: ICON.globe, label: "Location", value: "Online" },
  { icon: ICON.layers, label: "Structure", value: "Single round" },
];

const prizes = [
  { place: "1st place", cash: "$750" },
  { place: "2nd place", cash: "$450" },
  { place: "3rd place", cash: "$300" },
];

const rules = [
  { label: "Starting balance", value: "$10,000 at 1:100" },
  { label: "Minimum trades", value: "5" },
  { label: "Max drawdown", value: "30%" },
  { label: "Tier required", value: "Silver" },
];

export default function TrickOrTradePage() {
  return (
    <section className="td-page">
      <div className="col pad">
        <Link className="td-back" href="/tournaments/"><Icon d={ICON.arrow} />Back to tournaments</Link>

        <header className="td-head">
          <span className="td-head-ico"><Icon d={ICON.trophy} /></span>
          <div className="td-head-title">
            <div className="td-tags"><span className="mt-tag">Mini</span><span className="td-status">Upcoming</span></div>
            <h1>{upcomingMini.name}</h1>
          </div>
          <dl className="td-head-stats">
            <div><dt>Starts in</dt><dd><Countdown startsAt={upcomingMini.startsAt} /></dd></div>
            <div><dt>Prize pool</dt><dd>{upcomingMini.prize}</dd></div>
            <div><dt>Entry</dt><dd>$10</dd></div>
          </dl>
        </header>

        <div className="td-grid">
          <div className="td-poster" aria-hidden="true">
            <span className="td-poster-kicker">BattleTrader · Mini Tournament</span>
            <strong>Trick <em>or</em> Trade</strong>
            <span className="td-poster-prize">$1,500 prize pool</span>
            <div className="td-poster-pills"><span>30 Oct 2026</span><span className="is-hot">Entry $10</span><span>8 hours</span></div>
          </div>

          <div className="td-side">
            <article className="td-card">
              <h2>Tournament details</h2>
              <dl className="td-details">
                {details.map((item) => (
                  <div key={item.label}>
                    <Icon d={item.icon} />
                    <span><dt>{item.label}</dt><dd>{item.value}</dd></span>
                  </div>
                ))}
              </dl>
              <div className="td-instruments">
                <h3><Icon d={ICON.chart} />Available instruments</h3>
                <p>Forex majors and minors, gold, silver, major indices and energies.</p>
              </div>
            </article>

            <div className="td-money">
              <article className="td-card"><small><Icon d={ICON.dollar} />Prize pool</small><b className="is-prize">{upcomingMini.prize}</b></article>
              <article className="td-card"><small><Icon d={ICON.target} />Entry fee</small><b>$10</b></article>
            </div>

            <article className="td-card">
              <h2><Icon d={ICON.trophy} />Prize distribution</h2>
              <ul className="td-prizes">
                {prizes.map((prize) => (
                  <li key={prize.place}><span>{prize.place}</span><b>{prize.cash}</b></li>
                ))}
              </ul>
            </article>

            <article className="td-card">
              <h2><Icon d={ICON.layers} />Tournament round</h2>
              <div className="td-round">
                <div className="td-round-h"><b>Round 1 <em>(Final)</em></b><span className="td-status">Upcoming</span></div>
                <div className="td-round-meta">
                  <span><Icon d={ICON.calendar} />Start: 30 Oct, 09:00 UTC</span>
                  <span><Icon d={ICON.clock} />End: 30 Oct, 17:00 UTC</span>
                  <span className="is-prize"><Icon d={ICON.trophy} />Top winners: 3</span>
                </div>
              </div>
              <ul className="mt-rows td-rules">
                {rules.map((rule) => (
                  <li key={rule.label}><span>{rule.label}</span><b>{rule.value}</b></li>
                ))}
              </ul>
            </article>

            <Link className="td-enroll" href="/signup/">Sign up to enroll</Link>
            <p className="td-closes"><span className="mt-tag is-open"><Icon d={ICON.clock} />Registration closes 30 Oct at 09:00 UTC</span></p>
          </div>
        </div>
      </div>
    </section>
  );
}
