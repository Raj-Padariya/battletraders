import { Suspense } from "react";
import AdminShell from "@admin/components/AdminShell";
import GoaBody from "./GoaBody";

export const metadata = { title: "Goa event passes" };

export default function GoaPage() {
  return (
    <AdminShell current="goa" heading="Goa Live Final passes" lead={<>Everyone who paid for a pass on the Goa event page.</>}>
      <Suspense fallback={null}>
        <GoaBody />
      </Suspense>
    </AdminShell>
  );
}
