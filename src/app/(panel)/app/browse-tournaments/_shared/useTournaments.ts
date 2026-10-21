"use client";

// Browser-only tournament snapshot for Browse and Details: list + enrollments read after mount, re-read after an
// enrollment (old `afterEnroll`), plus a 1s clock for the countdown chips (old `setInterval(tick, 1000)`).
import { useCallback, useEffect, useState } from "react";
import { BTTournaments, type Enrollment, type Tournament } from "@panel/lib/data/tournaments";
import { ENROLLED_EVENT } from "./EnrollDialog";

export interface TournamentSnapshot {
  loaded: boolean;
  list: Tournament[];
  enrolled: Record<string, Enrollment>;
  /** Time the snapshot was taken — statuses/buttons use it, like the old render-time Date.now(). */
  at: number;
}

const EMPTY: TournamentSnapshot = { loaded: false, list: [], enrolled: {}, at: 0 };

export function useTournaments(): { snap: TournamentSnapshot; tick: number; reload: () => void } {
  const [snap, setSnap] = useState<TournamentSnapshot>(EMPTY);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => {
    setSnap({ loaded: true, list: BTTournaments.list(), enrolled: BTTournaments.enrollments(), at: Date.now() });
  }, []);

  useEffect(() => {
    reload();
    setTick(Date.now());
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    window.addEventListener(ENROLLED_EVENT, reload);
    return () => {
      window.clearInterval(id);
      window.removeEventListener(ENROLLED_EVENT, reload);
    };
  }, [reload]);

  return { snap, tick: tick || snap.at, reload };
}
