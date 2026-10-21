import Link from "next/link";

export const upcomingMini = {
  date: "Oct 30 · 9:00 AM UTC",
  name: "WTT Trick Or Trade 2026",
  prize: "$1,500",
  entrants: "5/256",
};

function MoneyIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M12 3v18m4-14.5C14.8 5.3 13.5 5 12 5 9.8 5 8 6.1 8 7.8c0 4.5 8 2.1 8 6.6 0 1.7-1.8 2.8-4 2.8-1.5 0-2.8-.3-4-1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}

function TrophyIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0V4Zm0 2H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function ClockIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7"/><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>;
}

function PeopleIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20m7-9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-7.5a4 4 0 0 1 0 7.8m4 8.7v-1.5a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function MiniIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>;
}

function PinIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>;
}

function TournamentTypeCard({ circuit = false }: { circuit?: boolean }) {
  const title = circuit ? "Circuit Championships" : "Mini Tournament";
  return (
    <article className={`home-battle-card${circuit ? " is-circuit" : " is-mini"}`}>
      <div className="home-battle-icon">{circuit ? <PinIcon /> : <MiniIcon />}</div>
      <h3>{title}</h3>
      <p>{circuit
        ? "Offline regional tournaments where traders compete to become Regional Champions and win their ticket to the WTT Main in Dubai."
        : "A twice-weekly online tournament built for excitement and rewards, where traders compete for prize pools and extra chances to qualify for the WTT Main. Every trade counts!"}</p>
      <div className="home-battle-stats">
        <div><MoneyIcon /><strong>{circuit ? "$50" : "$10"}</strong><span>Entry Fee</span></div>
        <div><TrophyIcon /><strong>{circuit ? "$15,000" : "$1,500"}</strong><span>Prize Pool</span></div>
      </div>
      <div className="home-battle-meta">
        <span><ClockIcon />{circuit ? "5 Trading Days" : "1 Trading Day"}</span>
        <span><PeopleIcon />{circuit ? "512" : "256"}</span>
      </div>
      <Link className="home-battle-cta" href={circuit ? "/tournaments/" : "/mini-tournaments/"}>
        {circuit ? "Explore Circuit" : "Explore Mini Tournaments"}
      </Link>
    </article>
  );
}

export default function HomeTournamentSections() {
  return (
    <>
      <section className="home-battle-section" aria-labelledby="home-battle-title">
        <div className="home-section-heading">
          <h2 id="home-battle-title">Choose Your <span>Battle</span></h2>
          <p>From free Daily Battles and twice-weekly Minis to the prestigious World Championship. Find the competition that matches your skill level.</p>
        </div>
        <div className="home-battle-grid">
          <TournamentTypeCard />
          <TournamentTypeCard circuit />
        </div>
      </section>

      <section className="home-mini-section" aria-labelledby="home-mini-title">
        <div className="home-mini-copy">
          <span className="home-mini-badge"><MiniIcon /> Twice a Week</span>
          <h2 id="home-mini-title">Mini <span>Tournaments</span></h2>
          <p>Full trading-day competitions every Tuesday and Thursday, built for quick decisions and fast payouts. A field of 256 and $1,500 to the podium.</p>
          <div className="home-mini-tags"><span>$10 Entry</span><span>Fast Payouts</span><span>Mobile Trading</span></div>
          <article className="home-next-card">
            <h3><MiniIcon /> Next Tournament</h3>
            <div className="home-next-stats"><div><strong>$10</strong><span>Entry Fee</span></div><div><strong>1 Day</strong><span>Duration</span></div><div><strong>$1.5K</strong><span>Prize Pool</span></div></div>
            <Link href="/mini-tournaments/">Register $10</Link>
          </article>
        </div>
        <div className="home-upcoming">
          <h3>Upcoming Minis</h3>
          <Link className="home-upcoming-item" href="/mini-tournaments/">
            <span><strong>{upcomingMini.date}</strong><small>{upcomingMini.name}</small></span>
            <span className="home-upcoming-prize"><strong>{upcomingMini.prize}</strong><small>{upcomingMini.entrants}</small></span>
          </Link>
          <Link className="home-upcoming-all" href="/mini-tournaments/">View All Mini Tournaments <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </>
  );
}
