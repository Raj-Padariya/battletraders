import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — BattleTrader",
  description: "What BattleTrader collects when you register, trade in a tournament or claim a prize, why we need it, who sees it and how to get it deleted.",
};

const UPDATED = "22 October 2026";

export default function PrivacyPage() {
  return (
    <>
      <header className="page-head">
        <div className="col pad inner">
          <p className="crumb">Privacy Policy</p>
          <h1>Your data, <span className="gt">kept simple</span></h1>
          <p>What we collect when you register, compete or claim a prize, why we need it, who sees it and how you get it removed. Last updated {UPDATED}.</p>
        </div>
      </header>

      <section>
        <div className="col pad">

          <div className="block">
            <h3 className="sub">1. Who we are</h3>
            <ol className="clauses">
              <li data-n="1">BattleTrader runs <b>simulated trading tournaments</b> on virtual accounts priced from live market data. In this policy &ldquo;BattleTrader&rdquo;, &ldquo;we&rdquo; and &ldquo;us&rdquo; mean the operator of this website, the trader panel and the live events.</li>
              <li data-n="1">This policy covers the website, the trader panel at <b>/app</b>, tournament registration and checkout, and in-person events such as the <b>Goa Live Final</b>.</li>
              <li data-n="1">Questions about your data go to us through the <Link href="/contact/">contact page</Link>. We answer privacy requests within <b>30 days</b>.</li>
            </ol>
          </div>

          <div className="block">
            <h3 className="sub">2. What we collect</h3>
            <p className="lead">We only ask for what a tournament, a payout or the law actually needs.</p>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>When</th><th>What we collect</th></tr></thead>
                <tbody>
                  <tr><td>Creating an account</td><td>Name, email address, country, a display name for the leaderboard and your password (stored only as a one-way hash).</td></tr>
                  <tr><td>Entering a tournament</td><td>The event you entered, entry fee, payment method type (card, UPI or crypto) and payment status. We do not store full card numbers or UPI PINs; the payment provider handles those.</td></tr>
                  <tr><td>Trading in an event</td><td>Every order, position, price, timestamp, balance and drawdown on your contest account, plus the device and IP address used to place trades.</td></tr>
                  <tr><td>Claiming a prize</td><td>Identity document, date of birth, address and payout details, used for verification and to pay you.</td></tr>
                  <tr><td>Live events</td><td>Hotel booking details, arrival date and any accessibility or dietary needs you choose to share.</td></tr>
                  <tr><td>Contacting us</td><td>Your message and the email or phone number you reply from.</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="block">
            <h3 className="sub">3. Why we use it</h3>
            <ol className="clauses">
              <li data-n="3"><b>To run the tournament.</b> Your trade log is the only record used for scoring, ranking and the drawdown limit.</li>
              <li data-n="3"><b>To keep the competition fair.</b> Trade logs, devices and IP addresses are checked for duplicate accounts, collusion, copy trading, bots and pricing exploits, as set out in the <Link href="/rules/">Rulebook</Link>.</li>
              <li data-n="3"><b>To pay prizes.</b> Identity verification is required before any cash prize or funded account is released, and payout details are needed to send it.</li>
              <li data-n="3"><b>To host live events.</b> Hotel stays included with a pass are booked in your name.</li>
              <li data-n="3"><b>To contact you</b> about events you entered, results, payouts and changes to these documents. Marketing emails are sent only if you opt in, and every one has an unsubscribe link.</li>
              <li data-n="3"><b>To meet legal duties</b> such as tax, anti-fraud and record-keeping obligations.</li>
            </ol>
          </div>

          <div className="block">
            <h3 className="sub">4. What is public</h3>
            <ol className="clauses">
              <li data-n="4">Leaderboards, <Link href="/rankings/">rankings</Link> and <Link href="/results/">results</Link> show your <b>display name, country and performance figures</b>. Your real name, email and documents are never shown.</li>
              <li data-n="4">Winners of live events may be named and photographed on stage. Tell us at registration if you do not want your photo published.</li>
            </ol>
          </div>

          <div className="block">
            <h3 className="sub">5. Who we share it with</h3>
            <p className="lead">We do not sell personal data. It is shared only where needed to provide the service.</p>
            <ol className="clauses">
              <li data-n="5"><b>Payment providers</b> that process entry fees and send payouts.</li>
              <li data-n="5"><b>Identity verification providers</b> that check documents before a prize is paid.</li>
              <li data-n="5"><b>Hotels and event partners</b> for live events, limited to what the booking needs.</li>
              <li data-n="5"><b>Hosting, email and analytics providers</b> that run the platform on our behalf.</li>
              <li data-n="5"><b>Authorities</b> where the law requires it, or to protect participants from fraud.</li>
            </ol>
          </div>

          <div className="block">
            <h3 className="sub">6. How long we keep it</h3>
            <ol className="clauses">
              <li data-n="6">Account details are kept while your account is open and deleted within <b>90 days</b> of closing it.</li>
              <li data-n="6">Trade logs and results are kept for <b>5 years</b> so rankings, audits and disputes can be checked.</li>
              <li data-n="6">Payment and identity records are kept for as long as tax and anti-fraud law requires.</li>
            </ol>
          </div>

          <div className="block">
            <h3 className="sub">7. Cookies and browser storage</h3>
            <ol className="clauses">
              <li data-n="7">The site stores your sign-in session, preferences and tournament passes in your browser so you stay signed in and your registrations show up. Clearing your browser data signs you out.</li>
              <li data-n="7">We do not use advertising cookies. If we add analytics that need consent, we will ask first.</li>
            </ol>
          </div>

          <div className="block">
            <h3 className="sub">8. Your rights</h3>
            <ol className="clauses">
              <li data-n="8">You can ask for a <b>copy</b> of your data, have it <b>corrected</b>, or have it <b>deleted</b>.</li>
              <li data-n="8">You can withdraw consent to marketing at any time.</li>
              <li data-n="8">Some data cannot be deleted while it is legally required, or while a prize, audit or dispute linked to it is still open.</li>
              <li data-n="8">Send any request through the <Link href="/contact/">contact page</Link> from the email on your account.</li>
            </ol>
          </div>

          <div className="block">
            <h3 className="sub">9. Security and age</h3>
            <ol className="clauses">
              <li data-n="9">Passwords are stored as one-way hashes and data is sent over encrypted connections. No system is perfectly secure, so use a password you do not use elsewhere.</li>
              <li data-n="9">BattleTrader is for people <b>18 and over</b>. We do not knowingly collect data from anyone younger and delete it if we find it.</li>
            </ol>
          </div>

          <div className="block">
            <h3 className="sub">10. Changes</h3>
            <ol className="clauses">
              <li data-n="10">We update this policy when the service changes. The date at the top always shows the latest version, and material changes are emailed to registered traders.</li>
            </ol>
            <div className="note"><b>Also read:</b> the <Link href="/terms/">Terms of Service</Link> and the <Link href="/rules/">Rulebook</Link>, which set out how tournaments, entry fees and prizes work.</div>
          </div>

        </div>
      </section>
    </>
  );
}
