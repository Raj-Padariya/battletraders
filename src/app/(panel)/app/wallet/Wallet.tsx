"use client";

// Port of the old wallet.js page half: balance hero, KYC-gated cash-out, activity tabs, ?topup= prefill.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Svg } from "@panel/components/Icon";
import { usePanel } from "@panel/lib/panel";
import { MAX, MIN, TX_CHANGED, addTransaction, cents, isVerified, openTopup, parseAmount, transactions, usd, type WalletTx } from "./walletShared";

const TYPES: Record<string, { label: string; sign: number; icon: string }> = {
  topup: { label: "Wallet top-up", sign: 1, icon: '<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>' },
  entry: { label: "Tournament entry", sign: -1, icon: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>' },
  cashout: { label: "Cash-out", sign: -1, icon: '<path d="M12 20V8M6 14l6-6 6 6M4 4h16"/>' },
  refund: { label: "Entry refund", sign: 1, icon: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/>' },
  reward: { label: "Prize reward", sign: 1, icon: '<path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 12H5z"/>' },
};
const STATUSES = ["completed", "pending", "failed"];
const QUICK_AMOUNTS = [50, 100, 250, 500];

const ICON = {
  wallet: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  up: '<path d="M12 20V8M6 14l6-6 6 6M4 4h16"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  swords: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2"/>',
};

const TABS = [
  { key: "all", label: "All" },
  { key: "in", label: "Money in" },
  { key: "out", label: "Money out" },
  { key: "cash", label: "Cash-outs" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const EMPTY: Record<TabKey, { title: string; text: string; action: "topup" | "battle" }> = {
  all: { title: "No transactions yet", text: "Top up your wallet to pay entry fees and join your first battle.", action: "topup" },
  in: { title: "No money in yet", text: "Top-ups, entry refunds and prize rewards show up here.", action: "topup" },
  out: { title: "No money out yet", text: "Tournament entry fees and cash-outs show up here.", action: "battle" },
  cash: { title: "No cash-outs yet", text: "Win prize money in the arena, then cash it out here.", action: "battle" },
};

const signOf = (tx: WalletTx): number => (TYPES[tx.type] || TYPES.topup).sign;

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) + ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function TxRow({ tx }: { tx: WalletTx }) {
  const meta = TYPES[tx.type] || TYPES.topup;
  const status = STATUSES.indexOf(tx.status) >= 0 ? tx.status : "pending";
  const when = formatDate(tx.at);
  const flow = meta.sign > 0 ? "is-in" : "is-out";
  return (
    <li className={"wl-row " + flow}>
      <span className="wl-row-ico" aria-hidden="true"><Svg body={meta.icon} /></span>
      <span className="wl-row-txt"><b>{meta.label}</b><small>{tx.note ? when + " \u00b7 " + tx.note : when}</small></span>
      <span className={"wl-amt " + flow}>{(meta.sign > 0 ? "+" : "\u2212") + usd(Math.abs(Number(tx.amount) || 0))}</span>
      <span className={"wl-status s-" + status}>{status}</span>
    </li>
  );
}

export default function Wallet() {
  const { profile, wallet, setWallet, toast } = usePanel();
  const [loaded, setLoaded] = useState(false);
  const [txs, setTxs] = useState<WalletTx[]>([]);
  const [verified, setVerified] = useState(false);
  const [tab, setTab] = useState<TabKey>("all");
  const [cashInput, setCashInput] = useState("");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const heroBtnRef = useRef<HTMLButtonElement>(null);
  const cashInputRef = useRef<HTMLInputElement>(null);

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

  const lists: Record<TabKey, WalletTx[]> = {
    all: txs,
    in: txs.filter((tx) => signOf(tx) > 0),
    out: txs.filter((tx) => signOf(tx) < 0),
    cash: txs.filter((tx) => tx.type === "cashout"),
  };
  const onTopup = (event: React.MouseEvent<HTMLElement>) => openTopup("", event.currentTarget);
  const goToCashOut = () => {
    document.getElementById("wl-cash")?.scrollIntoView({ behavior: "smooth", block: "center" });
    cashInputRef.current?.focus({ preventScroll: true });
  };

  const totalOf = (pick: (tx: WalletTx) => boolean): string =>
    usd(cents(txs.filter(pick).reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0)));
  const stats = [
    { tone: "s-in", label: "Topped up", value: totalOf((tx) => tx.type === "topup" && tx.status === "completed"), note: "USDT deposits" },
    { tone: "s-win", label: "Prize winnings", value: totalOf((tx) => tx.type === "reward" && tx.status === "completed"), note: "Paid into your wallet" },
    { tone: "s-out", label: "Spent on entries", value: totalOf((tx) => tx.type === "entry" && tx.status !== "failed"), note: "Tournament fees" },
    { tone: "s-wait", label: "Pending cash-out", value: totalOf((tx) => tx.type === "cashout" && tx.status === "pending"), note: "Under review" },
  ];

  const [balWhole, balCents] = usd(wallet.balance).split(".");

  return (
    <>
      <section className="ah wl-hero" aria-labelledby="wl-title">
        <div className="ah-txt">
          <div className="wl-hero-head">
            <span className="wl-hero-ico" aria-hidden="true"><Svg body={ICON.wallet} /></span>
            <p className="wl-tag">My wallet</p>
          </div>
          <h1 id="wl-title">Your <span>wallet</span></h1>
          <p>Top up for battle entries, collect your prize money and cash it out.</p>
          <div className="wl-hero-actions">
            <button className="btn b-ember" id="wl-topup-hero" type="button" data-topup="" ref={heroBtnRef} onClick={onTopup}><Svg body={ICON.plus} />Top up</button>
            <button className="btn b-line" type="button" onClick={goToCashOut}><Svg body={ICON.up} />Cash out</button>
          </div>
        </div>

        <div className="aw-card wl-bank">
          <div className="aw-card-top">
            <span className="wl-bank-id"><span className="aw-chip" aria-hidden="true"><Svg body={ICON.wallet} /></span><span className="aw-brand">BattleTrader</span></span>
            {verified ? (
              <span className="wl-verified"><Svg body={ICON.shield} />Verified</span>
            ) : (
              <Link className="wl-kyc" id="wl-kyc-badge" href="/app/profile/#kyc"><Svg body={ICON.lock} />KYC required</Link>
            )}
          </div>
          <p className="wl-bank-lbl">Available balance</p>
          <p className="wl-bank-num" id="wl-balance">{balWhole}<span>.{balCents}</span></p>
          <p className="wl-bank-sub">
            <span>Credits<b id="wl-credits">{String(wallet.credits || 0)}</b></span>
            <span>Free tickets<b>{String(wallet.tickets || 0)}</b></span>
          </p>
          <p className="aw-holder"><span>{profile.username}</span><span>USD</span></p>
        </div>
      </section>

      <ul className="wl-stats" aria-label="Wallet summary">
        {stats.map((s) => (
          <li key={s.label} className={"wl-stat " + s.tone}>
            <small><i aria-hidden="true" />{s.label}</small>
            <b>{loaded ? s.value : "\u2014"}</b>
            <em>{s.note}</em>
          </li>
        ))}
      </ul>

      <div className="wl-grid">
        <section className="ac wl-card wl-card-top" aria-labelledby="wl-top-h">
          <div className="ac-h"><h2 id="wl-top-h"><Svg body={ICON.plus} />Top up wallet</h2><span className="ac-chip wl-chip-crypto">USDT &middot; TRC20</span></div>
          <p className="wl-copy">Pick an amount to start, or choose your own on the payment page.</p>
          <div className="wl-quick" role="group" aria-label="Quick top-up amounts">
            {QUICK_AMOUNTS.map((amount) => (
              <button key={amount} type="button" onClick={(event) => openTopup(amount, event.currentTarget)}>${amount}</button>
            ))}
          </div>
          <ul className="wl-perks">
            <li><Svg body={ICON.check} />From {usd(MIN)} up to {usd(MAX)} per top-up</li>
            <li><Svg body={ICON.check} />Balance ready for your next battle entry</li>
          </ul>
          <div className="wl-card-foot">
            <button className="btn b-ember btn-block" id="wl-topup-card" type="button" data-topup="" onClick={onTopup}>Top up</button>
          </div>
        </section>

        <section className="ac wl-card wl-card-cash" id="wl-cash" aria-labelledby="wl-cash-h">
          <div className="ac-h"><h2 id="wl-cash-h"><Svg body={ICON.up} />Cash out</h2>{!verified && <span className="wl-chip-kyc" id="wl-cash-kyc">KYC required</span>}</div>
          <form className="wl-form" id="wl-cash-form" noValidate onSubmit={submitCash}>
            <p className="wl-copy">Send your prize money to your crypto wallet.</p>
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
                ref={cashInputRef}
                aria-describedby="wl-cash-hint wl-cash-reason"
                aria-invalid={typedBad ? "true" : "false"}
                value={cashInput}
                onChange={(event) => setCashInput(event.target.value)}
              />
              <button className="wl-max" type="button" disabled={!verified || wallet.balance <= 0} onClick={() => setCashInput(String(cents(wallet.balance)))}>Max</button>
            </div>
            <p className="wl-hint" id="wl-cash-hint">Minimum {usd(MIN)} &middot; Available {usd(wallet.balance)}</p>
            <p className="wl-reason" id="wl-cash-reason" aria-live="polite">{reason}</p>
            <div className="wl-card-foot wl-cash-foot">
              <button className="btn b-line btn-block" id="wl-cash-btn" type="submit" disabled={!loaded || reason !== ""}>Cash out</button>
              {!verified && <Link className="wl-kyc-link" id="wl-cash-kyc-link" href="/app/profile/#kyc"><Svg body={ICON.lock} />Verify your identity</Link>}
            </div>
          </form>
        </section>
      </div>

      <section className="ac wl-hist" aria-labelledby="wl-hist-h">
        <div className="ac-h"><h2 id="wl-hist-h"><Svg body={ICON.clock} />Wallet activity</h2></div>
        <div className="wl-tabs" role="tablist" aria-label="Filter wallet activity">
          {TABS.map((t, i) => {
            const on = t.key === tab;
            return (
              <button
                key={t.key}
                ref={(node) => {
                  tabRefs.current[i] = node;
                }}
                className="wl-tab"
                id={"wl-tab-" + t.key}
                role="tab"
                type="button"
                aria-selected={on ? "true" : "false"}
                aria-controls={"wl-panel-" + t.key}
                tabIndex={on ? 0 : -1}
                onClick={() => selectTab(i, false)}
                onKeyDown={(event) => onTabKey(event, i)}
              >
                {t.label} <span className="wl-count">{String(lists[t.key].length)}</span>
              </button>
            );
          })}
        </div>
        {TABS.map((t) => {
          const list = lists[t.key];
          const empty = EMPTY[t.key];
          return (
            <div key={t.key} className="wl-panel" id={"wl-panel-" + t.key} role="tabpanel" aria-labelledby={"wl-tab-" + t.key} tabIndex={0} hidden={tab !== t.key}>
              <ul className="wl-list" hidden={loaded && list.length === 0}>
                {list.map((tx, i) => <TxRow key={tx.id + ":" + i} tx={tx} />)}
              </ul>
              <div className="wl-empty" hidden={!loaded || list.length > 0}>
                <span className="wl-empty-ico" aria-hidden="true"><Svg body={ICON.clock} /></span>
                <b>{empty.title}</b>
                <p>{empty.text}</p>
                {empty.action === "topup" ? (
                  <button className="ab2" type="button" data-topup="" onClick={onTopup}><Svg body={ICON.plus} />Top up wallet</button>
                ) : (
                  <Link className="ab2" href="/app/browse-tournaments/"><Svg body={ICON.swords} />Find a battle</Link>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <p className="wl-foot">Sandbox wallet with sample data &middot; no real funds move until payments go live.</p>
    </>
  );
}
