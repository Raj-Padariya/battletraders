"use client";

// <dialog id="wl-dialog"> — the 3-step sandbox top-up from the old wallet.js. Credits the balance via usePanel().setWallet.
import { useEffect, useRef, useState } from "react";
import { usePanel } from "@panel/lib/panel";
import { MAX, MIN, TOPUP_OPEN, addTransaction, cents, parseAmount, usd } from "./walletShared";

const QUICK = [20, 50, 100, 250];

function amountError(raw: string): string {
  const text = raw.trim();
  if (!text) return "Enter an amount.";
  const amount = parseAmount(text);
  if (isNaN(amount)) return "Use numbers only, e.g. 100.";
  if (amount < MIN) return "Minimum top-up is $20.";
  if (amount > MAX) return "Maximum top-up is $10,000.";
  return "";
}

export default function TopupDialog() {
  const { wallet, setWallet, toast } = usePanel();
  const dlgRef = useRef<HTMLDialogElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const payHRef = useRef<HTMLHeadingElement>(null);
  const doneHRef = useRef<HTMLHeadingElement>(null);
  const addressRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [step, setStep] = useState(1);
  const [amountInput, setAmountInput] = useState("");
  const [err, setErr] = useState("");
  const [pendingAmount, setPendingAmount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [focusStep, setFocusStep] = useState(0);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ prefill: number | ""; opener: HTMLElement | null }>).detail;
      const dlg = dlgRef.current;
      if (!dlg) return;
      openerRef.current = detail.opener || (document.activeElement as HTMLElement | null);
      setAmountInput(detail.prefill ? String(detail.prefill) : "");
      setErr("");
      setCopied(false);
      setStep(1);
      if (!dlg.open) dlg.showModal();
      setFocusStep(1);
    };
    window.addEventListener(TOPUP_OPEN, onOpen);
    return () => window.removeEventListener(TOPUP_OPEN, onOpen);
  }, []);

  // Focus once React has un-hidden the step.
  useEffect(() => {
    if (!focusStep) return;
    setFocusStep(0);
    const target = focusStep === 1 ? amountRef.current : focusStep === 2 ? payHRef.current : doneHRef.current;
    target?.focus();
  }, [focusStep]);

  const close = () => dlgRef.current?.close();
  const typed = parseAmount(amountInput);

  const submitAmount = (event: React.FormEvent) => {
    event.preventDefault();
    const msg = amountError(amountInput);
    setErr(msg);
    if (msg) {
      amountRef.current?.focus();
      return;
    }
    setPendingAmount(parseAmount(amountInput));
    setStep(2);
    setFocusStep(2);
  };

  const copy = () => {
    const address = addressRef.current ? addressRef.current.textContent || "" : "";
    const fail = () => toast("Couldn't copy", "Select the address and copy it manually.", "error");
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      fail();
      return;
    }
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      toast("Address copied", "Paste it into your wallet app to send USDT (TRC20).");
    }, fail);
  };

  const sent = () => {
    const amount = pendingAmount;
    setWallet({ balance: cents(wallet.balance + amount), credits: wallet.credits, tickets: wallet.tickets });
    addTransaction({ id: "tx-" + Date.now(), type: "topup", amount, at: new Date().toISOString(), status: "completed", note: "USDT TRC20 \u00b7 sandbox" });
    setStep(3);
    setFocusStep(3);
    toast("Top-up complete", usd(amount) + " added to your balance (sandbox).");
  };

  return (
    <dialog
      className="wl-modal"
      id="wl-dialog"
      aria-labelledby="wl-dlg-title"
      aria-describedby="wl-dlg-sub"
      ref={dlgRef}
      onClose={() => {
        const opener = openerRef.current;
        openerRef.current = null;
        if (opener && opener.isConnected) opener.focus();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="wl-modal-in">
        <div className="wl-modal-h">
          <div>
            <h2 id="wl-dlg-title">Top up</h2>
            <p id="wl-dlg-sub">Enter the amount in USD and choose how you want to pay.</p>
          </div>
          <button className="wl-x" id="wl-dlg-close" type="button" aria-label="Close top-up" onClick={close}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
        </div>
        <ol className="wl-steps" aria-label="Top-up progress">
          {["Amount", "Payment", "Done"].map((label, i) => {
            const k = i + 1;
            const cls = (k === step ? "is-on" : "") + (k < step ? " is-done" : "");
            return (
              <li key={label} data-step-dot={k} className={cls.trim() || undefined} aria-current={k === step ? "step" : undefined}>{label}</li>
            );
          })}
        </ol>

        <form className="wl-step" id="wl-step-1" noValidate hidden={step !== 1} onSubmit={submitAmount}>
          <label className="wl-label" htmlFor="wl-amount">Amount (USD)</label>
          <div className="wl-field wl-field-lg">
            <span aria-hidden="true">$</span>
            <input
              id="wl-amount"
              name="amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="100"
              aria-describedby="wl-amount-min wl-amount-err"
              aria-invalid={err ? "true" : "false"}
              ref={amountRef}
              value={amountInput}
              onChange={(event) => {
                setAmountInput(event.target.value);
                if (err) setErr(amountError(event.target.value));
              }}
            />
            <small id="wl-amount-min">Min. $20</small>
          </div>
          <p className="wl-err" id="wl-amount-err" hidden={!err}>{err}</p>
          <div className="wl-quick" role="group" aria-label="Quick amounts">
            {QUICK.map((value) => (
              <button
                key={value}
                type="button"
                data-amount={value}
                aria-pressed={typed === value ? "true" : "false"}
                onClick={() => {
                  setAmountInput(String(value));
                  setErr("");
                }}
              >
                {"$" + value}
              </button>
            ))}
          </div>
          <fieldset className="wl-methods">
            <legend className="wl-label">Payment method</legend>
            <label className="wl-method"><input type="radio" name="method" value="crypto" defaultChecked /><span className="wl-method-ico" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="9" cy="7" rx="6" ry="3" /><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7" /><path d="M9 15v2c0 1.7 2.7 3 6 3s6-1.3 6-3v-5c0-1.7-2.7-3-6-3" /></svg></span><span className="wl-method-txt"><b>Crypto (USDT)</b><small>Pay with USDT or other cryptocurrencies</small></span></label>
            <label className="wl-method is-off"><input type="radio" name="method" value="card" disabled /><span className="wl-method-ico" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 10h19M6 15h4" /></svg></span><span className="wl-method-txt"><b>Card</b><small>Coming soon</small></span></label>
          </fieldset>
          <div className="wl-modal-f">
            <button className="btn b-line" type="button" data-close="" onClick={close}>Cancel</button>
            <button className="btn b-ember" type="submit">Next</button>
          </div>
        </form>

        <div className="wl-step" id="wl-step-2" hidden={step !== 2}>
          <p className="wl-sandbox"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>Sandbox payment &mdash; no real funds move</p>
          <h3 className="wl-step-h" id="wl-pay-h" tabIndex={-1} ref={payHRef}>Secure payment</h3>
          <dl className="wl-pay">
            <div><dt>Amount</dt><dd id="wl-pay-amount">{usd(pendingAmount)}</dd></div>
            <div><dt>You send</dt><dd id="wl-pay-usdt">{pendingAmount.toFixed(2) + " USDT"}</dd></div>
            <div><dt>Network</dt><dd>USDT TRC20</dd></div>
          </dl>
          <p className="wl-label" id="wl-addr-lbl">Deposit address</p>
          <div className="wl-addr" role="group" aria-labelledby="wl-addr-lbl">
            <code id="wl-address" ref={addressRef}>TQ7sandboxBattleTraderDep0s1tAddr</code>
            <button className="wl-copy" id="wl-copy" type="button" aria-label="Copy deposit address" onClick={copy}><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></svg><span>{copied ? "Copied" : "Copy"}</span></button>
          </div>
          <p className="wl-hint">Send only USDT on the TRC20 network to this address.</p>
          <div className="wl-modal-f">
            <button className="btn b-line" id="wl-back" type="button" onClick={() => { setStep(1); setFocusStep(1); }}>Back</button>
            <button className="btn b-ember" id="wl-sent" type="button" onClick={sent}>I&apos;ve sent the payment</button>
          </div>
        </div>

        <div className="wl-step wl-done" id="wl-step-3" hidden={step !== 3}>
          <span className="wl-done-ico" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m8 12.5 3 3 5-6" /></svg></span>
          <h3 className="wl-step-h" id="wl-done-h" tabIndex={-1} ref={doneHRef}>Top-up complete</h3>
          <p className="wl-done-txt"><b id="wl-done-amount">{usd(pendingAmount)}</b> was added to your balance.</p>
          <p className="wl-sandbox"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>Sandbox payment &mdash; no real funds move</p>
          <div className="wl-modal-f">
            <button className="btn b-ember btn-block" type="button" data-close="" onClick={close}>Done</button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
