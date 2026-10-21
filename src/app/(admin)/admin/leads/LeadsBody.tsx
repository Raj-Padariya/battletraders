"use client";

// Port of admin/assets/js/leads.js — type tabs, filters, table, CSV export and the #ld-dialog detail view.
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Icon from "@admin/components/Icon";
import { AdminDialog, IconBtn, Select, StatusBadge, TableCard, Toolbar, useAdminUi, type DialogHandle } from "@admin/components/AdminUi";
import { BTAdmin, type CsvColumn, type LeadRow, type LeadStatus, type LeadType } from "@admin/lib/store";
import { ago, cap, date, matches } from "@admin/lib/ui";

type TabKey = "all" | LeadType;

const TYPES: TabKey[] = ["all", "contact", "join", "partnership"];
const TAB_LABEL: Record<TabKey, string> = { all: "All", contact: "Contact", join: "Join", partnership: "Partnership" };
// "violet" is not one of the shared Tone values, so the type badge is rendered directly.
const TYPE_TONE: Record<string, string> = { contact: "info", join: "violet", partnership: "warn" };

const CSV_COLUMNS: CsvColumn<LeadRow>[] = [
  ["at", "Received"], ["type", "Type"], ["status", "Status"], ["name", "Name"], ["email", "Email"],
  ["phone", "Phone"], ["country", "Country"], ["topic", "Topic"], ["message", "Message"], ["page", "Page"],
];

function useDebounced<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), ms);
    return () => window.clearTimeout(timer);
  }, [value, ms]);
  return settled;
}

export default function LeadsBody() {
  const { toast, confirmAction } = useAdminUi();
  const params = useSearchParams();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [current, setCurrent] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [detail, setDetail] = useState<LeadRow | null>(null);
  const [dStatus, setDStatus] = useState<LeadStatus>("new");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dlg = useRef<DialogHandle>(null);
  const q = useDebounced(query, 150);

  const reload = () => setLeads(BTAdmin.leads());

  const filtered = leads.filter((l) => {
    if (current !== "all" && l.type !== current) return false;
    if (status && l.status !== status) return false;
    return matches(l, q.trim(), ["name", "email", "phone", "topic", "message", "country"]);
  });

  const openLead = (id: string, opener?: Element | null) => {
    const l = BTAdmin.leads().filter((x) => x.id === id)[0];
    if (!l) return;
    setDetail(l);
    setDStatus(l.status || "new");
    dlg.current?.open(opener);
  };

  useEffect(() => {
    reload();
    // Deep link from the Overview: /leads/?id=<leadId>
    const deepId = params.get("id");
    if (deepId) openLead(deepId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The old page re-read the store on every filter change.
  useEffect(() => {
    reload();
  }, [q, status, current]);

  const setTab = (type: TabKey, focus?: boolean) => {
    setCurrent(type);
    if (focus) tabRefs.current[TYPES.indexOf(type)]?.focus();
  };

  const onTabKey = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    let next: number | null = null;
    if (e.key === "ArrowRight") next = (i + 1) % TYPES.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + TYPES.length) % TYPES.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TYPES.length - 1;
    if (next !== null) {
      e.preventDefault();
      setTab(TYPES[next], true);
    }
  };

  const saveStatus = () => {
    if (!detail) return;
    BTAdmin.setLeadStatus(detail.id, dStatus);
    dlg.current?.close();
    toast("Lead marked " + dStatus + ".");
    reload();
  };

  // Replying usually means you've contacted them — mark it so it leaves the "New" list.
  const onReply = () => {
    if (!detail) return;
    const l = BTAdmin.leads().filter((x) => x.id === detail.id)[0];
    if (l && l.status === "new") {
      BTAdmin.setLeadStatus(detail.id, "contacted");
      reload();
    }
  };

  const deleteLead = () => {
    if (!detail) return;
    const id = detail.id;
    dlg.current?.close();
    confirmAction({ title: "Delete this lead?", text: "The message is removed from this browser. This can't be undone.", confirm: "Delete", tone: "bad" })
      .then((ok) => {
        if (!ok) return;
        BTAdmin.deleteLead(id);
        toast("Lead deleted.", "warn");
        reload();
      });
  };

  const exportCsv = () => {
    BTAdmin.exportCSV("battletrader-leads.csv", CSV_COLUMNS, filtered);
    toast("CSV downloaded.");
  };

  const pairs: [string, string][] = detail
    ? ([
        ["Type", cap(detail.type)], ["Email", detail.email], ["Phone", detail.phone], ["Country", detail.country],
        ["Topic", detail.topic], ["Sent from", detail.page], ["Received", date(detail.at, true)],
      ] as [string, string][]).filter((p) => !!p[1])
    : [];
  const message = detail
    ? detail.message || (detail.type === "join" ? "Asked to join BattleTrader (no message — this came from the Join form)." : "No message.")
    : "";
  const subject = "Re: " + ((detail && detail.topic) || "your message to BattleTrader");
  const replyHref = detail ? "mailto:" + encodeURIComponent(detail.email || "") + "?subject=" + encodeURIComponent(subject) : "#";

  return (
    <>
      <div className="ad-tabs" role="tablist" aria-label="Lead type">
        {TYPES.map((key, i) => {
          const on = key === current;
          return (
            <button
              key={key}
              className="ad-tab"
              type="button"
              role="tab"
              id={"ld-tab-" + key}
              data-type={key}
              aria-selected={on}
              aria-controls="ld-panel"
              tabIndex={on ? undefined : -1}
              ref={(node) => { tabRefs.current[i] = node; }}
              onClick={() => setTab(key)}
              onKeyDown={(e) => onTabKey(e, i)}
            >
              {TAB_LABEL[key]}
              <em id={"ld-n-" + key}>{key === "all" ? leads.length : leads.filter((l) => l.type === key).length}</em>
            </button>
          );
        })}
      </div>
      <div id="ld-panel" role="tabpanel" aria-labelledby={"ld-tab-" + current}>
        <Toolbar
          id="ld"
          searchLabel="Search leads"
          placeholder="Search by name, email or message…"
          query={query}
          onQuery={setQuery}
          selects={[{ id: "ld-status", label: "Status", options: [["", "All"], ["new", "New"], ["contacted", "Contacted"], ["closed", "Closed"]], value: status, onChange: setStatus }]}
        >
          <button className="ad-btn" type="button" id="ld-export" onClick={exportCsv}><Icon name="download" /><span>Export CSV</span></button>
        </Toolbar>
        <TableCard<LeadRow>
          id="ld-table"
          caption="Leads"
          columns={[{ label: "Name" }, { label: "Type" }, { label: "Phone" }, { label: "Topic" }, { label: "Received" }, { label: "Status" }, { label: "" }]}
          empty="No leads yet. Messages from the website’s Contact and Join forms land here."
          items={filtered}
          total={leads.length}
          rowKey={(l) => l.id}
          rowProps={(l) => ({
            className: "is-click",
            onClick: (e) => {
              if ((e.target as HTMLElement).closest("button, a")) return;
              openLead(l.id, e.currentTarget.querySelector("button"));
            },
          })}
          renderRow={(l) => [
            <span className="ad-cell-main" key="who">
              <span>
                <b>{l.name || "—"}</b>
                <small>{(l.email || "") + (l.demo ? " · demo" : "")}</small>
              </span>
            </span>,
            <span className={"ad-badge is-" + (TYPE_TONE[l.type] || "muted")} key="type">{cap(l.type)}</span>,
            l.phone || "—",
            l.topic || "—",
            <time dateTime={l.at} title={date(l.at, true)} key="at">{ago(l.at)}</time>,
            <StatusBadge status={l.status || "new"} key="st" />,
            {
              node: (
                <span className="ad-actions">
                  <IconBtn icon="eye" label={"Open message from " + (l.name || "lead")} onClick={(e) => openLead(l.id, e.currentTarget)} />
                </span>
              ),
              label: "",
            },
          ]}
        />
      </div>

      <AdminDialog ref={dlg} id="ld-dialog" title={<span id="ld-d-title">{detail ? detail.name || "Lead" : "Lead"}</span>}>
        <dl className="ad-dl" id="ld-d-dl">
          {pairs.map(([term, value]) => [<dt key={term + "-t"}>{term}</dt>, <dd key={term + "-d"}>{value}</dd>])}
        </dl>
        <p className="ad-label" style={{ margin: "16px 0 8px" }}>Message</p>
        <div className="ad-message" id="ld-d-msg">{message}</div>
        <div className="ad-form" style={{ marginTop: "16px" }}>
          <label className="ad-field"><span>Status</span>
            <Select id="ld-d-status" value={dStatus} options={[["new", "New"], ["contacted", "Contacted"], ["closed", "Closed"]]} onChange={(v) => setDStatus(v as LeadStatus)} />
          </label>
          <div className="ad-form-actions">
            <button className="ad-btn ad-btn-danger" type="button" id="ld-d-delete" onClick={deleteLead}><Icon name="trash" /><span>Delete</span></button>
            <a className="ad-btn" id="ld-d-reply" href={replyHref} hidden={!!detail && !detail.email} onClick={onReply}><Icon name="arrow" /><span>Reply by email</span></a>
            <button className="ad-btn ad-btn-primary" type="button" id="ld-d-save" onClick={saveStatus}><Icon name="check" /><span>Save status</span></button>
          </div>
        </div>
      </AdminDialog>
    </>
  );
}
