"use client";

// <dialog id="mt-withdraw"> from the old my-tournaments.js, rendered in PanelShell's `after` slot.
// Refunds go to the wallet through usePanel().setWallet so the top-bar pills update.
import { useEffect, useRef, useState } from "react";
import { BTTournaments, type Enrollment, type Tournament } from "@panel/lib/data/tournaments";
import { usePanel } from "@panel/lib/panel";
import { money, readJSON, writeJSON } from "@panel/lib/storage";
import { WITHDRAW_DONE, WITHDRAW_OPEN } from "./MyTournaments";

interface Pending {
  id: string;
  t: Tournament;
  e: Enrollment;
  opener: HTMLElement | null;
}

interface StoredTx {
  id: string;
  type: string;
  amount: number;
  at: string;
  status: string;
  note: string;
}

export default function WithdrawDialog() {
  const { wallet, setWallet, toast } = usePanel();
  const dlgRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const pendingRef = useRef<Pending | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; opener: HTMLElement | null }>).detail;
      const t = BTTournaments.get(detail.id);
      const e = BTTournaments.enrollments()[detail.id];
      const dlg = dlgRef.current;
      if (!t || !e || !dlg || dlg.open) return;
      const next = { id: detail.id, t, e, opener: detail.opener };
      pendingRef.current = next;
      setPending(next);
      dlg.showModal();
      cancelRef.current?.focus();
    };
    window.addEventListener(WITHDRAW_OPEN, onOpen);
    return () => window.removeEventListener(WITHDRAW_OPEN, onOpen);
  }, []);

  const close = () => {
    if (dlgRef.current?.open) dlgRef.current.close();
  };

  const confirm = () => {
    const current = pendingRef.current;
    if (!current) return;
    const { t, e } = current;
    BTTournaments.withdraw(current.id);
    const amount = Number(e.amount) || 0;
    const toCredits = e.paidWith === "credits";
    if (amount > 0) {
      setWallet({
        balance: toCredits ? wallet.balance : (Number(wallet.balance) || 0) + amount,
        credits: toCredits ? (Number(wallet.credits) || 0) + amount : wallet.credits,
        tickets: wallet.tickets,
      });
      let txs = readJSON<StoredTx[]>("bt-transactions", []);
      if (!Array.isArray(txs)) txs = [];
      txs.unshift({
        id: "tx-" + Date.now().toString(36),
        type: "refund",
        amount,
        at: new Date().toISOString(),
        status: "completed",
        note: "Refund: withdrew from " + t.name,
      });
      writeJSON("bt-transactions", txs);
    }
    close();
    window.dispatchEvent(new CustomEvent(WITHDRAW_DONE));
    toast(
      "Withdrawn from " + t.name,
      amount > 0 ? money(amount) + " refunded to your " + (toCredits ? "credits" : "balance") + "." : "Your seat is free for another fighter.",
    );
  };

  const onClose = () => {
    const closing = pendingRef.current;
    pendingRef.current = null;
    // The opener disappears when the withdraw goes through; fall back to the active tab.
    const opener = closing && closing.opener && closing.opener.isConnected ? closing.opener : null;
    const target = opener || (document.querySelector('.mt-tab[aria-selected="true"]') as HTMLElement | null);
    if (target) target.focus();
  };

  const amount = pending ? pending.e.amount : 0;
  const refundText = !pending
    ? ""
    : amount > 0
      ? money(amount) + " is refunded to " + (pending.e.paidWith === "credits" ? "your credits" : "your cash balance") + " straight away."
      : "Free entry, so there is nothing to refund.";

  return (
    <dialog
      className="mt-modal"
      id="mt-withdraw"
      aria-labelledby="mt-wd-title"
      aria-describedby="mt-wd-text"
      ref={dlgRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="mt-modal-in">
        <div className="mt-modal-h">
          <span className="mt-modal-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5h.01" /></svg></span>
          <h2 id="mt-wd-title">Withdraw from battle?</h2>
          <button type="button" className="mt-x" id="mt-wd-x" aria-label="Close" onClick={close}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
        </div>
        <p className="mt-modal-txt" id="mt-wd-text">You will give up your seat in <b id="mt-wd-name">{pending ? pending.t.name : ""}</b>.</p>
        <p className={"mt-refund" + (pending && !(amount > 0) ? " is-none" : "")} id="mt-wd-refund">{refundText}</p>
        <div className="mt-modal-btns">
          <button type="button" className="mt-btn mt-btn-line" id="mt-wd-cancel" ref={cancelRef} onClick={close}>Keep my seat</button>
          <button type="button" className="mt-btn mt-btn-danger" id="mt-wd-confirm" onClick={confirm}>Withdraw</button>
        </div>
      </div>
    </dialog>
  );
}
