import type { Metadata } from "next";
import { ICON, Icon } from "@site/components/TournamentUi";

export const metadata: Metadata = {
  title: "Results — BattleTrader",
  description: "Every event goes through the same audit before points and prizes are released. Here is what has been settled and how to dispute it.",
};

type EventResult = {
  id: string;
  theme: "daily" | "mini" | "circuit";
  format: string;
  title: string;
  date: string;
  location: string;
  winner: string;
  ret: string;
  field: string;
};

const results: EventResult[] = [
  { id: "circuit-1", theme: "circuit", format: "Circuit", title: "Circuit 1", date: "12 – 16 Oct 2026", location: "Online · Europe", winner: "sample_trader_a", ret: "+41.2%", field: "512" },
  { id: "mini-04", theme: "mini", format: "Mini", title: "Mini 04", date: "8 Oct 2026", location: "Online", winner: "sample_trader_c", ret: "+18.6%", field: "256" },
  { id: "mini-03", theme: "mini", format: "Mini", title: "Mini 03", date: "6 Oct 2026", location: "Online", winner: "sample_trader_b", ret: "+22.4%", field: "241" },
  { id: "daily-london", theme: "daily", format: "Daily", title: "Daily — London", date: "5 Oct 2026", location: "Online · London session", winner: "sample_trader_g", ret: "+9.1%", field: "1,308" },
  { id: "daily-asia", theme: "daily", format: "Daily", title: "Daily — Asia", date: "5 Oct 2026", location: "Online · Asia session", winner: "sample_trader_e", ret: "+7.8%", field: "942" },
];

const settlement = [
  { icon: ICON.clock, title: "Window closes", text: "Open positions are force-closed at market. The server-side trade log is sealed at that moment." },
  { icon: ICON.shield, title: "Top finishers audited", text: "Trade logs are checked for automation, minimum-hold breaches and duplicate accounts before anything is posted." },
  { icon: ICON.trophy, title: "Published", text: "Results go up with an objection window. Points land on the ladder once that window shuts." },
];

const timings = [
  { format: "Daily Battle", published: "Within 2 hours", objection: "24 hours", cash: "—" },
  { format: "Mini Tournament", published: "Next morning", objection: "24 hours", cash: "14 days" },
  { format: "Circuit Championship", published: "Within 48 hours", objection: "48 hours", cash: "14 days" },
  { format: "World Championship", published: "Same day", objection: "2 hours, on site", cash: "14 days" },
];

export default function ResultsPage() {
  return (
    <>
      <header className="page-head">
        <div className="col pad inner">
          <p className="mt-badge"><Icon d={ICON.trophy} />Settled &amp; audited</p>
          <h1>Tournament <span className="gt">results</span></h1>
          <p>Relive the action. See who topped the board in every settled event &mdash; and how each result was checked before it went up.</p>
        </div>
      </header>

      <section className="mt-page">
        <div className="col pad">
          <div className="rs-year">
            <h2>2026</h2>
            <span className="rs-sample">Sample board · Season 1 opens at launch</span>
          </div>

          <div className="rs-grid">
            {results.map((event) => (
              <article key={event.id} className={`rs-card is-${event.theme}`}>
                <div className="rs-banner" aria-hidden="true">
                  <span className="rs-format"><Icon d={ICON.trophy} />{event.format}</span>
                  <strong>{event.title}</strong>
                  <span className="rs-date">{event.date}</span>
                </div>
                <div className="rs-body">
                  <h3>{event.title}</h3>
                  <ul className="rs-meta">
                    <li><Icon d={ICON.calendar} />{event.date}</li>
                    <li><Icon d={ICON.pin} />{event.location}</li>
                  </ul>
                  <div className="rs-winner">
                    <small>Winner</small>
                    <b>{event.winner}</b>
                    <span>{event.ret} return · field of {event.field}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <h2 className="mt-h2">How results are settled</h2>
          <ol className="mt-steps rs-steps">
            {settlement.map((step, index) => (
              <li key={step.title}>
                <span className="mt-ico mt-ico-round"><Icon d={step.icon} /></span>
                <small>Step {String(index + 1).padStart(2, "0")}</small>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>

          <div className="tbl-wrap rs-timings">
            <table>
              <thead><tr><th>Format</th><th>Results published</th><th>Objection window</th><th>Cash paid</th></tr></thead>
              <tbody>
                {timings.map((row) => (
                  <tr key={row.format}><td><b>{row.format}</b></td><td className="num">{row.published}</td><td className="num">{row.objection}</td><td className="num">{row.cash}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="mt-cta">
            <h2>Disputing a result</h2>
            <p>Send objections to <b>results@battletrader.com</b> inside the window above, with your handle and the event name. The sealed server log is the record &mdash; screenshots are not accepted against it &mdash; and any change is published with its reason.</p>
          </aside>
        </div>
      </section>
    </>
  );
}
