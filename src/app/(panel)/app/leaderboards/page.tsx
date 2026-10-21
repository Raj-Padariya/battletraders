import "@panel/styles/leaderboards.css";
import type { Metadata } from "next";
import { Suspense } from "react";
import PanelShell from "@panel/components/PanelShell";
import LeaderboardsView from "./LeaderboardsView";

export const metadata: Metadata = {
  title: "Leaderboards",
  description: "Live tournament standings and past battle results on BattleTrader.",
};

export default function LeaderboardsPage() {
  return (
    <PanelShell current="leaderboards" crumb="Leaderboards">
      <Suspense fallback={null}>
        <LeaderboardsView />
      </Suspense>
    </PanelShell>
  );
}
