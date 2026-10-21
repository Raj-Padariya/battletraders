import type { Metadata } from "next";
import Link from "next/link";
import { ICON, Icon, UpcomingMiniCard } from "@site/components/TournamentUi";

export const metadata: Metadata = {
  title: "All Tournaments — BattleTrader",
  description: "Free daily sprints, paid tournaments, a monthly circuit and one championship a year. Same engine, same rules — what changes is the clock and the stakes.",
};

type Format = {
  id: string;
  theme: "daily" | "mini" | "circuit" | "world";
  icon: string;
  title: string;
  tagline: string;
  chips: { icon: string; label: string }[];
  stats: { label: string; value: string }[];
  empty?: string;
  explore?: { href: string; label: string };
};

const formats: Format[] = [
  {
    id: "daily",
    theme: "daily",
    icon: ICON.clock,
    title: "Daily Battles",
    tagline: "A free one-hour sprint every weekday — the fastest way to move up the ladder.",
    chips: [
      { icon: ICON.bolt, label: "Free to enter" },
      { icon: ICON.users, label: "Unlimited field" },
      { icon: ICON.layers, label: "100 points to the winner" },
    ],
    stats: [
      { label: "Entry", value: "Free" },
      { label: "Duration", value: "1 hour" },
      { label: "Runs", value: "Mon – Fri" },
      { label: "Min. trades", value: "3" },
    ],
    empty: "A new Daily Battle opens every weekday at the bell. Sign in to take your seat.",
  },
  {
    id: "mini",
    theme: "mini",
    icon: ICON.bolt,
    title: "Mini Tournaments",
    tagline: "A full trading day against a capped field of 256, with cash to the podium.",
    chips: [
      { icon: ICON.bolt, label: "Quick & accessible" },
      { icon: ICON.target, label: "Skill building" },
      { icon: ICON.trophy, label: "Twice a week" },
    ],
    stats: [
      { label: "Entry", value: "$10" },
      { label: "Duration", value: "1 trading day" },
      { label: "Field", value: "256" },
      { label: "Prize pool", value: "$1,500" },
    ],
    explore: { href: "/mini-tournaments/", label: "Explore Mini Tournaments" },
  },
  {
    id: "circuit",
    theme: "circuit",
    icon: ICON.globe,
    title: "Circuit Championships",
    tagline: "One a month over a full trading week. Finish top 50 and your World Championship seat is booked.",
    chips: [
      { icon: ICON.pin, label: "Monthly circuit" },
      { icon: ICON.trophy, label: "Substantial rewards" },
      { icon: ICON.users, label: "Build your reputation" },
    ],
    stats: [
      { label: "Entry", value: "$50" },
      { label: "Duration", value: "5 trading days" },
      { label: "Field", value: "512" },
      { label: "Prize pool", value: "$15,000" },
    ],
    empty: "No circuit championships scheduled right now. Check back soon for the next one.",
    explore: { href: "/circuit-tournaments/", label: "Explore Circuit Championships" },
  },
  {
    id: "world",
    theme: "world",
    icon: ICON.crown,
    title: "World Championship",
    tagline: "One hundred traders, one room, twenty-four hours. Played in person, once a year.",
    chips: [
      { icon: ICON.shield, label: "By qualification" },
      { icon: ICON.wallet, label: "Funded accounts" },
      { icon: ICON.globe, label: "Travel covered" },
    ],
    stats: [
      { label: "Entry", value: "Invite" },
      { label: "Duration", value: "24 hours" },
      { label: "Field", value: "100" },
      { label: "Prize pool", value: "$250,000+" },
    ],
    empty: "Two ways in: finish top 50 in any Circuit Championship, or end the season in the Elite tier.",
  },
];

export default function TournamentsPage() {
  return (
    <>
      <header className="page-head">
        <div className="col pad inner">
          <p className="mt-badge"><Icon d={ICON.trophy} />All tournaments</p>
          <h1>Tournaments that showcase <span className="gt">trading skill</span></h1>
          <p>Free daily sprints, paid tournaments, a monthly circuit and one championship a year. Same engine, same rules &mdash; what changes is the clock and the stakes.</p>
        </div>
      </header>

      <section className="mt-page">
        <div className="col pad">
          {formats.map((format) => (
            <section key={format.id} id={format.id} className={`tr-format is-${format.theme}`}>
              <article className="tr-head">
                <span className="tr-ico"><Icon d={format.icon} /></span>
                <div>
                  <h2>{format.title}</h2>
                  <p>{format.tagline}</p>
                  <ul className="tr-chips">
                    {format.chips.map((chip) => (
                      <li key={chip.label}><Icon d={chip.icon} />{chip.label}</li>
                    ))}
                  </ul>
                </div>
              </article>

              <dl className="tr-stats">
                {format.stats.map((stat) => (
                  <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>
                ))}
              </dl>

              {format.id === "mini" ? (
                <div className="mt-upcoming"><UpcomingMiniCard /></div>
              ) : (
                <p className="tr-empty">{format.empty}</p>
              )}

              {format.explore && (
                <div className="tr-explore">
                  <Link className={format.id === "mini" ? "btn b-ember" : "btn b-line"} href={format.explore.href}>
                    {format.explore.label}<Icon d={ICON.arrow} />
                  </Link>
                </div>
              )}
            </section>
          ))}

          <h2 className="mt-h2">Side by side</h2>
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

          <aside className="mt-cta">
            <h2>Ready to compete?</h2>
            <p>Join traders from around the world and prove your trading skills on an identical balance.</p>
            <div className="btn-row">
              <Link className="btn b-ember" href="/#join">Get started</Link>
              <Link className="btn b-line" href="/schedule/">View schedule</Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
