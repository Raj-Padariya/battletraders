"use client";

import { useEffect, useState } from "react";

type Props = {
  startsAt: string;
  // Registration-open moment used as the 0% point of the progress bar.
  opensAt: string;
};

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function split(ms: number): Parts {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

const pad = (value: number) => String(value).padStart(2, "0");

export default function Countdown({ startsAt, opensAt }: Props) {
  const start = new Date(startsAt).getTime();
  const open = new Date(opensAt).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const isLive = now !== null && now >= start;
  const parts = now === null ? null : split(start - now);
  const progress = now === null ? 0 : Math.min(100, Math.max(0, ((now - open) / (start - open)) * 100));

  // Placeholders on the server so the static HTML never carries a stale countdown.
  const units = [
    { label: "Days", value: parts ? pad(parts.days) : "--" },
    { label: "Hours", value: parts ? pad(parts.hours) : "--" },
    { label: "Mins", value: parts ? pad(parts.minutes) : "--" },
    { label: "Secs", value: parts ? pad(parts.seconds) : "--" },
  ];

  return (
    <div className={`td-clock${isLive ? " is-live" : ""}`}>
      <p className="td-clock-label">
        <span className="td-clock-dot" />
        {isLive ? "Tournament is live" : "Starts in"}
      </p>
      {!isLive && (
        <div className="td-clock-units" role="timer" aria-live="off">
          {units.map((unit) => (
            <div key={unit.label} className="td-clock-unit">
              <b>{unit.value}</b>
              <small>{unit.label}</small>
            </div>
          ))}
        </div>
      )}
      <div className="td-clock-bar" aria-hidden="true"><span style={{ width: `${isLive ? 100 : progress}%` }} /></div>
    </div>
  );
}
