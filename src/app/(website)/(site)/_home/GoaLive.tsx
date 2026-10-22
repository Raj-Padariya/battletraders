"use client";

/* Live strip on the home Goa ticket: ticking countdown to the start and the seats-filled bar.
   Both read the browser (clock + stored passes), so they render placeholders on the server and fill in on mount. */
import { useEffect, useState } from "react";
import { GOA_SEATS, GOA_SEATS_DEMO_TAKEN, GOA_STARTS_AT } from "@panel/lib/data/goa";
import { goaSeatsTaken } from "@panel/lib/pass";

const pad = (n: number) => String(n).padStart(2, "0");

export default function GoaLive() {
  const [now, setNow] = useState(0);
  const [taken, setTaken] = useState(GOA_SEATS_DEMO_TAKEN);

  useEffect(() => {
    setNow(Date.now());
    setTaken(goaSeatsTaken());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const left = Math.max(0, new Date(GOA_STARTS_AT).getTime() - now);
  const units: [string, number][] = [
    ["Days", Math.floor(left / 86400000)],
    ["Hrs", Math.floor((left % 86400000) / 3600000)],
    ["Min", Math.floor((left % 3600000) / 60000)],
    ["Sec", Math.floor((left % 60000) / 1000)],
  ];
  const fill = Math.round((taken / GOA_SEATS) * 100);

  return (
    <div className="goa-live">
      <div className="goa-live-clock" role="timer" aria-label="Time until the Goa Live Final starts">
        <span className="goa-live-label"><i aria-hidden="true" />Starts in</span>
        <div className="goa-live-units">
          {units.map(([label, value]) => (
            <span key={label}><b>{now ? pad(value) : "--"}</b><small>{label}</small></span>
          ))}
        </div>
      </div>
      <div className="goa-live-seats">
        <div><span>Seats filled</span><b>{taken} / {GOA_SEATS}</b></div>
        <span className="goa-live-bar" aria-hidden="true"><i style={{ width: fill + "%" }} /></span>
        <small>{taken >= GOA_SEATS ? "Sold out" : `${GOA_SEATS - taken} seats left`}</small>
      </div>
    </div>
  );
}
