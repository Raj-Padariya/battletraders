"use client";

// Users list — port of admin/assets/js/users.js (toolbar filters, table, block/unblock, CSV export).
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Icon from "@admin/components/Icon";
import { Badge, IconBtn, StatusBadge, TableCard, Toolbar, useAdminUi } from "@admin/components/AdminUi";
import { BTAdmin, type UserRow } from "@admin/lib/store";
import { asset, date, matches, money } from "@admin/lib/ui";

const KYC_LABEL: Record<string, string> = { none: "Not started", draft: "Draft", pending: "Review", verified: "Verified", rejected: "Rejected" };

function TypeBadge({ u }: { u: UserRow }) {
  if (u.live) return <Badge text="Signed in here" tone="info" />;
  if (u.source === "demo") return <Badge text="Demo" tone="muted" />;
  // "violet" is an admin-base.css badge tone outside the shared Tone type.
  return <span className="ad-badge is-violet">Signed up here</span>;
}

export default function UsersList() {
  const { toast, confirmAction } = useAdminUi();
  const [all, setAll] = useState<UserRow[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [kyc, setKyc] = useState("");

  const reload = () => setAll(BTAdmin.users());

  useEffect(() => {
    const list = BTAdmin.users();
    setAll(list);
    const seen: Record<string, true> = {};
    list.forEach((u) => { if (u.countryName) seen[u.countryName] = true; });
    setCountries(Object.keys(seen).sort());
  }, []);

  // The old onFilter debounced text input by 150 ms.
  useEffect(() => {
    const timer = window.setTimeout(() => setAppliedQuery(query), 150);
    return () => window.clearTimeout(timer);
  }, [query]);

  const rows = useMemo(() => all.filter((u) => {
    if (country && u.countryName !== country) return false;
    if (status === "blocked" && !u.blocked) return false;
    if (status === "active" && u.blocked) return false;
    if (source && u.source !== source) return false;
    if (kyc && u.kycStatus !== kyc) return false;
    return matches(u, appliedQuery.trim(), ["username", "fullName", "email", "countryName"]);
  }), [all, country, status, source, kyc, appliedQuery]);

  const toggleBlock = (u: UserRow, button: HTMLButtonElement) => {
    if (u.blocked) {
      BTAdmin.unblock(u.username);
      toast("@" + u.username + " can use their account again.");
      reload();
      return;
    }
    confirmAction({
      title: "Block @" + u.username + "?",
      text: "They will see an \"Account suspended\" screen in the user panel until you unblock them.",
      confirm: "Block user",
      tone: "bad",
    }).then((ok) => {
      if (!ok) { button.focus(); return; }
      BTAdmin.block(u.username);
      toast("@" + u.username + " is blocked.", "warn");
      reload();
    });
  };

  const exportCsv = () => {
    BTAdmin.exportCSV<UserRow>("battletrader-users.csv", [
      ["username", "Username"], ["fullName", "Full name"], ["email", "Email"], ["countryName", "Country"],
      ["joined", "Joined"], ["balance", "Balance"], ["kycStatus", "KYC"],
      [(u) => (u.live ? "signed in here" : u.source), "Type"],
      [(u) => (u.blocked ? "blocked" : "active"), "Status"],
    ], rows);
    toast("CSV downloaded.");
  };

  return (
    <>
      <Toolbar
        id="us"
        searchLabel="Search users"
        placeholder="Search by username, name or email…"
        query={query}
        onQuery={setQuery}
        selects={[
          { id: "us-country", label: "Country", options: [["", "All countries"], ...countries.map((c): [string, string] => [c, c])], value: country, onChange: setCountry },
          { id: "us-status", label: "Status", options: [["", "All"], ["active", "Active"], ["blocked", "Blocked"]], value: status, onChange: setStatus },
          { id: "us-source", label: "Type", options: [["", "All users"], ["registered", "Signed up here"], ["demo", "Demo data"]], value: source, onChange: setSource },
          { id: "us-kyc", label: "KYC", options: [["", "Any"], ["pending", "Waiting for review"], ["verified", "Verified"], ["rejected", "Rejected"], ["none", "Not started"]], value: kyc, onChange: setKyc },
        ]}
      >
        <button className="ad-btn" type="button" id="us-export" onClick={exportCsv}><Icon name="download" /><span>Export CSV</span></button>
      </Toolbar>
      <TableCard<UserRow>
        id="us-table"
        caption="Users"
        columns={[{ label: "User" }, { label: "Country" }, { label: "Joined" }, { label: "Balance", num: true }, { label: "KYC" }, { label: "Type" }, { label: "Status" }, { label: "" }]}
        empty="No users match these filters."
        items={rows}
        total={all.length}
        rowKey={(u) => u.username}
        renderRow={(u) => {
          const href = asset("/user/?u=" + encodeURIComponent(u.username));
          return [
            <span className="ad-cell-main" key="who">
              <span className="ad-av">{u.username.replace(/[^A-Za-z0-9]/g, "").charAt(0).toUpperCase() || "?"}</span>
              <span>
                <Link className="ad-cell-link" href={href}>{"@" + u.username}</Link>
                <small>{[u.fullName, u.email].filter(Boolean).join(" · ")}</small>
              </span>
            </span>,
            u.countryName || "—",
            u.joined ? date(u.joined) : "—",
            { node: u.balance === null ? "—" : money(u.balance), num: true },
            <StatusBadge key="kyc" status={u.kycStatus || "none"} label={KYC_LABEL[u.kycStatus] || "Not started"} />,
            <TypeBadge key="type" u={u} />,
            <StatusBadge key="status" status={u.blocked ? "blocked" : "active"} />,
            {
              node: (
                <span className="ad-actions">
                  <IconBtn icon="eye" label={"View @" + u.username} onClick={() => { window.location.href = href; }} />
                  <IconBtn
                    icon={u.blocked ? "tick" : "ban"}
                    label={(u.blocked ? "Unblock @" : "Block @") + u.username}
                    onClick={(e) => toggleBlock(u, e.currentTarget)}
                    variant={u.blocked ? "ok" : "bad"}
                  />
                </span>
              ),
              label: "",
            },
          ];
        }}
      />
    </>
  );
}
