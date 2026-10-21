import PanelShell from "@panel/components/PanelShell";
import DashboardBody from "./DashboardBody";
import DashboardTour from "./DashboardTour";

export const metadata = {
  title: "My dashboard",
  description: "Your BattleTrader home base: battles, quests, balance, badges and season stats.",
};

export default function DashboardPage() {
  return (
    <PanelShell current="dashboard" crumb="Overview" skipLabel="Skip to dashboard" ctaId="tour-compete" after={<DashboardTour />}>
      <DashboardBody />
    </PanelShell>
  );
}
