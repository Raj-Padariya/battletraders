import { Suspense } from "react";
import AdminShell from "@admin/components/AdminShell";
import LeadsBody from "./LeadsBody";

export const metadata = { title: "Leads" };

export default function LeadsPage() {
  return (
    <AdminShell current="leads" heading="Leads" lead={<>Messages sent through the website&rsquo;s contact and join forms.</>}>
      <Suspense fallback={null}>
        <LeadsBody />
      </Suspense>
    </AdminShell>
  );
}
