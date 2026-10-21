import type { Metadata } from "next";
import { Suspense } from "react";
import TraderProfile, { TraderProfileFallback } from "./TraderProfile";

export const metadata: Metadata = {
  title: "Trader profile — BattleTrader",
  description: "Member record for a BattleTrader competitor: tournaments, victories, podiums, win rate and recent placements.",
};

export default function ProfilePage() {
  return (
    <Suspense fallback={<TraderProfileFallback />}>
      <TraderProfile />
    </Suspense>
  );
}
