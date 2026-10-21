import Link from "next/link";
import { upcomingMini } from "@site/components/HomeTournamentSections";

export function Icon({ d }: { d: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export const ICON = {
  bolt: "m13 2-9 12h7l-1 8 10-13h-7l1-7Z",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3 2",
  dollar: "M12 3v18m4-14.5C14.8 5.3 13.5 5 12 5 9.8 5 8 6.1 8 7.8c0 4.5 8 2.1 8 6.6 0 1.7-1.8 2.8-4 2.8-1.5 0-2.8-.3-4-1.5",
  users: "M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20m7-9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-7.5a4 4 0 0 1 0 7.8m4 8.7v-1.5a4 4 0 0 0-3-3.87",
  card: "M3 6h18v12H3zM3 10h18M7 15h3",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  target: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z",
  trophy: "M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0V4Zm0 2H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4",
  wallet: "M3 7h15a3 3 0 0 1 3 3v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 0 2-3h11v3M16 14h2",
  gauge: "M12 14l4-4M3.5 17a9 9 0 1 1 17 0",
  shield: "M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z",
  layers: "m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  pin: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  crown: "m3 8 4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8Z",
};

export function UpcomingMiniCard() {
  return (
    <article className="mt-event">
      <div className="mt-event-tags">
        <span className="mt-tag">Mini</span>
        <span className="mt-tag is-open"><Icon d={ICON.clock} />Registration open</span>
      </div>
      <h3>{upcomingMini.name}</h3>
      <ul>
        <li><Icon d={ICON.calendar} />{upcomingMini.date}</li>
        <li><Icon d={ICON.globe} />Online</li>
        <li><Icon d={ICON.users} />{upcomingMini.entrants} entrants</li>
      </ul>
      <div className="mt-event-money">
        <div><small>Prize pool</small><b className="is-prize">{upcomingMini.prize}</b></div>
        <div><small>Entry fee</small><b>$10</b></div>
      </div>
      <Link className="mt-event-cta" href={`/mini-tournaments/${upcomingMini.slug}/`}>View details<Icon d={ICON.arrow} /></Link>
    </article>
  );
}
