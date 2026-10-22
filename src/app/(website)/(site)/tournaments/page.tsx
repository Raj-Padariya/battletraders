import type { Metadata } from "next";
import { GoaEventCard, ICON, Icon } from "@site/components/TournamentUi";

export const metadata: Metadata = {
  title: "Tournaments — BattleTrader",
  description: "The Goa Live Final 2026: one room, twenty-four hours of trading, hotel included.",
};

export default function TournamentsPage() {
  return (
    <>
      <header className="page-head">
        <div className="col pad inner">
          <p className="mt-badge"><Icon d={ICON.trophy} />Tournaments</p>
          <h1>Our <span className="gt">tournament</span></h1>
          <p>One event, one room, twenty-four hours of trading. Register on the event page &mdash; seats are limited.</p>
        </div>
      </header>

      <section className="mt-page">
        <div className="col pad">
          <div className="mt-upcoming"><GoaEventCard /></div>
        </div>
      </section>
    </>
  );
}
