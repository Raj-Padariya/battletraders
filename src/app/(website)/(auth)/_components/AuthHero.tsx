import Link from "next/link";
import ArenaCandles from "./ArenaCandles";
import BattleScene from "./BattleScene";

interface AuthHeroProps {
  /** First line of the heading, before "Global Arena". */
  headingLead: string;
  intro: string;
  chip: React.ReactNode;
}

// Left brand panel shared by login and signup.
export default function AuthHero({ headingLead, intro, chip }: AuthHeroProps) {
  return (
    <section className="auth-hero">
      <div className="arena-fx" aria-hidden="true">
        <span className="ax-orb o1"></span>
        <span className="ax-orb o2"></span>
        <ArenaCandles />
        <span className="ax-horizon"></span>
      </div>
      <div className="auth-hero-in">
        <Link href="/" className="logo">
          {/* eslint-disable-next-line @next/next/no-img-element -- static export, same markup as the old page */}
          <img src="/assets/img/battel-logo.svg" alt="BattleTrader" width="1214" height="162" />
        </Link>
        <h1>
          {headingLead}
          <br />
          <span className="gt">Global Arena</span>
        </h1>
        <p>{intro}</p>
        <ul className="auth-feats">
          <li>
            <span className="auth-ico ico-gold">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" />
                <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
              </svg>
            </span>
            Elite Tournaments
          </li>
          <li>
            <span className="auth-ico ico-steel">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m3 17 6-6 4 4 8-8" />
                <path d="M14 7h7v7" />
              </svg>
            </span>
            Real-time Trading
          </li>
          <li>
            <span className="auth-ico ico-ember">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
              </svg>
            </span>
            Global Alliances
          </li>
        </ul>
        <BattleScene chip={chip} />
      </div>
    </section>
  );
}
