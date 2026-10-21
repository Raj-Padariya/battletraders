import { Suspense } from "react";
import AdminShell from "@admin/components/AdminShell";
import KycReview from "./KycReview";

export const metadata = { title: "KYC" };

export default function KycPage() {
  return (
    <AdminShell
      current="kyc"
      heading="KYC review"
      lead="Check identity documents before users can cash out. Pick a submission to review it."
    >
      {/* ?u= deep link needs useSearchParams, which needs a Suspense boundary for static export. */}
      <Suspense fallback={null}>
        <KycReview />
      </Suspense>
    </AdminShell>
  );
}
