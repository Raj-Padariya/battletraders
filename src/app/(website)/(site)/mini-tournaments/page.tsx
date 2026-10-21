import type { Metadata } from "next";
import Link from "next/link";
import { ICON, Icon, UpcomingMiniCard } from "@site/components/TournamentUi";

export const metadata: Metadata = {
  title: "Mini Tournaments — BattleTrader",
  description: "Ten dollars in, a full trading day, $1,500 to the podium. The first paid rung on the ladder.",
};

const steps = [
  { icon: ICON.card, title: "Register", text: "Pick the next Tuesday or Thursday Mini and pay the $10 entry. Silver tier and above can enter." },
  { icon: ICON.chart, title: "Trade", text: "Everyone starts on $10,000 at 1:100. Take at least five trades inside the trading-day window." },
  { icon: ICON.target, title: "Compete", text: "The board ranks percentage return live. Stay inside the 30% drawdown limit or you finish unranked." },
  { icon: ICON.trophy, title: "Win", text: "The top three split $1,500 and every ranked finish earns ladder points toward the next rung." },
];

const features = [
  { icon: ICON.clock, title: "One trading day", text: "A full session through the London open and the New York overlap. Long enough to recover from a bad first hour." },
  { icon: ICON.dollar, title: "$10 entry", text: "The first paid step on the ladder, priced so you can enter every week and build form." },
  { icon: ICON.users, title: "Field of 256", text: "Entries close at the bell or when the field fills, whichever comes first." },
  { icon: ICON.wallet, title: "$10,000 balance", text: "Identical starting balance and 1:100 leverage for every entrant. Only the trading differs." },
  { icon: ICON.gauge, title: "30% drawdown cut", text: "Breach it and you drop off the board. One oversized position is the commonest way out." },
  { icon: ICON.layers, title: "Ladder points", text: "400 points for a win, 30 for a top-50, 5 for any ranked finish. Showing up pays." },
];

const podium = [
  { place: "first", label: "1st", cash: "$750", points: "400" },
  { place: "second", label: "2nd", cash: "$450", points: "280" },
  { place: "third", label: "3rd", cash: "$300", points: "200" },
];

const ladder = [
  { finish: "4th – 10th", points: "120" },
  { finish: "11th – 50th", points: "30" },
  { finish: "Any ranked finish", points: "5" },
];

const facts = [
  { icon: ICON.clock, label: "Entries close", value: "At the bell, or when full" },
  { icon: ICON.chart, label: "Minimum trades", value: "5" },
  { icon: ICON.users, label: "Field size", value: "256 max" },
  { icon: ICON.dollar, label: "Entry fee", value: "$10" },
];

export default function MiniTournamentsPage() {
  return (
    <>
      <header className="page-head">
        <div className="col pad inner">
          <p className="mt-badge"><Icon d={ICON.bolt} />Fast-paced competition</p>
          <h1>Mini Tournaments</h1>
          <p>Ten dollars in, a full trading day, $1,500 to the podium. The first paid rung on the ladder.</p>
        </div>
      </header>

      <section className="mt-page">
        <div className="col pad">
          <article className="mt-intro">
            <span className="mt-ico mt-ico-lg"><Icon d={ICON.bolt} /></span>
            <div>
              <h2>What are Mini Tournaments?</h2>
              <p>A full trading day against a capped field of 256. It is the first paid step on the ladder and the one most traders use to find out whether their Daily Battle form holds up over a longer window. The whole $1,500 is paid out whatever the field size: a Mini that fills to 60 pays the same three cheques as one that fills to 256.</p>
              <ul className="mt-chips">
                <li><Icon d={ICON.clock} />1 trading day</li>
                <li><Icon d={ICON.dollar} />$10 entry</li>
                <li><Icon d={ICON.users} />Silver tier and up</li>
              </ul>
            </div>
          </article>

          <h2 className="mt-h2">How it works</h2>
          <ol className="mt-steps">
            {steps.map((step, index) => (
              <li key={step.title}>
                <span className="mt-ico mt-ico-round"><Icon d={step.icon} /></span>
                <small>Step {String(index + 1).padStart(2, "0")}</small>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>

          <h2 className="mt-h2">Key features</h2>
          <div className="mt-features">
            {features.map((feature) => (
              <article key={feature.title}>
                <span className="mt-ico"><Icon d={feature.icon} /></span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>

          <h2 className="mt-h2">Payouts &amp; schedule</h2>
          <div className="mt-split">
            <article className="mt-panel">
              <header className="mt-panel-h">
                <span className="mt-ico"><Icon d={ICON.trophy} /></span>
                <div>
                  <h3>Prize pool · $1,500</h3>
                  <p>Paid to the top three, whatever the field size.</p>
                </div>
              </header>
              <ol className="mt-podium">
                {podium.map((spot) => (
                  <li key={spot.place} className={`is-${spot.place}`}>
                    <small>{spot.label}</small>
                    <b>{spot.cash}</b>
                    <span>{spot.points} pts</span>
                  </li>
                ))}
              </ol>
              <ul className="mt-rows">
                {ladder.map((row) => (
                  <li key={row.finish}><span>{row.finish}</span><b>{row.points} pts</b></li>
                ))}
              </ul>
            </article>

            <article className="mt-panel">
              <header className="mt-panel-h">
                <span className="mt-ico"><Icon d={ICON.calendar} /></span>
                <div>
                  <h3>Schedule</h3>
                  <p>Two Minis a week, same opening bell.</p>
                </div>
              </header>
              <div className="mt-days">
                {["Tuesday", "Thursday"].map((day) => (
                  <div key={day}>
                    <small>{day}</small>
                    <b>07:00 <em>GMT</em></b>
                    <span>12:30 IST</span>
                  </div>
                ))}
              </div>
              <ul className="mt-rows">
                {facts.map((fact) => (
                  <li key={fact.label}><span><Icon d={fact.icon} />{fact.label}</span><b>{fact.value}</b></li>
                ))}
              </ul>
            </article>
          </div>

          <h2 className="mt-h2">Upcoming Mini Tournaments</h2>
          <div className="mt-upcoming">
            <UpcomingMiniCard />
          </div>

          <h2 className="mt-h2">What tends to win</h2>
          <div className="rules">
            <div className="rl"><b>A day is long enough to recover</b><span>Unlike a one-hour Daily, a bad opening hour is not fatal. Traders who blow up early usually did it chasing, not waiting.</span></div>
            <div className="rl"><b>Five trades is a low bar</b><span>You do not need volume. Several past winners took six or seven positions all day.</span></div>
            <div className="rl"><b>The drawdown rule bites</b><span>Going for a top-three finish with one oversized position is the single commonest way to finish unranked.</span></div>
            <div className="rl"><b>Points reward showing up</b><span>A 40th place still pays 30 points. Entering consistently beats entering only when you feel sharp.</span></div>
          </div>

          <aside className="mt-cta">
            <h2>Ready to jump in?</h2>
            <p>Minis run every Tuesday and Thursday and are open from Silver tier up. Pick your day and start competing.</p>
            <div className="btn-row">
              <Link className="btn b-ember" href="/#join">Enter the next Mini</Link>
              <Link className="btn b-line" href="/rules/">Read the rulebook</Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
