import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer>
      <div className="col pad ft">
        <div className="ft-brand">
          <Link href="/" className="logo">
            {/* eslint-disable-next-line @next/next/no-img-element -- static export, identical markup to the old site */}
            <img src="/assets/img/battel-logo.svg" alt="BattleTrader" width={1214} height={162} />
          </Link>
          <p>Simulated trading tournaments on live market data &mdash; where trading meets e-sports competition.</p>
          <div className="social">
            <a href="#" aria-label="BattleTrader on Telegram"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 4-18 7 6.5 2.2L18 7l-6.8 7.6L11 20l3.4-3.9L19 19z" /></svg></a>
            <a href="#" aria-label="BattleTrader on Discord"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7.5a14 14 0 0 1 8 0M7 17c3 1.5 7 1.5 10 0" /><path d="M6.5 6.5C5 9 4.3 12 4.5 16c1.3 1.2 2.8 2 4.3 2.5L10 16.5M17.5 6.5C19 9 19.7 12 19.5 16c-1.3 1.2-2.8 2-4.3 2.5L14 16.5" /><circle cx="9.5" cy="12.5" r="1" /><circle cx="14.5" cy="12.5" r="1" /></svg></a>
            <a href="#" aria-label="BattleTrader on X"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l16 16M20 4 4 20" /></svg></a>
            <a href="#" aria-label="BattleTrader on Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.6" /><circle cx="16.8" cy="7.2" r=".6" /></svg></a>
            <a href="#" aria-label="BattleTrader on YouTube"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="3.5" /><path d="m10.5 9.5 4 2.5-4 2.5z" /></svg></a>
          </div>
        </div>
        <nav className="ft-col" aria-label="Navigation">
          <p className="fh">Navigation</p>
          <Link href="/">Home</Link>
          <Link href="/schedule/">Schedule</Link>
          <Link href="/rankings/">Rankings</Link>
          <Link href="/contact/">Contact</Link>
        </nav>
        <nav className="ft-col" aria-label="Tournaments">
          <p className="fh">Tournaments</p>
          <Link href="/tournaments/">All Tournaments</Link>
          <Link href="/mini-tournaments/">Mini Tournaments</Link>
          <Link href="/circuit-tournaments/">Circuit Tournaments</Link>
          <Link href="/results/">Results</Link>
        </nav>
        <nav className="ft-col" aria-label="Resources">
          <p className="fh">Resources</p>
          <Link href="/rules/">Rulebook</Link>
          <Link href="/faq/">FAQ</Link>
          <Link href="/our-partners/">Our Partners</Link>
          <Link href="/partnership/">Partnership</Link>
          <Link href="/privacy/">Privacy Policy</Link>
          <Link href="/terms/">Terms of Service</Link>
        </nav>
      </div>
      <div className="col pad ft-bottom">
        <p className="disc">BattleTrader runs simulated trading tournaments on virtual accounts using live market pricing. No participant capital is traded and no brokerage service is provided. Entry fees are tournament entry fees, not deposits, and are not refundable once an event has started. Results in a simulated tournament are not indicative of results in live trading. Trading leveraged financial instruments carries a high degree of risk. Participation must comply with the laws of your country of residence.</p>
        <p className="copy">&copy; 2026 BattleTrader. All rights reserved. <span className="ft-legal"><Link href="/privacy/">Privacy</Link> <span aria-hidden="true">&middot;</span> <Link href="/terms/">Terms</Link></span></p>
      </div>
    </footer>
  );
}
