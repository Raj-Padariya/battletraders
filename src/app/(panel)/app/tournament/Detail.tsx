"use client";

// #tn-detail-root — port of the Details half of the old tournaments.js. Reads ?id after mount.
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { BTTournaments, statusOf, type Round, type Tournament } from "@panel/lib/data/tournaments";
import { usePanel } from "@panel/lib/panel";
import { money } from "@panel/lib/storage";
import { STATUS_LABEL, addTx, entryState, entryText, flagOf, fmtDateTime, fmtShort, fmtTime, ordinal, round2, type PathName } from "../browse-tournaments/_shared/format";
import { CdChip, Ico, OrgLogo, Poster, RegPill, StatusChip, TypeChip } from "../browse-tournaments/_shared/pieces";
import { useTournaments } from "../browse-tournaments/_shared/useTournaments";

function InfoRow({ icon, label, children }: { icon: PathName; label: string; children: React.ReactNode }) {
  return (
    <div>
      <Ico name={icon} />
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function roundStatus(r: Round, now: number) {
  if (now >= new Date(r.end).getTime()) return "completed" as const;
  if (now >= new Date(r.start).getTime()) return "live" as const;
  return "upcoming" as const;
}

const NotFound = () => (
  <section className="ac tn-nf" aria-labelledby="tn-nf-h">
    <span className="tn-empty-ico" aria-hidden="true"><Ico name="alert" /></span>
    <h1 id="tn-nf-h">Tournament not found</h1>
    <p>This battle doesn&apos;t exist or has left the arena. Pick another one from the tournament list.</p>
    <Link className="tn-btn tn-btn-grad" href="/app/browse-tournaments/"><Ico name="back" />Back to tournaments</Link>
  </section>
);

export default function Detail() {
  const params = useSearchParams();
  const id = params.get("id");
  const { snap, tick, reload } = useTournaments();
  const { wallet, setWallet, toast } = usePanel();
  const mountRef = useRef<HTMLDivElement>(null);
  const refocus = useRef(false);
  const now = snap.at;
  const t: Tournament | null = snap.loaded && id ? snap.list.find((x) => x.id === id) || null : null;

  useEffect(() => {
    if (!snap.loaded) return;
    document.title = (t ? t.name : "Tournament not found") + " \u2014 BattleTrader";
  }, [snap.loaded, t]);

  useEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    const again = mountRef.current?.querySelector<HTMLElement>("[data-enroll]");
    if (again) again.focus();
  }, [snap]);

  const withdraw = (tour: Tournament) => {
    const record = BTTournaments.enrollments()[tour.id];
    const amount = (record && record.amount) || 0;
    BTTournaments.withdraw(tour.id);
    if (amount > 0) {
      const toCredits = record.paidWith === "credits";
      setWallet({
        balance: toCredits ? wallet.balance : round2(wallet.balance + amount),
        credits: toCredits ? round2(wallet.credits + amount) : wallet.credits,
        tickets: wallet.tickets,
      });
      addTx("refund", amount, "Refund: " + tour.name);
    }
    refocus.current = true;
    reload();
    toast("Withdrawn", "You left " + tour.name + (amount > 0 ? ". " + money(amount) + " refunded." : "."));
  };

  let body: React.ReactNode = null;
  if (snap.loaded && !t) body = <NotFound />;
  if (t) {
    const state = entryState(t, now, snap.enrolled);
    const seatsLeft = Math.max(0, t.maxParticipants - t.participants);
    const copy = {
      open: ["Ready to battle?", "Entry " + entryText(t) + " \u00b7 " + seatsLeft + " seat" + (seatsLeft === 1 ? "" : "s") + " left"],
      enrolled: ["You're enrolled", "Your seat is locked in. Track it from My tournaments."],
      live: ["Battle in progress", "Registration closed when the battle went live."],
      full: ["This battle is full", "All " + t.maxParticipants + " seats are taken."],
      closed: ["Registration closed", "Entries for this battle are no longer accepted."],
      completed: ["Battle over", "Final standings are on the leaderboards."],
    }[state];
    const pct = Math.min(100, Math.round((t.participants / t.maxParticipants) * 100));
    const flag = flagOf(t.countryCode);

    let cta: React.ReactNode;
    if (state === "open") {
      cta = (
        <>
          <button className="tn-btn tn-btn-grad tn-big" type="button" data-enroll={t.id} data-area="detail"><Ico name="bolt" />Enroll now</button>
          <RegPill t={t} now={now} />
        </>
      );
    } else if (state === "enrolled") {
      cta = (
        <>
          <span className="tn-btn tn-btn-done tn-big"><Ico name="check" />You&apos;re enrolled</span>
          {statusOf(t, now) === "registering" ? <button className="tn-link" type="button" onClick={() => withdraw(t)}>Withdraw</button> : null}
        </>
      );
    } else if (state === "completed") {
      cta = <Link className="tn-btn tn-btn-line tn-big" href="/app/leaderboards/"><Ico name="chart" />View results</Link>;
    } else {
      cta = (
        <>
          <button className="tn-btn tn-btn-off tn-big" type="button" disabled>{{ live: "Live now", full: "Full", closed: "Closed" }[state]}</button>
          <RegPill t={t} now={now} />
        </>
      );
    }

    body = (
      <>
        <section className={"ah tn-dhead tn-t-" + t.type} aria-labelledby="tn-d-name">
          <span className="tn-hero-ico" aria-hidden="true"><Ico name="trophy" /></span>
          <div className="tn-dhead-txt">
            <div className="tn-chips"><TypeChip t={t} /><StatusChip t={t} now={now} /></div>
            <h1 id="tn-d-name">{t.name}</h1>
            <p className="tn-dhead-tag">{t.tagline}</p>
          </div>
          <div className="tn-dhead-side">
            <CdChip t={t} now={tick} />
            <div className="tn-dhead-nums">
              <div className="m-prize"><span>Prize pool</span><b>{money(t.prizePool)}</b></div>
              <div><span>Entry</span><b>{entryText(t)}</b></div>
            </div>
          </div>
        </section>

        <section className="ac tn-sponsors" aria-label="Organizer and sponsors">
          <span>Organized by</span>
          <OrgLogo name={t.organizer} />
          {t.sponsors.length ? <span>Sponsored by</span> : null}
          {t.sponsors.map((s, i) => <OrgLogo key={s + i} name={s} />)}
        </section>

        <div className="tn-dgrid">
          <div className="tn-dposter"><Poster t={t} /></div>
          <section className="ac tn-dinfo" aria-labelledby="tn-d-info-h">
            <div className="ac-h"><h2 id="tn-d-info-h"><Ico name="layers" />Tournament details</h2></div>
            <dl className="tn-rows">
              <InfoRow icon="calendar" label="Start date">{fmtDateTime(t.start)}</InfoRow>
              <InfoRow icon="flag" label="End date">{fmtDateTime(t.end)}</InfoRow>
              <InfoRow icon="lock" label="Registration closes">{fmtDateTime(t.registrationCloses)}</InfoRow>
              <InfoRow icon="users" label="Participants">
                {t.participants + " / " + t.maxParticipants + " (" + pct + "% full)"}
                <span className="tn-fill" aria-hidden="true"><i style={{ width: pct + "%" }} /></span>
              </InfoRow>
              <InfoRow icon={t.online ? "globe" : "pin"} label="Location">{t.online ? "Online" : (flag ? flag + " " : "") + t.location}</InfoRow>
              <InfoRow icon="swords" label="Structure">{t.structure}</InfoRow>
              <InfoRow icon="star" label="Rounds">{t.rounds.length + (t.rounds.length === 1 ? " round" : " rounds")}</InfoRow>
            </dl>
            <p className="tn-instr"><b>Available instruments</b>{t.instruments}</p>
            <div className="tn-tiles">
              <div className="tn-tile m-prize"><span>Prize pool</span><b>{money(t.prizePool)}</b></div>
              <div className="tn-tile m-fee"><span>Entry fee</span><b>{entryText(t)}</b></div>
            </div>
          </section>
          <section className="ac tn-denroll" id="tn-enroll-status" tabIndex={-1} aria-label="Enrollment">
            <div className="tn-enroll-box">
              <p><b>{copy[0]}</b><span>{copy[1]}</span></p>
              <div className="tn-enroll-cta">{cta}</div>
            </div>
          </section>

          <section className="ac tn-dprizes" aria-labelledby="tn-d-prize-h" style={{ "--glow": "#FFC433" } as React.CSSProperties}>
            <div className="ac-h"><h2 id="tn-d-prize-h"><Ico name="trophy" />Prize distribution</h2></div>
            <ol className="tn-prize-list">
              {t.prizes.map((amount, i) => (
                <li key={i} className={i < 3 ? "p" + (i + 1) : undefined}>
                  <span className="tn-rk" aria-hidden="true">{String(i + 1)}</span>
                  <span>{ordinal(i + 1) + " place"}</span>
                  <b>{money(amount)}</b>
                </li>
              ))}
            </ol>
            {t.bonus.length ? <h3 className="tn-bonus-h">Bonus prizes</h3> : null}
            {t.bonus.length ? (
              <ul className="tn-bonus">
                {t.bonus.map((b, i) => (
                  <li key={b.name + i}><span><b>{b.name}</b><small>{b.note}</small></span><b>{money(b.amount)}</b></li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="ac tn-drounds" aria-labelledby="tn-d-round-h" style={{ "--glow": "#33CCFF" } as React.CSSProperties}>
            <div className="ac-h"><h2 id="tn-d-round-h"><Ico name="swords" />Tournament rounds</h2></div>
            <ol className="tn-round-list">
              {t.rounds.map((r, i) => {
                const rs = roundStatus(r, now);
                return (
                  <li key={r.name + i} className={"tn-round" + (r.final ? " is-final" : "")}>
                    <div className="tn-round-h">
                      <b>{r.final ? <Ico name="crown" /> : null}{r.name}</b>
                      <span className={"tn-chip tn-st s-" + rs}><i aria-hidden="true" />{STATUS_LABEL[rs]}</span>
                    </div>
                    <dl>
                      <div><dt>Start</dt><dd>{fmtShort(r.start) + ", " + fmtTime(r.start)}</dd></div>
                      <div><dt>End</dt><dd>{fmtShort(r.end) + ", " + fmtTime(r.end)}</dd></div>
                      {r.winners ? (
                        <div><dt>Top winners</dt><dd>{String(r.winners)}</dd></div>
                      ) : (
                        <div><dt>Top advance</dt><dd>{String(r.advance)}</dd></div>
                      )}
                    </dl>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </>
    );
  }

  return (
    <div className="tn-page" id="tn-detail">
      <Link className="tn-back" href="/app/browse-tournaments/"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>Back to tournaments</Link>
      <div id="tn-detail-root" aria-live="polite" ref={mountRef}>{body}</div>
    </div>
  );
}
