"use client";

// Port of admin/assets/js/vouchers.js — admin redeem codes (enable / disable / delete), vouchers held by users
// (filters + CSV) and the #vo-dialog create form. /vouchers/#new opens the form like the old page.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon from "@admin/components/Icon";
import { AdminDialog, Badge, FieldError, IconBtn, Select, TableCard, Toolbar, useAdminUi, type DialogHandle } from "@admin/components/AdminUi";
import type { TournamentType, VoucherKind } from "@admin/lib/data/tournaments";
import { BTAdmin, type AdminCode, type CsvColumn, type VoucherRow } from "@admin/lib/store";
import { cap, date, matches, money, type Tone } from "@admin/lib/ui";
import { VOUCHER_NEW_EVENT } from "./NewCodeButton";

type VoucherState = "active" | "used" | "expired";

const gives = (v: { kind: VoucherKind; value: number }): string => {
  if (v.kind === "percent") return v.value + "% off";
  if (v.kind === "free-entry") return "Free entry";
  return money(v.value) + " off";
};
const appliesTo = (list: TournamentType[] | undefined): string => (list || []).map(cap).join(", ") || "—";
const stateOf = (v: VoucherRow): VoucherState => {
  if (v.usesLeft <= 0) return "used";
  if (v.expiresAt && new Date(v.expiresAt) < new Date()) return "expired";
  return "active";
};
const STATE_TONE: Record<VoucherState, Tone> = { active: "ok", used: "muted", expired: "bad" };

const CSV_COLUMNS: CsvColumn<VoucherRow>[] = [
  ["username", "User"], ["code", "Code"], ["kind", "Kind"], ["value", "Value"], [(v) => (v.appliesTo || []).join(" "), "Applies to"],
  ["usesLeft", "Uses left"], ["usesTotal", "Uses total"], ["addedAt", "Added"], ["expiresAt", "Expires"], [stateOf, "State"],
];

const APPLY_OPTIONS: [TournamentType, string][] = [["main", "Main tournaments"], ["circuit", "Circuit"], ["mini", "Mini"]];

type FieldKey = "vo-code" | "vo-value" | "vo-days";

export default function VouchersBody() {
  const { toast, confirmAction } = useAdminUi();
  const [codes, setCodes] = useState<AdminCode[]>([]);
  const [held, setHeld] = useState<VoucherRow[]>([]);
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  // Create form
  const dlg = useRef<DialogHandle>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);
  const daysRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<VoucherKind>("amount");
  const [value, setValue] = useState("");
  const [days, setDays] = useState("30");
  const [applies, setApplies] = useState<TournamentType[]>(["main", "circuit", "mini"]);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [formMsg, setFormMsg] = useState("");
  const caret = useRef<number | null>(null);

  const renderCodes = () => setCodes(BTAdmin.adminCodes());
  const renderHeld = () => setHeld(BTAdmin.vouchers());

  const openCreate = (opener?: Element | null) => {
    setCode("");
    setKind("amount");
    setValue("");
    setDays("30");
    setApplies(["main", "circuit", "mini"]);
    setErrors({});
    setFormMsg("");
    dlg.current?.open(opener);
    codeRef.current?.focus();
  };

  const openCreateRef = useRef(openCreate);
  openCreateRef.current = openCreate;

  useEffect(() => {
    renderCodes();
    renderHeld();
    if (window.location.hash === "#new") openCreateRef.current();
    const onNew = (e: Event) => openCreateRef.current((e as CustomEvent<Element>).detail || null);
    window.addEventListener(VOUCHER_NEW_EVENT, onNew);
    return () => window.removeEventListener(VOUCHER_NEW_EVENT, onNew);
  }, []);

  // Search debounced 150 ms like the old onFilter; the held list is re-read on each filter change.
  useEffect(() => {
    const timer = window.setTimeout(() => setQ(query), 150);
    return () => window.clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    renderHeld();
  }, [q, stateFilter]);

  // Keep the caret where it was after the code is upper-cased / stripped.
  useEffect(() => {
    if (caret.current !== null && codeRef.current) {
      codeRef.current.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  }, [code]);

  const filteredHeld = held.filter((v) => {
    if (stateFilter && stateOf(v) !== stateFilter) return false;
    return matches(v, q.trim(), ["code", "kind", "username"]);
  });

  const toggleCode = (c: AdminCode) => {
    const active = c.active !== false;
    BTAdmin.setCodeActive(c.code, !active);
    toast(c.code + (active ? " disabled — it can no longer be redeemed." : " enabled."), active ? "warn" : "ok");
    renderCodes();
  };

  const removeCode = (c: AdminCode, opener: HTMLElement) => {
    confirmAction({ title: "Delete " + c.code + "?", text: "Nobody can redeem it any more. Vouchers already redeemed keep working.", confirm: "Delete code", tone: "bad" })
      .then((ok) => {
        if (!ok) { opener.focus(); return; }
        BTAdmin.deleteCode(c.code);
        toast(c.code + " deleted.", "warn");
        renderCodes();
      });
  };

  const exportCsv = () => {
    BTAdmin.exportCSV("battletrader-vouchers.csv", CSV_COLUMNS, filteredHeld);
    toast("CSV downloaded.");
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormMsg("");
    const upper = code.trim().toUpperCase();
    const amount = kind === "free-entry" ? 0 : Number(value);
    const dayCount = Number(days);
    const bad: Partial<Record<FieldKey, string>> = {};
    let msg = "";
    if (!/^[A-Z0-9]{4,16}$/.test(upper)) bad["vo-code"] = "Use 4–16 letters or numbers.";
    if (kind !== "free-entry" && (!amount || amount <= 0)) bad["vo-value"] = "Enter a discount above 0.";
    else if (kind === "percent" && amount > 100) bad["vo-value"] = "A percent discount can't be more than 100.";
    if (!dayCount || dayCount < 1 || dayCount > 365) bad["vo-days"] = "Between 1 and 365 days.";
    if (!applies.length) msg = "Pick at least one tournament type.";
    setErrors(bad);
    setFormMsg(msg);
    if (bad["vo-code"]) { codeRef.current?.focus(); return; }
    if (bad["vo-value"]) { valueRef.current?.focus(); return; }
    if (bad["vo-days"]) { daysRef.current?.focus(); return; }
    if (msg) return;

    const result = BTAdmin.createVoucher({ code: upper, kind, value: amount, days: dayCount, appliesTo: applies });
    if (!result.ok) {
      setErrors({ "vo-code": result.error });
      codeRef.current?.focus();
      return;
    }
    dlg.current?.close();
    toast(upper + " is live. Users can redeem it now.");
    renderCodes();
  };

  const invalid = (key: FieldKey) =>
    errors[key] ? { "aria-invalid": true as const, "aria-describedby": key + "-err" } : {};

  return (
    <>
      <h2 className="ad-section-h">Redeem codes</h2>
      <TableCard<AdminCode>
        id="vo-codes"
        caption="Redeem codes created in the admin"
        columns={[{ label: "Code" }, { label: "Gives" }, { label: "Applies to" }, { label: "Valid for" }, { label: "Created" }, { label: "Status" }, { label: "" }]}
        empty="No codes yet. Create one and share it with your community."
        items={codes}
        rowKey={(c) => c.code}
        renderRow={(c) => {
          const active = c.active !== false;
          return [
            <code className="ad-code" key="c">{c.code}</code>,
            gives(c),
            appliesTo(c.appliesTo),
            c.days + (c.days === 1 ? " day" : " days"),
            date(c.createdAt),
            <Badge text={active ? "Active" : "Disabled"} tone={active ? "ok" : "muted"} key="st" />,
            {
              node: (
                <span className="ad-actions">
                  <IconBtn icon={active ? "ban" : "tick"} label={(active ? "Disable " : "Enable ") + c.code} onClick={() => toggleCode(c)} variant={active ? "bad" : "ok"} />
                  <IconBtn icon="trash" label={"Delete " + c.code} onClick={(e) => removeCode(c, e.currentTarget)} variant="bad" />
                </span>
              ),
              label: "",
            },
          ];
        }}
      />
      <h2 className="ad-section-h" style={{ marginTop: "22px" }}>Vouchers held by users</h2>
      <Toolbar
        id="vo"
        searchLabel="Search vouchers"
        placeholder="Search by user or code…"
        query={query}
        onQuery={setQuery}
        selects={[{ id: "vo-state", label: "State", options: [["", "All"], ["active", "Active"], ["used", "Used"], ["expired", "Expired"]], value: stateFilter, onChange: setStateFilter }]}
      >
        <button className="ad-btn" type="button" id="vo-export" onClick={exportCsv}><Icon name="download" /><span>Export CSV</span></button>
      </Toolbar>
      <TableCard<VoucherRow>
        id="vo-held"
        caption="Vouchers held by users"
        columns={[{ label: "User" }, { label: "Code" }, { label: "Gives" }, { label: "Applies to" }, { label: "Uses left", num: true }, { label: "Expires" }, { label: "State" }]}
        empty="No vouchers match these filters."
        items={filteredHeld}
        total={held.length}
        rowKey={(v) => v.username + ":" + v.id}
        renderRow={(v) => {
          const state = stateOf(v);
          return [
            <Link className="ad-cell-link" href={"/admin/user/?u=" + encodeURIComponent(v.username)} key="u">{"@" + v.username}</Link>,
            <code className="ad-code" key="c">{v.code}</code>,
            gives(v),
            appliesTo(v.appliesTo),
            { node: v.usesLeft + " / " + v.usesTotal, num: true },
            date(v.expiresAt),
            <Badge text={cap(state)} tone={STATE_TONE[state]} key="st" />,
          ];
        }}
      />

      <AdminDialog ref={dlg} id="vo-dialog" title="Create redeem code">
        <form className="ad-form" id="vo-form" noValidate onSubmit={submit}>
          <label className="ad-field"><span>Code</span>
            <input
              type="text"
              id="vo-code"
              maxLength={16}
              autoComplete="off"
              placeholder="DIWALI50"
              style={{ textTransform: "uppercase" }}
              required
              ref={codeRef}
              value={code}
              onChange={(e) => {
                caret.current = e.target.selectionStart;
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
              }}
              {...invalid("vo-code")}
            />
            <small className="ad-hint">4&ndash;16 letters or numbers. Users type this on the Redeem page.</small>
            <FieldError id="vo-code" message={errors["vo-code"]} />
          </label>
          <div className="ad-form-grid">
            <label className="ad-field"><span>Kind</span>
              <Select id="vo-kind" value={kind} options={[["amount", "Dollar discount"], ["percent", "Percent discount"], ["free-entry", "Free entry"]]} onChange={(v) => setKind(v as VoucherKind)} />
            </label>
            <label className="ad-field" id="vo-value-wrap" hidden={kind === "free-entry"}><span id="vo-value-l">{kind === "percent" ? "Discount (%)" : "Discount ($)"}</span>
              <input type="number" id="vo-value" min="1" step="1" max={kind === "percent" ? "100" : undefined} required ref={valueRef} value={value} onChange={(e) => setValue(e.target.value)} {...invalid("vo-value")} />
              <FieldError id="vo-value" message={errors["vo-value"]} />
            </label>
            <label className="ad-field"><span>Valid for (days after redeeming)</span>
              <input type="number" id="vo-days" min="1" max="365" step="1" required ref={daysRef} value={days} onChange={(e) => setDays(e.target.value)} {...invalid("vo-days")} />
              <FieldError id="vo-days" message={errors["vo-days"]} />
            </label>
          </div>
          <fieldset className="ad-fieldset" id="vo-applies">
            <legend>Works on</legend>
            {APPLY_OPTIONS.map(([key, label]) => (
              <label className="ad-check" key={key}>
                <input
                  type="checkbox"
                  value={key}
                  checked={applies.indexOf(key) !== -1}
                  onChange={(e) => setApplies((list) => (e.target.checked ? APPLY_OPTIONS.map((o) => o[0]).filter((k) => k === key || list.indexOf(k) !== -1) : list.filter((k) => k !== key)))}
                /> {label}
              </label>
            ))}
          </fieldset>
          <p className="ad-form-msg is-err" id="vo-form-msg" role="alert" hidden={!formMsg}>{formMsg}</p>
          <div className="ad-form-actions">
            <button className="ad-btn ad-btn-ghost" type="button" data-close>Cancel</button>
            <button className="ad-btn ad-btn-primary" type="submit"><Icon name="check" /><span>Create code</span></button>
          </div>
        </form>
      </AdminDialog>
    </>
  );
}
