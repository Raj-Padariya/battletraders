import "@panel/styles/my-tournaments.css";
import PanelShell from "@panel/components/PanelShell";
import MyTournaments from "./MyTournaments";
import WithdrawDialog from "./WithdrawDialog";

export const metadata = { title: "My tournaments" };

export default function MyTournamentsPage() {
  return (
    <PanelShell current="my-tournaments" crumb="My tournaments" after={<WithdrawDialog />}>
      <MyTournaments />
    </PanelShell>
  );
}
