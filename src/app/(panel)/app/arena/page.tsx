import "@panel/styles/arena.css";
import PanelShell from "@panel/components/PanelShell";
import ArenaTerminal from "./ArenaTerminal";

export const metadata = {
  title: "Personal arena",
  description: "Your BattleTrader Play practice arena: $100,000 virtual balance, 1:200 leverage and simulated live prices.",
};

export default function ArenaPage() {
  return (
    <PanelShell current="arena" crumb="Personal arena">
      <ArenaTerminal />
    </PanelShell>
  );
}
