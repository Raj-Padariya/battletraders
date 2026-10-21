import AdminShell from "@admin/components/AdminShell";
import NewCodeButton from "./NewCodeButton";
import VouchersBody from "./VouchersBody";

export const metadata = { title: "Vouchers" };

export default function VouchersPage() {
  return (
    <AdminShell
      current="vouchers"
      heading="Vouchers"
      lead="Create redeem codes users can enter on the Redeem page, and see the vouchers they already hold."
      actions={<NewCodeButton />}
    >
      <VouchersBody />
    </AdminShell>
  );
}
