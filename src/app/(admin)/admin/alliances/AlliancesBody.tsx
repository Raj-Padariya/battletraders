"use client";

// Port of the Alliances block of admin/assets/js/community.js.
import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@admin/components/Icon";
import { Badge, TableCard, Toolbar, useAdminUi } from "@admin/components/AdminUi";
import { BTAdmin } from "@admin/lib/store";
import { date, matches, num, textOn } from "@admin/lib/ui";
import { BTAlliances, type Alliance } from "../_community/alliances";
import { Kpi, useDebounced } from "../_community/parts";
import "../_community/register";

export default function AlliancesBody() {
  const { toast } = useAdminUi();
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [requests, setRequests] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("");
  const appliedQuery = useDebounced(query);

  useEffect(() => {
    setAlliances(BTAlliances.list());
    setRequests(BTAdmin.allianceRequests());
  }, []);

  const memberCount = alliances.reduce((s, a) => s + (a.members ? a.members.length : 0), 0);
  const created = alliances.filter((a) => a.created).length;

  const filtered = alliances.filter((a) => {
    if (source === "created" && !a.created) return false;
    if (source === "sample" && a.created) return false;
    return matches(a, appliedQuery.trim(), ["name", "tag", "leader", "description"]);
  });

  const onExport = () => {
    BTAdmin.exportCSV<Alliance>("battletrader-alliances.csv", [
      ["id", "ID"], ["name", "Name"], ["tag", "Tag"], ["leader", "Leader"],
      [(a) => (a.members ? a.members.length : 0), "Members"], ["seasonPoints", "Season points"],
      [(a) => (a.record ? a.record.w + "-" + a.record.l : ""), "Record"], ["founded", "Founded"],
      [(a) => (a.created ? "user-created" : "sample"), "Type"],
    ], filtered);
    toast("CSV downloaded.");
  };

  const renderRow = (a: Alliance) => {
    const color = BTAlliances.crestColor(a.name);
    const crest = (
      <span className="ad-av" style={{ "--av": color, color: textOn(color) } as React.CSSProperties}>{BTAlliances.initials(a.name)}</span>
    );
    return [
      <span className="ad-cell-main" key="n">
        {crest}
        <span><b>{a.name + (a.tag ? " [" + a.tag + "]" : "")}</b><small>{requests.indexOf(a.id) !== -1 ? "Join request pending" : (a.description || "").slice(0, 60)}</small></span>
      </span>,
      a.leader ? <Link className="ad-cell-link" href={"/admin/user/?u=" + encodeURIComponent(a.leader)}>{"@" + a.leader}</Link> : "—",
      { node: num(a.members ? a.members.length : 0), num: true },
      { node: num(a.seasonPoints || 0), num: true },
      a.record ? a.record.w + "W – " + a.record.l + "L" : "—",
      a.founded ? date(a.founded) : "—",
      // "violet" is not a shared Tone; the old badge() just set the class, so render it directly.
      a.created ? <span className="ad-badge is-violet">User-created</span> : <Badge text="Sample" tone="muted" />,
    ];
  };

  return (
    <>
      <div className="ad-kpis" aria-label="Alliance numbers">
        <Kpi glyph='<path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z"/>' label="Alliances" valueId="al-total" value={num(alliances.length)} subId="al-total-s" sub={created + " created by users"} />
        <Kpi tone="cyan" glyph='<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>' label="Members" valueId="al-members" value={num(memberCount)} sub="across all alliances" />
        <Kpi tone="gold" glyph='<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6"/>' label="Join requests" valueId="al-requests" value={num(requests.length)} sub="from the signed-in user" />
      </div>
      <Toolbar
        id="al"
        searchLabel="Search alliances"
        placeholder="Search by name, tag or leader…"
        query={query}
        onQuery={setQuery}
        selects={[{ id: "al-source", label: "Show", value: source, onChange: setSource, options: [["", "All alliances"], ["created", "Created by users"], ["sample", "Sample alliances"]] }]}
      >
        <button className="ad-btn" type="button" id="al-export" onClick={onExport}><Icon name="download" /><span>Export CSV</span></button>
      </Toolbar>
      <TableCard<Alliance>
        id="al-table"
        caption="Alliances"
        columns={[{ label: "Alliance" }, { label: "Leader" }, { label: "Members", num: true }, { label: "Season points", num: true }, { label: "Record" }, { label: "Founded" }, { label: "Type" }]}
        empty="No alliances match these filters."
        items={filtered}
        rowKey={(a) => a.id}
        renderRow={renderRow}
        total={alliances.length}
      />
    </>
  );
}
