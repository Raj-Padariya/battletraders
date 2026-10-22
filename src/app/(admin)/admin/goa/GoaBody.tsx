"use client";

// Goa Live Final registrations: every pass bought on the public event page, with totals and CSV export.
// Until the backend exists the list is read from this browser's storage (bt-goa-registrations).
import { useEffect, useState } from "react";
import Icon from "@admin/components/Icon";
import { TableCard, Toolbar, useAdminUi } from "@admin/components/AdminUi";
import { BTAdmin, type CsvColumn } from "@admin/lib/store";
import { ago, date, matches } from "@admin/lib/ui";
import {
  GOA_DEFAULT_SCHEDULE, GOA_DURATION_HOURS, GOA_ENTRY_FEE, GOA_SEATS, GOA_SEATS_DEMO_TAKEN,
  goaSchedule, istDate, istTime, istToIso, isoToIstParts, saveGoaStart, usd,
} from "@panel/lib/data/goa";
import { readRegistrations, type GoaRegistration } from "@panel/lib/pass";

const METHOD_LABEL: Record<string, string> = { card: "Card", upi: "UPI", crypto: "Crypto" };

const CSV_COLUMNS: CsvColumn<GoaRegistration>[] = [
  ["seat", "Seat"], ["issuedAt", "Paid at"], ["holder", "Name"], ["email", "Email"], ["serial", "Registration ID"],
  ["method", "Method"], ["amount", "Amount (USD)"], ["paymentRef", "Payment ref"],
];

export default function GoaBody() {
  const { toast } = useAdminUi();
  const [rows, setRows] = useState<GoaRegistration[]>([]);
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState("");
  const [startsAt, setStartsAt] = useState(GOA_DEFAULT_SCHEDULE.startsAt);
  const [form, setForm] = useState(isoToIstParts(GOA_DEFAULT_SCHEDULE.startsAt));

  useEffect(() => {
    const load = () => setRows(readRegistrations());
    load();
    const saved = goaSchedule().startsAt;
    setStartsAt(saved);
    setForm(isoToIstParts(saved));
    // A pass bought in another tab of this browser shows up without a reload.
    const onStorage = (e: StorageEvent) => { if (e.key === "bt-goa-registrations") load(); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const filtered = rows.filter((r) => {
    if (method && r.method !== method) return false;
    return matches(r, query.trim(), ["holder", "email", "serial", "paymentRef"]);
  });

  const revenue = rows.reduce((sum, r) => sum + r.amount, 0);
  const taken = Math.min(GOA_SEATS, GOA_SEATS_DEMO_TAKEN + rows.length);

  const formValid = /^\d{4}-\d{2}-\d{2}$/.test(form.date) && /^\d{2}:\d{2}$/.test(form.time);
  const previewStart = formValid ? istToIso(form.date, form.time) : startsAt;
  const previewEnd = new Date(Date.parse(previewStart) + GOA_DURATION_HOURS * 3600000).toISOString();
  const isDefault = startsAt === GOA_DEFAULT_SCHEDULE.startsAt;

  const saveTime = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formValid) {
      toast("Pick a date and a start time.");
      return;
    }
    saveGoaStart(previewStart);
    setStartsAt(previewStart);
    toast("Event time saved: " + istDate(previewStart) + ", " + istTime(previewStart) + " IST.");
  };

  const resetTime = () => {
    saveGoaStart(null);
    setStartsAt(GOA_DEFAULT_SCHEDULE.startsAt);
    setForm(isoToIstParts(GOA_DEFAULT_SCHEDULE.startsAt));
    toast("Event time reset to " + istDate(GOA_DEFAULT_SCHEDULE.startsAt) + ", " + istTime(GOA_DEFAULT_SCHEDULE.startsAt) + " IST.");
  };

  const exportCsv = () => {
    BTAdmin.exportCSV("goa-live-final-passes.csv", CSV_COLUMNS, filtered);
    toast("CSV downloaded.");
  };

  const kpis: [string, string, string][] = [
    ["Passes sold", String(rows.length), "Paid on the event page"],
    ["Collected", usd(revenue), usd(GOA_ENTRY_FEE) + " per pass"],
    ["Seats filled", taken + " / " + GOA_SEATS, GOA_SEATS_DEMO_TAKEN + " sample seats included"],
    ["Seats left", String(GOA_SEATS - taken), "Sales stop at " + GOA_SEATS],
  ];

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
        {kpis.map(([label, value, note]) => (
          <div className="ad-kpi" key={label} style={{ padding: "16px 18px" }}>
            <p className="ad-label" style={{ margin: 0 }}>{label}</p>
            <b style={{ display: "block", marginTop: "6px", fontSize: "24px" }}>{value}</b>
            <small style={{ opacity: 0.65 }}>{note}</small>
          </div>
        ))}
      </div>

      <form className="ad-kpi" onSubmit={saveTime} aria-labelledby="goa-time-h" style={{ padding: "16px 18px", marginBottom: "16px" }}>
        <h2 id="goa-time-h" style={{ margin: 0, fontSize: "15px" }}>Event time (India, IST)</h2>
        <p className="ad-label" style={{ margin: "4px 0 14px" }}>
          The live final runs for {GOA_DURATION_HOURS} hours from the start time. The website, event page and trader panel all use this time.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", alignItems: "end" }}>
          <label className="ad-field"><span>Start date</span>
            <input type="date" id="goa-start-date" required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </label>
          <label className="ad-field"><span>Start time (IST)</span>
            <input type="time" id="goa-start-time" required step={60} value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
          </label>
          <div>
            <p className="ad-label" style={{ margin: 0 }}>Ends (auto)</p>
            <b style={{ display: "block", marginTop: "6px" }}>{istDate(previewEnd)}, {istTime(previewEnd)} IST</b>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "14px", alignItems: "center" }}>
          <button className="ad-btn" type="submit"><span>Save time</span></button>
          <button className="ad-btn" type="button" onClick={resetTime} disabled={isDefault}><span>Reset to default</span></button>
          <small style={{ opacity: 0.65 }}>
            Live now: {istDate(startsAt)}, {istTime(startsAt)} IST{isDefault ? " (default)" : ""}. Test mode: saved in this browser until the backend is connected.
          </small>
        </div>
      </form>

      <Toolbar
        id="goa"
        searchLabel="Search passes"
        placeholder="Search by name, email, pass ID or payment ref…"
        query={query}
        onQuery={setQuery}
        selects={[{ id: "goa-method", label: "Method", options: [["", "All"], ["card", "Card"], ["upi", "UPI"], ["crypto", "Crypto"]], value: method, onChange: setMethod }]}
      >
        <button className="ad-btn" type="button" onClick={exportCsv}><Icon name="download" /><span>Export CSV</span></button>
      </Toolbar>

      <TableCard<GoaRegistration>
        id="goa-table"
        caption="Goa Live Final passes"
        columns={[{ label: "Seat" }, { label: "Trader" }, { label: "Registration ID" }, { label: "Method" }, { label: "Amount" }, { label: "Payment ref" }, { label: "Paid" }]}
        empty="No passes yet. Passes bought on the Goa event page appear here."
        items={filtered}
        total={rows.length}
        rowKey={(r) => r.id}
        renderRow={(r) => [
          <b key="seat">#{r.seat}</b>,
          <span className="ad-cell-main" key="who">
            <span>
              <b>{r.holder}</b>
              <small>{r.email}</small>
            </span>
          </span>,
          <code key="serial">{r.serial}</code>,
          <span className="ad-badge is-info" key="method">{METHOD_LABEL[r.method] || r.method}</span>,
          usd(r.amount),
          r.paymentRef,
          <time dateTime={r.issuedAt} title={date(r.issuedAt, true)} key="at">{ago(r.issuedAt)}</time>,
        ]}
      />
      <p className="ad-label" style={{ marginTop: "12px" }}>
        One registration per email, {GOA_SEATS} seats maximum. Test mode: registrations are stored in the buyer&rsquo;s browser until the backend is connected, so this list shows registrations made in this browser.
      </p>
    </>
  );
}
