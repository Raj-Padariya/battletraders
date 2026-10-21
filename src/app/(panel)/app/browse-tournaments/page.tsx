import "@panel/styles/tournaments.css";
import PanelShell from "@panel/components/PanelShell";
import EnrollDialog from "./_shared/EnrollDialog";
import Browse from "./Browse";

export const metadata = {
  title: "Browse tournaments",
  description: "Browse and join BattleTrader trading competitions: Main events, Circuit qualifiers and Mini battles.",
};

export default function BrowseTournamentsPage() {
  return (
    <PanelShell current="browse-tournaments" crumb="Browse tournaments" after={<EnrollDialog />}>
      <Browse />
    </PanelShell>
  );
}
