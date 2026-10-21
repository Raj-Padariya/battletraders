import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rules — BattleTrader",
  description: "These apply to every format. Where a format's own page states a different figure, that figure governs for that format.",
};

export default function RulesPage() {
  return (
    <>
      <header className="page-head">
        <div className="col pad inner">
          <p className="crumb">Rulebook</p>
          <h1>The rules, <span className="gt">in full</span></h1>
          <p>These apply to every format. Where a format&apos;s own page states a different figure, that figure governs for that format.</p>
        </div>
      </header>

      <section>
        <div className="col pad">

          <div className="block">
            <h3 className="sub">1. Eligibility</h3>
            <ol className="clauses">
              <li data-n="1">You must be <b>18 or over</b> to enter any format.</li>
              <li data-n="1"><b>One account per person.</b> Duplicate accounts void every result on all of them and forfeit any prize.</li>
              <li data-n="1">Employees of BattleTrader and their immediate family may enter Daily Battles but are not eligible for cash prizes or the World Championship.</li>
              <li data-n="1">Residents of jurisdictions where participation is unlawful are not eligible. Confirming this is your responsibility.</li>
              <li data-n="1">Identity verification is required before any cash prize or funded account is released.</li>
            </ol>
          </div>

          <div className="block">
            <h3 className="sub">2. Account and platform</h3>
            <ol className="clauses">
              <li data-n="2">Every entrant in an event receives an <b>identical simulated account</b>. Balances are stated on each format&apos;s page.</li>
              <li data-n="2">Leverage is fixed at <b>1:100</b> in every format and cannot be changed.</li>
              <li data-n="2">Pricing is live market data. Spreads and slippage reflect real conditions.</li>
              <li data-n="2">Contest accounts carry no monetary value. Balances cannot be withdrawn, transferred or converted.</li>
              <li data-n="2">Accounts are disabled when the event window closes.</li>
            </ol>
          </div>

          <div className="block">
            <h3 className="sub">3. Instruments</h3>
            <p className="lead">Nine instruments are tradable. A position opened on anything else is void and excluded from scoring.</p>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Category</th><th>Instruments</th></tr></thead>
                <tbody>
                  <tr><td>Major FX</td><td>EURUSD, GBPUSD, USDJPY, USDCHF, USDCAD, AUDUSD, NZDUSD</td></tr>
                  <tr><td>Metals</td><td>XAUUSD</td></tr>
                  <tr><td>Crypto</td><td>BTCUSD</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="block">
            <h3 className="sub">4. Position limits</h3>
            <ol className="clauses">
              <li data-n="4">Maximum <b>5.00 lots per position</b>.</li>
              <li data-n="4">Maximum <b>10.00 lots total open exposure</b> at any moment.</li>
              <li data-n="4">Maximum <b>5 positions open</b> at any moment.</li>
              <li data-n="4">Hedging within your own account is permitted.</li>
              <li data-n="4">Partial closes are permitted. Each closed portion counts as a separate trade.</li>
              <li data-n="4">Stop-loss orders are not compulsory. The drawdown limit applies either way.</li>
            </ol>
          </div>

          <div className="block">
            <h3 className="sub">5. Trade validity</h3>
            <ol className="clauses">
              <li data-n="5"><b>Minimum hold is 60 seconds.</b> A position closed faster is excluded from scoring; its profit or loss still moves your balance and your drawdown.</li>
              <li data-n="5">A position must be opened inside the window to count.</li>
              <li data-n="5">Positions still open at the close are <b>force-closed at market</b> and counted at that result.</li>
              <li data-n="5">Pending orders that have not triggered by the close are cancelled and do not count as trades.</li>
              <li data-n="5">Swap and rollover charges apply normally in any format running past a daily rollover.</li>
            </ol>
          </div>

          <div className="block">
            <h3 className="sub">6. Scoring</h3>
            <ol className="clauses">
              <li data-n="6">Entrants are ranked on <b>percentage net return</b> on the closing balance.</li>
              <li data-n="6">A <b>minimum trade count</b> is required to be ranked. It is 3 in a Daily Battle, 5 in a Mini Tournament or the World Championship, and 10 in a Circuit Championship.</li>
              <li data-n="6"><b>Maximum drawdown is 30%</b>, measured on equity including floating profit and loss. A breach disables the account immediately and the entrant is unranked for that event.</li>
              <li data-n="6">Tie-breakers, in order: lower maximum drawdown, then the earlier timestamp on the final closed trade, then the higher number of qualifying trades.</li>
              <li data-n="6">The live leaderboard is indicative. The <b>server-side trade log at the close is the sole record</b> for scoring.</li>
              <li data-n="6">Top finishers&apos; trade logs are audited before cash prizes or points are confirmed.</li>
            </ol>
          </div>

          <div className="block">
            <h3 className="sub">7. Prohibited practices</h3>
            <p className="lead">Each of these voids your result for the event and may close your account permanently.</p>
            <ol className="clauses">
              <li data-n="7"><b>Automated trading of any kind</b> &mdash; Expert Advisors, bots, scripts or auto-execution tools.</li>
              <li data-n="7"><b>Copy trading or signal following</b> &mdash; taking trades from a service, group, mentor or any third party.</li>
              <li data-n="7"><b>Account sharing</b> &mdash; anyone other than the registered account holder trading the account.</li>
              <li data-n="7"><b>Collusion</b> &mdash; two or more entrants coordinating positions, including deliberately opposite positions to guarantee one high finish.</li>
              <li data-n="7"><b>Exploiting pricing or platform errors.</b> Profit arising from a quote error or feed interruption is voided whether or not it was deliberate.</li>
              <li data-n="7"><b>Misrepresentation</b> at sign-up or during verification.</li>
            </ol>
          </div>

          <div className="block">
            <h3 className="sub">8. Technical</h3>
            <ol className="clauses">
              <li data-n="8">You are responsible for your own device, software and internet connection.</li>
              <li data-n="8"><b>A disconnection does not pause, extend or restart an event</b>, and no compensation is payable. Positions stay open and the clock keeps running.</li>
              <li data-n="8">If a platform-wide outage exceeds 30 minutes, BattleTrader may extend the window, resume it, or void the event and refund entry fees. No other remedy is available.</li>
              <li data-n="8">Set stop losses on every position as protection against disconnection.</li>
            </ol>
          </div>

          <div className="block">
            <h3 className="sub">9. Prizes and payouts</h3>
            <ol className="clauses">
              <li data-n="9">Prize structures are published before entries open and do not change once an event has started.</li>
              <li data-n="9">Cash prizes are paid within <b>14 days</b> of the event closing, after the audit and identity verification.</li>
              <li data-n="9">Prizes are personal and non-transferable. A funded account cannot be exchanged for cash.</li>
              <li data-n="9"><b>Taxes are the winner&apos;s responsibility.</b> Tax is deducted at source where the law of the payout jurisdiction requires it.</li>
              <li data-n="9">A prize is withdrawn if a breach is found after it is announced, and the places below are re-ranked.</li>
            </ol>
          </div>

          <div className="block">
            <h3 className="sub">10. Disputes</h3>
            <ol className="clauses">
              <li data-n="10">Objections must be submitted in writing within <b>24 hours</b> of results being published.</li>
              <li data-n="10">The <b>server-side trade log is the sole record</b>. Screenshots and local platform history are not accepted against it.</li>
              <li data-n="10">BattleTrader&apos;s decision on any objection is final and binding.</li>
              <li data-n="10">BattleTrader may interpret these rules and decide any situation they do not cover. Such decisions are published with the results.</li>
            </ol>
            <div className="note"><b>These rules apply to every format.</b> Where a format&apos;s page states a different figure &mdash; starting balance, minimum trades, window length &mdash; that figure governs for that format.</div>
          </div>

        </div>
      </section>
    </>
  );
}
