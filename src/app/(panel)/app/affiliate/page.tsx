import "@panel/styles/affiliate.css";
import PanelShell from "@panel/components/PanelShell";
import AffiliateBody from "./AffiliateBody";

export const metadata = {
  title: "Affiliate",
  description: "Generate your BattleTrader affiliate code, share your link and climb the affiliate ranks.",
};

export default function AffiliatePage() {
  return (
    <PanelShell current="affiliate" crumb="Affiliate">
      <AffiliateBody />
    </PanelShell>
  );
}
