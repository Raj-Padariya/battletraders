"use client";

// Port of the Achievements block of admin/assets/js/community.js.
import { useEffect, useState } from "react";
import Icon from "@admin/components/Icon";
import { Badge, TableCard, Toolbar, useAdminUi } from "@admin/components/AdminUi";
import { BTAdmin, type AchievementRow } from "@admin/lib/store";
import { cap, matches, num, type Tone } from "@admin/lib/ui";
import { categories } from "../_community/achievements";
import { Kpi, useDebounced } from "../_community/parts";
import "../_community/register";

// Diamond was "violet" in the old map; it is not a shared Tone, so it is rendered as a raw badge below.
const RARITY_TONE: Record<string, Tone | "violet"> = { Bronze: "muted", Silver: "info", Gold: "warn", Platinum: "info", Diamond: "violet", Legendary: "warn", Immortal: "bad" };
const catName: Record<string, string> = Object.fromEntries(categories.map((c) => [c.id, c.name]));

function RarityBadge({ rarity }: { rarity: string }) {
  const tone = RARITY_TONE[rarity];
  if (tone === "violet") return <span className="ad-badge is-violet">{rarity}</span>;
  return <Badge text={rarity} tone={tone} />;
}

export default function AchievementsBody() {
  const { toast } = useAdminUi();
  const [list, setList] = useState<AchievementRow[]>([]);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("");
  const [state, setState] = useState("");
  const appliedQuery = useDebounced(query);

  useEffect(() => {
    setList(BTAdmin.achievements());
  }, []);

  const unlocked = list.filter((a) => a.unlocked).length;

  const filtered = list.filter((a) => {
    if (cat && a.category !== cat) return false;
    if (state === "unlocked" && !a.unlocked) return false;
    if (state === "progress" && (a.unlocked || !a.pct)) return false;
    if (state === "locked" && (a.unlocked || a.pct)) return false;
    return matches(a, appliedQuery.trim(), ["name", "description", "rarity"]);
  });

  const onExport = () => {
    BTAdmin.exportCSV<AchievementRow>("battletrader-achievements.csv", [
      ["id", "ID"], ["name", "Name"], ["category", "Category"], ["rarity", "Rarity"], ["xp", "XP"],
      ["credits", "Credits"], ["playersPct", "Players %"], ["pct", "Progress %"],
      [(a) => (a.unlocked ? "yes" : "no"), "Unlocked"],
    ], filtered);
    toast("CSV downloaded.");
  };

  return (
    <>
      <div className="ad-kpis" aria-label="Achievement numbers">
        <Kpi glyph='<path d="M7 3h10l-3 6h-4z"/><circle cx="12" cy="15" r="6"/>' label="Achievements" valueId="ac-total" value={num(list.length)} subId="ac-total-s" sub={categories.length + " categories"} />
        <Kpi tone="green" glyph='<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>' label="Unlocked" valueId="ac-unlocked" value={num(unlocked)} subId="ac-unlocked-s" sub={list.length ? Math.round((unlocked / list.length) * 100) + "% of all" : ""} />
        <Kpi tone="gold" glyph='<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>' label="Total XP on offer" valueId="ac-xp" value={num(list.reduce((s, a) => s + (Number(a.xp) || 0), 0))} subId="ac-credits" sub={num(list.reduce((s, a) => s + (Number(a.credits) || 0), 0)) + " credits on offer"} />
      </div>
      <Toolbar
        id="ac"
        searchLabel="Search achievements"
        placeholder="Search achievements…"
        query={query}
        onQuery={setQuery}
        selects={[
          { id: "ac-cat", label: "Category", value: cat, onChange: setCat, options: [["", "All categories"], ...categories.map((c): [string, string] => [c.id, c.name])] },
          { id: "ac-state", label: "Progress", value: state, onChange: setState, options: [["", "All"], ["unlocked", "Unlocked"], ["progress", "In progress"], ["locked", "Not started"]] },
        ]}
      >
        <button className="ad-btn" type="button" id="ac-export" onClick={onExport}><Icon name="download" /><span>Export CSV</span></button>
      </Toolbar>
      <TableCard<AchievementRow>
        id="ac-table"
        caption="Achievements"
        columns={[{ label: "Achievement" }, { label: "Category" }, { label: "Rarity" }, { label: "XP", num: true }, { label: "Credits", num: true }, { label: "Players with it", num: true }, { label: "Progress", num: true }]}
        empty="No achievements match these filters."
        items={filtered}
        rowKey={(a) => a.id}
        renderRow={(a) => [
          <span className="ad-cell-main" key="n"><span><b>{a.name}</b><small>{a.description}</small></span></span>,
          catName[a.category] || cap(a.category),
          <RarityBadge rarity={a.rarity} key="r" />,
          { node: num(a.xp), num: true },
          { node: num(a.credits), num: true },
          { node: a.playersPct + "%", num: true },
          {
            node: (
              <span className="ad-progress-cell">
                <span className="ad-progress" role="img" aria-label={a.pct + "% complete"}><i style={{ width: Math.min(100, a.pct) + "%" }} /></span>
                <b>{a.unlocked ? "Done" : a.pct + "%"}</b>
              </span>
            ),
            num: true,
          },
        ]}
        total={list.length}
      />
    </>
  );
}
