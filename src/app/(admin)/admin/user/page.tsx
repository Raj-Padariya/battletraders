import { Suspense } from "react";
import Link from "next/link";
import AdminShell from "@admin/components/AdminShell";
import UserDetailView from "./UserDetailView";

export const metadata = { title: "User" };

// useSearchParams (?u=) needs a Suspense boundary for static export; the fallback is the empty page chrome.
export default function UserPage() {
  return (
    <Suspense
      fallback={
        <AdminShell current="users" heading="User" lead={<Link className="ad-cell-link" href="/admin/users/">&larr; All users</Link>}>
          {null}
        </AdminShell>
      }
    >
      <UserDetailView />
    </Suspense>
  );
}
