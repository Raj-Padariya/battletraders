import "@panel/styles/affiliate.css";
import PanelShell from "@panel/components/PanelShell";
import AffiliateBody from "./AffiliateBody";

export const metadata = {
  title: "Refer & Earn",
  description: "Generate your BattleTrader referral code, share your link and earn rewards as you climb the referral ranks.",
};

export default function AffiliatePage() {
  return (
    <PanelShell current="affiliate" crumb="Refer & Earn">
      <AffiliateBody />
    </PanelShell>
  );
}
