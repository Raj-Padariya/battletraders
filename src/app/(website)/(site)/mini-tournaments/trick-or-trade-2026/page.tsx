import type { Metadata } from "next";
import Link from "next/link";
import { upcomingMini } from "@site/components/HomeTournamentSections";
import { ICON, Icon } from "@site/components/TournamentUi";
import Countdown from "./Countdown";

export const metadata: Metadata = {
  title: `${upcomingMini.name} — BattleTrader`,
  description: "A one-day Mini Tournament: $10 entry, a field of 256 and $1,500 to the podium.",
};

const REGISTRATION_OPENS = "2026-10-15T09:00:00Z";

const stats = [
  { icon: ICON.trophy, label: "Prize pool", value: upcomingMini.prize, tone: "prize" },
  { icon: ICON.target, label: "Entry fee", value: "$10", tone: "" },
  { icon: ICON.users, label: "Entrants", value: upcomingMini.entrants, tone: "" },
  { icon: ICON.clock, label: "Duration", value: "8 hours", tone: "" },
];

const timeline = [
  { label: "Registration opens", value: "15 Oct 2026 · 09:00 UTC", state: "done" },
  { label: "Registration closes", value: "30 Oct 2026 · 09:00 UTC", state: "next" },
  { label: "Trading window", value: "30 Oct · 09:00 – 17:00 UTC", state: "" },
  { label: "Results published", value: "31 Oct 2026, morning", state: "" },
];

const prizes = [
  { place: "1st", cash: "$750", share: "50%", tone: "first" },
  { place: "2nd", cash: "$450", share: "30%", tone: "second" },
  { place: "3rd", cash: "$300", share: "20%", tone: "third" },
];

const rules = [
  { icon: ICON.wallet, label: "Starting balance", value: "$10,000 at 1:100" },
  { icon: ICON.chart, label: "Minimum trades", value: "5" },
  { icon: ICON.gauge, label: "Max drawdown", value: "30%" },
  { icon: ICON.shield, label: "Tier required", value: "Silver" },
  { icon: ICON.globe, label: "Location", value: "Online" },
  { icon: ICON.layers, label: "Structure", value: "Single round" },
];

const instruments = ["Forex majors", "Forex minors", "Gold", "Silver", "Indices", "Energies"];

export default function TrickOrTradePage() {
  return (
    <section className="td-page">
      <div className="col pad">
        <Link className="td-back" href="/tournaments/"><Icon d={ICON.arrow} />Back to tournaments</Link>

        <header className="td-hero">
          <div className="td-hero-copy">
            <div className="td-tags">
              <span className="mt-tag">Mini</span>
              <span className="td-status"><span className="td-status-dot" />Registration open</span>
            </div>
            <h1>{upcomingMini.name}</h1>
            <p>One trading day. A field of 256. Same balance, same clock &mdash; the best return takes $750.</p>
            <ul className="td-hero-meta">
              <li><Icon d={ICON.calendar} />30 Oct 2026</li>
              <li><Icon d={ICON.clock} />09:00 – 17:00 UTC</li>
              <li><Icon d={ICON.globe} />Online</li>
            </ul>
          </div>
          <Countdown startsAt={upcomingMini.startsAt} opensAt={REGISTRATION_OPENS} />
        </header>

        <ul className="td-stats">
          {stats.map((stat) => (
            <li key={stat.label} className={stat.tone ? `is-${stat.tone}` : undefined}>
              <span className="td-stat-ico"><Icon d={stat.icon} /></span>
              <span><small>{stat.label}</small><b>{stat.value}</b></span>
            </li>
          ))}
        </ul>

        <div className="td-body">
          <div className="td-main">
            <article className="td-card">
              <h2><Icon d={ICON.trophy} />Prize distribution</h2>
              <ol className="td-podium">
                {prizes.map((prize) => (
                  <li key={prize.place} className={`is-${prize.tone}`}>
                    <small>{prize.place}</small>
                    <b>{prize.cash}</b>
                    <span>{prize.share} of pool</span>
                  </li>
                ))}
              </ol>
            </article>

            <article className="td-card">
              <h2><Icon d={ICON.calendar} />Timeline</h2>
              <ol className="td-timeline">
                {timeline.map((step) => (
                  <li key={step.label} className={step.state ? `is-${step.state}` : undefined}>
                    <span className="td-timeline-dot" />
                    <div><b>{step.label}</b><small>{step.value}</small></div>
                  </li>
                ))}
              </ol>
            </article>

            <article className="td-card">
              <h2><Icon d={ICON.layers} />Rules</h2>
              <ul className="td-rules">
                {rules.map((rule) => (
                  <li key={rule.label}>
                    <Icon d={rule.icon} />
                    <span><small>{rule.label}</small><b>{rule.value}</b></span>
                  </li>
                ))}
              </ul>
              <div className="td-instruments">
                <h3><Icon d={ICON.chart} />Available instruments</h3>
                <ul>{instruments.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            </article>
          </div>

          <aside className="td-enroll-card">
            <div className="td-enroll-art" aria-hidden="true" />
            <div className="td-enroll-body">
              <small>Entry</small>
              <b>$10</b>
              <p>One entry per trader. Your seat is confirmed the moment you pay.</p>
              <Link className="td-enroll" href="/signup/">Sign up to enroll<Icon d={ICON.arrow} /></Link>
              <ul className="td-enroll-points">
                <li><Icon d={ICON.shield} />Silver tier or above</li>
                <li><Icon d={ICON.clock} />Closes 30 Oct, 09:00 UTC</li>
                <li><Icon d={ICON.users} />{upcomingMini.entrants} seats taken</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
