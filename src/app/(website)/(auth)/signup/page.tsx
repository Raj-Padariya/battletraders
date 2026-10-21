import type { Metadata } from "next";
import AuthHero from "../_components/AuthHero";
import SignupFlow from "./SignupFlow";

export const metadata: Metadata = {
  title: "Create Account — BattleTrader",
  description:
    "Create your BattleTrader account. Compete in trading tournaments, climb the leaderboards and prove your edge against traders worldwide.",
};

export default function SignupPage() {
  return (
    <main className="auth">
      <AuthHero
        headingLead="Join the"
        intro="Create your account today. Compete in high-stakes trading tournaments, climb the leaderboards, and prove your edge against traders worldwide."
        chip={
          <span className="ab-chip c1">
            <svg viewBox="0 0 24 24">
              <path d="M12 2v20M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.6 7 6.8c0 4.8 10 2.6 10 7.6 0 2.2-2.2 3.6-5 3.6s-5-1.2-5-3.4" />
            </svg>
            Free entry · $0
          </span>
        }
      />

      <section className="auth-panel">
        <SignupFlow />
      </section>
    </main>
  );
}
