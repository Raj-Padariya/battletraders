import "@panel/styles/alliances.css";
import type { Metadata } from "next";
import AlliancesView from "./AlliancesList";

export const metadata: Metadata = {
  title: "Alliances",
  description: "Search, join or create a BattleTrader alliance and compete as a team.",
};

export default function AlliancesPage() {
  return <AlliancesView />;
}
