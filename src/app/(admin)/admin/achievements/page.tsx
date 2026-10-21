import type { Metadata } from "next";
import AdminShell from "@admin/components/AdminShell";
import AchievementsBody from "./AchievementsBody";

export const metadata: Metadata = { title: "Achievements" };

export default function AchievementsPage() {
  return (
    <AdminShell current="achievements" heading="Achievements" lead="Every achievement in the game and how far the signed-in user has got.">
      <AchievementsBody />
    </AdminShell>
  );
}
