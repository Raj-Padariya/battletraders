"use client";

// Small pieces shared by the Alliances / Affiliates / Achievements pages (old community.js + their HTML).
import { useEffect, useState } from "react";

/** KPI tile with the exact inline glyph the old page used. */
export function Kpi({ tone, glyph, label, valueId, value, subId, sub }: {
  tone?: string;
  glyph: string;
  label: string;
  valueId: string;
  value: string;
  subId?: string;
  sub: string;
}) {
  return (
    <div className={"ad-kpi" + (tone ? " is-" + tone : "")}>
      <span className="ad-kpi-l"><svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: glyph }} />{label}</span>
      <b className="ad-kpi-v" id={valueId}>{value}</b>
      <span className="ad-kpi-s" id={subId}>{sub}</span>
    </div>
  );
}

/** Old UI.onFilter: text inputs re-render after a 150 ms pause. */
export function useDebounced(value: string): string {
  const [applied, setApplied] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setApplied(value), 150);
    return () => window.clearTimeout(timer);
  }, [value]);
  return applied;
}
