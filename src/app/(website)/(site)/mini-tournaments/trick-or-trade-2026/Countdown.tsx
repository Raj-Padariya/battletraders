"use client";

import { useEffect, useState } from "react";

function remaining(target: number, now: number): string {
  const diff = target - now;
  if (diff <= 0) return "Live now";
  const minutes = Math.floor(diff / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  return `Starts in ${days}d ${hours}h ${minutes % 60}m`;
}

export default function Countdown({ startsAt }: { startsAt: string }) {
  const target = new Date(startsAt).getTime();
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setLabel(remaining(target, Date.now()));
    tick();
    const timer = window.setInterval(tick, 30000);
    return () => window.clearInterval(timer);
  }, [target]);

  // Rendered empty on the server so the static HTML never carries a stale countdown.
  return <span className="td-countdown">{label ?? "\u00a0"}</span>;
}
