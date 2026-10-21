"use client";

import { useRef, useState } from "react";

export type TabDef = {
  id: string;
  panelId: string;
  label: string;
  icon: React.ReactNode;
  panel: React.ReactNode;
};

// Roving-tabindex tabs (old pages.js 293-320): click selects, arrows/Home/End select + focus.
export default function RankingTabs({ label, tabs }: { label: string; tabs: TabDef[] }) {
  const [selected, setSelected] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectTab = (index: number, moveFocus: boolean) => {
    setSelected(index);
    if (moveFocus) tabRefs.current[index]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number | null = null;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next === null) return;
    e.preventDefault();
    selectTab(next, true);
  };

  return (
    <>
      <div className="tabs" role="tablist" aria-label={label}>
        {tabs.map((tab, index) => {
          const active = index === selected;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              className="tab"
              type="button"
              role="tab"
              id={tab.id}
              aria-controls={tab.panelId}
              aria-selected={active ? "true" : "false"}
              tabIndex={active ? undefined : -1}
              onClick={() => selectTab(index, false)}
              onKeyDown={(e) => onKeyDown(e, index)}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab, index) => (
        <div key={tab.panelId} className="block" role="tabpanel" id={tab.panelId} aria-labelledby={tab.id} hidden={index !== selected}>
          {tab.panel}
        </div>
      ))}
    </>
  );
}
