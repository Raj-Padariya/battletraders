import type { Metadata } from "next";
import ContactPanel from "./ContactPanel";

export const metadata: Metadata = {
  title: "Contact — BattleTrader",
  description: "Four inboxes, each watched by the people who can answer. Support is staffed continuously while an event is running.",
};

export default function ContactPage() {
  return (
    <>
      <header className="page-head">
        <div className="col pad inner">
          <p className="crumb">Contact</p>
          <h1>Talk to <span className="gt">us</span></h1>
          <p>Four inboxes, each watched by the people who can answer. Support is staffed continuously while an event is running.</p>
        </div>
      </header>

      <section>
        <div className="col pad">
          <ContactPanel />

          <div className="block">
            <h3 className="sub">Response <span className="gt">times</span></h3>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Enquiry</th><th>Target reply</th><th>While an event is live</th></tr></thead>
                <tbody>
                  <tr><td>Platform or account problem</td><td className="num">12 hours</td><td className="num">Under 1 hour</td></tr>
                  <tr><td>Result objection</td><td className="num">24 hours</td><td className="num">Same day</td></tr>
                  <tr><td>Prize or payout query</td><td className="num">2 working days</td><td className="num">&mdash;</td></tr>
                  <tr><td>Partnership enquiry</td><td className="num">2 working days</td><td className="num">&mdash;</td></tr>
                </tbody>
              </table>
            </div>
            <div className="note"><b>During a live event, support is staffed continuously.</b> If something breaks mid-window, write to support and keep trading &mdash; the clock does not stop, and your trade log is the record whatever happens to your screen.</div>
          </div>
        </div>
      </section>
    </>
  );
}
