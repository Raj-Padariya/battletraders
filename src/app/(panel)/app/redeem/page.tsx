import "@panel/styles/redeem.css";
import PanelShell from "@panel/components/PanelShell";
import RedeemBody from "./RedeemBody";

export const metadata = {
  title: "Redeem",
  description: "Redeem BattleTrader voucher codes, view your active vouchers and review past usage.",
};

export default function RedeemPage() {
  return (
    <PanelShell current="redeem" crumb="Redeem">
      <RedeemBody />
    </PanelShell>
  );
}
