// Markup pieces the old tournaments.js built with h(): chips, poster, byline, action buttons.
// Pure (no hooks): callers pass `now` and the enrollments snapshot so render never reads the clock or storage.
import Link from "next/link";
import { Svg } from "@panel/components/Icon";
import { BTTournaments, statusOf, type Enrollment, type Tournament } from "@panel/lib/data/tournaments";
import { money } from "@panel/lib/storage";
import { PATHS, STATUS_LABEL, TYPE_SHORT, cdText, detailUrl, entryState, fmtDate, fmtDateTime, type PathName } from "./format";

export const Ico = ({ name }: { name: PathName }) => <Svg body={PATHS[name]} />;

export const TypeChip = ({ t }: { t: Tournament }) => <span className="tn-chip tn-type">{TYPE_SHORT[t.type] || t.type}</span>;

export function StatusChip({ t, now }: { t: Tournament; now: number }) {
  const status = statusOf(t, now);
  return (
    <span className={"tn-chip tn-st s-" + status}>
      <i aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export const CdChip = ({ t, now }: { t: Tournament; now: number }) => (
  <span className="tn-chip tn-cd" data-cd={t.id}>
    <Ico name="clock" />
    <span>{cdText(t, now)}</span>
  </span>
);

export function RegPill({ t, now }: { t: Tournament; now: number }) {
  if (statusOf(t, now) === "registering") {
    return (
      <p className="tn-pill-ok">
        <Ico name="checkCircle" />
        <span>{"Registration closes " + fmtDateTime(t.registrationCloses)}</span>
      </p>
    );
  }
  return (
    <p className="tn-pill-ok is-closed">
      <Ico name="lock" />
      <span>Registration closed</span>
    </p>
  );
}

export const OrgLogo = ({ name }: { name: string }) => (
  <span className="tn-logo">
    <b>{name}</b>
  </span>
);

export const Byline = ({ t }: { t: Tournament }) => (
  <div className="tn-byline">
    <div>
      <span>Organizer</span>
      <div className="tn-org">
        <OrgLogo name={t.organizer} />
      </div>
    </div>
    {t.sponsors.length ? (
      <div>
        <span>{t.sponsors.length > 1 ? "Sponsors" : "Sponsor"}</span>
        <div className="tn-org">
          {t.sponsors.map((s, i) => (
            <OrgLogo key={s + i} name={s} />
          ))}
        </div>
      </div>
    ) : null}
  </div>
);

export const Poster = ({ t }: { t: Tournament }) => (
  <div
    className={"tn-poster tn-t-" + t.type}
    role="img"
    aria-label={t.name + " poster: " + money(t.prizePool) + " prize pool, " + fmtDate(t.start)}
  >
    <div className="tn-poster-top">
      <span className="tn-poster-brand">BattleTrader</span>
      <span className="tn-poster-type">{BTTournaments.typeLabel(t.type)}</span>
    </div>
    <p className="tn-poster-name">{t.name}</p>
    <div className="tn-poster-prize">
      <span>Prize pool</span>
      <b>{money(t.prizePool)}</b>
    </div>
    <span className="tn-poster-date">
      <Ico name="calendar" />
      {fmtDate(t.start)}
    </span>
  </div>
);

export const ViewBtn = ({ t, area }: { t: Tournament; area: string }) => (
  <Link className="tn-btn tn-btn-line tn-view" href={detailUrl(t)} data-fk={area + ":" + t.id}>
    View details
  </Link>
);

export function ActionBtn({ t, area, now, enrolled }: { t: Tournament; area: string; now: number; enrolled: Record<string, Enrollment> }) {
  const state = entryState(t, now, enrolled);
  if (state === "completed") {
    return (
      <Link className="tn-btn tn-btn-line" href="/app/leaderboards/">
        <Ico name="chart" />
        View results
      </Link>
    );
  }
  if (state === "enrolled") {
    return (
      <span className="tn-btn tn-btn-done" data-enrolled={t.id}>
        <Ico name="check" />
        Enrolled
      </span>
    );
  }
  if (state === "open") {
    return (
      <button className="tn-btn tn-btn-grad" type="button" data-enroll={t.id} data-area={area}>
        <Ico name="bolt" />
        Enroll now
      </button>
    );
  }
  const label = { live: "Live now", full: "Full", closed: "Closed" }[state];
  return (
    <button className="tn-btn tn-btn-off" type="button" disabled>
      {label}
    </button>
  );
}
