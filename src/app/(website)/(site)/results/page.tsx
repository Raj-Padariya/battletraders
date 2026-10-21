import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Results — BattleTrader",
  description: "Every event goes through the same audit before points and prizes are released. Here is what has been settled and how to dispute it.",
};

export default function ResultsPage() {
  return (
    <>
      <header className="page-head">
        <div className="col pad inner">
          <p className="crumb">Results</p>
          <h1>Settled, audited, <span className="gt">published</span></h1>
          <p>Every event goes through the same audit before points and prizes are released. Here is what has been settled and how to dispute it.</p>
        </div>
      </header>

      <section>
        <div className="col pad">
          <div className="block">
            <h3 className="sub">How results are <span className="gt">settled</span></h3>
            <p className="lead">Nothing is final when the window closes. Every event goes through the same three steps before points and prizes are released, and the published result is the one that survives the audit.</p>
            <div className="steps">
              <div className="st"><span className="n">01</span><h3>Window closes</h3><p>Open positions are force-closed at market. The server-side trade log is sealed at that moment.</p></div>
              <div className="st"><span className="n">02</span><h3>Top finishers audited</h3><p>Trade logs are checked for automation, minimum-hold breaches and duplicate accounts before anything is posted.</p></div>
              <div className="st"><span className="n">03</span><h3>Published</h3><p>Results go up with an objection window. Points land on the ladder once that window shuts.</p></div>
            </div>
            <div className="tbl-wrap mt-20">
              <table>
                <thead><tr><th>Format</th><th>Results published</th><th>Objection window</th><th>Cash paid</th></tr></thead>
                <tbody>
                  <tr><td><b>Daily Battle</b></td><td className="num">Within 2 hours</td><td className="num">24 hours</td><td className="num">&mdash;</td></tr>
                  <tr><td><b>Mini Tournament</b></td><td className="num">Next morning</td><td className="num">24 hours</td><td className="num">14 days</td></tr>
                  <tr><td><b>Circuit Championship</b></td><td className="num">Within 48 hours</td><td className="num">48 hours</td><td className="num">14 days</td></tr>
                  <tr className="key"><td><b>World Championship</b></td><td className="num">Same day</td><td className="num">2 hours, on site</td><td className="num">14 days</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="block">
            <h3 className="sub">Latest <span className="gt">results</span></h3>
            <span className="sample">Sample board &middot; Season 1 opens at launch</span>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Event</th><th>Format</th><th>Winner</th><th className="num">Return</th><th className="num">Field</th><th className="num">Status</th></tr></thead>
                <tbody>
                  <tr><td>Circuit 1</td><td>Circuit Championship</td><td>sample_trader_a</td><td className="num">+41.2%</td><td className="num">512</td><td className="num">Settled</td></tr>
                  <tr><td>Mini 04</td><td>Mini Tournament</td><td>sample_trader_c</td><td className="num">+18.6%</td><td className="num">256</td><td className="num">Settled</td></tr>
                  <tr><td>Mini 03</td><td>Mini Tournament</td><td>sample_trader_b</td><td className="num">+22.4%</td><td className="num">241</td><td className="num">Settled</td></tr>
                  <tr><td>Daily &mdash; London</td><td>Daily Battle</td><td>sample_trader_g</td><td className="num">+9.1%</td><td className="num">1,308</td><td className="num">Settled</td></tr>
                  <tr><td>Daily &mdash; Asia</td><td>Daily Battle</td><td>sample_trader_e</td><td className="num">+7.8%</td><td className="num">942</td><td className="num">Settled</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="block">
            <h3 className="sub">Disputing a <span className="gt">result</span></h3>
            <p className="lead">Objections go to <b>results@battletrader.com</b> inside the window shown above, with your handle and the event name. Two things decide the outcome.</p>
            <div className="rules">
              <div className="rl"><b>The server log is the record</b><span>Screenshots and local platform history are not accepted against it. The log is sealed at the close and cannot be edited afterwards.</span></div>
              <div className="rl"><b>Decisions are published</b><span>Where an objection changes a result, the change and the reason go up with the corrected board. Nothing is adjusted quietly.</span></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
