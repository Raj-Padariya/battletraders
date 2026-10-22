"use client";

/* Prints a piece of the Goa schedule in India time. The static HTML carries the default schedule; on mount it switches
   to the start an admin saved (goaSchedule), so every date/time on the site follows the admin page. */
import { useEffect, useState } from "react";
import { GOA_DEFAULT_SCHEDULE, goaSchedule, istDate, istDay, istTime, type GoaSchedule } from "@panel/lib/data/goa";

export type GoaTimeFormat =
  | "startDate"   // 23 Nov 2026
  | "startDay"    // 23 Nov
  | "startTime"   // 17:00
  | "endDate"     // 24 Nov 2026
  | "endDay"      // 24 Nov
  | "endTime"     // 17:00
  | "range";      // 23 Nov 17:00 – 24 Nov 17:00 IST

const render = (s: GoaSchedule, format: GoaTimeFormat): string => {
  switch (format) {
    case "startDate": return istDate(s.startsAt);
    case "startDay": return istDay(s.startsAt);
    case "startTime": return istTime(s.startsAt);
    case "endDate": return istDate(s.endsAt);
    case "endDay": return istDay(s.endsAt);
    case "endTime": return istTime(s.endsAt);
    case "range": return `${istDay(s.startsAt)} ${istTime(s.startsAt)} – ${istDay(s.endsAt)} ${istTime(s.endsAt)} IST`;
  }
};

export function useGoaSchedule(): GoaSchedule {
  const [schedule, setSchedule] = useState(GOA_DEFAULT_SCHEDULE);
  useEffect(() => setSchedule(goaSchedule()), []);
  return schedule;
}

export default function GoaTime({ format }: { format: GoaTimeFormat }) {
  return <>{render(useGoaSchedule(), format)}</>;
}

const istPart = (iso: string, options: Intl.DateTimeFormatOptions): string =>
  new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", ...options });

/** The "Nov / 23 / 2026" calendar tile on the home page ticket. */
export function GoaDateTile() {
  const { startsAt } = useGoaSchedule();
  return (
    <div className="goa-date" aria-label={istPart(startsAt, { day: "numeric", month: "long", year: "numeric" })}>
      <small>{istPart(startsAt, { month: "short" })}</small>
      <b>{istPart(startsAt, { day: "numeric" })}</b>
      <small>{istPart(startsAt, { year: "numeric" })}</small>
    </div>
  );
}
