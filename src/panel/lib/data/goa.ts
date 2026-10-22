// Goa Live Final: the ONE place its numbers live. The panel tournament data, the public event page and the checkout
// all read from here, and every derived amount (pool, winners, share of pool) is computed, never typed in by hand.

export const GOA_EVENT_ID = "goa-live-final-2026";

/** Prize per finishing place, 1st first. 1st-5th as agreed, then $900 down to $100 (6th-14th) and $100 for 15th-19th,
    so the pool is exactly $20,000. Nothing after the last entry. */
export const GOA_PRIZES: readonly number[] = [
  5000, 4000, 3000, 2000, 1000,
  900, 800, 700, 600, 500, 400, 300, 200, 100,
  100, 100, 100, 100, 100,
];

export const GOA_ENTRY_FEE = 500;
export const GOA_SEATS = 100;
/** Sample seats shown as already sold; passes bought in this browser are added on top. Set to 0 at launch. */
export const GOA_SEATS_DEMO_TAKEN = 37;

export const GOA_STARTS_AT = "2026-11-23T04:30:00Z"; // 10:00 IST
export const GOA_ENDS_AT = "2026-11-24T04:30:00Z"; // 24 hours later
export const GOA_REGISTRATION_OPENS = "2026-10-22T04:30:00Z";
export const GOA_REGISTRATION_CLOSES = "2026-11-22T12:30:00Z"; // 18:00 IST

export const GOA_PRIZE_POOL = GOA_PRIZES.reduce((sum, amount) => sum + amount, 0);
export const GOA_WINNERS = GOA_PRIZES.length;

export interface GoaPrizeRow {
  place: number;
  label: string;
  amount: number;
  /** Share of the prize pool, rounded to one decimal. */
  share: number;
}

export function ordinal(n: number): string {
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return n + "th";
  return n + (["th", "st", "nd", "rd"][n % 10] ?? "th");
}

export const goaPrizeRows = (): GoaPrizeRow[] =>
  GOA_PRIZES.map((amount, i) => ({
    place: i + 1,
    label: ordinal(i + 1),
    amount,
    share: Math.round((amount / GOA_PRIZE_POOL) * 1000) / 10,
  }));

export const usd = (n: number): string => "$" + n.toLocaleString("en-US");
