import "@panel/styles/profile.css";
import type { Metadata } from "next";
import ProfileView from "./ProfileView";

export const metadata: Metadata = {
  title: "Profile & KYC",
  description: "Manage your BattleTrader profile, verify your phone and submit KYC documents to unlock cash-outs.",
};

export default function ProfilePage() {
  return <ProfileView />;
}
