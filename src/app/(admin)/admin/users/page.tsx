import AdminShell from "@admin/components/AdminShell";
import UsersList from "./UsersList";

export const metadata = { title: "Users" };

export default function UsersPage() {
  return (
    <AdminShell
      current="users"
      heading="Users"
      lead="Everyone who signed up in this browser, plus the sample traders shown on the leaderboards."
    >
      <UsersList />
    </AdminShell>
  );
}
