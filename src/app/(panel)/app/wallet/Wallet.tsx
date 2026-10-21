"use client";

// Port of the old wallet.js page half: balance hero, KYC-gated cash-out, activity tabs, ?topup= prefill.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Svg } from "@panel/components/Icon";
import { usePanel } from "@panel/lib/panel";
import { MIN, TX_CHANGED, addTransaction, cents, isVerified, openTopup, parseAmount, transactions, usd, type WalletTx } from "./walletShared";

const TYPES: Record<string, { label: string; sign: number; icon: string }> = {
  topup: { label: "Wallet top-up", sign: 1, icon: '<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>' },
  entry: { label: "Tournament entry", sign: -1, icon: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>' },
  cashout: { label: "Cash-out", sign: -1, icon: '<path d="M12 20V8M6 14l6-6 6 6M4 4h16"/>' },
  refund: { label: "Entry refund", sign: 1, icon: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/>' },
  reward: { label: "Prize reward", sign: 1, icon: '<path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 12H5z"/>' },
};
const STATUSES = ["completed", "pending", "failed"];
const TABS = [
  { key: "all", id: "wl-tab-all", panel: "wl-panel-all", label: "Transaction history" },
  { key: "cash", id: "wl-tab-cash", panel: "wl-panel-cash", label: "Cash-outs" },
] as const;

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) + ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function TxRow({ tx }: { tx: WalletTx }) {
  const known = !!TYPES[tx.type];
  const meta = TYPES[tx.type] || TYPES.topup;
  const status = STATUSES.indexOf(tx.status) >= 0 ? tx.status : "pending";
  const when = formatDate(tx.at);
  return (
    <li className={"wl-row t-" + (known ? tx.type : "topup")}>
      <span className="wl-row-ico" aria-hidden="true"><Svg body={meta.icon} /></span>
      <span className="wl-row-txt"><b>{meta.label}</b><small>{tx.note ? when + " \u00b7 " + tx.note : when}</small></span>
      <span className={"wl-amt " + (meta.sign > 0 ? "is-in" : "is-out")}>{(meta.sign > 0 ? "+" : "\u2212") + usd(Math.abs(Number(tx.amount) || 0))}</span>
      <span className={"wl-status s-" + status}>{status}</span>
    </li>
  );
}

export default function Wallet() {
  const { wallet, setWallet, toast } = usePanel();
  const [loaded, setLoaded] = useState(false);
  const [txs, setTxs] = useState<WalletTx[]>([]);
  const [verified, setVerified] = useState(false);
  const [tab, setTab] = useState<"all" | "cash">("all");
  const [cashInput, setCashInput] = useState("");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const heroBtnRef = useRef<HTMLButtonElement>(null);

  const reload = useCallback(() => {
    setTxs(transactions());
    setVerified(isVerified());
    setLoaded(true);
  }, []);

  useEffect(() => {
    reload();
    window.addEventListener(TX_CHANGED, reload);
    // wallet/?topup=<amount>: the tournament enroll flow sends short-funded users here.
    const params = new URLSearchParams(window.location.search);
    if (params.has("topup")) {
      const wanted = Number(params.get("topup"));
      const prefill = isFinite(wanted) && wanted > 0 ? cents(wanted) : "";
      params.delete("topup");
      const rest = params.toString();
      window.history.replaceState(window.history.state, "", window.location.pathname + (rest ? "?" + rest : "") + window.location.hash);
      // Defer one frame so the dialog in the `after` slot has registered its listener.
      window.requestAnimationFrame(() => openTopup(prefill, heroBtnRef.current));
    }
    return () => window.removeEventListener(TX_CHANGED, reload);
  }, [reload]);

  // Returns the reason the cash-out cannot go ahead, or "" when it can.
  const cashBlocker = (): string => {
    if (!verified) return "Complete KYC verification in your profile to cash out.";
    const raw = cashInput.trim();
    if (!raw) return "Enter the amount you want to cash out.";
    const amount = parseAmount(raw);
    if (isNaN(amount)) return "Use numbers only, e.g. 100.";
    if (amount < MIN) return "Minimum cash-out is $20.";
    if (amount > wallet.balance) return "That is more than your available balance of " + usd(wallet.balance) + ".";
    return "";
  };
  const reason = loaded ? cashBlocker() : "";
  const typedBad = reason !== "" && verified && cashInput.trim() !== "";

  const submitCash = (event: React.FormEvent) => {
    event.preventDefault();
    if (cashBlocker()) return;
    const amount = parseAmount(cashInput);
    setWallet({ balance: cents(wallet.balance - amount), credits: wallet.credits, tickets: wallet.tickets });
    addTransaction({ id: "tx-" + Date.now(), type: "cashout", amount, at: new Date().toISOString(), status: "pending", note: "Under review" });
    setCashInput("");
    toast("Cash-out requested", usd(amount) + " is pending review. We'll notify you when it's sent.");
  };

  const selectTab = (index: number, focus: boolean) => {
    setTab(TABS[index].key);
    if (focus) tabRefs.current[index]?.focus();
  };
  const onTabKey = (event: React.KeyboardEvent, i: number) => {
    let next = -1;
    if (event.key === "ArrowRight") next = (i + 1) % TABS.length;
    else if (event.key === "ArrowLeft") next = (i - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TABS.length - 1;
    if (next < 0) return;
    event.preventDefault();
    selectTab(next, true);
  };

  const lists = { all: txs, cash: txs.filter((tx) => tx.type === "cashout") };
  const onTopup = (event: React.MouseEvent<HTMLElement>) => openTopup("", event.currentTarget);

  return (
    <>
      <section className="ah wl-hero" aria-labelledby="wl-title">
        <div className="ah-txt">
          <div className="wl-hero-head">
            <span className="wl-hero-ico" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M3 10h18M16 15h2" /></svg></span>
            <p className="wl-tag"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z" /></svg>My wallet</p>
          </div>
          <h1 id="wl-title">Available <span>balance</span></h1>
          <p>Manage your tournament prize money</p>
        </div>
        <div className="wl-bal" data-glass="">
          <p className="wl-bal-lbl">Available balance</p>
          <p className="wl-bal-num" id="wl-balance">{usd(wallet.balance)}</p>
          <div className="wl-bal-meta">
            <span className="wl-credits"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>Credits <b id="wl-credits">{String(wallet.credits || 0)}</b></span>
            <Link className="wl-kyc" id="wl-kyc-badge" href="/app/profile/#kyc" hidden={verified}><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>KYC required</Link>
          </div>
          <button className="btn b-ember wl-hero-btn" id="wl-topup-hero" type="button" data-topup="" ref={heroBtnRef} onClick={onTopup}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>Top up</button>
        </div>
      </section>

      <div className="wl-grid">
        <section className="ac wl-card wl-card-top" aria-labelledby="wl-top-h">
          <div className="ac-h"><h2 id="wl-top-h"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>Top up wallet</h2><span className="ac-chip wl-chip-crypto">Crypto</span></div>
          <p className="wl-copy">Top up with crypto - complete your payment on the secure payment page.</p>
          <ul className="wl-perks">
            <li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>USDT on the TRC20 network</li>
            <li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>From $20 up to $10,000 per top-up</li>
            <li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>Balance ready for your next battle entry</li>
          </ul>
          <div className="wl-card-foot">
            <button className="btn b-ember btn-block" id="wl-topup-card" type="button" data-topup="" onClick={onTopup}>Top up</button>
          </div>
        </section>

        <section className="ac wl-card wl-card-cash" aria-labelledby="wl-cash-h">
          <div className="ac-h"><h2 id="wl-cash-h"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20V8M6 14l6-6 6 6M4 4h16" /></svg>Cash out</h2><span className="wl-chip-kyc" id="wl-cash-kyc" hidden={verified}>KYC required</span></div>
          <form className="wl-form" id="wl-cash-form" noValidate onSubmit={submitCash}>
            <p className="wl-copy">Request a cash-out</p>
            <label className="wl-label" htmlFor="wl-cash-amount">Amount (USD)</label>
            <div className="wl-field">
              <span aria-hidden="true">$</span>
              <input
                id="wl-cash-amount"
                name="amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="100"
                aria-describedby="wl-cash-hint wl-cash-reason"
                aria-invalid={typedBad ? "true" : "false"}
                value={cashInput}
                onChange={(event) => setCashInput(event.target.value)}
              />
            </div>
            <p className="wl-hint" id="wl-cash-hint">Minimum cash-out: $20</p>
            <p className="wl-reason" id="wl-cash-reason" aria-live="polite">{reason}</p>
            <div className="wl-card-foot wl-cash-foot">
              <button className="btn b-line btn-block" id="wl-cash-btn" type="submit" disabled={!loaded || reason !== ""}>Cash out</button>
              <Link className="wl-kyc-link" id="wl-cash-kyc-link" href="/app/profile/#kyc" hidden={verified}><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>Verify your identity</Link>
            </div>
          </form>
        </section>
      </div>

      <section className="ac wl-hist" aria-labelledby="wl-hist-h">
        <div className="ac-h"><h2 id="wl-hist-h"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>Wallet activity</h2></div>
        <div className="wl-tabs" role="tablist" aria-label="Wallet activity">
          {TABS.map((t, i) => {
            const on = t.key === tab;
            return (
              <button
                key={t.key}
                ref={(node) => {
                  tabRefs.current[i] = node;
                }}
                className="wl-tab"
                id={t.id}
                role="tab"
                type="button"
                aria-selected={on ? "true" : "false"}
                aria-controls={t.panel}
                tabIndex={on ? 0 : -1}
                onClick={() => selectTab(i, false)}
                onKeyDown={(event) => onTabKey(event, i)}
              >
                {t.label} <span className="wl-count" data-count={t.key}>{String(lists[t.key].length)}</span>
              </button>
            );
          })}
        </div>
        <div className="wl-panel" id="wl-panel-all" role="tabpanel" aria-labelledby="wl-tab-all" tabIndex={0} hidden={tab !== "all"}>
          <ul className="wl-list" data-list="all" hidden={loaded && lists.all.length === 0}>
            {lists.all.map((tx, i) => <TxRow key={tx.id + ":" + i} tx={tx} />)}
          </ul>
          <div className="wl-empty" data-empty="all" hidden={!loaded || lists.all.length > 0}>
            <span className="wl-empty-ico" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg></span>
            <b>No transactions found</b>
            <p>Top up your wallet to pay entry fees and join your first battle.</p>
            <button className="ab2" type="button" data-topup="" onClick={onTopup}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>Top up wallet</button>
          </div>
        </div>
        <div className="wl-panel" id="wl-panel-cash" role="tabpanel" aria-labelledby="wl-tab-cash" tabIndex={0} hidden={tab !== "cash"}>
          <ul className="wl-list" data-list="cash" hidden={loaded && lists.cash.length === 0}>
            {lists.cash.map((tx, i) => <TxRow key={tx.id + ":" + i} tx={tx} />)}
          </ul>
          <div className="wl-empty" data-empty="cash" hidden={!loaded || lists.cash.length > 0}>
            <span className="wl-empty-ico" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg></span>
            <b>No transactions found</b>
            <p>Win prize money in the arena, then cash it out here.</p>
            <Link className="ab2" href="/app/browse-tournaments/"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2" /></svg>Find a battle</Link>
          </div>
        </div>
      </section>

      <p className="wl-foot">Sandbox wallet with sample data &middot; no real funds move until payments go live.</p>
    </>
  );
}
