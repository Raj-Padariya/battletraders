import type { Metadata } from "next";
import LoginBody from "./LoginBody";

export const metadata: Metadata = { title: { absolute: "Admin sign in — BattleTrader" } };

export default function LoginPage() {
  return <LoginBody />;
}
