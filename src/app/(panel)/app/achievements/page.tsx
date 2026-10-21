import "@panel/styles/achievements.css";
import PanelShell from "@panel/components/PanelShell";
import AchievementsBody from "./AchievementsBody";

export const metadata = {
  title: "Achievements",
  description: "Track your BattleTrader trading milestones: unlock achievements, earn XP and credits.",
};

export default function AchievementsPage() {
  return (
    <PanelShell current="achievements" crumb="Achievements">
      <AchievementsBody />
    </PanelShell>
  );
}
