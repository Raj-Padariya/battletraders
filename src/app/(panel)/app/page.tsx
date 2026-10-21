import { redirect } from "next/navigation";

// /app/ has no page of its own — the panel starts at the dashboard.
export default function PanelHome() {
  redirect("/app/dashboard/");
}
