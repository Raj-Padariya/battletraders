"use client";

import { useEffect, useState } from "react";
import Icon from "@admin/components/Icon";
import { currentTheme, setTheme, type Theme } from "@admin/lib/ui";

/** Sun/moon toggle (old admin-shell `themeButton`). The label says what a click will do. */
export default function ThemeButton({ className = "" }: { className?: string }) {
  // "dark" is the server default; the pre-paint script may already have set light, synced after mount.
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => setThemeState(currentTheme()), []);

  const next: Theme = theme === "light" ? "dark" : "light";
  const label = "Switch to " + next + " theme";

  return (
    <button
      className={"ad-theme-btn" + (className ? " " + className : "")}
      type="button"
      data-theme-toggle=""
      aria-label={label}
      title={label}
      aria-pressed={theme === "light"}
      onClick={() => {
        setTheme(next);
        setThemeState(next);
      }}
    >
      <span className="ad-theme-knob" aria-hidden="true"></span>
      <span className="ad-theme-ic is-moon" aria-hidden="true"><Icon name="moon" /></span>
      <span className="ad-theme-ic is-sun" aria-hidden="true"><Icon name="sun" /></span>
    </button>
  );
}
