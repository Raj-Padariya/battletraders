import type { Metadata } from "next";
import AdminShell from "@admin/components/AdminShell";
import AffiliatesBody from "./AffiliatesBody";

export const metadata: Metadata = { title: "Affiliates" };

export default function AffiliatesPage() {
  return (
    <AdminShell current="affiliates" heading="Affiliates" lead="Referral codes and what each affiliate has earned.">
      <AffiliatesBody />
    </AdminShell>
  );
}
