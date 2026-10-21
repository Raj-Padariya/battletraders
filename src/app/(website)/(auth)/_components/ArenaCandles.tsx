"use client";

import { useEffect, useState } from "react";

interface Candle {
  up: boolean;
  bottom: string;
  height: string;
  delay: string;
}

// Arena backdrop candles — random walk, so built after mount to keep the server HTML deterministic.
export default function ArenaCandles() {
  const [candles, setCandles] = useState<Candle[]>([]);

  useEffect(() => {
    let price = 50;
    const built: Candle[] = [];
    for (let c = 0; c < 22; c++) {
      const open = price;
      price = Math.max(12, Math.min(84, price + (Math.random() - 0.46) * 16));
      built.push({
        up: price >= open,
        bottom: Math.min(open, price).toFixed(1) + "%",
        height: Math.max(3, Math.abs(price - open)).toFixed(1) + "%",
        delay: (c * 0.18).toFixed(2) + "s",
      });
    }
    setCandles(built);
  }, []);

  return (
    <div className="ax-candles">
      {candles.map((candle, i) => (
        <i
          key={i}
          className={candle.up ? "up" : "dn"}
          style={{ "--b": candle.bottom, "--h": candle.height, "--d": candle.delay } as React.CSSProperties}
        ></i>
      ))}
    </div>
  );
}
