"use client";

import { useEffect, useState } from "react";

type Market = readonly [symbol: string, open: number, decimals: number];

// Illustrative prices, drifted client-side (same list and maths as the old app ticker.js).
const MARKETS: readonly Market[] = [
  ["EUR/USD", 1.0842, 4], ["GBP/USD", 1.2715, 4], ["USD/JPY", 149.32, 2],
  ["AUD/USD", 0.6583, 4], ["USD/CAD", 1.3641, 4], ["USD/CHF", 0.8812, 4],
  ["NZD/USD", 0.6047, 4], ["XAU/USD", 2387.4, 1], ["BTC/USD", 67250, 0],
];

export default function Ticker() {
  // First render must match the server: open prices and +0.00%.
  const [prices, setPrices] = useState<number[]>(() => MARKETS.map((m) => m[1]));

  useEffect(() => {
    const drift = () =>
      setPrices((current) => current.map((p) => p * (1 + (Math.random() - 0.5) * 0.0012)));
    drift();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(drift, 2000);
    return () => window.clearInterval(timer);
  }, []);

  const items = MARKETS.map(([symbol, open, decimals], i) => {
    const change = (prices[i] / open - 1) * 100;
    return { symbol, price: prices[i].toFixed(decimals), change, label: (change >= 0 ? "+" : "") + change.toFixed(2) + "%" };
  });

  return (
    <div className="ticker" aria-hidden="true">
      <span className="ticker-tag"><i></i>Live markets</span>
      <div className="ticker-track">
        {[0, 1].map((copy) =>
          items.map((m) => (
            <span className="ticker-item" data-sym={m.symbol} key={`${copy}-${m.symbol}`}>
              <b>{m.symbol}</b>
              <span>{m.price}</span>
              <span className={m.change >= 0 ? "up" : "dn"}>{m.label}</span>
            </span>
          )),
        )}
      </div>
    </div>
  );
}
