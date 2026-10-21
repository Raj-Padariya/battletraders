import { Suspense } from "react";
import AdminShell from "@admin/components/AdminShell";
import BattlesBody from "./BattlesBody";
import NewBattleButton from "./NewBattleButton";

export const metadata = { title: "Battles" };

export default function BattlesPage() {
  return (
    <AdminShell
      current="battles"
      heading="Battles"
      lead={<>Every tournament users can see. Changes show up on the user panel&rsquo;s Browse Tournaments page right away.</>}
      actions={<NewBattleButton />}
    >
      <Suspense fallback={null}>
        <BattlesBody />
      </Suspense>
    </AdminShell>
  );
}
