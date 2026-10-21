"use client";

// Port of admin/assets/js/transactions.js — money KPIs, filters (?u= preselects the user), table with approve /
// decline for pending rows, CSV export and the #tx-dialog manual adjustment.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Icon from "@admin/components/Icon";
import { AdminDialog, DatePicker, FieldError, IconBtn, Select, StatusBadge, TableCard, Toolbar, useAdminUi, type DialogHandle } from "@admin/components/AdminUi";
import { BTAdmin, type CsvColumn, type TransactionRow, type TransactionStatus, type WalletAccountRow } from "@admin/lib/store";
import { cap, date, matches, money, num } from "@admin/lib/ui";
import { ADJUST_EVENT } from "./AdjustButton";

const TYPE_LABEL: Record<string, string> = { topup: "Top-up", entry: "Entry fee", cashout: "Cash-out", refund: "Refund", reward: "Reward" };
const INCOMING: Record<string, boolean> = { topup: true, refund: true, reward: true };

const CSV_COLUMNS: CsvColumn<TransactionRow>[] = [
  ["id", "ID"], ["at", "Date"], ["username", "User"], ["type", "Type"], ["status", "Status"], ["amount", "Amount"], ["note", "Note"],
];

type FieldKey = "tx-d-user" | "tx-amount" | "tx-note";

export default function TransactionsBody() {
  const { toast, confirmAction } = useAdminUi();
  const params = useSearchParams();
  const [all, setAll] = useState<TransactionRow[]>([]);
  const [wallets, setWallets] = useState<WalletAccountRow[]>([]);
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  const [user, setUser] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Adjustment dialog
  const dlg = useRef<DialogHandle>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const userRef = useRef<HTMLButtonElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);
  const [pickList, setPickList] = useState<WalletAccountRow[]>([]);
  const [pick, setPick] = useState("");
  const [dir, setDir] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [formMsg, setFormMsg] = useState("");
  const [balance, setBalance] = useState("$0");
  const [loaded, setLoaded] = useState(false);

  const reload = () => {
    setAll(BTAdmin.transactions());
    setWallets(BTAdmin.walletAccounts());
  };

  useEffect(() => {
    const list = BTAdmin.transactions();
    setAll(list);
    setWallets(BTAdmin.walletAccounts());
    setLoaded(true);
    const wanted = params.get("u") || "";
    if (wanted && list.some((t) => t.username === wanted)) setUser(wanted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search is debounced like the old onFilter (150 ms for text inputs).
  useEffect(() => {
    const timer = window.setTimeout(() => setQ(query), 150);
    return () => window.clearTimeout(timer);
  }, [query]);

  const filtered = (() => {
    const fromMs = from ? new Date(from + "T00:00:00").getTime() : -Infinity;
    const toMs = to ? new Date(to + "T23:59:59").getTime() : Infinity;
    return all.filter((t) => {
      if (user && t.username !== user) return false;
      if (type && t.type !== type) return false;
      if (status && t.status !== status) return false;
      const at = new Date(t.at).getTime();
      if (at < fromMs || at > toMs) return false;
      return matches(t, q.trim(), ["note", "type", "id", "username"]);
    });
  })();

  const userNames = Object.keys(all.reduce<Record<string, true>>((names, t) => { names[t.username] = true; return names; }, {})).sort();

  // Summary KPIs
  const shownWallets = wallets.filter((w) => !user || w.username === user);
  const done = filtered.filter((t) => t.status === "completed");
  const sum = (kind: string) => {
    const list = done.filter((t) => t.type === kind);
    return { total: list.reduce((s, t) => s + Number(t.amount || 0), 0), count: list.length };
  };
  const ins = sum("topup");
  const outs = sum("cashout");
  const prizes = sum("reward");

  const decide = (t: TransactionRow, next: TransactionStatus, opener: HTMLElement) => {
    const verb = next === "completed" ? "Approve" : "Decline";
    confirmAction({
      title: verb + " this " + (TYPE_LABEL[t.type] || t.type).toLowerCase() + "?",
      text: "@" + t.username + " · " + money(t.amount) + (t.note ? " — " + t.note : "") + ". The user sees the new status in their wallet.",
      confirm: verb,
      tone: next === "failed" ? "bad" : undefined,
    }).then((ok) => {
      if (!ok) { opener.focus(); return; }
      BTAdmin.setTransactionStatus(t.id, next);
      toast(verb === "Approve" ? "Marked completed." : "Marked failed.", next === "failed" ? "warn" : "ok");
      reload();
    });
  };

  const exportCsv = () => {
    BTAdmin.exportCSV("battletrader-transactions.csv", CSV_COLUMNS, filtered);
    toast("CSV downloaded.");
  };

  /* ---------- Manual adjustment ---------- */
  const showBalance = (username: string) => {
    const w = BTAdmin.wallet(username);
    setBalance(w ? money(w.balance) : "—");
  };

  const openAdjust = (opener: Element | null) => {
    const list = BTAdmin.walletAccounts();
    setPickList(list);
    // A select falls back to its first option; an unknown preselected user leaves it empty like the old DOM did.
    const first = list.length ? list[0].username : "";
    const next = user ? (list.some((w) => w.username === user) ? user : "") : first;
    setPick(next);
    setDir("credit");
    setAmount("");
    setNote("");
    setErrors({});
    setFormMsg("");
    showBalance(next);
    dlg.current?.open(opener);
    amountRef.current?.focus();
  };

  const openAdjustRef = useRef(openAdjust);
  openAdjustRef.current = openAdjust;
  useEffect(() => {
    const onAdjust = (e: Event) => openAdjustRef.current((e as CustomEvent<Element>).detail || null);
    window.addEventListener(ADJUST_EVENT, onAdjust);
    return () => window.removeEventListener(ADJUST_EVENT, onAdjust);
  }, []);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormMsg("");
    const value = Number(amount);
    const reason = note.trim();
    const bad: Partial<Record<FieldKey, string>> = {};
    if (!pick) bad["tx-d-user"] = "Pick a user.";
    if (!value || value <= 0) bad["tx-amount"] = "Enter an amount above $0.";
    if (reason.length < 3) bad["tx-note"] = "Say why — the user sees this note.";
    setErrors(bad);
    if (bad["tx-d-user"]) { userRef.current?.focus(); return; }
    if (bad["tx-amount"]) { amountRef.current?.focus(); return; }
    if (bad["tx-note"]) { noteRef.current?.focus(); return; }
    const debit = dir === "debit";
    const result = BTAdmin.adjustWallet(pick, debit ? -value : value, reason);
    if (!result || "error" in result) {
      setFormMsg((result && result.error) || "Couldn't apply this adjustment.");
      return;
    }
    dlg.current?.close();
    toast((debit ? "Debited " : "Credited ") + money(value) + " for @" + pick + ". New balance " + money(result.wallet.balance) + ".");
    reload();
  };

  const invalid = (key: FieldKey) =>
    errors[key] ? { "aria-invalid": true as const, "aria-describedby": key + "-err" } : {};

  return (
    <>
      <div className="ad-kpis" aria-label="Money">
        <div className="ad-kpi is-green"><span className="ad-kpi-l"><Icon name="wallet" />Held in wallets</span><b className="ad-kpi-v" id="tx-balance">{money(shownWallets.reduce((s, w) => s + w.balance, 0))}</b><span className="ad-kpi-s" id="tx-owner">{!loaded ? "" : user ? "@" + user : shownWallets.length + (shownWallets.length === 1 ? " wallet" : " wallets")}</span></div>
        <div className="ad-kpi is-cyan"><span className="ad-kpi-l"><Icon name="trend" />Top-ups</span><b className="ad-kpi-v" id="tx-in">{money(ins.total)}</b><span className="ad-kpi-s" id="tx-in-s">{loaded ? ins.count + (ins.count === 1 ? " payment" : " payments") : ""}</span></div>
        <div className="ad-kpi is-red"><span className="ad-kpi-l"><Icon name="trendDown" />Cash-outs</span><b className="ad-kpi-v" id="tx-out">{money(outs.total)}</b><span className="ad-kpi-s" id="tx-out-s">{loaded ? outs.count + (outs.count === 1 ? " payout" : " payouts") : ""}</span></div>
        <div className="ad-kpi is-gold"><span className="ad-kpi-l"><Icon name="clock" />Pending</span><b className="ad-kpi-v" id="tx-pending">{num(filtered.filter((t) => t.status === "pending").length)}</b><span className="ad-kpi-s">need a decision</span></div>
        <div className="ad-kpi is-pink"><span className="ad-kpi-l"><Icon name="trophy" />Prizes paid</span><b className="ad-kpi-v" id="tx-prizes">{money(prizes.total)}</b><span className="ad-kpi-s" id="tx-prizes-s">{loaded ? prizes.count + (prizes.count === 1 ? " reward" : " rewards") : ""}</span></div>
      </div>
      <Toolbar
        id="tx"
        searchLabel="Search transactions"
        placeholder="Search user or note…"
        query={query}
        onQuery={setQuery}
        selects={[
          { id: "tx-user", label: "User", options: [["", "All users"], ...userNames.map((n): [string, string] => [n, "@" + n])], value: user, onChange: setUser },
          { id: "tx-type", label: "Type", options: [["", "All types"], ["topup", "Top-up"], ["entry", "Entry fee"], ["cashout", "Cash-out"], ["refund", "Refund"], ["reward", "Reward"]], value: type, onChange: setType },
          { id: "tx-status", label: "Status", options: [["", "All"], ["completed", "Completed"], ["pending", "Pending"], ["failed", "Failed"]], value: status, onChange: setStatus },
        ]}
      >
        <DatePicker id="tx-from" label="From" value={from} onChange={setFrom} />
        <DatePicker id="tx-to" label="To" value={to} onChange={setTo} />
        <button className="ad-btn" type="button" id="tx-export" style={{ alignSelf: "flex-end" }} onClick={exportCsv}><Icon name="download" /><span>Export CSV</span></button>
      </Toolbar>
      <TableCard<TransactionRow>
        id="tx-table"
        caption="Transactions"
        columns={[{ label: "Date" }, { label: "User" }, { label: "Type" }, { label: "Note" }, { label: "Status" }, { label: "Amount", num: true }, { label: "" }]}
        empty="No transactions match these filters."
        items={filtered}
        total={all.length}
        rowKey={(t) => t.username + ":" + t.id}
        renderRow={(t) => {
          const label = TYPE_LABEL[t.type] || t.type;
          const sign = INCOMING[t.type] ? "+" : "−";
          return [
            date(t.at, true),
            <Link className="ad-cell-link" href={"/admin/user/?u=" + encodeURIComponent(t.username)} key="u">{"@" + t.username}</Link>,
            label,
            t.note || "—",
            <StatusBadge status={t.status === "completed" ? "completed_tx" : t.status} label={cap(t.status)} key="st" />,
            { node: <span className={INCOMING[t.type] ? "ad-amt is-in" : "ad-amt is-out"}>{sign + money(t.amount)}</span>, num: true },
            {
              node: t.status === "pending" ? (
                <span className="ad-actions">
                  <IconBtn icon="tick" label={"Approve " + label + " for @" + t.username} onClick={(e) => decide(t, "completed", e.currentTarget)} variant="ok" />
                  <IconBtn icon="x" label={"Decline " + label + " for @" + t.username} onClick={(e) => decide(t, "failed", e.currentTarget)} variant="bad" />
                </span>
              ) : <span></span>,
              label: "",
            },
          ];
        }}
      />

      <AdminDialog ref={dlg} id="tx-dialog" title="Adjust a balance">
        <form className="ad-form" id="tx-form" noValidate onSubmit={submit}>
          <label className="ad-field"><span>User</span>
            <Select
              id="tx-d-user"
              ref={userRef}
              value={pick}
              placeholder="Choose a user"
              options={pickList.map((w): [string, string] => [w.username, "@" + w.username + (w.fullName ? " — " + w.fullName : "") + (w.live ? " (signed in here)" : "")])}
              onChange={(v) => { setPick(v); showBalance(v); }}
              {...invalid("tx-d-user")}
            />
            <FieldError id="tx-d-user" message={errors["tx-d-user"]} />
          </label>
          <p className="ad-hint">Current balance: <b id="tx-d-balance">{balance}</b></p>
          <fieldset className="ad-fieldset">
            <legend>Direction</legend>
            <label className="ad-check"><input type="radio" name="tx-dir" value="credit" checked={dir === "credit"} onChange={() => setDir("credit")} /> Credit &mdash; add money (shown as a reward)</label>
            <label className="ad-check"><input type="radio" name="tx-dir" value="debit" checked={dir === "debit"} onChange={() => setDir("debit")} /> Debit &mdash; remove money</label>
          </fieldset>
          <label className="ad-field"><span>Amount ($)</span>
            <input type="number" id="tx-amount" min="0.01" step="0.01" required ref={amountRef} value={amount} onChange={(e) => setAmount(e.target.value)} {...invalid("tx-amount")} />
            <FieldError id="tx-amount" message={errors["tx-amount"]} />
          </label>
          <label className="ad-field"><span>Reason</span>
            <input type="text" id="tx-note" maxLength={120} placeholder="e.g. Compensation for outage on 12 Oct" required ref={noteRef} value={note} onChange={(e) => setNote(e.target.value)} {...invalid("tx-note")} />
            <FieldError id="tx-note" message={errors["tx-note"]} />
          </label>
          <p className="ad-form-msg is-err" id="tx-form-msg" role="alert" hidden={!formMsg}>{formMsg}</p>
          <div className="ad-form-actions">
            <button className="ad-btn ad-btn-ghost" type="button" data-close>Cancel</button>
            <button className="ad-btn ad-btn-primary" type="submit"><Icon name="check" /><span>Apply</span></button>
          </div>
        </form>
      </AdminDialog>
    </>
  );
}
