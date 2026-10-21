import type { Metadata } from "next";
import Link from "next/link";
import AuthHero from "../_components/AuthHero";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Log In — BattleTrader",
  description: "Log in to BattleTrader to enter tournaments, track your rank and see your results.",
};

export default function LoginPage() {
  return (
    <main className="auth">
      <AuthHero
        headingLead="Back to the"
        intro="Log in to enter today's battles, check where you stand on the season ladder, and pick up where you left off."
        chip={
          <span className="ab-chip c1">
            <svg viewBox="0 0 24 24">
              <path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 12H5z" />
            </svg>
            #1 · 9,420 pts
          </span>
        }
      />

      <section className="auth-panel">
        <div className="auth-card">
          <h2>Log In</h2>
          <p className="auth-sub">Welcome back, trader</p>

          <LoginForm />

          <p className="auth-switch">
            New to BattleTrader?<Link href="/signup/">Create account</Link>
          </p>
          <nav className="auth-legal" aria-label="Legal">
            <Link href="/rules/">Terms &amp; Conditions</Link>
            <Link href="/rules/">Privacy Policy</Link>
          </nav>
        </div>
      </section>
    </main>
  );
}
