import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — BattleTrader",
  description: "The agreement between you and BattleTrader: accounts, simulated trading, entry fees and refunds, prizes, live events and fair play.",
};

const UPDATED = "22 October 2026";

export default function TermsPage() {
  return (
    <>
      <header className="page-head">
        <div className="col pad inner">
          <p className="crumb">Terms of Service</p>
          <h1>The terms, <span className="gt">plainly stated</span></h1>
          <p>The agreement between you and BattleTrader when you create an account, enter a tournament or attend a live event. Last updated {UPDATED}.</p>
        </div>
      </header>

      <section>
        <div className="col pad">

          <div className="block">
            <h3 className="sub">1. Agreement</h3>
            <ol className="clauses">
              <li data-n="1">By creating an account or entering any event you agree to these Terms, the <Link href="/rules/">Rulebook</Link> and the <Link href="/privacy/">Privacy Policy</Link>.</li>
              <li data-n="1">Where these Terms and the Rulebook differ on how an event is run or scored, <b>the Rulebook governs</b>. Where a format&apos;s own page states a different figure, that figure governs for that format.</li>
              <li data-n="1">If you do not agree, do not use the service.</li>
            </ol>
          </div>

          <div className="block">
            <h3 className="sub">2. What BattleTrader is</h3>
            <ol className="clauses">
              <li data-n="2">BattleTrader runs <b>simulated trading competitions</b>. Every entrant trades a virtual contest account priced from live market data.</li>
              <li data-n="2"><b>No real capital is traded</b> and BattleTrader is not a broker. We do not hold client funds, execute real trades or give investment advice.</li>
              <li data-n="2">Contest balances have <b>no monetary value</b> and cannot be withdrawn, transferred or converted.</li>
              <li data-n="2">Results in a simulated tournament are not indicative of results in live trading. Trading leveraged instruments in real markets carries a high degree of risk.</li>
            </ol>
          </div>

          <div className="block">
            <h3 className="sub">3. Your account</h3>
            <ol className="clauses">
              <li data-n="3">You must be <b>18 or over</b> and allowed to take part under the laws of your country of residence. Confirming this is your responsibility.</li>
              <li data-n="3"><b>One account per person.</b> Duplicate accounts void every result on all of them and forfeit any prize.</li>
              <li data-n="3">The details you give must be true and kept up to date. Identity verification is required before any prize is released.</li>
              <li data-n="3">Keep your password private. You are responsible for everything done on your account, and only you may trade it.</li>
            </ol>
          </div>

          <div className="block">
            <h3 className="sub">4. Entry fees and refunds</h3>
            <ol className="clauses">
              <li data-n="4">Entry fees are <b>tournament entry fees, not deposits</b>. They pay for a seat in an event and are not credited to any trading balance.</li>
              <li data-n="4">Fees are shown in US dollars before you pay and can be paid by the methods offered at checkout, such as card, UPI or crypto.</li>
              <li data-n="4">You may cancel and receive a full refund up to <b>7 days before an event starts</b>. After that, and once an event has started, entry fees are <b>not refundable</b>.</li>
              <li data-n="4">If BattleTrader cancels an event, or voids it under the Rulebook after a platform-wide outage, the entry fee is refunded in full to the original payment method.</li>
              <li data-n="4">An entry is personal. It cannot be transferred to another person without our written approval.</li>
            </ol>
          </div>

          <div className="block">
            <h3 className="sub">5. Prizes</h3>
            <ol className="clauses">
              <li data-n="5">Prize structures are published on each event&apos;s page before entries open and do not change once an event has started.</li>
              <li data-n="5">Prizes are paid after the trade-log audit and identity verification, within <b>14 days</b> of the event closing.</li>
              <li data-n="5">Prizes are personal and non-transferable. <b>Taxes are the winner&apos;s responsibility</b>; tax is deducted at source where the law requires it.</li>
              <li data-n="5">A prize is withdrawn if a breach of these Terms or the Rulebook is found, and the places below are re-ranked.</li>
            </ol>
          </div>

          <div className="block">
            <h3 className="sub">6. Live events</h3>
            <ol className="clauses">
              <li data-n="6">Where a pass includes a hotel stay, as with the Goa Live Final, BattleTrader books and pays for the room for the nights stated on the event page. Travel, meals and other costs are your own unless the page says otherwise.</li>
              <li data-n="6">You must bring a valid photo ID that matches your account. Entry can be refused without one.</li>
              <li data-n="6">Venues, dates and start times may change for reasons outside our control. We will tell registered traders as early as we can, and a cancelled event is refunded under section 4.</li>
              <li data-n="6">Behaviour that disrupts other traders, staff or the venue can lead to removal from the event without a refund.</li>
            </ol>
          </div>

          <div className="block">
            <h3 className="sub">7. Fair play</h3>
            <p className="lead">Each of these breaks these Terms and may void your results and close your account permanently.</p>
            <ol className="clauses">
              <li data-n="7">Bots, Expert Advisors, scripts or any automated trading.</li>
              <li data-n="7">Copy trading, signal following, account sharing or collusion with other entrants.</li>
              <li data-n="7">Exploiting pricing, feed or platform errors, whether or not it was deliberate.</li>
              <li data-n="7">Interfering with the platform, scraping it, or trying to access another trader&apos;s account.</li>
              <li data-n="7">False information at sign-up, at checkout or during verification.</li>
            </ol>
          </div>

          <div className="block">
            <h3 className="sub">8. Our content</h3>
            <ol className="clauses">
              <li data-n="8">The BattleTrader name, logo, website, trader panel and event formats belong to BattleTrader. You may not copy or reuse them without our written permission.</li>
              <li data-n="8">You allow us to show your display name, country and results on leaderboards, results pages and event coverage.</li>
            </ol>
          </div>

          <div className="block">
            <h3 className="sub">9. Liability</h3>
            <ol className="clauses">
              <li data-n="9">The service is provided &ldquo;as is&rdquo;. We work to keep it available but do not promise it will be uninterrupted or error-free. Technical issues are handled as set out in the Rulebook.</li>
              <li data-n="9">BattleTrader is not liable for losses from your own device, connection or decisions, or for any trading you do with real money elsewhere.</li>
              <li data-n="9">Our total liability to you for any event is limited to the entry fee you paid for that event. Nothing here limits liability that cannot be limited by law.</li>
            </ol>
          </div>

          <div className="block">
            <h3 className="sub">10. Suspension, changes and disputes</h3>
            <ol className="clauses">
              <li data-n="10">We may suspend or close an account that breaks these Terms or the Rulebook. You may close your account at any time through the <Link href="/contact/">contact page</Link>.</li>
              <li data-n="10">We may update these Terms. The date at the top shows the latest version, and material changes are emailed to registered traders before they apply to new entries.</li>
              <li data-n="10">Disputes about results follow the Rulebook: objections in writing within <b>24 hours</b> of results being published, with the server-side trade log as the sole record.</li>
              <li data-n="10">Any other concern can be raised through the <Link href="/contact/">contact page</Link>, and we will try to resolve it with you first.</li>
            </ol>
            <div className="note"><b>Also read:</b> the <Link href="/rules/">Rulebook</Link> for how every format is run and scored, and the <Link href="/privacy/">Privacy Policy</Link> for how your data is handled.</div>
          </div>

        </div>
      </section>
    </>
  );
}
