import type { Metadata } from "next";
import AdminShell from "@admin/components/AdminShell";
import SettingsBody from "./SettingsBody";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <AdminShell current="settings" heading="Settings" lead="Admin login, data export and the audit trail of every change made here.">
      <SettingsBody />
    </AdminShell>
  );
}
