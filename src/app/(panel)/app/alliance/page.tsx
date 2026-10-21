import "@panel/styles/alliances.css";
import type { Metadata } from "next";
import { Suspense } from "react";
import PanelShell from "@panel/components/PanelShell";
import AllianceDetail from "./AllianceDetail";
import AllianceTour from "./AllianceTour";

export const metadata: Metadata = {
  title: "Alliance",
  description: "Alliance banner, team stats and roster.",
};

export default function AlliancePage() {
  return (
    <PanelShell current="alliances" crumb="Alliance" after={<AllianceTour />}>
      <Suspense fallback={null}>
        <AllianceDetail />
      </Suspense>
    </PanelShell>
  );
}
