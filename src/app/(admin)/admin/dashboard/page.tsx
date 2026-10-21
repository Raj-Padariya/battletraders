import "@admin/styles/dashboard.css";
import Link from "next/link";
import AdminShell from "@admin/components/AdminShell";
import Icon from "@admin/components/Icon";
import Overview from "./Overview";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <AdminShell
      current="overview"
      heading="Dashboard"
      lead="Everything happening on BattleTrader at a glance."
      actions={<Link className="ad-btn ad-btn-primary" href="/admin/battles/#new"><Icon name="plus" /><span>Add battle</span></Link>}
    >
      <Overview />
    </AdminShell>
  );
}
