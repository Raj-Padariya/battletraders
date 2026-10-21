import { Suspense } from "react";
import AdminShell from "@admin/components/AdminShell";
import AdjustButton from "./AdjustButton";
import TransactionsBody from "./TransactionsBody";

export const metadata = { title: "Wallet & transactions" };

export default function TransactionsPage() {
  return (
    <AdminShell
      current="transactions"
      heading="Wallet & transactions"
      lead="Top-ups, entry fees, cash-outs, refunds and rewards across every user."
      actions={<AdjustButton />}
    >
      <Suspense fallback={null}>
        <TransactionsBody />
      </Suspense>
    </AdminShell>
  );
}
