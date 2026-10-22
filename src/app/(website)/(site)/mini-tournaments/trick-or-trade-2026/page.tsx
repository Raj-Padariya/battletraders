import type { Metadata } from "next";
import Link from "next/link";
import { ICON, Icon } from "@site/components/TournamentUi";
import {
  GOA_ENTRY_FEE, GOA_PRIZE_POOL, GOA_REGISTRATION_OPENS, GOA_SEATS, GOA_STARTS_AT, GOA_WINNERS, goaPrizeRows, usd,
} from "@panel/lib/data/goa";
import Countdown from "./Countdown";
import GoaPassFlow from "./GoaPassFlow";
import "./goa-pass.css";

export const metadata: Metadata = {
  title: "Goa Live Final 2026 — BattleTrader",
  description: `A 24-hour live trading final in Goa: ${usd(GOA_ENTRY_FEE)} entry, hotel stay included, ${usd(GOA_PRIZE_POOL)} for the top ${GOA_WINNERS}.`,
};

const rows = goaPrizeRows();
const podium = [rows[1], rows[0], rows[2]]; // 2nd - 1st - 3rd, winner in the middle
const ladder = rows.slice(3);
const ladderTotal = ladder.reduce((sum, row) => sum + row.amount, 0);
const top3Total = GOA_PRIZE_POOL - ladderTotal;
const topShare = rows[0].share;

const stats = [
  { icon: ICON.trophy, label: "Prize pool", value: usd(GOA_PRIZE_POOL), tone: "prize" },
  { icon: ICON.target, label: "Entry fee", value: usd(GOA_ENTRY_FEE), tone: "" },
  { icon: ICON.users, label: "Seats", value: String(GOA_SEATS), tone: "" },
  { icon: ICON.crown, label: "Paid places", value: "Top " + GOA_WINNERS, tone: "" },
];

const timeline = [
  { label: "Registration opens", value: "22 Oct 2026", state: "done" },
  { label: "Registration closes", value: "22 Nov 2026 · 18:00 IST", state: "next" },
  { label: "Live final in Goa", value: "23 Nov 10:00 – 24 Nov 10:00 IST", state: "" },
  { label: "Winners announced", value: "24 Nov 2026, on the floor", state: "" },
];

const steps = [
  { title: "Register & pay", text: `Pay ${usd(GOA_ENTRY_FEE)} on this page to lock your seat. One registration per email; your pass is emailed to you.` },
  { title: "Check in at Goa", text: "Show your pass at the venue on 23 Nov. Your hotel room is booked and paid by BattleTrader." },
  { title: "Trade for 24 hours", text: "Everyone starts with the same $10,000 demo balance at 1:100 — forex, stocks, crypto, indices, commodities and energies." },
  { title: `Top ${GOA_WINNERS} get paid`, text: `The board locks at 10:00 IST on 24 Nov. The highest balances share the ${usd(GOA_PRIZE_POOL)} prize pool.` },
];



const perks = [
  { title: "Hotel on us", text: "Room in Goa booked and paid by BattleTrader for every pass holder." },
  { title: "24 hours live", text: "One non-stop session on the floor, from 10:00 IST to 10:00 IST." },
  { title: "Top " + GOA_WINNERS + " paid", text: usd(GOA_PRIZE_POOL) + " split across the leaderboard, " + usd(rows[0].amount) + " to the winner." },
];

export default function GoaEventPage() {
  return (
    <section className="td-page gp-page">
      <div className="col pad">
        <Link className="td-back" href="/tournaments/"><Icon d={ICON.arrow} />Back to tournaments</Link>

        <header className="td-hero gp-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="gp-hero-img" src="/assets/img/goa-event.svg" alt="Sunset over a Goa beach with palm trees" />
          <div className="td-hero-copy">
            <div className="td-tags">
              <span className="mt-tag">Live event</span>
              <span className="td-status"><span className="td-status-dot" />Registration open</span>
            </div>
            <h1>Goa Live <span className="gp-sun">Final 2026</span></h1>
            <p>Twenty-four hours of trading on the beach floor. Win your seat for {usd(GOA_ENTRY_FEE)} and BattleTrader books and pays your hotel in Goa.</p>
            <ul className="td-hero-meta">
              <li><Icon d={ICON.calendar} />23 Nov 2026</li>
              <li><Icon d={ICON.clock} />10:00 IST · 24 hours</li>
              <li><Icon d={ICON.globe} />Goa, India</li>
            </ul>
          </div>
          <Countdown startsAt={GOA_STARTS_AT} opensAt={GOA_REGISTRATION_OPENS} />
        </header>

        <ul className="td-stats">
          {stats.map((stat) => (
            <li key={stat.label} className={stat.tone ? `is-${stat.tone}` : undefined}>
              <span className="td-stat-ico"><Icon d={stat.icon} /></span>
              <span><small>{stat.label}</small><b>{stat.value}</b></span>
            </li>
          ))}
        </ul>

        <ul className="gp-perks">
          {perks.map((perk) => (
            <li key={perk.title}><b>{perk.title}</b><span>{perk.text}</span></li>
          ))}
        </ul>

        <div className="td-body">
          <div className="td-main">
            <article className="td-card gp-prizes">
              <div className="gp-prizes-head">
                <h2><Icon d={ICON.trophy} />Prize distribution</h2>
                <p><b>{usd(GOA_PRIZE_POOL)}</b> across the top {GOA_WINNERS}</p>
              </div>

              <ol className="gp-podium">
                {podium.map((row) => (
                  <li key={row.place} className={"gp-step gp-step-" + row.place}>
                    <span className="gp-medal">{row.place}</span>
                    <small>{row.label} place</small>
                    <b>{usd(row.amount)}</b>
                    <em>{row.share}% of pool</em>
                    <span className="gp-plinth" aria-hidden="true" />
                  </li>
                ))}
              </ol>

              <table className="gp-ladder">
                <caption className="sr-only">Prizes for 4th to {ordinalLast()} place</caption>
                <thead>
                  <tr><th scope="col">Place</th><th scope="col">Share of pool</th><th scope="col">Prize</th></tr>
                </thead>
                <tbody>
                  {ladder.map((row) => (
                    <tr key={row.place}>
                      <th scope="row">{row.label}</th>
                      <td>
                        <span className="gp-bar" aria-hidden="true"><i style={{ width: (row.share / topShare) * 100 + "%" }} /></span>
                        <span className="gp-pct">{row.share}%</span>
                      </td>
                      <td>{usd(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="gp-split" aria-label="Prize pool breakdown">
                <div className="gp-split-bar" aria-hidden="true">
                  <i className="is-top" style={{ width: (top3Total / GOA_PRIZE_POOL) * 100 + "%" }} />
                  <i className="is-rest" style={{ width: (ladderTotal / GOA_PRIZE_POOL) * 100 + "%" }} />
                </div>
                <dl className="gp-split-parts">
                  <div><dt><span className="gp-dot is-top" />Top 3</dt><dd>{usd(top3Total)}</dd></div>
                  <div><dt><span className="gp-dot is-rest" />4th &ndash; {ordinalLast()}</dt><dd>{usd(ladderTotal)}</dd></div>
                </dl>
                <div className="gp-split-total">
                  <span>Total prize pool</span>
                  <b>{usd(GOA_PRIZE_POOL)}</b>
                </div>
              </div>
              <p className="gp-fine">Prizes are paid to the top {GOA_WINNERS} finishers only. Places {GOA_WINNERS + 1} and below do not receive a cash prize.</p>
            </article>

            <article className="td-card gp-hotel">
              <span className="gp-hotel-ico" aria-hidden="true"><Icon d={ICON.shield} /></span>
              <div>
                <h2>Hotel stay included</h2>
                <p>Every pass holder gets a hotel room in Goa for the event, booked and paid by BattleTrader. Travel to Goa is not included.</p>
              </div>
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

            <article className="td-card gp-how">
              <h2><Icon d={ICON.layers} />How it works</h2>
              <ol className="gp-how-list">
                {steps.map((step, i) => (
                  <li key={step.title}>
                    <span className="gp-how-num" aria-hidden="true">{i + 1}</span>
                    <div><b>{step.title}</b><p>{step.text}</p></div>
                  </li>
                ))}
              </ol>
            </article>

          </div>

          <GoaPassFlow />
        </div>
      </div>
    </section>
  );
}

function ordinalLast(): string {
  return rows[rows.length - 1].label;
}
