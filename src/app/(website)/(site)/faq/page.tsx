import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — BattleTrader",
  description: "Everything traders ask before their first event, grouped so you can find it fast.",
};

export default function FaqPage() {
  return (
    <>
      <header className="page-head">
        <div className="col pad inner">
          <p className="crumb">Questions</p>
          <h1>Frequently <span className="gt">asked</span></h1>
          <p>Everything traders ask before their first event, grouped so you can find it fast.</p>
        </div>
      </header>

      <section>
        <div className="mid pad">

          <div className="faqgroup">
            <h3>Getting started</h3>
            <details><summary>Is any of my own money at risk?</summary><p>No. Every event runs on a simulated account with virtual capital priced off the live market. Daily Battles are free; paid formats charge an entry fee and nothing else. You never deposit trading capital and you cannot lose more than the entry fee.</p></details>
            <details><summary>Do I need a broker account?</summary><p>No. BattleTrader is not a broker and does not hold client funds. You trade the tournament platform, not a live account.</p></details>
            <details><summary>What do I need to start?</summary><p>An email address, a mobile number and a device with a browser. Your first free Daily Battle opens the next trading day after you confirm your email.</p></details>
            <details><summary>Is there an app?</summary><p>The platform runs in the browser on desktop and mobile. There is nothing to install.</p></details>
          </div>

          <div className="faqgroup">
            <h3>Formats and entry</h3>
            <details><summary>Which format should I start with?</summary><p>Daily Battles. They are free, run every weekday, and build the points that unlock everything else. Most traders play Dailies for a few weeks before buying into a Mini Tournament.</p></details>
            <details><summary>Can I enter more than one event at once?</summary><p>No. You can hold one active event at a time. Enter the next one once your current window closes.</p></details>
            <details><summary>What happens if an event does not fill?</summary><p>Paid events run with the field they have. Prize pools are fixed and published in advance, so they do not shrink with a smaller field.</p></details>
            <details><summary>Can I get an entry fee back?</summary><p>Yes, until the window opens. Once an event has started the fee is not refundable.</p></details>
          </div>

          <div className="faqgroup">
            <h3>Trading and rules</h3>
            <details><summary>Can I use an Expert Advisor?</summary><p>No. Automated trading, copy trading and signal services are prohibited in every format and void your result. Trade logs for ranked finishes are audited.</p></details>
            <details><summary>Why is there a 60-second minimum hold?</summary><p>It stops tick-scalping and latency exploitation, which turn the contest into a test of connection speed rather than judgement. Trades closed faster still affect your balance; they just do not count toward your trade requirement.</p></details>
            <details><summary>What counts toward the drawdown limit?</summary><p>Equity, including floating profit and loss. A 30% drop from your starting equity at any moment disables the account for that event, even if the position would have recovered.</p></details>
            <details><summary>Can I trade during news releases?</summary><p>Yes. There is no news restriction. Spreads widen and slippage increases during high-impact releases, as they do in live trading, and BattleTrader is not liable for either.</p></details>
            <details><summary>What happens if I disconnect?</summary><p>Your positions stay open and the clock keeps running. Reconnect and carry on. A disconnection does not pause or restart an event, so set stop losses.</p></details>
          </div>

          <div className="faqgroup">
            <h3>Rankings</h3>
            <details><summary>How do points work?</summary><p>Every ranked finish earns points, scaled by format and finishing position. Points accumulate across the season and set your tier. The full table is on the Rankings page.</p></details>
            <details><summary>Do points expire?</summary><p>They reset at the start of each new season, and tiers reset with them. Your best season and career totals stay on your profile permanently.</p></details>
            <details><summary>What if I finish unranked?</summary><p>No points. An unranked finish means you missed the minimum trade count or breached the drawdown limit, and the result does not count whatever your balance was.</p></details>
            <details><summary>How do I reach the World Championship?</summary><p>Two routes: finish in the top 50 of any Circuit Championship, or end the season in the Elite tier. Either earns a seat in the 100-trader field.</p></details>
          </div>

          <div className="faqgroup">
            <h3>Prizes and payouts</h3>
            <details><summary>When are prizes paid?</summary><p>Within 14 days of the event closing, once the top finishers&apos; trade logs are audited and identity verification is complete.</p></details>
            <details><summary>How are prizes paid?</summary><p>By bank transfer or USDT, to an account in the winner&apos;s own name. Third-party payouts are not made.</p></details>
            <details><summary>Do I pay tax on a prize?</summary><p>Tax is the winner&apos;s responsibility, and is deducted at source where the law of the payout jurisdiction requires it. Take your own tax advice.</p></details>
            <details><summary>What is a funded account prize?</summary><p>A live trading account funded with BattleTrader capital, traded on an 80% profit share. Its terms are set out in the Funded Account Agreement, which the winner accepts before the account is opened.</p></details>
          </div>

          <div className="faqgroup">
            <h3>Account and support</h3>
            <details><summary>Can I change my trader handle?</summary><p>Once per season, and not while an event is running. Past results keep the handle they were set under.</p></details>
            <details><summary>Why was my account suspended?</summary><p>Most suspensions follow a duplicate account, an automated-trading flag or a failed verification. Write to support and the audit on your account will be explained.</p></details>
            <details><summary>How do I close my account?</summary><p>Write to support from your registered email. Any unpaid prize is settled first; entry fees for events already started are not refunded.</p></details>
          </div>

        </div>
      </section>
    </>
  );
}
