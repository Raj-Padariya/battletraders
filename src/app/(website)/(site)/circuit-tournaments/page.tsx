import type { Metadata } from "next";
import Link from "next/link";
import { ICON, Icon } from "@site/components/TournamentUi";

export const metadata: Metadata = {
  title: "Circuit Championships — BattleTrader",
  description: "A monthly championship over a full trading week, and the shortest route into the World Championship field.",
};

const reasons = [
  { icon: ICON.shield, title: "Build circuit reputation", text: "Establish yourself as a top trader in your region and get your name on the season board." },
  { icon: ICON.trophy, title: "Qualify for the World Championship", text: "Finish top 50 in any Circuit and your seat at the in-person final is booked." },
  { icon: ICON.users, title: "Network with regional traders", text: "Meet the traders around you and compare notes with the people you will face again." },
  { icon: ICON.dollar, title: "Substantial prize pools", text: "$15,000 per Circuit, with cash paid all the way down to 10th place." },
  { icon: ICON.chart, title: "A full trading week", text: "Five trading days on a $25,000 balance. Consistency wins, not one lucky session." },
];

const regions = [
  {
    name: "Europe",
    text: "The European trading powerhouse — London, Frankfurt, Paris and beyond.",
    countries: [["GB", "United Kingdom", "London"], ["DE", "Germany", "Frankfurt"], ["FR", "France", "Paris"], ["CH", "Switzerland", "Zurich"], ["NL", "Netherlands", "Amsterdam"]],
  },
  {
    name: "Asia Pacific",
    text: "Dynamic markets spanning Tokyo, Singapore, Sydney and the fastest-growing economies.",
    countries: [["SG", "Singapore", "Singapore"], ["JP", "Japan", "Tokyo"], ["MY", "Malaysia", "Kuala Lumpur"], ["TH", "Thailand", "Bangkok"], ["KR", "South Korea", "Seoul"]],
  },
  {
    name: "Middle East & Africa",
    text: "Emerging trading hubs from Dubai to Johannesburg — a rapidly growing competitive scene.",
    countries: [["AE", "UAE", "Dubai"], ["SA", "Saudi Arabia", "Riyadh"], ["QA", "Qatar", "Doha"], ["EG", "Egypt", "Cairo"], ["BH", "Bahrain", "Manama"]],
  },
];

const stages = [
  { title: "Reach Platinum", text: "Earn 4,000 season points from Daily Battles and Minis to unlock Circuit entry." },
  { title: "Trade the Circuit week", text: "Five trading days against a field of up to 512, on an identical $25,000 balance." },
  { title: "Qualify for the final", text: "Top 50 earn a World Championship seat — one hundred traders, one room, 24 hours." },
];

const podium = [
  { place: "first", label: "1st", cash: "$6,000", points: "1,200" },
  { place: "second", label: "2nd", cash: "$3,500", points: "850" },
  { place: "third", label: "3rd", cash: "$2,000", points: "600" },
];

const ladder = [
  { finish: "4th – 10th", value: "$500 · 400 pts" },
  { finish: "11th – 50th", value: "220 pts" },
  { finish: "Any ranked finish", value: "25 pts" },
];

const facts = [
  { icon: ICON.dollar, label: "Entry fee", value: "$50" },
  { icon: ICON.wallet, label: "Starting balance", value: "$25,000 at 1:100" },
  { icon: ICON.clock, label: "Window", value: "5 trading days" },
  { icon: ICON.users, label: "Field cap", value: "512" },
  { icon: ICON.chart, label: "Minimum trades", value: "10" },
  { icon: ICON.gauge, label: "Max drawdown", value: "30%" },
  { icon: ICON.shield, label: "Tier required", value: "Platinum" },
];

export default function CircuitTournamentsPage() {
  return (
    <>
      <header className="page-head">
        <div className="col pad inner">
          <p className="mt-badge is-violet"><Icon d={ICON.globe} />Monthly championship</p>
          <h1>Circuit <span className="gt">Championships</span></h1>
          <p>A monthly championship over a full trading week, and the shortest route into the World Championship field.</p>
        </div>
      </header>

      <section className="mt-page is-violet">
        <div className="col pad">
          <article className="mt-intro">
            <span className="mt-ico mt-ico-lg"><Icon d={ICON.globe} /></span>
            <div>
              <h2>What are Circuit Championships?</h2>
              <p>The Circuit is the serious end of the online ladder. Five trading days, a larger starting balance, a 512-trader field, and the only route into the World Championship that does not require a whole season of consistency. Finish in the top 50 of any Circuit and your seat at the final is booked for that season.</p>
              <ul className="mt-chips">
                <li><Icon d={ICON.clock} />5 trading days</li>
                <li><Icon d={ICON.dollar} />$15,000 prize pool</li>
                <li><Icon d={ICON.shield} />Platinum tier</li>
              </ul>
            </div>
          </article>

          <h2 className="mt-h2">Why compete on the Circuit?</h2>
          <div className="mt-features ct-reasons">
            {reasons.map((reason) => (
              <article key={reason.title}>
                <span className="mt-ico"><Icon d={reason.icon} /></span>
                <h3>{reason.title}</h3>
                <p>{reason.text}</p>
              </article>
            ))}
          </div>

          <h2 className="mt-h2">Regions we cover</h2>
          <div className="ct-regions">
            {regions.map((region) => (
              <article key={region.name} className="ct-region">
                <header>
                  <span className="mt-ico"><Icon d={ICON.globe} /></span>
                  <div>
                    <h3>{region.name}</h3>
                    <p>{region.text}</p>
                  </div>
                </header>
                <ul>
                  {region.countries.map(([code, country, city]) => (
                    <li key={code}>
                      <img className="ct-flag" src={`/assets/img/flags/${code.toLowerCase()}.svg`} alt="" width={36} height={24} loading="lazy" />
                      <span><b>{country}</b><small>{city}</small></span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <h2 className="mt-h2">Tournament format</h2>
          <ol className="ct-stages">
            {stages.map((stage, index) => (
              <li key={stage.title}>
                <span className="ct-num">{index + 1}</span>
                <h3>{stage.title}</h3>
                <p>{stage.text}</p>
              </li>
            ))}
          </ol>

          <h2 className="mt-h2">Payouts &amp; rules</h2>
          <div className="mt-split">
            <article className="mt-panel">
              <header className="mt-panel-h">
                <span className="mt-ico"><Icon d={ICON.trophy} /></span>
                <div>
                  <h3>Prize pool · $15,000</h3>
                  <p>Cash to the top ten, points to every ranked finish.</p>
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
                  <li key={row.finish}><span>{row.finish}</span><b>{row.value}</b></li>
                ))}
              </ul>
            </article>

            <article className="mt-panel">
              <header className="mt-panel-h">
                <span className="mt-ico"><Icon d={ICON.layers} /></span>
                <div>
                  <h3>The rules</h3>
                  <p>Same engine as every format, bigger stakes.</p>
                </div>
              </header>
              <ul className="mt-rows">
                {facts.map((fact) => (
                  <li key={fact.label}><span><Icon d={fact.icon} />{fact.label}</span><b>{fact.value}</b></li>
                ))}
              </ul>
            </article>
          </div>

          <h2 className="mt-h2">Upcoming Circuit tournaments</h2>
          <p className="tr-empty">No circuit tournaments are open right now. Check back soon — the season calendar lists every upcoming week.</p>

          <aside className="mt-cta">
            <h2>Represent your region</h2>
            <p>Join the next Circuit Championship and prove you&apos;re the best trader in your area. Your path to the World Championship starts here.</p>
            <div className="btn-row">
              <Link className="btn b-ember" href="/#join">Get started</Link>
              <Link className="btn b-line" href="/tournaments/">All tournaments</Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
