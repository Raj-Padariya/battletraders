"use client";

// Port of the Affiliates block of admin/assets/js/community.js.
import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@admin/components/Icon";
import { TableCard, Toolbar, useAdminUi } from "@admin/components/AdminUi";
import { BTAdmin, type AffiliateRow } from "@admin/lib/store";
import { date, matches, money, num } from "@admin/lib/ui";
import { Kpi, useDebounced } from "../_community/parts";

export default function AffiliatesBody() {
  const { toast } = useAdminUi();
  const [rows, setRows] = useState<AffiliateRow[]>([]);
  const [query, setQuery] = useState("");
  const appliedQuery = useDebounced(query);

  useEffect(() => {
    setRows(BTAdmin.affiliates());
  }, []);

  const filtered = rows.filter((r) => matches(r, appliedQuery.trim(), ["username", "code"]));

  const onExport = () => {
    BTAdmin.exportCSV<AffiliateRow>("battletrader-affiliates.csv", [
      ["username", "User"], ["code", "Code"], ["referrals", "Referrals"], ["cash", "Cash"],
      ["credits", "Credits"], ["tickets", "Tickets"], ["generatedAt", "Code created"],
    ], filtered);
    toast("CSV downloaded.");
  };

  return (
    <>
      <div className="ad-kpis" aria-label="Affiliate numbers">
        <Kpi glyph='<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13M12 8S9 3 7 5s3 3 5 3zm0 0s3-5 5-3-3 3-5 3z"/>' label="Affiliates" valueId="af-total" value={num(rows.length)} sub="with a referral code" />
        <Kpi tone="cyan" glyph='<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6"/>' label="Referrals" valueId="af-refs" value={num(rows.reduce((s, r) => s + r.referrals, 0))} sub="signed up with a code" />
        <Kpi tone="green" glyph='<path d="M12 2v20M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.6 7 6.8c0 4.8 10 2.6 10 7.6 0 2.2-2.2 3.6-5 3.6s-5-1.2-5-3.4"/>' label="Paid out" valueId="af-cash" value={money(rows.reduce((s, r) => s + r.cash, 0))} subId="af-cash-s" sub={num(rows.reduce((s, r) => s + r.credits, 0)) + " credits earned"} />
      </div>
      <Toolbar id="af" searchLabel="Search affiliates" placeholder="Search by user or code…" query={query} onQuery={setQuery}>
        <button className="ad-btn" type="button" id="af-export" onClick={onExport}><Icon name="download" /><span>Export CSV</span></button>
      </Toolbar>
      <TableCard<AffiliateRow>
        id="af-table"
        caption="Affiliates"
        columns={[{ label: "User" }, { label: "Code" }, { label: "Referrals", num: true }, { label: "Cash", num: true }, { label: "Credits", num: true }, { label: "Tickets", num: true }, { label: "Code created" }]}
        empty="No affiliates match. A user gets a code by opening the Affiliate page in the user panel."
        items={filtered}
        rowKey={(r) => r.username + "|" + r.code}
        renderRow={(r) => [
          r.username !== "—" ? <Link className="ad-cell-link" href={"/admin/user/?u=" + encodeURIComponent(r.username)}>{"@" + r.username}</Link> : "—",
          <code className="ad-code" key="c">{r.code}</code>,
          { node: num(r.referrals), num: true },
          { node: money(r.cash), num: true },
          { node: num(r.credits), num: true },
          { node: num(r.tickets), num: true },
          date(r.generatedAt),
        ]}
        total={rows.length}
      />
    </>
  );
}
