import type { Metadata } from "next";
import AdminShell from "@admin/components/AdminShell";
import AlliancesBody from "./AlliancesBody";

export const metadata: Metadata = { title: "Alliances" };

export default function AlliancesPage() {
  return (
    <AdminShell current="alliances" heading="Alliances" lead="Every alliance, including the ones users created, and pending join requests.">
      <AlliancesBody />
    </AdminShell>
  );
}
