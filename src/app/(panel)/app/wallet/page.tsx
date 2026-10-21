import "@panel/styles/wallet.css";
import PanelShell from "@panel/components/PanelShell";
import TopupDialog from "./TopupDialog";
import Wallet from "./Wallet";

export const metadata = { title: "Wallet" };

export default function WalletPage() {
  return (
    <PanelShell current="wallet" crumb="Wallet" after={<TopupDialog />}>
      <Wallet />
    </PanelShell>
  );
}
