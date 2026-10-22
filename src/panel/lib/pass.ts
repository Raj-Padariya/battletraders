// Goa Live Final registrations. One paid registration = one seat = one pass.
// Rules enforced here: at most GOA_SEATS seats, and one registration per email (case-insensitive, trimmed).
// Each record gets a random serial, a sequential seat number and a signature over its fields, so an edited
// record fails verification.
//
// LIMIT: until the backend exists, this list lives in the buyer's browser. That stops a second registration from the
// same browser, but another browser or device starts from an empty list. The same rules must be enforced on the
// server (unique email index, seat counter in a transaction) when the backend and real gateway are connected.
import { readJSON, writeJSON } from "@panel/lib/storage";
import { GOA_SEATS, GOA_SEATS_DEMO_TAKEN } from "@panel/lib/data/goa";

export interface GoaRegistration {
  id: string;
  serial: string;
  seat: number;
  eventId: string;
  holder: string;
  email: string;
  issuedAt: string;
  amount: number;
  method: string;
  paymentRef: string;
  sig: string;
}

export type RejectReason = "email-used" | "sold-out";
export type CheckResult = { ok: true } | { ok: false; reason: RejectReason };
export type ReserveResult = { ok: true; registration: GoaRegistration } | { ok: false; reason: RejectReason };

const REGISTRATIONS_KEY = "bt-goa-registrations";
const SIGNING_SALT = "bt-goa-2026-local";

/* FNV-1a 32-bit, run twice with different seeds for a 16-hex-char tag. Not cryptographic: see the note above. */
function fnv(text: string, seed: number): string {
  let hash = seed >>> 0;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

const payload = (r: Omit<GoaRegistration, "sig">) =>
  [r.id, r.serial, r.seat, r.eventId, r.holder, r.email, r.issuedAt, r.amount, r.method, r.paymentRef].join("|");

const signPayload = (text: string) => fnv(SIGNING_SALT + text, 2166136261) + fnv(text + SIGNING_SALT, 33554467);

function randomHex(bytes: number): string {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return Array.from(values, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** Newest first. Records that fail their signature are dropped, so a hand-edited entry never counts. */
export function readRegistrations(): GoaRegistration[] {
  return readJSON<GoaRegistration[]>(REGISTRATIONS_KEY, []).filter(verifyRegistration);
}

export function verifyRegistration(r: GoaRegistration): boolean {
  const { sig, ...unsigned } = r;
  return typeof sig === "string" && signPayload(payload(unsigned)) === sig;
}

export function goaSeatsTaken(): number {
  return Math.min(GOA_SEATS, GOA_SEATS_DEMO_TAKEN + readRegistrations().length);
}

export function findRegistration(eventId: string, email: string): GoaRegistration | null {
  const key = normalizeEmail(email);
  return readRegistrations().find((r) => r.eventId === eventId && r.email === key) ?? null;
}

/** Checks both rules before payment so the buyer is not charged for a seat they cannot get. */
export function canRegister(eventId: string, email: string): CheckResult {
  if (findRegistration(eventId, email)) return { ok: false, reason: "email-used" };
  if (goaSeatsTaken() >= GOA_SEATS) return { ok: false, reason: "sold-out" };
  return { ok: true };
}

/** Re-checks both rules at write time (the list may have changed during payment), then records the seat. */
export function reserveSeat(eventId: string, holder: string, email: string, amount: number, method: string, paymentRef: string): ReserveResult {
  const check = canRegister(eventId, email);
  if (!check.ok) return { ok: false, reason: check.reason };
  const existing = readRegistrations();
  const id = randomHex(8);
  const unsigned: Omit<GoaRegistration, "sig"> = {
    id,
    serial: "GOA-" + id.slice(0, 4).toUpperCase() + "-" + id.slice(4, 8).toUpperCase(),
    seat: GOA_SEATS_DEMO_TAKEN + existing.length + 1,
    eventId,
    holder: holder.trim(),
    email: normalizeEmail(email),
    issuedAt: new Date().toISOString(),
    amount,
    method,
    paymentRef,
  };
  const registration: GoaRegistration = { ...unsigned, sig: signPayload(payload(unsigned)) };
  writeJSON(REGISTRATIONS_KEY, [registration, ...existing]);
  return { ok: true, registration };
}
