import { redirect } from "next/navigation";

// /admin/ has no page of its own (old admin/index.html forwarded too); the dashboard's guard sends signed-out visitors to login.
export default function AdminHome() {
  redirect("/admin/dashboard/");
}
