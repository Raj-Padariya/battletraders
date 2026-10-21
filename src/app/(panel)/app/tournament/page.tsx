import "@panel/styles/tournaments.css";
import Link from "next/link";
import { Suspense } from "react";
import PanelShell from "@panel/components/PanelShell";
import EnrollDialog from "../browse-tournaments/_shared/EnrollDialog";
import Detail from "./Detail";

export const metadata = {
  title: "Tournament",
  description: "Tournament details: schedule, rounds, prize distribution and enrollment.",
};

const Placeholder = () => (
  <div className="tn-page" id="tn-detail">
    <Link className="tn-back" href="/app/browse-tournaments/"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>Back to tournaments</Link>
    <div id="tn-detail-root" aria-live="polite"></div>
  </div>
);

export default function TournamentPage() {
  return (
    <PanelShell current="browse-tournaments" crumb="Tournament" after={<EnrollDialog />}>
      <Suspense fallback={<Placeholder />}>
        <Detail />
      </Suspense>
    </PanelShell>
  );
}
