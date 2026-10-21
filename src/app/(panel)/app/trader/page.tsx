import "@panel/styles/trader.css";
import type { Metadata } from "next";
import { Suspense } from "react";
import PanelShell from "@panel/components/PanelShell";
import TraderRecordView from "./TraderRecord";

export const metadata: Metadata = {
  title: "Trader record",
  description: "Public trader record: tournaments, victories, podiums, style and recent placements.",
};

export default function TraderPage() {
  return (
    <PanelShell current="profile" crumb="Trader record">
      <Suspense fallback={null}>
        <TraderRecordView />
      </Suspense>
    </PanelShell>
  );
}
