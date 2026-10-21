"use client";

// React replacement for the old window.BTPanel (panel.js). PanelShell provides it; page client components read it
// with usePanel(). Profile and wallet start at the old placeholders ("trader", "TR", $0) so server and browser render
// the same HTML, and switch to the stored values once `ready` is true (after the first effect).
import { createContext, useContext } from "react";

export interface PanelProfile {
  username: string;
  countryName: string;
  country: string;
  timezone: string;
  /** ISO date the account was created (signup), or the page-load time for a guest. */
  joined: string;
  email: string;
  fullName: string;
  avatar: string;
  frame: string;
  isGuest: boolean;
  initials: string;
}

export interface Wallet {
  balance: number;
  credits: number;
  tickets: number;
}

export type ToastKind = "" | "success" | "error" | "warn" | "info";

export interface PanelApi {
  /** False during the server render and the first browser render. */
  ready: boolean;
  profile: PanelProfile;
  /** Re-read `bt-profile` (call after a page saved it, e.g. Profile settings). */
  reloadProfile: () => void;
  reduceMotion: boolean;
  wallet: Wallet;
  setWallet: (next: Wallet) => void;
  toast: (title: string, text?: string, kind?: string) => void;
  setDrawer: (open: boolean) => void;
}

export const GUEST_PROFILE: PanelProfile = {
  username: "trader",
  countryName: "Guest",
  country: "",
  timezone: "",
  joined: "",
  email: "",
  fullName: "",
  avatar: "",
  frame: "",
  isGuest: true,
  initials: "TR",
};

export const PanelContext = createContext<PanelApi | null>(null);

export function usePanel(): PanelApi {
  const api = useContext(PanelContext);
  if (!api) throw new Error("usePanel() must be used inside <PanelShell>");
  return api;
}

/** Old fill("data-joined", …) format, e.g. "15 Oct". */
export const joinedLabel = (iso: string): string =>
  (iso ? new Date(iso) : new Date()).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
