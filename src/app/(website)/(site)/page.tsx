import type { Metadata } from "next";
import Link from "next/link";
import HomeTournamentSections from "@site/components/HomeTournamentSections";
import Duel from "./_home/Duel";
import JoinForm from "./_home/JoinForm";

export const metadata: Metadata = {
  title: "BattleTrader — Simulated Trading Tournaments",
  description:
    "Simulated trading tournaments on live market data. Free daily battles, paid events with cash prizes, and one world championship a year.",
};

export default function HomePage() {
  return (
    <>
      <header className="hero">
        <div className="col pad hero-in">
          <div className="hero-copy">
            <span className="tag">
              <i aria-hidden="true"></i>Season 1 · Arena open
            </span>
            <h1>
              Trade.
              <br />
              Battle.
              <br />
              <span>Dominate.</span>
            </h1>
            <p>
              Same balance. Same market. Same clock. Face real traders head-to-head on live pricing — the best return takes the rank, the
              prize and the bragging rights.
            </p>
            <div className="hero-btns">
              <a className="btn b-ember" href="#join">
                Enter the arena
              </a>
              <Link className="btn b-line" href="/tournaments/">
                See the formats
              </Link>
            </div>
          </div>

          <Duel />
        </div>
      </header>

      <section id="formats">
        <div className="col pad">
          <div className="head">
            <p className="kick">Choose your arena</p>
            <h2>
              Start free. <span className="gt">Fight to the final.</span>
            </h2>
            <p>
              Every format runs on the same engine and the same rules. What changes is the entry, the clock and what is on the line. Points
              from every event feed one season ranking.
            </p>
          </div>
          <div className="fmts">
            <div className="fmt">
              <span className="lv">Tier 01</span>
              <h3>Daily Battle</h3>
              <div className="fee">Free entry</div>
              <p>A one-hour sprint on a single session. Fastest way to climb the ladder and the only format that runs every weekday.</p>
              <dl>
                <dt>Duration</dt>
                <dd>1 hour</dd>
                <dt>Balance</dt>
                <dd>$10,000</dd>
                <dt>Prize</dt>
                <dd>Ranking points</dd>
              </dl>
            </div>
            <div className="fmt">
              <span className="lv">Tier 02</span>
              <h3>Mini Tournament</h3>
              <div className="fee">$10 entry</div>
              <p>A full trading day against a capped field. Cash to the top three, points to everyone who finishes ranked.</p>
              <dl>
                <dt>Duration</dt>
                <dd>1 day</dd>
                <dt>Field</dt>
                <dd>256 max</dd>
                <dt>Prize pool</dt>
                <dd>$1,500</dd>
              </dl>
            </div>
            <div className="fmt">
              <span className="lv">Tier 03</span>
              <h3>Circuit Championship</h3>
              <div className="fee">$50 entry</div>
              <p>A monthly event over a full trading week. Finish in the top 50 and you qualify for the World Championship field.</p>
              <dl>
                <dt>Duration</dt>
                <dd>5 days</dd>
                <dt>Field</dt>
                <dd>512 max</dd>
                <dt>Prize pool</dt>
                <dd>$15,000</dd>
              </dl>
            </div>
            <div className="fmt flag">
              <span className="lv">The final</span>
              <h3>World Championship</h3>
              <div className="fee">Invitation only</div>
              <p>
                One hundred traders, one room, twenty-four hours. Qualify through the circuit or the season ladder. Played in person, on the
                floor.
              </p>
              <dl>
                <dt>Duration</dt>
                <dd>24 hours</dd>
                <dt>Field</dt>
                <dd>100</dd>
                <dt>Prize pool</dt>
                <dd>$250,000</dd>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <HomeTournamentSections />

      <section className="alt" id="how">
        <div className="col pad">
          <div className="head">
            <p className="kick">How it works</p>
            <h2>
              From rookie to <span className="gt">ranked fighter</span>
            </h2>
          </div>
          <div className="steps">
            <div className="st">
              <span className="n">01</span>
              <h3>Create an account</h3>
              <p>Email and mobile. No deposit, no card, no trading account needed to start.</p>
            </div>
            <div className="st">
              <span className="n">02</span>
              <h3>Pick a battle</h3>
              <p>Join the next free Daily Battle, or buy into a Mini Tournament. Entries close when the clock starts.</p>
            </div>
            <div className="st">
              <span className="n">03</span>
              <h3>Trade the window</h3>
              <p>Identical simulated balance for everyone, live market pricing, leaderboard updating as you trade.</p>
            </div>
            <div className="st">
              <span className="n">04</span>
              <h3>Bank your points</h3>
              <p>Every ranked finish adds season points. Points decide your tier, and your tier decides what you can enter.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="ladder">
        <div className="col pad">
          <div className="head">
            <p className="kick">Season ranking</p>
            <h2>
              Five tiers. <span className="gt">One ladder.</span>
            </h2>
            <p>
              Points carry across every format for the length of a season. Reach Platinum and the Circuit Championship opens; finish the
              season in Elite and you are seeded straight into the World Championship.
            </p>
          </div>
          <div className="ladder">
            <div className="tier">
              <div className="bar-i tier-bronze"></div>
              <b>Bronze</b>
              <span>0 – 499</span>
            </div>
            <div className="tier">
              <div className="bar-i tier-silver"></div>
              <b>Silver</b>
              <span>500 – 1,499</span>
            </div>
            <div className="tier">
              <div className="bar-i tier-gold"></div>
              <b>Gold</b>
              <span>1,500 – 3,999</span>
            </div>
            <div className="tier">
              <div className="bar-i tier-platinum"></div>
              <b>Platinum</b>
              <span>4,000 – 7,999</span>
            </div>
            <div className="tier">
              <div className="bar-i tier-elite"></div>
              <b>Elite</b>
              <span>8,000 +</span>
            </div>
          </div>

          <span className="sample">Sample board · Season 1 opens at launch</span>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Trader</th>
                  <th>Tier</th>
                  <th className="num">Events</th>
                  <th className="num">Points</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="rk">01</td>
                  <td>sample_trader_a</td>
                  <td>
                    <span className="pill pill-ember">Elite</span>
                  </td>
                  <td className="num">34</td>
                  <td className="num">9,420</td>
                </tr>
                <tr>
                  <td className="rk">02</td>
                  <td>sample_trader_b</td>
                  <td>
                    <span className="pill pill-ember">Elite</span>
                  </td>
                  <td className="num">31</td>
                  <td className="num">8,775</td>
                </tr>
                <tr>
                  <td className="rk">03</td>
                  <td>sample_trader_c</td>
                  <td>
                    <span className="pill pill-steel">Platinum</span>
                  </td>
                  <td className="num">29</td>
                  <td className="num">7,310</td>
                </tr>
                <tr>
                  <td className="rk">04</td>
                  <td>sample_trader_d</td>
                  <td>
                    <span className="pill pill-steel">Platinum</span>
                  </td>
                  <td className="num">26</td>
                  <td className="num">6,140</td>
                </tr>
                <tr>
                  <td className="rk">05</td>
                  <td>sample_trader_e</td>
                  <td>
                    <span className="pill pill-gold">Gold</span>
                  </td>
                  <td className="num">22</td>
                  <td className="num">3,890</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="alt" id="rules">
        <div className="col pad">
          <div className="head">
            <p className="kick">Rules of engagement</p>
            <h2>
              Fair fight, <span className="gt">every battle</span>
            </h2>
            <p>The full rulebook is accepted at sign-up. These are the ones that shape how you trade.</p>
          </div>
          <div className="rules">
            <div className="rl">
              <b>Ranked on % net return</b>
              <span>Measured on your closing balance when the window shuts.</span>
            </div>
            <div className="rl">
              <b>Minimum 5 closed trades</b>
              <span>Finish with fewer and you are listed unranked, whatever the balance.</span>
            </div>
            <div className="rl">
              <b>Maximum 30% drawdown</b>
              <span>Breach it and the account is disabled for that event, live on the board.</span>
            </div>
            <div className="rl">
              <b>No bots, no copy trading</b>
              <span>Expert Advisors, scripts and signal services are grounds for disqualification.</span>
            </div>
            <div className="rl">
              <b>5 lots per position, 10 total</b>
              <span>Position caps stop one oversized trade from deciding an event.</span>
            </div>
            <div className="rl">
              <b>60-second minimum hold</b>
              <span>Anything closed faster is excluded from scoring.</span>
            </div>
            <div className="rl">
              <b>Nine instruments</b>
              <span>Seven major pairs, XAU/USD and BTC/USD. Nothing else.</span>
            </div>
            <div className="rl">
              <b>One account per person</b>
              <span>Verified at sign-up. Duplicate accounts void every result on both.</span>
            </div>
          </div>
        </div>
      </section>

      <section id="join">
        <div className="mid pad">
          <div className="head">
            <p className="kick">Join the fight</p>
            <h2>
              Enter your first <span className="gt">battle</span>
            </h2>
            <p>Free to join. Your first Daily Battle starts the next trading day after you confirm your email.</p>
          </div>
          <div className="card">
            <JoinForm />
          </div>
        </div>
      </section>

      <section className="alt" id="faq">
        <div className="mid pad">
          <div className="head">
            <p className="kick">Questions</p>
            <h2>
              Before you <span className="gt">enter</span>
            </h2>
          </div>
          <details>
            <summary>Is any of my own money at risk?</summary>
            <p>
              No. Every event runs on a simulated account with virtual capital on live market pricing. Daily Battles are free; paid formats
              charge an entry fee and nothing else. You never deposit trading capital.
            </p>
          </details>
          <details>
            <summary>How do points work?</summary>
            <p>
              Every ranked finish earns points, scaled by the format and the size of the field. Points accumulate across the season and set
              your tier. Tiers unlock the higher formats, and the season&apos;s Elite tier is seeded into the World Championship.
            </p>
          </details>
          <details>
            <summary>Can I use an Expert Advisor?</summary>
            <p>
              No. Automated trading, copy trading and signal services are prohibited in every format and void your results. Trade logs for
              every ranked finish are checked.
            </p>
          </details>
          <details>
            <summary>What happens if I disconnect mid-event?</summary>
            <p>
              Your positions stay open and the clock keeps running. Reconnect and carry on. An individual disconnection does not pause or
              restart an event, so set stop losses on every position.
            </p>
          </details>
          <details>
            <summary>How do I reach the World Championship?</summary>
            <p>
              Two routes: finish in the top 50 of any Circuit Championship, or end the season in the Elite tier. Both earn a seat in the
              100-trader field, played in person over 24 hours.
            </p>
          </details>
          <details>
            <summary>When are prizes paid?</summary>
            <p>
              Cash prizes are paid within 14 days of the event closing, after the top finishers&apos; trade logs are audited. Winners
              complete identity verification before payout.
            </p>
          </details>
        </div>
      </section>
    </>
  );
}
