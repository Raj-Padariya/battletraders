// Shared bits of the old wallet.js used by both the page body and the top-up dialog.
import { readJSON, writeJSON } from "@panel/lib/storage";

export const TX_KEY = "bt-transactions";
export const MIN = 20;
export const MAX = 10000;
export const TOPUP_OPEN = "bt-wl-topup-open";
export const TX_CHANGED = "bt-wl-tx-changed";

export interface WalletTx {
  id: string;
  type: string;
  amount: number;
  at: string;
  status: string;
  note?: string;
}

export const cents = (n: number): number => Math.round(n * 100) / 100;
export const usd = (n: number): string => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Numbers only, up to 2 decimals. Returns NaN for anything else. */
export function parseAmount(raw: string): number {
  const text = String(raw || "").trim().replace(/,/g, "");
  return /^\d+(\.\d{1,2})?$/.test(text) ? Number(text) : NaN;
}

export function isVerified(): boolean {
  const kyc = readJSON<{ status?: string } | null>("bt-kyc", null);
  return !!(kyc && kyc.status === "verified");
}

export function transactions(): WalletTx[] {
  const list = readJSON<WalletTx[]>(TX_KEY, []);
  return Array.isArray(list) ? list : [];
}

export function addTransaction(tx: WalletTx): void {
  const list = transactions();
  list.unshift(tx);
  writeJSON(TX_KEY, list);
  window.dispatchEvent(new CustomEvent(TX_CHANGED));
}

/** Ask the dialog (rendered in PanelShell's `after` slot) to open at step 1. */
export function openTopup(prefill: number | "", opener: HTMLElement | null): void {
  window.dispatchEvent(new CustomEvent(TOPUP_OPEN, { detail: { prefill, opener } }));
}
