"use client";

/* Redeem page — port of redeem.js. Vouchers live in `bt-vouchers`, always via the BTTournaments API. */
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { Svg } from "@panel/components/Icon";
import { usePanel } from "@panel/lib/panel";
import { BTTournaments as T } from "@panel/lib/data/tournaments";
import type { Voucher } from "@panel/lib/data/tournaments";

const DAY_MS = 24 * 3600000;
const SAMPLES = ["ARENA20", "BATTLE50", "FREEMINI", "SEASON10"];

const ICONS = {
  percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  ticket: '<path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4 2 2 0 0 0 0-4V6H3z"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
  dollar: '<path d="M12 2v20M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.6 7 6.8c0 4.8 10 2.6 10 7.6 0 2.2-2.2 3.6-5 3.6s-5-1.2-5-3.4"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  repeat: '<path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  arrow: '<path d="M7 17 17 7M8 7h9v9"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5h.01"/>',
  tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  tick: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
};

const fmtDate = (iso: string): string => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const discountLabel = (v: Voucher): string => {
  if (v.kind === "free-entry") return "Free entry";
  if (v.kind === "percent") return v.value + "% off";
  return "$" + v.value + " off";
};
const iconFor = (v: Voucher): string => (v.kind === "free-entry" ? ICONS.ticket : v.kind === "percent" ? ICONS.percent : ICONS.dollar);
const isExpired = (v: Voucher): boolean => new Date(v.expiresAt).getTime() <= Date.now();
const normalise = (raw: string): string => raw.toUpperCase().replace(/\s+/g, "").slice(0, 24);

type ResultKind = "ok" | "warn" | "bad";
type TabId = "available" | "history";

function VoucherRow({ v, past, isNew }: { v: Voucher; past: boolean; isNew: boolean }) {
  const left = new Date(v.expiresAt).getTime() - Date.now();
  const soon = !past && left < 7 * DAY_MS;
  const days = Math.max(1, Math.ceil(left / DAY_MS));
  return (
    <li className={"rd-v" + (past ? " is-past" : "") + (isNew ? " is-new" : "")} data-code={v.code}>
      <span className={"rd-v-ico is-" + (v.kind === "free-entry" ? "ticket" : v.kind)}><Svg body={iconFor(v)} /></span>
      <div className="rd-v-main">
        <div className="rd-v-top">
          <span className="rd-v-code">{v.code}</span>
          <span className="rd-chip is-off">{discountLabel(v)}</span>
          {!past ? (
            <span className="rd-chip is-avail">Available</span>
          ) : v.usedAt ? (
            <span className="rd-chip is-used">{"Used " + fmtDate(v.usedAt)}</span>
          ) : (
            <span className="rd-chip is-expired">Expired</span>
          )}
        </div>
        <ul className="rd-meta">
          <li><Svg body={ICONS.layers} />{"Applies to: " + v.appliesTo.map(T.typeLabel).join(", ")}</li>
          <li><Svg body={ICONS.repeat} />{"Uses left: " + v.usesLeft + " / " + v.usesTotal}</li>
          <li><Svg body={ICONS.calendar} />{"Added " + fmtDate(v.addedAt)}</li>
          {soon ? (
            <li className="is-soon"><Svg body={ICONS.clock} />{"Expires in " + days + " day" + (days === 1 ? "" : "s")}</li>
          ) : (
            <li><Svg body={ICONS.clock} />{(isExpired(v) ? "Expired " : "Expires ") + fmtDate(v.expiresAt)}</li>
          )}
        </ul>
      </div>
      {!past && (
        <Link className="rd-use" href="/app/browse-tournaments/" aria-label={"Use " + v.code + " in a tournament"}>
          Use in a tournament<Svg body={ICONS.arrow} />
        </Link>
      )}
    </li>
  );
}

export default function RedeemBody() {
  const { toast } = usePanel();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ kind: ResultKind; content: ReactNode } | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [tab, setTab] = useState<TabId>("available");
  const [available, setAvailable] = useState<Voucher[]>([]);
  const [history, setHistory] = useState<Voucher[]>([]);
  const [highlight, setHighlight] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const render = useCallback(() => {
    setAvailable(T.vouchers());
    setHistory(T.allVouchers().filter((v) => v.usesLeft <= 0 || isExpired(v)));
  }, []);

  // Vouchers can change in another tab (enroll dialog); keep the lists current.
  useEffect(() => {
    render();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "bt-vouchers") render();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", render);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pageshow", render);
    };
  }, [render]);

  const focusInput = () => inputRef.current?.focus();

  const onInput = (raw: string, pos: number | null) => {
    const next = normalise(raw);
    setCode(next);
    setInvalid(false);
    if (next !== raw && pos !== null) {
      const caret = Math.min(pos, next.length);
      window.requestAnimationFrame(() => inputRef.current?.setSelectionRange(caret, caret));
    }
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = normalise(code.trim());
    if (!value || busy) return;
    setBusy(true);
    window.setTimeout(() => {
      const res = T.redeemCode(value);
      setBusy(false);
      if (res.ok) {
        setResult({ kind: "ok", content: <><b>{res.voucher.code}</b>{" added - " + discountLabel(res.voucher)}</> });
        setInvalid(false);
        setCode("");
        setTab("available");
        setHighlight(res.voucher.code);
        render();
        toast("Voucher added", res.voucher.code + " - " + discountLabel(res.voucher) + " is ready to use.");
      } else if (res.reason === "used") {
        setResult({ kind: "warn", content: <>You&apos;ve already redeemed <b>{value}</b>. Each code works once per account.</> });
        setInvalid(true);
      } else {
        setResult({ kind: "bad", content: "That code isn't valid. Check it and try again." });
        setInvalid(true);
      }
      focusInput();
    }, 500);
  };

  const onTabKey = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const order: TabId[] = ["available", "history"];
    const i = order.indexOf(tab);
    let next = i;
    if (e.key === "ArrowRight") next = (i + 1) % order.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + order.length) % order.length;
    else if (e.key === "Home") next = 0;
    else next = order.length - 1;
    setTab(order[next]);
    document.getElementById("rd-tab-" + order[next])?.focus();
  };

  return (
    <div className="rd-page">
      <section className="ah rd-hero" aria-labelledby="rd-title">
        <div className="ah-floor" aria-hidden="true"></div>
        <div className="ah-txt">
          <span className="rd-hero-ico"><Svg body={ICONS.ticket} /></span>
          <h1 id="rd-title"><span>Redeem</span></h1>
          <p>View your active vouchers, redeem new codes, and review past usage.</p>
        </div>
      </section>

      <section className="ac rd-card" aria-labelledby="rd-form-h" style={{ "--glow": "#FF33FF" } as React.CSSProperties}>
        <div className="ac-h"><h2 id="rd-form-h"><Svg body={ICONS.tag} />Redeem a voucher code</h2></div>
        <p className="rd-lead" id="rd-lead">Enter a code you received from a promotion or campaign to add it to your account.</p>
        <form className="rd-form" id="rd-form" noValidate onSubmit={submit}>
          <label className="rd-sr" htmlFor="rd-code">Voucher code</label>
          <input
            className="rd-input"
            id="rd-code"
            name="code"
            type="text"
            placeholder="ENTER CODE"
            maxLength={24}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-describedby="rd-lead rd-result"
            aria-invalid={invalid ? true : undefined}
            value={code}
            ref={inputRef}
            onChange={(e) => onInput(e.target.value, e.target.selectionStart)}
          />
          <button className="rd-btn" id="rd-submit" type="submit" disabled={!code.trim() || busy} aria-busy={busy ? true : undefined}>
            {busy ? <i className="rd-spin" aria-hidden="true"></i> : <Svg body={ICONS.tick} />}
            <span>{busy ? "Checking" : "Redeem"}</span>
          </button>
        </form>
        <p className={"rd-result" + (result ? " is-" + result.kind : "")} id="rd-result" role="status" aria-live="polite">
          {result && (
            <>
              <Svg body={result.kind === "ok" ? ICONS.check : ICONS.alert} />
              <span>{result.content}</span>
            </>
          )}
        </p>
        <p className="rd-hint">
          <Svg body={ICONS.info} />
          <span>
            Try a sample code:{" "}
            <span className="rd-samples">
              {SAMPLES.map((sample) => (
                <button
                  className="rd-sample"
                  type="button"
                  data-sample={sample}
                  key={sample}
                  onClick={() => {
                    setCode(sample);
                    setInvalid(false);
                    focusInput();
                  }}
                >
                  {sample}
                </button>
              ))}
            </span>
          </span>
        </p>
      </section>

      <section className="ac rd-card rd-list-card" aria-label="Your vouchers" style={{ "--glow": "#33CCFF" } as React.CSSProperties}>
        <div className="rd-tabs" role="tablist" aria-label="Vouchers">
          <button
            className="rd-tab"
            id="rd-tab-available"
            type="button"
            role="tab"
            aria-selected={tab === "available"}
            aria-controls="rd-panel-available"
            aria-label={"Available, " + available.length + " voucher" + (available.length === 1 ? "" : "s")}
            tabIndex={tab === "available" ? 0 : -1}
            onClick={() => setTab("available")}
            onKeyDown={onTabKey}
          >
            Available <em id="rd-count">{available.length}</em>
          </button>
          <button
            className="rd-tab"
            id="rd-tab-history"
            type="button"
            role="tab"
            aria-selected={tab === "history"}
            aria-controls="rd-panel-history"
            tabIndex={tab === "history" ? 0 : -1}
            onClick={() => setTab("history")}
            onKeyDown={onTabKey}
          >
            History
          </button>
        </div>

        <div className="rd-panel" id="rd-panel-available" role="tabpanel" aria-labelledby="rd-tab-available" tabIndex={0} hidden={tab !== "available"}>
          <ul className="rd-list" id="rd-available">
            {available.map((v) => <VoucherRow v={v} past={false} isNew={v.code === highlight} key={v.id} />)}
          </ul>
          <div className="rd-empty" id="rd-available-empty" hidden={available.length > 0}>
            <span className="rd-empty-ico"><Svg body={ICONS.ticket} /></span>
            <b>No active vouchers</b>
            <span>Redeem a code above to add a discount or a free entry to your account.</span>
            <button className="rd-ghost" type="button" data-focus-code="" onClick={focusInput}><Svg body={ICONS.tag} /><span>Enter a code</span></button>
          </div>
        </div>

        <div className="rd-panel" id="rd-panel-history" role="tabpanel" aria-labelledby="rd-tab-history" tabIndex={0} hidden={tab !== "history"}>
          <ul className="rd-list" id="rd-history">
            {history.map((v) => <VoucherRow v={v} past={true} isNew={false} key={v.id} />)}
          </ul>
          <div className="rd-empty" id="rd-history-empty" hidden={history.length > 0}>
            <span className="rd-empty-ico"><Svg body={ICONS.clock} /></span>
            <b>No voucher history yet</b>
            <span>Vouchers you use in a tournament, or that expire, show up here.</span>
            <Link className="rd-ghost" href="/app/browse-tournaments/"><Svg body={ICONS.trophy} /><span>Browse tournaments</span></Link>
          </div>
        </div>
      </section>

      <p className="rd-foot">Voucher codes on this page are sample promotions until the rewards backend goes live.</p>
    </div>
  );
}
