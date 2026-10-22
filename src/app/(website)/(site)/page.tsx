import type { Metadata } from "next";
import Link from "next/link";
import { GOA_ENTRY_FEE, GOA_PRIZE_POOL, GOA_PRIZES, GOA_SEATS, GOA_WINNERS, usd } from "@panel/lib/data/goa";
import GoaTime, { GoaDateTile } from "@site/components/GoaTime";

import JoinForm from "./_home/JoinForm";
import GoaLive from "./_home/GoaLive";

export const metadata: Metadata = {
  title: "BattleTrader — Simulated Trading Tournaments",
  description:
    "Simulated trading tournaments on live market data. Free daily battles, paid events with cash prizes, and one world championship a year.",
};

export default function HomePage() {
  return (
    <>
      <header className="hero">
        <div className="col pad hero-in hero-center">
          <div className="hero-copy">
            <span className="tag">
              <i aria-hidden="true"></i>Season 1 · Arena open
            </span>
            <h1>
              Same market.
              <br />
              Same clock.
              <br />
              <span>One winner.</span>
            </h1>
            <p>
              Every entrant starts on an <strong>identical balance</strong>, with the same instruments and the same leverage. The board is live
              from the first tick to the last. The only variable in the room is how you trade.
            </p>
            <div className="hero-btns">
              <a className="btn b-ember" href="#join">
                Enter the arena →
              </a>
              <Link className="btn b-line" href="/tournaments/">
                See the formats
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section id="goa" className="goa-sec" aria-labelledby="goa-home-title">
        <div className="col pad">
          <div className="goa-sec-head">
            <p className="kick">Live event</p>
            <h2 id="goa-home-title">Trade the beach. <span className="goa-sun">Win in Goa.</span></h2>
            <p>One room, one clock, twenty-four hours. Hotel on us for every pass holder.</p>
          </div>

          <article className="goa-ticket">
            <div className="goa-ticket-art">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/img/goa-trading-floor.jpg" alt="Traders at rows of laptops on a lit-up Goa beach at dusk" loading="lazy" />
              <GoaDateTile />
              <p className="goa-place">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /></svg>
                Goa, India &middot; <GoaTime format="startTime" /> IST
              </p>
            </div>

            <span className="goa-perf" aria-hidden="true" />

            <div className="goa-ticket-stub">
              <p className="goa-stub-kick">BattleTrader &middot; Live Final 2026</p>
              <p className="goa-pool"><b>{usd(GOA_PRIZE_POOL)}</b><span>prize pool &middot; top {GOA_WINNERS} paid</span></p>

              <div className="goa-entry">
                <div>
                  <small>Entry fee</small>
                  <b>{usd(GOA_ENTRY_FEE)}</b>
                </div>
                <ul aria-label="Included">
                  <li className="is-ok">Hotel included</li>
                  <li>24 hours live</li>
                </ul>
              </div>

              <GoaLive />

              <Link className="goa-cta" href="/mini-tournaments/trick-or-trade-2026/">
                Register now
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section id="formats" className="tf-sec">
        <div className="col pad">
          <div className="tf-head">
            <div>
              <p className="kick">The tournament</p>
              <h2>
                Trade the field. <span className="gt">Fight to the final.</span>
              </h2>
            </div>
            <p>
              One room in Goa, one clock, one leaderboard. Everyone starts with the same $10,000 balance &mdash; the highest balance after
              24 hours takes {usd(GOA_PRIZES[0])}.
            </p>
          </div>

          <dl className="tf-numbers">
            <div className="is-hero"><dt>Prize pool</dt><dd>{usd(GOA_PRIZE_POOL)}</dd><small>Top {GOA_WINNERS} paid</small></div>
            <div><dt>Entry</dt><dd>{usd(GOA_ENTRY_FEE)}</dd><small>Hotel included</small></div>
            <div><dt>Seats</dt><dd>{GOA_SEATS}</dd><small>One per email</small></div>
            <div><dt>Session</dt><dd>24h</dd><small>Non-stop, live</small></div>
          </dl>

          <div className="tf-body">
            <ol className="tf-day" aria-label="Event day">
              {[
                ["22 Nov · 18:00", "Registration closes", "Last chance to lock a seat."],
                ["23 Nov · 10:00", "Opening bell", "Every trader starts on $10,000 at 1:100."],
                ["24 Nov · 10:00", "Final bell", "The board locks. No more trades."],
                ["24 Nov · on the floor", "Winners crowned", `${usd(GOA_PRIZE_POOL)} paid to the top ${GOA_WINNERS}.`],
              ].map(([when, title, text]) => (
                <li key={title}>
                  <time>{when}</time>
                  <b>{title}</b>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
            <figure className="tf-art">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/img/td-hero.svg" alt="" width={1600} height={700} loading="lazy" />
              <figcaption>
                <span className="tf-live"><i aria-hidden="true" />Live leaderboard</span>
                <span>Every trade, ranked in real time</span>
              </figcaption>
            </figure>
          </div>

          <div className="tf-cta">
            <Link className="btn b-ember" href="/mini-tournaments/trick-or-trade-2026/">Register for Goa</Link>
            <span>{usd(GOA_ENTRY_FEE)} entry &middot; {GOA_SEATS} seats &middot; 23 Nov 2026</span>
          </div>
        </div>
      </section>


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

      <section id="rules">
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
