"use client";

/* Personal Arena — port of arena.js. Practice terminal on simulated prices; owns localStorage 'bt-arena'.
   No chart here on purpose: the trading backend will provide it. */
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { Svg } from "@panel/components/Icon";
import { usePanel } from "@panel/lib/panel";
import { readJSON, writeJSON } from "@panel/lib/storage";

const KEY = "bt-arena";
const START_BALANCE = 100000;
const LEVERAGE = 200;
const MAX_LOTS = 100;
const MIN_LOTS = 0.01;

type Side = "buy" | "sell";
type OrderType = "market" | "limit" | "stop";
type FieldId = "pa-lots" | "pa-tp" | "pa-sl" | "pa-entry";
type TabId = "pos" | "ord" | "his";

/* contract = units per 1 lot; quoteJPY means P&L is in JPY and is converted at the current price */
interface Instrument {
  sym: string;
  name: string;
  cls: string;
  base: number;
  digits: number;
  spread: number;
  vol: number;
  contract: number;
  quoteJPY?: boolean;
}

interface Position {
  id: string;
  sym: string;
  side: Side;
  lots: number;
  open: number;
  tp: number | null;
  sl: number | null;
  at: string;
}

interface PendingOrder {
  id: string;
  sym: string;
  side: Side;
  type: "limit" | "stop";
  lots: number;
  price: number;
  tp: number | null;
  sl: number | null;
  at: string;
}

interface ClosedTrade {
  id: string;
  sym: string;
  side: Side;
  lots: number;
  open: number;
  close: number;
  pnl: number;
  at: string;
  closedAt: string;
  reason: string;
}

interface ArenaState {
  startedAt: string;
  balance: number;
  positions: Position[];
  orders: PendingOrder[];
  history: ClosedTrade[];
  favs: string[];
  prices: Record<string, number>;
  defLots: number;
}

interface Session {
  o: number;
  h: number;
  l: number;
}

const INSTRUMENTS: Instrument[] = [
  { sym: "EURUSD", name: "Euro / US Dollar", cls: "Forex", base: 1.0852, digits: 5, spread: 0.0001, vol: 0.00012, contract: 100000 },
  { sym: "GBPUSD", name: "British Pound / US Dollar", cls: "Forex", base: 1.2714, digits: 5, spread: 0.00014, vol: 0.00014, contract: 100000 },
  { sym: "USDJPY", name: "US Dollar / Japanese Yen", cls: "Forex", base: 149.62, digits: 3, spread: 0.014, vol: 0.00012, contract: 100000, quoteJPY: true },
  { sym: "XAUUSD", name: "Gold / US Dollar", cls: "Commodity", base: 2351.4, digits: 2, spread: 0.3, vol: 0.00025, contract: 100 },
  { sym: "BTCUSD", name: "Bitcoin / US Dollar", cls: "Crypto", base: 67250, digits: 2, spread: 12, vol: 0.0006, contract: 1 },
  { sym: "ETHUSD", name: "Ethereum / US Dollar", cls: "Crypto", base: 3512.5, digits: 2, spread: 1.2, vol: 0.0007, contract: 1 },
  { sym: "US30", name: "Dow Jones 30", cls: "Index", base: 39120, digits: 1, spread: 2, vol: 0.0002, contract: 1 },
  { sym: "NAS100", name: "Nasdaq 100", cls: "Index", base: 18240, digits: 1, spread: 1.5, vol: 0.00025, contract: 1 },
  { sym: "AAPL", name: "Apple Inc.", cls: "Stock", base: 191.24, digits: 2, spread: 0.04, vol: 0.0003, contract: 100 },
];
const BY_SYM: Record<string, Instrument> = Object.fromEntries(INSTRUMENTS.map((i) => [i.sym, i]));

const TOOLS: { id: string; label: string; body: string }[] = [
  { id: "cursor", label: "Cursor", body: '<path d="M5 3l14 7-6 2-2 6z"/>' },
  { id: "cross", label: "Crosshair", body: '<circle cx="12" cy="12" r="7"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>' },
  { id: "trendline", label: "Trend line", body: '<path d="M5 19 19 5"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="5" r="2"/>' },
  { id: "ruler", label: "Measure", body: '<path d="M3 17 17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>' },
  { id: "rect", label: "Rectangle", body: '<rect x="4" y="6" width="16" height="12" rx="1.5"/>' },
  { id: "pencil", label: "Brush", body: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>' },
  { id: "indicators", label: "Indicators", body: '<path d="M3 12h3l2-5 3 10 3-7 2 2h5"/>' },
];
const TIMEFRAMES = ["1m", "5m", "15m", "1H", "4H", "1D", "1W"];
const TABS: { id: TabId; label: string }[] = [
  { id: "pos", label: "Positions" },
  { id: "ord", label: "Orders" },
  { id: "his", label: "History" },
];

const RESET_ICON = '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/>';
const LOCK_ICON = '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>';
const CHECK_ICON = '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>';
const EMPTY_ICONS: Record<TabId, string> = {
  pos: '<path d="m3 17 6-6 4 4 8-8M15 7h6v6"/>',
  ord: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  his: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/><path d="M12 8v4l3 2"/>',
};

/* ---------- Maths ---------- */
const round = (n: number, d: number): number => {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
};
const ask = (mid: Record<string, number>, i: Instrument): number => round(mid[i.sym] + i.spread / 2, i.digits);
const bid = (mid: Record<string, number>, i: Instrument): number => round(mid[i.sym] - i.spread / 2, i.digits);
const fmtPx = (i: Instrument, n: number): string =>
  Number(n).toLocaleString("en-US", { minimumFractionDigits: i.digits, maximumFractionDigits: i.digits });
const fmtUsd = (n: number, signed?: boolean): string => {
  const abs = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (signed) return (n > 0.004 ? "+$" : n < -0.004 ? "-$" : "$") + abs;
  return (n < -0.004 ? "-$" : "$") + abs;
};
const toUsd = (i: Instrument, amountInQuote: number, px: number): number => (i.quoteJPY ? amountInQuote / px : amountInQuote);
const marginFor = (i: Instrument, lots: number, px: number): number => toUsd(i, i.contract * lots * px, px) / LEVERAGE;
const closePrice = (mid: Record<string, number>, p: Position): number => {
  const i = BY_SYM[p.sym];
  return p.side === "buy" ? bid(mid, i) : ask(mid, i);
};
const pnlOf = (mid: Record<string, number>, p: Position, px?: number): number => {
  const i = BY_SYM[p.sym];
  const close = px === undefined ? closePrice(mid, p) : px;
  const dir = p.side === "buy" ? 1 : -1;
  return toUsd(i, (close - p.open) * dir * i.contract * p.lots, close);
};
const accountOf = (mid: Record<string, number>, state: ArenaState) => {
  let floating = 0;
  let margin = 0;
  state.positions.forEach((p) => {
    floating += pnlOf(mid, p);
    margin += marginFor(BY_SYM[p.sym], p.lots, p.open);
  });
  const equity = state.balance + floating;
  return { floating, margin, equity, free: equity - margin, level: margin > 0 ? (equity / margin) * 100 : null };
};
const uid = (): string => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const opt = (i: Instrument, n: number | null): string => (n === null || n === undefined ? "\u2014" : fmtPx(i, n));
const tone = (n: number): string => (n > 0.004 ? "pa-up" : n < -0.004 ? "pa-dn" : "");
const fresh = (startedAt?: string): ArenaState => ({
  startedAt: startedAt || new Date().toISOString(),
  balance: START_BALANCE,
  positions: [],
  orders: [],
  history: [],
  favs: [],
  prices: {},
  defLots: 0.1,
});
const readNum = (raw: string): { empty: boolean; ok: boolean; n: number } => {
  const trimmed = raw.trim();
  if (trimmed === "") return { empty: true, ok: false, n: 0 };
  const n = Number(trimmed);
  return { empty: false, ok: isFinite(n) && n > 0, n };
};
const focusId = (id: string): void => {
  window.requestAnimationFrame(() => document.getElementById(id)?.focus());
};

export default function ArenaTerminal() {
  const { profile, reduceMotion, toast } = usePanel();
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const [loaded, setLoaded] = useState(false);

  // Price feed + arena account live in refs (mutated on every tick, like the original); `rerender` repaints.
  const arenaRef = useRef<ArenaState | null>(null);
  const midRef = useRef<Record<string, number>>(Object.fromEntries(INSTRUMENTS.map((i) => [i.sym, i.base])));
  const sessionRef = useRef<Record<string, Session>>(
    Object.fromEntries(INSTRUMENTS.map((i) => [i.sym, { o: i.base, h: i.base, l: i.base }])),
  );
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [sym, setSym] = useState(INSTRUMENTS[0].sym);
  const [side, setSide] = useState<Side>("buy");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [lots, setLots] = useState("0.10");
  const [entry, setEntry] = useState("");
  const [tp, setTp] = useState("");
  const [sl, setSl] = useState("");
  const [errors, setErrors] = useState<Partial<Record<FieldId, string>>>({});
  const [listOpen, setListOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tool, setTool] = useState("cursor");
  const [timeframe, setTimeframe] = useState("1H");
  const [tab, setTab] = useState<TabId>("pos");

  const listRef = useRef<HTMLUListElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const save = useCallback(() => {
    if (arenaRef.current) writeJSON(KEY, arenaRef.current);
  }, []);

  const clearErrs = (...ids: FieldId[]) =>
    setErrors((prev) => {
      const next = { ...prev };
      ids.forEach((id) => delete next[id]);
      return next;
    });

  /* ---------- Boot: restore saved account + last prices ---------- */
  useEffect(() => {
    const saved = readJSON<Partial<ArenaState> | null>(KEY, null);
    if (saved && typeof saved === "object") {
      const state: ArenaState = { ...fresh(saved.startedAt), ...saved };
      arenaRef.current = state;
      INSTRUMENTS.forEach((i) => {
        const px = Number(state.prices ? state.prices[i.sym] : NaN);
        if (isFinite(px) && px > 0) {
          midRef.current[i.sym] = px;
          sessionRef.current[i.sym] = { o: px, h: px, l: px };
        }
      });
      setLots(Number(state.defLots).toFixed(2));
    }
    setLoaded(true);
  }, []);

  /* Run fn (which may remove the focused Close/Cancel button) and keep focus inside the book panel. */
  const keepPanelFocus = (fn: () => void) => {
    const active = document.activeElement;
    const panel = active instanceof Element ? (active.closest(".pa-panel") as HTMLElement | null) : null;
    fn();
    if (panel) {
      window.requestAnimationFrame(() => {
        if (!panel.contains(document.activeElement)) panel.focus();
      });
    }
  };

  const closePosition = useCallback(
    (id: string, reason?: string) => {
      const state = arenaRef.current;
      if (!state) return;
      const at = state.positions.findIndex((p) => p.id === id);
      if (at === -1) return;
      const mid = midRef.current;
      const p = state.positions[at];
      const px = closePrice(mid, p);
      const pnl = round(pnlOf(mid, p, px), 2);
      state.positions.splice(at, 1);
      state.balance = round(state.balance + pnl, 2);
      state.history.unshift({
        id: p.id, sym: p.sym, side: p.side, lots: p.lots, open: p.open, close: px, pnl,
        at: p.at, closedAt: new Date().toISOString(), reason: reason || "manual",
      });
      save();
      rerender();
      toastRef.current(
        reason && reason !== "manual" ? "Position closed by " + reason.toUpperCase() : "Position closed",
        p.sym + " " + fmtUsd(pnl, true) + " realised",
        pnl < -0.004 ? "error" : undefined,
      );
    },
    [save],
  );

  /* ---------- Simulated price feed ---------- */
  useEffect(() => {
    const timer = window.setInterval(() => {
      const state = arenaRef.current;
      if (!state || document.hidden) return;
      const mid = midRef.current;
      INSTRUMENTS.forEach((i) => {
        const shock = (Math.random() + Math.random() + Math.random() - 1.5) * 2 * i.vol;
        const next = round(mid[i.sym] * (1 + shock), i.digits);
        mid[i.sym] = next > 0 ? next : mid[i.sym];
        const s = sessionRef.current[i.sym];
        if (next > s.h) s.h = next;
        if (next < s.l) s.l = next;
        state.prices[i.sym] = mid[i.sym];
      });
      // TP / SL hits close the position on the next tick
      state.positions.slice().forEach((p) => {
        const px = closePrice(mid, p);
        const dir = p.side === "buy" ? 1 : -1;
        if (p.tp !== null && p.tp !== undefined && (px - p.tp) * dir >= 0) keepPanelFocus(() => closePosition(p.id, "tp"));
        else if (p.sl !== null && p.sl !== undefined && (p.sl - px) * dir >= 0) keepPanelFocus(() => closePosition(p.id, "sl"));
      });
      save();
      rerender();
    }, reduceMotion ? 4000 : 1500);
    return () => window.clearInterval(timer);
  }, [reduceMotion, save, closePosition]);

  /* ---------- Popovers: focus on open, close on outside click ---------- */
  useEffect(() => {
    if (listOpen) listRef.current?.focus();
  }, [listOpen]);
  useEffect(() => {
    if (listOpen) document.getElementById("pa-opt-" + INSTRUMENTS[activeIdx].sym)?.scrollIntoView({ block: "nearest" });
  }, [listOpen, activeIdx]);
  useEffect(() => {
    if (settingsOpen) document.getElementById("pa-def-lots")?.focus();
  }, [settingsOpen]);
  useEffect(() => {
    if (!listOpen && !settingsOpen) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (listOpen && !target?.closest(".pa-sym")) setListOpen(false);
      if (settingsOpen && !target?.closest(".pa-set")) setSettingsOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [listOpen, settingsOpen]);

  const arena = arenaRef.current;
  const started = arena !== null;
  const mid = midRef.current;
  const current = BY_SYM[sym];
  const session = sessionRef.current[sym];
  const chg = ((mid[sym] - session.o) / session.o) * 100;
  const upDown = chg >= 0 ? "pa-up" : "pa-dn";
  const account = arena ? accountOf(mid, arena) : null;
  const isFav = !!arena && arena.favs.includes(sym);
  const marketPx = side === "buy" ? ask(mid, current) : bid(mid, current);
  const lotsNum = Number(lots);
  const marginNeed = isFinite(lotsNum) && lotsNum > 0 ? fmtUsd(marginFor(current, lotsNum, marketPx)) : "$0.00";
  const entryBelow = (orderType === "limit") === (side === "buy");
  const entryHint =
    orderType === "market"
      ? ""
      : (orderType === "limit" ? "Limit" : "Stop") + " " + side + " must be " + (entryBelow ? "below " : "above ") + fmtPx(current, marketPx);
  const submitLabel = side.toUpperCase() + (orderType === "market" ? "" : " " + orderType.toUpperCase()) + " " + sym;

  /* ---------- Start gate ---------- */
  const begin = () => {
    const state = fresh();
    INSTRUMENTS.forEach((i) => {
      state.prices[i.sym] = midRef.current[i.sym];
    });
    arenaRef.current = state;
    save();
    setLots(state.defLots.toFixed(2));
    rerender();
    toast("Welcome to BattleTrader Play!", "Your trading journey has begun.");
    focusId("pa-sym-btn");
  };

  /* ---------- Symbol picker (listbox) ---------- */
  const openList = () => {
    setActiveIdx(INSTRUMENTS.indexOf(current));
    setListOpen(true);
  };
  const closeList = (refocus: boolean) => {
    setListOpen(false);
    if (refocus) document.getElementById("pa-sym-btn")?.focus();
  };
  const pickSymbol = (next: string) => {
    setSym(next);
    setTp("");
    setSl("");
    setEntry("");
    clearErrs("pa-tp", "pa-sl", "pa-entry", "pa-lots");
  };
  const moveActive = (n: number) => setActiveIdx((n + INSTRUMENTS.length) % INSTRUMENTS.length);
  const onListKey = (e: ReactKeyboardEvent<HTMLUListElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); moveActive(activeIdx + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); moveActive(activeIdx - 1); }
    else if (e.key === "Home") { e.preventDefault(); moveActive(0); }
    else if (e.key === "End") { e.preventDefault(); moveActive(INSTRUMENTS.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pickSymbol(INSTRUMENTS[activeIdx].sym); closeList(true); }
    else if (e.key === "Escape") { e.preventDefault(); closeList(true); }
    else if (e.key === "Tab") closeList(false);
  };

  const toggleFav = () => {
    if (!arena) return;
    const at = arena.favs.indexOf(sym);
    if (at === -1) arena.favs.push(sym);
    else arena.favs.splice(at, 1);
    save();
    rerender();
  };

  /* ---------- Settings popover ---------- */
  const closeSettings = (refocus: boolean) => {
    setSettingsOpen(false);
    if (refocus) document.getElementById("pa-settings")?.focus();
  };
  const changeDefLots = (value: string) => {
    if (!arena) return;
    arena.defLots = Number(value);
    setLots(arena.defLots.toFixed(2));
    clearErrs("pa-lots");
    save();
    rerender();
  };

  /* ---------- Tool rail (visual only) ---------- */
  const pickTool = (id: string, focus: boolean) => {
    setTool(id);
    if (focus) document.querySelector<HTMLElement>('.pa-tool[data-tool="' + id + '"]')?.focus();
  };
  const onToolKey = (e: ReactKeyboardEvent<HTMLButtonElement>, n: number) => {
    const steps: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    const step = steps[e.key];
    if (step) { e.preventDefault(); pickTool(TOOLS[(n + step + TOOLS.length) % TOOLS.length].id, true); }
    else if (e.key === "Home") { e.preventDefault(); pickTool(TOOLS[0].id, true); }
    else if (e.key === "End") { e.preventDefault(); pickTool(TOOLS[TOOLS.length - 1].id, true); }
  };

  /* ---------- Order ticket ---------- */
  const stepLots = (step: number) => {
    let v = Number(lots);
    if (!isFinite(v)) v = MIN_LOTS;
    v = round(v + step * 0.01, 2);
    setLots(Math.min(MAX_LOTS, Math.max(MIN_LOTS, v)).toFixed(2));
    clearErrs("pa-lots");
  };

  const validate = (state: ArenaState) => {
    const errs: [FieldId, string][] = [];
    const dir = side === "buy" ? 1 : -1;
    const lotsRaw = lots.trim();
    const lotsVal = Number(lotsRaw);
    if (lotsRaw === "" || !isFinite(lotsVal)) errs.push(["pa-lots", "Enter a lot size."]);
    else if (lotsVal < MIN_LOTS) errs.push(["pa-lots", "Minimum is 0.01 lots."]);
    else if (lotsVal > MAX_LOTS) errs.push(["pa-lots", "Maximum is 100 lots."]);
    else if (Math.abs(Math.round(lotsVal * 100) - lotsVal * 100) > 1e-6) errs.push(["pa-lots", "Use steps of 0.01 lots."]);

    let ref = marketPx;
    if (orderType !== "market") {
      const entryVal = readNum(entry);
      if (entryVal.empty || !entryVal.ok) errs.push(["pa-entry", "Enter the price to trigger this order."]);
      else if (entryBelow && entryVal.n >= marketPx) errs.push(["pa-entry", "Must be below the current price " + fmtPx(current, marketPx) + "."]);
      else if (!entryBelow && entryVal.n <= marketPx) errs.push(["pa-entry", "Must be above the current price " + fmtPx(current, marketPx) + "."]);
      else ref = entryVal.n;
    }
    const refLabel = orderType === "market" ? "the current price " + fmtPx(current, marketPx) : "your entry " + fmtPx(current, ref);

    const tpVal = readNum(tp);
    if (!tpVal.empty) {
      if (!tpVal.ok) errs.push(["pa-tp", "Enter a valid price or leave it empty."]);
      else if ((tpVal.n - ref) * dir <= 0) errs.push(["pa-tp", "For a " + side + ", take profit must be " + (dir > 0 ? "above " : "below ") + refLabel + "."]);
    }
    const slVal = readNum(sl);
    if (!slVal.empty) {
      if (!slVal.ok) errs.push(["pa-sl", "Enter a valid price or leave it empty."]);
      else if ((ref - slVal.n) * dir <= 0) errs.push(["pa-sl", "For a " + side + ", stop loss must be " + (dir > 0 ? "below " : "above ") + refLabel + "."]);
    }

    if (!errs.some((er) => er[0] === "pa-lots") && orderType === "market") {
      const need = marginFor(current, lotsVal, marketPx);
      if (need > accountOf(mid, state).free) errs.push(["pa-lots", "Not enough free margin: this needs " + fmtUsd(need) + "."]);
    }
    return { errs, lots: round(lotsVal, 2), entry: ref, tp: tpVal.ok ? tpVal.n : null, sl: slVal.ok ? slVal.n : null };
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const state = arenaRef.current;
    if (!state) return;
    const v = validate(state);
    setErrors(Object.fromEntries(v.errs));
    if (v.errs.length) {
      document.getElementById(v.errs[0][0])?.focus();
      return;
    }
    const now = new Date().toISOString();
    if (orderType === "market") {
      state.positions.unshift({ id: uid(), sym, side, lots: v.lots, open: v.entry, tp: v.tp, sl: v.sl, at: now });
      toast("Position opened", side.toUpperCase() + " " + v.lots.toFixed(2) + " " + sym + " @ " + fmtPx(current, v.entry));
      setTab("pos");
    } else {
      state.orders.unshift({ id: uid(), sym, side, type: orderType, lots: v.lots, price: v.entry, tp: v.tp, sl: v.sl, at: now });
      toast("Order placed", side.toUpperCase() + " " + orderType.toUpperCase() + " " + v.lots.toFixed(2) + " " + sym + " @ " + fmtPx(current, v.entry));
      setTab("ord");
    }
    setTp("");
    setSl("");
    setEntry("");
    save();
    rerender();
  };

  /* ---------- Positions / Orders / History ---------- */
  const onTabKey = (e: ReactKeyboardEvent<HTMLButtonElement>, n: number) => {
    let to: TabId | null = null;
    if (e.key === "ArrowRight") to = TABS[(n + 1) % TABS.length].id;
    else if (e.key === "ArrowLeft") to = TABS[(n - 1 + TABS.length) % TABS.length].id;
    else if (e.key === "Home") to = TABS[0].id;
    else if (e.key === "End") to = TABS[TABS.length - 1].id;
    if (!to) return;
    e.preventDefault();
    setTab(to);
    document.getElementById("pa-tab-" + to)?.focus();
  };

  const cancelOrder = (o: PendingOrder) =>
    keepPanelFocus(() => {
      if (!arena) return;
      arena.orders = arena.orders.filter((x) => x.id !== o.id);
      save();
      rerender();
      toast("Order cancelled", o.sym + " " + o.type + " order removed.");
    });

  const emptyState = (id: TabId, title: string, text: string, action: string) => (
    <div className="pa-empty">
      <span><Svg body={EMPTY_ICONS[id]} /></span>
      <b>{title}</b>
      <p>{text}</p>
      <button type="button" onClick={() => document.getElementById("pa-lots")?.focus()}>{action}</button>
    </div>
  );

  const head = (labels: string[]) => (
    <thead>
      <tr>{labels.map((h, k) => <th scope="col" key={k}>{h}</th>)}</tr>
    </thead>
  );
  const sideTag = (s: Side) => <span className={"pa-tag is-" + s}>{s}</span>;

  /* ---------- Reset dialog ---------- */
  const openReset = (opener: HTMLElement | null) => {
    openerRef.current = opener;
    setSettingsOpen(false);
    dialogRef.current?.showModal();
    document.getElementById("pa-reset-cancel")?.focus();
  };
  const restoreFocus = () => {
    openerRef.current?.focus();
    openerRef.current = null;
  };
  const closeReset = () => {
    dialogRef.current?.close();
    restoreFocus();
  };
  const confirmReset = () => {
    const keep = arenaRef.current;
    if (!keep) return;
    const state = fresh(keep.startedAt);
    state.favs = keep.favs;
    state.defLots = keep.defLots;
    INSTRUMENTS.forEach((i) => {
      state.prices[i.sym] = midRef.current[i.sym];
    });
    arenaRef.current = state;
    save();
    closeReset();
    setErrors({});
    setLots(Number(state.defLots).toFixed(2));
    rerender();
    toast("Account reset", "Back to " + fmtUsd(START_BALANCE) + " virtual balance. Fresh battle!");
  };

  const fieldErr = (id: FieldId) => (
    <p className="pa-err" id={id + "-err"} hidden={!errors[id]}>{errors[id] ?? ""}</p>
  );

  return (
    <>
      <section className="pa-gate" id="pa-start" aria-labelledby="pa-start-h" hidden={!loaded || started}>
        <div className="pa-gate-glow" aria-hidden="true"></div>
        <div className="ac pa-start-card" data-glass="">
          <span className="pa-start-ico" aria-hidden="true"><Svg body='<path d="m3 17 6-6 4 4 8-8M15 7h6v6"/>' /></span>
          <h1 id="pa-start-h">Start my trading journey</h1>
          <p className="pa-start-sub">Welcome to BattleTrader Play &ndash; your personal trading arena</p>
          <ul className="pa-start-stats">
            <li><b>$100,000</b><span>Virtual balance</span></li>
            <li><b>1:200</b><span>Leverage</span></li>
            <li><b>Live markets</b><span>Real-time data</span></li>
          </ul>
          <ul className="pa-start-list">
            <li><Svg body={CHECK_ICON} /><span>Trade stocks, forex, crypto, commodities and indices with real-time prices</span></li>
            <li><Svg body={CHECK_ICON} /><span>Practice strategies risk-free before entering tournaments</span></li>
            <li><Svg body={CHECK_ICON} /><span>Reset your account anytime to start fresh</span></li>
          </ul>
          <button className="pa-begin" id="pa-begin" type="button" onClick={begin}><Svg body='<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>' /><span>Begin trading</span></button>
          <p className="pa-note"><Svg body={LOCK_ICON} />Practice account &middot; virtual funds. Prices are simulated sample data until the trading backend goes live.</p>
        </div>
      </section>

      <section className="pa-term" id="pa-term" aria-labelledby="pa-term-h" hidden={!started}>
        <div className="pa-strip" data-glass="">
          <button
            className="pa-ibtn pa-fav"
            id="pa-fav"
            type="button"
            aria-pressed={isFav}
            aria-label={(isFav ? "Remove " : "Add ") + sym + (isFav ? " from favourites" : " to favourites")}
            onClick={toggleFav}
          >
            <Svg body='<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>' />
          </button>
          <div className="pa-sym">
            <button
              className="pa-sym-btn"
              id="pa-sym-btn"
              type="button"
              aria-haspopup="listbox"
              aria-expanded={listOpen}
              aria-controls="pa-sym-list"
              aria-label={"Instrument: " + sym + ". Change instrument"}
              onClick={() => (listOpen ? closeList(true) : openList())}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  openList();
                }
              }}
            >
              <b id="pa-sym-name">{sym}</b><Svg body='<path d="m6 9 6 6 6-6"/>' />
            </button>
            <ul
              className="pa-sym-list"
              id="pa-sym-list"
              role="listbox"
              aria-label="Instruments"
              tabIndex={-1}
              hidden={!listOpen}
              aria-activedescendant={listOpen ? "pa-opt-" + INSTRUMENTS[activeIdx].sym : undefined}
              onKeyDown={onListKey}
              ref={listRef}
            >
              {INSTRUMENTS.map((i, n) => (
                <li
                  className={"pa-sym-opt" + (n === activeIdx ? " is-active" : "")}
                  id={"pa-opt-" + i.sym}
                  role="option"
                  aria-selected={i.sym === sym}
                  key={i.sym}
                  onClick={() => {
                    pickSymbol(i.sym);
                    closeList(true);
                  }}
                  onMouseMove={() => setActiveIdx(n)}
                >
                  <b>{i.sym}</b>
                  <small>{i.cls + " · " + i.name}</small>
                  <em className={mid[i.sym] - sessionRef.current[i.sym].o >= 0 ? "pa-up" : "pa-dn"}>{fmtPx(i, mid[i.sym])}</em>
                </li>
              ))}
            </ul>
          </div>
          <p className="pa-quote" aria-live="off"><b id="pa-price" className={upDown}>{fmtPx(current, mid[sym])}</b><span id="pa-chg" className={upDown}>{(chg >= 0 ? "+" : "") + chg.toFixed(2) + "%"}</span></p>
          <h1 className="pa-title" id="pa-term-h"><span className="pa-av" data-initials="">{profile.initials}</span><span className="pa-title-txt"><span data-username="">{profile.username}</span>&rsquo;s Personal Arena</span></h1>
          <span className="pa-practice"><Svg body={LOCK_ICON} />Practice account &middot; virtual funds</span>
          <div className="pa-set">
            <button
              className="pa-ibtn"
              id="pa-settings"
              type="button"
              aria-label="Arena settings"
              aria-expanded={settingsOpen}
              aria-controls="pa-set-pop"
              onClick={() => setSettingsOpen((open) => !open)}
            >
              <Svg body='<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>' />
            </button>
            <div
              className="pa-set-pop"
              id="pa-set-pop"
              hidden={!settingsOpen}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  closeSettings(true);
                }
              }}
            >
              <label htmlFor="pa-def-lots">Default lot size</label>
              <select className="pa-in" id="pa-def-lots" value={String(arena?.defLots ?? 0.1)} onChange={(e) => changeDefLots(e.target.value)}>
                <option value="0.01">0.01</option><option value="0.1">0.10</option><option value="1">1.00</option><option value="5">5.00</option>
              </select>
              <button className="pa-pop-reset" id="pa-reset-2" type="button" onClick={() => openReset(document.getElementById("pa-settings"))}>
                <Svg body={RESET_ICON} />Reset account
              </button>
            </div>
          </div>
        </div>

        <div className="pa-desk">
          <div className="pa-rail" role="toolbar" aria-label="Drawing tools" aria-orientation="vertical">
            {TOOLS.map((t, n) => (
              <button
                className="pa-tool"
                type="button"
                data-tool={t.id}
                aria-label={t.label}
                title={t.label}
                aria-pressed={tool === t.id}
                tabIndex={tool === t.id ? 0 : -1}
                key={t.id}
                onClick={() => pickTool(t.id, false)}
                onKeyDown={(e) => onToolKey(e, n)}
              >
                <Svg body={t.body} />
              </button>
            ))}
          </div>

          <div className="pa-chartcol">
            <div className="pa-ohlc">
              <dl className="pa-ohlc-dl" aria-label="Session open, high, low, close">
                <div><dt>O</dt><dd id="pa-o">{fmtPx(current, session.o)}</dd></div>
                <div><dt>H</dt><dd id="pa-h">{fmtPx(current, session.h)}</dd></div>
                <div><dt>L</dt><dd id="pa-l">{fmtPx(current, session.l)}</dd></div>
                <div><dt>C</dt><dd id="pa-c">{fmtPx(current, mid[sym])}</dd></div>
              </dl>
              <div className="pa-tfs" role="group" aria-label="Timeframe">
                {TIMEFRAMES.map((t) => (
                  <button className="pa-tf" type="button" data-tf={t} aria-pressed={timeframe === t} key={t} onClick={() => setTimeframe(t)}>{t}</button>
                ))}
              </div>
            </div>
            <div className="pa-chart" data-glass="">
              <div className="pa-chart-in">
                <span className="pa-chart-ico" aria-hidden="true"><Svg body='<path d="M7 3v4M7 15v6M17 3v2M17 13v8"/><rect x="5" y="7" width="4" height="8" rx="1"/><rect x="15" y="5" width="4" height="8" rx="1"/>' /></span>
                <p className="pa-chart-h">Live chart connects when the trading backend goes live</p>
                <p className="pa-chart-sub"><span id="pa-chart-sym">{sym}</span> &middot; <span id="pa-chart-tf">{timeframe}</span> &middot; prices below are simulated sample data</p>
              </div>
            </div>
          </div>

          <form className="ac pa-ticket" id="pa-ticket" noValidate aria-labelledby="pa-ticket-h" data-glass="" onSubmit={submit}>
            <div className="ac-h"><h2 id="pa-ticket-h"><Svg body='<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2"/>' />Order ticket</h2></div>
            <div className="pa-sides" role="group" aria-label="Direction">
              {(["buy", "sell"] as const).map((s) => (
                <button
                  className={"pa-side pa-" + s}
                  type="button"
                  data-side={s}
                  aria-pressed={side === s}
                  key={s}
                  onClick={() => {
                    setSide(s);
                    clearErrs("pa-tp", "pa-sl", "pa-entry");
                  }}
                >
                  <span>{s === "buy" ? "Buy" : "Sell"}</span>
                  <small id={s === "buy" ? "pa-ask" : "pa-bid"}>{fmtPx(current, s === "buy" ? ask(mid, current) : bid(mid, current))}</small>
                </button>
              ))}
            </div>
            <div className="pa-f">
              <label htmlFor="pa-type">Type</label>
              <select
                className="pa-in"
                id="pa-type"
                name="pa-type"
                value={orderType}
                onChange={(e) => {
                  setOrderType(e.target.value as OrderType);
                  clearErrs("pa-entry");
                }}
              >
                <option value="market">Market</option><option value="limit">Limit</option><option value="stop">Stop</option>
              </select>
            </div>
            <div className="pa-f" id="pa-entry-f" hidden={orderType === "market"}>
              <label htmlFor="pa-entry">Entry price</label>
              <input
                className="pa-in"
                id="pa-entry"
                name="pa-entry"
                type="number"
                inputMode="decimal"
                step="any"
                aria-describedby="pa-entry-err pa-entry-hint"
                aria-invalid={errors["pa-entry"] ? true : undefined}
                value={entry}
                onChange={(e) => {
                  setEntry(e.target.value);
                  clearErrs("pa-entry");
                }}
              />
              <p className="pa-hint" id="pa-entry-hint">{entryHint}</p>
              {fieldErr("pa-entry")}
            </div>
            <div className="pa-f">
              <label htmlFor="pa-lots">Lots</label>
              <div className="pa-step">
                <button className="pa-step-b" type="button" data-step="-1" aria-label="Decrease lots" onClick={() => stepLots(-1)}><Svg body='<path d="M5 12h14"/>' /></button>
                <input
                  className="pa-in"
                  id="pa-lots"
                  name="pa-lots"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  max="100"
                  aria-describedby="pa-lots-err pa-lots-hint"
                  aria-invalid={errors["pa-lots"] ? true : undefined}
                  value={lots}
                  onChange={(e) => {
                    setLots(e.target.value);
                    clearErrs("pa-lots");
                  }}
                />
                <button className="pa-step-b" type="button" data-step="1" aria-label="Increase lots" onClick={() => stepLots(1)}><Svg body='<path d="M12 5v14M5 12h14"/>' /></button>
              </div>
              <p className="pa-hint" id="pa-lots-hint">Margin <b id="pa-margin-need">{marginNeed}</b> &middot; 1:200</p>
              {fieldErr("pa-lots")}
            </div>
            <div className="pa-two">
              <div className="pa-f" id="pa-tp-f">
                <label htmlFor="pa-tp">Take profit</label>
                <input
                  className="pa-in"
                  id="pa-tp"
                  name="pa-tp"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  placeholder="Optional"
                  aria-describedby="pa-tp-err"
                  aria-invalid={errors["pa-tp"] ? true : undefined}
                  value={tp}
                  onChange={(e) => {
                    setTp(e.target.value);
                    clearErrs("pa-tp");
                  }}
                />
                {fieldErr("pa-tp")}
              </div>
              <div className="pa-f" id="pa-sl-f">
                <label htmlFor="pa-sl">Stop loss</label>
                <input
                  className="pa-in"
                  id="pa-sl"
                  name="pa-sl"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  placeholder="Optional"
                  aria-describedby="pa-sl-err"
                  aria-invalid={errors["pa-sl"] ? true : undefined}
                  value={sl}
                  onChange={(e) => {
                    setSl(e.target.value);
                    clearErrs("pa-sl");
                  }}
                />
                {fieldErr("pa-sl")}
              </div>
            </div>
            <button className={"pa-submit " + (side === "buy" ? "is-buy" : "is-sell")} id="pa-submit" type="submit">{submitLabel}</button>
          </form>
        </div>

        <div className="ac pa-acct" data-glass="">
          <dl className="pa-acct-dl">
            <div><dt>Balance</dt><dd id="pa-bal">{fmtUsd(arena ? arena.balance : START_BALANCE)}</dd></div>
            <div><dt>Equity</dt><dd id="pa-eq">{fmtUsd(account ? account.equity : START_BALANCE)}</dd></div>
            <div><dt>Margin level</dt><dd id="pa-ml">{account && account.level !== null ? Math.round(account.level).toLocaleString("en-US") + "%" : "\u2014"}</dd></div>
            <div><dt>Free margin</dt><dd id="pa-fm">{fmtUsd(account ? account.free : START_BALANCE)}</dd></div>
            <div><dt>P&amp;L</dt><dd id="pa-pl" className={tone(account ? account.floating : 0) || undefined}>{fmtUsd(account ? account.floating : 0, true)}</dd></div>
          </dl>
          <button className="pa-reset" id="pa-reset" type="button" onClick={(e) => openReset(e.currentTarget)}><Svg body={RESET_ICON} />Reset account</button>
        </div>

        <div className="ac pa-book">
          <div className="pa-tabs" role="tablist" aria-label="Trades">
            {TABS.map((t, n) => {
              const count = arena ? (t.id === "pos" ? arena.positions : t.id === "ord" ? arena.orders : arena.history).length : 0;
              return (
                <button
                  className="pa-tab"
                  id={"pa-tab-" + t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  aria-controls={"pa-panel-" + t.id}
                  tabIndex={tab === t.id ? undefined : -1}
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  onKeyDown={(e) => onTabKey(e, n)}
                >
                  {t.label} <span id={"pa-n-" + t.id}>{"(" + count + ")"}</span>
                </button>
              );
            })}
          </div>

          <div className="pa-panel" id="pa-panel-pos" role="tabpanel" aria-labelledby="pa-tab-pos" tabIndex={0} hidden={tab !== "pos"}>
            {arena && arena.positions.length > 0 ? (
              <table className="pa-tbl">
                {head(["Symbol", "Side", "Lots", "Open", "Current", "TP", "SL", "P&L", ""])}
                <tbody>
                  {arena.positions.map((p) => {
                    const i = BY_SYM[p.sym];
                    const pnl = pnlOf(mid, p);
                    return (
                      <tr key={p.id}>
                        <td data-label="Symbol">{p.sym}</td>
                        <td data-label="Side">{sideTag(p.side)}</td>
                        <td data-label="Lots">{p.lots.toFixed(2)}</td>
                        <td data-label="Open">{fmtPx(i, p.open)}</td>
                        <td data-label="Current" data-live={"px-" + p.id}>{fmtPx(i, closePrice(mid, p))}</td>
                        <td data-label="TP">{opt(i, p.tp)}</td>
                        <td data-label="SL">{opt(i, p.sl)}</td>
                        <td data-label="P&L" data-live={"pnl-" + p.id} className={tone(pnl) || undefined}>{fmtUsd(pnl, true)}</td>
                        <td data-label="" className="pa-td-act">
                          <button
                            type="button"
                            className="pa-row-btn"
                            aria-label={"Close " + p.side + " " + p.lots.toFixed(2) + " " + p.sym}
                            onClick={() => keepPanelFocus(() => closePosition(p.id))}
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              emptyState("pos", "No open positions", "Open a market order from the ticket and it shows up here with live P&L.", "Open a position")
            )}
          </div>

          <div className="pa-panel" id="pa-panel-ord" role="tabpanel" aria-labelledby="pa-tab-ord" tabIndex={0} hidden={tab !== "ord"}>
            {arena && arena.orders.length > 0 ? (
              <table className="pa-tbl">
                {head(["Symbol", "Side", "Type", "Lots", "Price", "TP", "SL", "Placed", ""])}
                <tbody>
                  {arena.orders.map((o) => {
                    const i = BY_SYM[o.sym];
                    return (
                      <tr key={o.id}>
                        <td data-label="Symbol">{o.sym}</td>
                        <td data-label="Side">{sideTag(o.side)}</td>
                        <td data-label="Type">{o.type.charAt(0).toUpperCase() + o.type.slice(1)}</td>
                        <td data-label="Lots">{o.lots.toFixed(2)}</td>
                        <td data-label="Price">{fmtPx(i, o.price)}</td>
                        <td data-label="TP">{opt(i, o.tp)}</td>
                        <td data-label="SL">{opt(i, o.sl)}</td>
                        <td data-label="Placed">{new Date(o.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</td>
                        <td data-label="" className="pa-td-act">
                          <button
                            type="button"
                            className="pa-row-btn"
                            aria-label={"Cancel " + o.side + " " + o.type + " " + o.sym}
                            onClick={() => cancelOrder(o)}
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              emptyState("ord", "No pending orders", "Pick Limit or Stop in the ticket to queue an entry at your price.", "Place an order")
            )}
          </div>

          <div className="pa-panel" id="pa-panel-his" role="tabpanel" aria-labelledby="pa-tab-his" tabIndex={0} hidden={tab !== "his"}>
            {arena && arena.history.length > 0 ? (
              <table className="pa-tbl">
                {head(["Symbol", "Side", "Lots", "Open", "Close", "Closed", "P&L"])}
                <tbody>
                  {arena.history.map((h) => {
                    const i = BY_SYM[h.sym];
                    return (
                      <tr key={h.id + h.closedAt}>
                        <td data-label="Symbol">{h.sym}</td>
                        <td data-label="Side">{sideTag(h.side)}</td>
                        <td data-label="Lots">{h.lots.toFixed(2)}</td>
                        <td data-label="Open">{fmtPx(i, h.open)}</td>
                        <td data-label="Close">{fmtPx(i, h.close)}</td>
                        <td data-label="Closed">{new Date(h.closedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                        <td data-label="P&L" className={tone(h.pnl) || undefined}>{fmtUsd(h.pnl, true)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              emptyState("his", "No closed trades yet", "Closed positions land here with their realised P&L.", "Start trading")
            )}
          </div>
        </div>
      </section>

      <dialog className="pa-modal" id="pa-reset-dlg" aria-labelledby="pa-reset-h" aria-describedby="pa-reset-txt" ref={dialogRef} onClose={restoreFocus}>
        <div className="pa-modal-h">
          <span className="pa-modal-ico" aria-hidden="true"><Svg body={RESET_ICON} /></span>
          <h2 id="pa-reset-h">Reset practice account?</h2>
          <button className="pa-x" id="pa-reset-x" type="button" aria-label="Close" onClick={closeReset}><Svg body='<path d="M6 6l12 12M18 6 6 18"/>' /></button>
        </div>
        <p id="pa-reset-txt">Your balance goes back to <b>$100,000</b>. All open positions, pending orders and trade history are cleared. This can&rsquo;t be undone.</p>
        <div className="pa-modal-btns">
          <button className="pa-ghost" id="pa-reset-cancel" type="button" onClick={closeReset}>Keep my account</button>
          <button className="pa-danger" id="pa-reset-ok" type="button" onClick={confirmReset}>Reset account</button>
        </div>
      </dialog>
    </>
  );
}
