"use client";

// Shared <dialog id="tn-enroll"> from the old tournaments.js. Rendered in PanelShell's `after` slot by Browse and Details.
// Like the old code it opens from any click on a [data-enroll] button anywhere on the page, and after a successful
// enrollment it fires ENROLLED_EVENT so the page that is showing re-renders (old `afterEnroll`).
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BTTournaments, type PaidWith, type Tournament, type Voucher } from "@panel/lib/data/tournaments";
import { usePanel } from "@panel/lib/panel";
import { money } from "@panel/lib/storage";
import { addTx, entryState, entryText, round2 } from "./format";

export const ENROLLED_EVENT = "bt-tn-enrolled";

interface EnrollCtx {
  t: Tournament;
  opener: HTMLElement | null;
  fallback: string;
  vouchers: Voucher[];
  voucherId: string;
  coupon: number | null;
  couponCode: string;
}

const escapeSel = (value: string): string => (typeof CSS !== "undefined" && CSS.escape ? CSS.escape(value) : value);

export default function EnrollDialog() {
  const { wallet, setWallet, toast } = usePanel();
  const router = useRouter();
  const dlgRef = useRef<HTMLDialogElement>(null);
  const goRef = useRef<HTMLButtonElement>(null);
  const voucherRef = useRef<HTMLSelectElement>(null);
  const couponRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef<EnrollCtx | null>(null);
  const [ctx, setCtx] = useState<EnrollCtx | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponInvalid, setCouponInvalid] = useState(false);
  const [couponMsg, setCouponMsg] = useState({ text: "", cls: "tn-mmsg" });
  const [focusToken, setFocusToken] = useState<"" | "open" | "coupon">("");

  const voucher = ctx ? ctx.vouchers.find((v) => v.id === ctx.voucherId) || null : null;
  const fee = ctx ? ctx.t.entryFee : 0;
  const vDisc = ctx && voucher ? round2(Math.min(fee, BTTournaments.voucherDiscount(voucher, fee))) : 0;
  const cDisc = ctx && ctx.coupon ? round2(Math.min(ctx.coupon, fee - vDisc)) : 0;
  const due = round2(Math.max(0, fee - vDisc - cDisc));
  const shortRaw = round2(due - (wallet.balance + wallet.credits));
  const short = shortRaw > 0 ? shortRaw : 0;
  const isFree = ctx ? ctx.t.entryFee <= 0 : false;
  const topupMode = ctx !== null && !isFree && short > 0;

  const resetCoupon = () => {
    setCouponInput("");
    setCouponInvalid(false);
    setCouponMsg({ text: "", cls: "tn-mmsg" });
  };

  const openEnroll = (t: Tournament, opener: HTMLElement | null, area: string) => {
    const dlg = dlgRef.current;
    if (!dlg || dlg.open) return;
    if (entryState(t, Date.now(), BTTournaments.enrollments()) !== "open") {
      toast("Entry not available", "Registration for " + t.name + " is not open.", "error");
      return;
    }
    const next: EnrollCtx = {
      t, opener,
      fallback: area === "detail" ? "#tn-enroll-status" : '[data-fk="' + escapeSel(area + ":" + t.id) + '"]',
      vouchers: BTTournaments.vouchers(t.type), voucherId: "", coupon: null, couponCode: "",
    };
    activeRef.current = next;
    setCtx(next);
    resetCoupon();
    dlg.showModal();
    setFocusToken("open");
  };
  const openRef = useRef(openEnroll);
  useEffect(() => {
    openRef.current = openEnroll;
  });

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const btn = target && target.closest ? (target.closest("[data-enroll]") as HTMLElement | null) : null;
      if (!btn) return;
      const t = BTTournaments.get(btn.getAttribute("data-enroll") || "");
      if (t) openRef.current(t, btn, btn.getAttribute("data-area") || "");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Focus after React has applied the new dialog state (disabled voucher select, free/paid section).
  useEffect(() => {
    if (!focusToken) return;
    setFocusToken("");
    if (focusToken === "coupon") {
      couponRef.current?.focus();
      return;
    }
    if (!ctx) return;
    const target = isFree ? goRef.current : !ctx.vouchers.length ? couponRef.current : voucherRef.current;
    target?.focus();
  }, [focusToken, ctx, isFree]);

  const applyCoupon = () => {
    if (!ctx) return;
    if (ctx.coupon) {
      setCtx({ ...ctx, coupon: null, couponCode: "" });
      resetCoupon();
      setFocusToken("coupon");
      return;
    }
    const code = couponInput.trim();
    const value = code ? BTTournaments.couponValue(code) : null;
    if (value === null) {
      setCouponInvalid(true);
      setCouponMsg({ text: code ? "That coupon code isn't valid. Check it and try again." : "Enter a coupon code first.", cls: "tn-mmsg is-err" });
      couponRef.current?.focus();
      return;
    }
    const upper = code.toUpperCase();
    setCtx({ ...ctx, coupon: value, couponCode: upper });
    setCouponInput(upper);
    setCouponInvalid(false);
    setCouponMsg({ text: "Coupon " + upper + " applied: " + money(value) + " off.", cls: "tn-mmsg is-ok" });
  };

  const confirmEnroll = () => {
    if (!ctx) return;
    const t = ctx.t;
    if (t.entryFee > 0 && short > 0) {
      router.push("/app/wallet/?topup=" + Math.max(20, Math.ceil(short)));
      return;
    }
    const fromCredits = round2(Math.min(wallet.credits, due));
    const fromBalance = round2(due - fromCredits);
    if (due > 0) {
      setWallet({ balance: round2(wallet.balance - fromBalance), credits: round2(wallet.credits - fromCredits), tickets: wallet.tickets });
    }
    const paidWith: PaidWith = t.entryFee <= 0 ? "free" : due === 0 ? (voucher ? "voucher" : "coupon") : fromBalance > 0 ? "wallet" : "credits";
    if (t.entryFee > 0 && voucher) BTTournaments.useVoucher(voucher.id);
    BTTournaments.enroll(t.id, { paidWith, amount: due });
    if (due > 0) {
      const extras: string[] = [];
      if (voucher) extras.push("voucher " + voucher.code);
      if (ctx.coupon) extras.push("coupon " + ctx.couponCode);
      addTx("entry", due, "Entry: " + t.name + (extras.length ? " (" + extras.join(", ") + ")" : ""));
    }
    window.dispatchEvent(new CustomEvent(ENROLLED_EVENT, { detail: t.id }));
    dlgRef.current?.close();
    toast("You're in the arena", "Enrolled in " + t.name + ". Good luck, fighter.");
  };

  const onClose = () => {
    const closing = activeRef.current;
    activeRef.current = null;
    if (!closing) return;
    const target = closing.opener && closing.opener.isConnected ? closing.opener : (document.querySelector(closing.fallback) as HTMLElement | null);
    if (target) target.focus();
  };

  const close = () => dlgRef.current?.close();
  const vouchers = ctx ? ctx.vouchers : [];
  const typeLabel = ctx ? BTTournaments.typeLabel(ctx.t.type) : "";

  return (
    <dialog
      className="tn-modal"
      id="tn-enroll"
      aria-labelledby="tn-enroll-h"
      aria-describedby="tn-enroll-sub"
      ref={dlgRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <form
        className="tn-mform"
        id="tn-enroll-form"
        method="dialog"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (activeRef.current) confirmEnroll();
        }}
      >
        <header className="tn-mhead">
          <span className="tn-mhead-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4 2 2 0 0 0 0-4V6H3z" /><path d="M14 6v12" strokeDasharray="2 2" /></svg></span>
          <div className="tn-mhead-txt">
            <h2 id="tn-enroll-h">Tournament enrollment</h2>
            <p id="tn-enroll-sub">Review your entry and lock in your seat in the arena.</p>
          </div>
          <button className="tn-x" id="tn-enroll-x" type="button" aria-label="Close enrollment dialog" onClick={close}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
        </header>

        <div className="tn-msum">
          <p className="tn-msum-name" id="tn-m-name">{ctx ? ctx.t.name : "Tournament"}</p>
          <dl className="tn-msum-dl">
            <div><dt>Entry fee</dt><dd id="tn-m-fee">{ctx ? entryText(ctx.t) : "$0"}</dd></div>
            <div><dt>Prize pool</dt><dd id="tn-m-prize" className="tn-violet">{ctx ? money(ctx.t.prizePool) : "$0"}</dd></div>
            <div><dt>Trading platform</dt><dd id="tn-m-platform">{ctx ? ctx.t.platform : "BattleTrader Play"}</dd></div>
          </dl>
        </div>

        <p className="tn-mfree" id="tn-m-free" hidden={!isFree}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m8 12.5 3 3 5-6" /></svg><span>This entry is free. Confirm to claim your seat.</span></p>

        <div className="tn-mpaid" id="tn-m-paid" hidden={isFree}>
          <div className="tn-mtiles">
            <div className="tn-mtile t-bal"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M3 10h18M16 15h2" /></svg><span>Wallet balance</span><b id="tn-m-bal">{ctx ? money(wallet.balance) : "$0"}</b></div>
            <div className="tn-mtile t-cred"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg><span>Credits available</span><b id="tn-m-cred">{ctx ? money(wallet.credits) : "$0"}</b></div>
          </div>

          <p className="tn-notice" id="tn-m-short" role="status" hidden={short <= 0 || !ctx}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg><span id="tn-m-short-txt">{ctx ? "You're " + money(short) + " short of the entry fee. Have a voucher or coupon? Apply it below, or top up your wallet to claim your seat." : ""}</span></p>

          <div className="tn-mfield">
            <label htmlFor="tn-m-voucher">Apply a voucher</label>
            <select
              id="tn-m-voucher"
              aria-describedby="tn-m-voucher-hint"
              ref={voucherRef}
              disabled={ctx ? !vouchers.length : false}
              value={ctx ? ctx.voucherId : ""}
              onChange={(event) => ctx && setCtx({ ...ctx, voucherId: event.target.value })}
            >
              {ctx ? <option value="">{vouchers.length ? "No voucher" : "No vouchers for this battle"}</option> : null}
              {vouchers.map((v) => {
                const off = BTTournaments.voucherDiscount(v, fee);
                const what = v.kind === "percent" ? v.value + "% off" : v.kind === "free-entry" ? "Free entry" : money(v.value) + " off";
                return <option key={v.id} value={v.id}>{v.code + " \u2014 " + what + " (-" + money(off) + ")"}</option>;
              })}
            </select>
            <small id="tn-m-voucher-hint" className="tn-mhint">
              {ctx
                ? vouchers.length
                  ? vouchers.length + " voucher" + (vouchers.length > 1 ? "s" : "") + " can be used on " + typeLabel + " battles."
                  : "Redeem a code on the Redeem page to add vouchers."
                : ""}
            </small>
          </div>

          <div className="tn-mfield">
            <label htmlFor="tn-m-coupon">Have a coupon code?</label>
            <div className="tn-coupon-row">
              <input
                id="tn-m-coupon"
                type="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="e.g. ARENA20"
                aria-describedby="tn-m-coupon-msg"
                ref={couponRef}
                value={couponInput}
                disabled={!!(ctx && ctx.coupon)}
                aria-invalid={couponInvalid ? "true" : undefined}
                onChange={(event) => {
                  setCouponInput(event.target.value);
                  if (couponInvalid) {
                    setCouponInvalid(false);
                    setCouponMsg({ text: "", cls: "tn-mmsg" });
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyCoupon();
                  }
                }}
              />
              <button className="tn-mini-btn" id="tn-m-coupon-btn" type="button" onClick={applyCoupon}>{ctx && ctx.coupon ? "Remove" : "Apply"}</button>
            </div>
            <p className={couponMsg.cls} id="tn-m-coupon-msg">{couponMsg.text}</p>
          </div>

          <dl className="tn-mtotal">
            <div><dt>Entry fee</dt><dd id="tn-m-t-fee">{money(fee)}</dd></div>
            <div id="tn-m-t-vrow" hidden={!vDisc}><dt>Voucher</dt><dd id="tn-m-t-v" className="tn-green">{"-" + money(vDisc)}</dd></div>
            <div id="tn-m-t-crow" hidden={!cDisc}><dt>Coupon</dt><dd id="tn-m-t-c" className="tn-green">{"-" + money(cDisc)}</dd></div>
            <div className="tn-mtotal-due"><dt>Total due</dt><dd id="tn-m-due" aria-live="polite">{money(due)}</dd></div>
          </dl>
        </div>

        <footer className="tn-mfoot">
          <button className="tn-btn tn-btn-line" id="tn-m-cancel" type="button" onClick={close}>Cancel</button>
          <button className="tn-btn tn-btn-grad" id="tn-m-go" type="submit" ref={goRef} data-mode={ctx ? (topupMode ? "topup" : "confirm") : undefined}>
            {topupMode ? "Proceed to top up" : "Confirm enrollment"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
