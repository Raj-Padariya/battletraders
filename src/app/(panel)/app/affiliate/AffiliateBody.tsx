"use client";

/* Affiliate page — port of affiliate.js. Owns localStorage key `bt-affiliate`. */
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { Svg } from "@panel/components/Icon";
import { usePanel } from "@panel/lib/panel";
import { readJSON, writeJSON } from "@panel/lib/storage";

const KEY = "bt-affiliate";
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

interface Rank {
  name: string;
  label: string;
  at: number;
  reward: number;
  mult: number;
  color: string;
}

const RANKS: Rank[] = [
  { name: "Default", label: "Starter", at: 0, reward: 2.0, mult: 1.0, color: "#A64DFF" },
  { name: "Bronze", label: "Bronze", at: 10, reward: 2.1, mult: 1.05, color: "#E09A5B" },
  { name: "Silver", label: "Silver", at: 100, reward: 2.2, mult: 1.1, color: "#C9D1E0" },
  { name: "Gold", label: "Gold", at: 300, reward: 2.4, mult: 1.2, color: "#FFC433" },
];

type StatId = "referrals" | "cash" | "credits" | "tickets";
const STAT_INFO: Record<StatId, { title: string; sub: string; hint: string }> = {
  referrals: { title: "Referral history", sub: "Traders who joined the arena with your code.", hint: "No referrals yet. Share your link to bring fighters in." },
  cash: { title: "Cash earnings", sub: "Cash rewards and 10% entry-fee commissions.", hint: "No cash earned yet. Commission lands when a referral pays a real-money entry." },
  credits: { title: "Credits earned", sub: "Battle credits awarded through Refer & Earn.", hint: "No credits earned yet." },
  tickets: { title: "Free tickets", sub: "Free tournament tickets from referral campaigns.", hint: "No free tickets earned yet." },
};

interface AffiliateData {
  code: string;
  generatedAt: string;
  referrals: number;
  cash: number;
  credits: number;
  tickets: number | Record<string, number>;
}

const ICONS = {
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
  gift: '<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13M12 8S9 3 7 5s3 3 5 3zm0 0s3-5 5-3-3 3-5 3z"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  dollar: '<path d="M12 2v20M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.6 7 6.8c0 4.8 10 2.6 10 7.6 0 2.2-2.2 3.6-5 3.6s-5-1.2-5-3.4"/>',
  coins: '<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M9 15v2c0 1.7 2.7 3 6 3s6-1.3 6-3v-5c0-1.7-2.7-3-6-3"/>',
  ticket: '<path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4 2 2 0 0 0 0-4V6H3z"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  tick: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  leave: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l-5-5 5-5M5 12h11"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  addUser: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6"/>',
};
const rankIcon = (i: number): string => (i < 2 ? ICONS.star : ICONS.trophy);
const rankUnlock = (r: Rank, i: number, first: string): string => (i === 0 ? first : "Unlocks at " + r.at + " referrals");

const usd = (n: number | undefined): string => "$" + Number(n || 0).toFixed(2);

const read = (): AffiliateData | null => {
  const data = readJSON<AffiliateData | null>(KEY, null);
  return data && typeof data.code === "string" && /^[A-Z0-9]{8}$/.test(data.code) ? data : null;
};

/** 8-char A-Z0-9 code, seeded from the username and the current time (FNV-1a + xorshift). */
const makeCode = (username: string): string => {
  const seed = (username || "trader") + "|" + Date.now() + "|" + Math.random();
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  let out = "";
  for (let j = 0; j < 8; j++) {
    h ^= h << 13;
    h >>>= 0;
    h ^= h >>> 17;
    h ^= h << 5;
    h >>>= 0;
    out += CHARS[h % CHARS.length];
  }
  return out;
};

// Signup lives in the website app (served from the site root), not under the panel's /app basePath.
const linkFor = (code: string): string => new URL("/signup/?ref=" + encodeURIComponent(code), window.location.origin).href;

const rankFor = (n: number): number => {
  let idx = 0;
  RANKS.forEach((r, i) => {
    if (n >= r.at) idx = i;
  });
  return idx;
};

export default function AffiliateBody() {
  const { profile, toast } = usePanel();
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState<AffiliateData | null>(null);
  const [busy, setBusy] = useState(false);
  const [stat, setStat] = useState<StatId>("referrals");

  const genRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const detailRef = useRef<HTMLDialogElement>(null);
  const leaveRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const focusTitle = useRef(false);
  const focusGenerate = useRef(false);

  useEffect(() => {
    setData(read());
    setLoaded(true);
  }, []);

  // Focus moves once the swapped view is visible.
  useEffect(() => {
    if (data && focusTitle.current) titleRef.current?.focus({ preventScroll: false });
    if (!data && focusGenerate.current) genRef.current?.focus();
    focusTitle.current = false;
    focusGenerate.current = false;
  }, [data]);

  /* ---------- generate ---------- */
  const generate = () => {
    if (busy) return;
    setBusy(true);
    window.setTimeout(() => {
      const next: AffiliateData = { code: makeCode(profile.username), generatedAt: new Date().toISOString(), referrals: 0, cash: 0, credits: 0, tickets: 0 };
      writeJSON(KEY, next);
      setBusy(false);
      focusTitle.current = true;
      setData(next);
      toast("Referral code ready", "Your code " + next.code + " is live. Share it to start earning.");
    }, 700);
  };

  /* ---------- copy ---------- */
  const fallbackCopy = (text: string): boolean => {
    const field = linkRef.current;
    if (!field) return false;
    const restore = field.value;
    field.value = text;
    field.focus();
    field.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    field.value = restore;
    if (!ok) field.select();
    return ok;
  };

  const copy = (what: "code" | "link") => {
    const current = read();
    if (!current) return;
    const text = what === "code" ? current.code : linkFor(current.code);
    const title = what === "code" ? "Code copied" : "Link copied";
    const done = () => toast(title, text);
    const fail = () => {
      if (fallbackCopy(text)) done();
      else toast("Copy blocked", "Select the link field and copy it manually.", "error");
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fail);
    else fail();
  };

  const copyButton = (what: "code" | "link", cls: string, label: string, icon: string) => (
    <button className={cls} type="button" data-copy={what} onClick={() => copy(what)}>
      <Svg body={icon} /><span>{label}</span>
    </button>
  );

  /* ---------- dialogs ---------- */
  const openDialog = (dlg: HTMLDialogElement | null, opener: HTMLElement, focusEl?: HTMLElement | null) => {
    if (!dlg) return;
    openerRef.current = opener;
    dlg.showModal();
    (focusEl || dlg.querySelector<HTMLElement>("[data-close]"))?.focus();
  };
  const onDialogClick = (e: ReactMouseEvent<HTMLDialogElement>) => {
    const target = e.target as Element;
    if (target.closest("[data-close]") || target === e.currentTarget) e.currentTarget.close();
  };
  const onDialogClose = () => {
    const opener = openerRef.current;
    if (opener && document.contains(opener) && !opener.closest("[hidden]")) opener.focus();
    openerRef.current = null;
  };

  const leave = () => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* storage blocked */
    }
    openerRef.current = null;
    leaveRef.current?.close();
    focusGenerate.current = true;
    setData(null);
    toast("You left Refer & Earn", "Generate a new code whenever you want to rejoin.");
  };

  /* ---------- derived member state ---------- */
  const refs = data?.referrals || 0;
  const idx = rankFor(refs);
  const rank = RANKS[idx];
  const next = RANKS[idx + 1];
  const tickets: Record<string, number> = data && data.tickets && typeof data.tickets === "object" ? data.tickets : {};
  const info = STAT_INFO[stat];

  const tile = (id: StatId, cls: string, icon: string, label: string, value: React.ReactNode) => (
    <button
      className={"ak aff-tile " + cls}
      type="button"
      data-stat={id}
      aria-haspopup="dialog"
      onClick={(e) => {
        setStat(id);
        openDialog(detailRef.current, e.currentTarget);
      }}
    >
      <span className="ak-ico"><Svg body={icon} /></span>
      <span className="ak-lbl">{label}</span>
      {value}
      <span className="ak-sub">Click to view details</span>
    </button>
  );

  const ticketChip = (type: string, label: string) => (
    <i className={"t-" + type} title={label + " tickets"}>
      <Svg body={ICONS.ticket} /><b data-ticket={type}>{tickets[type] || 0}</b><span className="aff-sr"> {label}</span>
    </i>
  );

  return (
    <>
      <div className="aff-page">
        <div className="aff-view" id="aff-join-view" hidden={!loaded || !!data}>
          <section className="ah aff-hero" aria-labelledby="aff-join-title">
            <div className="ah-txt pb-head">
              <span className="pb-ico" aria-hidden="true"><Svg body={ICONS.users} /></span>
              <h1 id="aff-join-title">Refer &amp; Earn</h1>
              <p>Refer friends to BattleTrader and earn rewards as you climb the ranks.</p>
            </div>
            <ol className="aff-steps" aria-label="How it works">
              <li><span><Svg body={ICONS.bolt} /></span><b>Get your code</b><small>Generate a unique link</small></li>
              <li><span><Svg body={ICONS.share} /></span><b>Share it</b><small>Invite fellow traders</small></li>
              <li><span><Svg body={ICONS.gift} /></span><b>Earn rewards</b><small>Tickets as they join</small></li>
            </ol>
          </section>

          <section className="ac aff-join" aria-labelledby="aff-join-h">
            <span className="aff-join-ico"><Svg body={ICONS.addUser} /></span>
            <h2 id="aff-join-h">Start referring and earning</h2>
            <p>Generate your unique referral code to start earning rewards. Refer friends and climb the ranks!</p>
            <button className="aff-btn" id="aff-generate" type="button" disabled={busy} aria-busy={busy ? true : undefined} onClick={generate} ref={genRef}>
              {busy ? <i className="aff-spin" aria-hidden="true"></i> : <Svg body={ICONS.bolt} />}
              <span>{busy ? "Generating..." : "Generate referral code"}</span>
            </button>
          </section>

          <div className="aff-grid">
            <section className="ac aff-span-7" aria-labelledby="aff-ranks-h" style={{ "--glow": "#FFC433" } as CSSProperties}>
              <div className="ac-h"><h2 id="aff-ranks-h"><Svg body={ICONS.trophy} />Referral ranks &amp; rewards</h2></div>
              <p className="aff-lead">Every verified referral moves you up the ladder. Higher ranks raise your base reward and multiply the cash you earn.</p>
              <p className="aff-note"><Svg body={ICONS.dollar} /><span>You earn <b>10% commission</b> on your referrals&apos; real-money tournament enrollment fees &mdash; at every rank. Entries paid with credits don&apos;t earn commission.</span></p>
              <ul className="aff-rank-list">
                {RANKS.map((r, i) => (
                  <li className="aff-rank" style={{ "--rk": r.color } as CSSProperties} key={r.name}>
                    <span className="aff-rank-ico"><Svg body={rankIcon(i)} /></span>
                    <span className="aff-rank-txt"><b>{r.name}{i === 0 && <em>Current</em>}</b><small>{rankUnlock(r, i, "Starting rank")}</small></span>
                    <dl className="aff-rank-vals">
                      <div><dt>Reward</dt><dd>{usd(r.reward)}</dd></div>
                      <div><dt>Cash multiplier</dt><dd>{r.mult.toFixed(2) + "x"}</dd></div>
                    </dl>
                  </li>
                ))}
              </ul>
            </section>

            <section className="ac aff-span-5" aria-labelledby="aff-how-h" style={{ "--glow": "#22E39A" } as CSSProperties}>
              <div className="ac-h"><h2 id="aff-how-h"><Svg body={ICONS.info} />How earnings work</h2></div>
              <ul className="aff-bullets">
                <li><Svg body={ICONS.tick} /><span>Share your code or link. Friends who sign up with it become your referrals.</span></li>
                <li><Svg body={ICONS.tick} /><span>When a referral pays a tournament entry with real money, you earn 10% of the fee.</span></li>
                <li><Svg body={ICONS.tick} /><span>Each verified referral pays your rank&apos;s base reward, boosted by your cash multiplier.</span></li>
                <li><Svg body={ICONS.tick} /><span>Reach 10, 100 and 300 referrals to unlock Bronze, Silver and Gold.</span></li>
              </ul>
            </section>
          </div>
        </div>

        <div className="aff-view" id="aff-member-view" hidden={!data}>
          <section className="ah aff-hero aff-hero-in" aria-labelledby="aff-member-title">
            <div className="ah-txt">
              <span className="aff-hero-ico is-bolt"><Svg body={ICONS.bolt} /></span>
              <p className="ah-tag aff-tag"><Svg body={ICONS.gift} />Refer &amp; Earn</p>
              <h1 id="aff-member-title" tabIndex={-1} ref={titleRef}>Your <span>referral code</span></h1>
              <p className="aff-code-big" id="aff-code-big">{data ? data.code : "--------"}</p>
              <div className="ah-btns">
                {copyButton("code", "aff-btn", "Copy code", ICONS.copy)}
                {copyButton("link", "aff-btn2", "Copy link", ICONS.share)}
              </div>
            </div>
            <dl className="aff-hero-stats">
              <div><dt>Total referrals</dt><dd data-stat-val="referrals">{refs}</dd></div>
              <div><dt>Cash earned</dt><dd className="is-cash" data-stat-val="cash">{usd(data?.cash)}</dd></div>
            </dl>
          </section>

          <div className="aff-tiles">
            {tile("referrals", "", ICONS.users, "Total referrals", <span className="ak-val" data-stat-val="referrals">{refs}</span>)}
            {tile("cash", "k-green", ICONS.dollar, "Cash earned", <span className="ak-val" data-stat-val="cash">{usd(data?.cash)}</span>)}
            {tile("credits", "k-pink", ICONS.coins, "Credits earned", <span className="ak-val" data-stat-val="credits">{usd(data?.credits)}</span>)}
            {tile(
              "tickets",
              "k-gold",
              ICONS.ticket,
              "Free tickets",
              <span className="ak-val aff-tix">{ticketChip("mini", "Mini")}{ticketChip("circuit", "Circuit")}{ticketChip("main", "Main Event")}</span>,
            )}
          </div>

          <div className="aff-grid">
            <section className="ac aff-span-7" aria-labelledby="aff-link-h" style={{ "--glow": "#33CCFF" } as CSSProperties}>
              <div className="ac-h"><h2 id="aff-link-h"><Svg body={ICONS.share} />Your referral link</h2></div>
              <p className="aff-lead">Share this link. Anyone who signs up through it joins the arena as your referral.</p>
              <label className="aff-sr" htmlFor="aff-link">Your referral link</label>
              <input className="aff-link" id="aff-link" type="text" readOnly value={data ? linkFor(data.code) : ""} ref={linkRef} />
              <div className="aff-btn-row">
                {copyButton("link", "aff-btn", "Copy link", ICONS.copy)}
                {copyButton("code", "aff-btn2", "Copy code", ICONS.copy)}
              </div>
            </section>

            <section className="ac aff-span-5" aria-labelledby="aff-myrank-h" style={{ "--glow": "#FFC433" } as CSSProperties}>
              <div className="ac-h"><h2 id="aff-myrank-h"><Svg body={ICONS.star} />Your referral rank</h2></div>
              <div className="aff-me-rank">
                <span className="aff-rank-ico is-big" id="aff-my-ico" style={{ "--rk": rank.color } as CSSProperties}><Svg body={ICONS.star} /></span>
                <span className="aff-me-txt"><b id="aff-my-rank">{rank.label}</b><small id="aff-my-verified">{refs + " verified referral" + (refs === 1 ? "" : "s")}</small></span>
                <span className="aff-mult"><small>Cash multiplier</small><b id="aff-my-mult">{rank.mult.toFixed(2) + "x"}</b></span>
              </div>
              <div className="aff-prog">
                <div className="aff-prog-row">
                  <span id="aff-prog-lbl">{next ? "Progress to " + next.name : "Top rank reached"}</span>
                  <b id="aff-prog-n">{next ? refs + " / " + next.at + " referrals" : refs + " referrals"}</b>
                </div>
                <div className="aff-bar" id="aff-bar" role="progressbar" aria-labelledby="aff-prog-lbl" aria-valuemin={0} aria-valuemax={next ? next.at : 1} aria-valuenow={next ? refs : 1}>
                  <i id="aff-bar-fill" style={{ width: (next ? Math.min(100, (refs / next.at) * 100) : 100) + "%" }}></i>
                </div>
                <p id="aff-prog-next">{next ? <>Next rank unlocks <b>{next.mult.toFixed(2) + "x"}</b> cash multiplier</> : "You hold the highest referral rank."}</p>
              </div>
            </section>

            <section className="ac aff-span-7" aria-labelledby="aff-prog-h" style={{ "--glow": "#33CCFF" } as CSSProperties}>
              <div className="ac-h"><h2 id="aff-prog-h"><Svg body={ICONS.gift} />Current reward program</h2></div>
              <dl className="aff-boxes">
                <div><dt>Reward type</dt><dd>Cash</dd></div>
                <div><dt>Base reward</dt><dd id="aff-base">{usd(rank.reward)}</dd></div>
                <div><dt>Your multiplier</dt><dd><span id="aff-mult-x">{(rank.mult === 1 ? "1" : rank.mult.toFixed(2)) + "x"}</span> <small id="aff-mult-lbl">{rank.mult === 1 ? "(Standard)" : "(" + rank.name + ")"}</small></dd></div>
              </dl>
              <p className="aff-strip"><Svg body={ICONS.coins} /><span><b>Tournament enrollment commission</b>10% of every real-money entry fee your referrals pay, at every rank.</span></p>
              <h3 className="aff-sub-h">Reward tiers</h3>
              <ul className="aff-tiers">
                {RANKS.map((r, i) => (
                  <li
                    className={"aff-tier" + (i === idx ? " is-current" : "")}
                    style={{ "--rk": r.color } as CSSProperties}
                    data-tier={i}
                    aria-current={i === idx ? true : undefined}
                    key={r.name}
                  >
                    <span className="aff-tier-name"><Svg body={rankIcon(i)} /><span><b>{r.name}</b><small>{rankUnlock(r, i, "From your first referral")}</small></span></span>
                    <span className="aff-tier-val"><small>Reward</small><b>{usd(r.reward)}</b></span>
                    <span className="aff-tier-val"><small>Multiplier</small><b>{r.mult.toFixed(2) + "x"}</b></span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="ac aff-span-5" aria-labelledby="aff-steps-h" style={{ "--glow": "#A64DFF" } as CSSProperties}>
              <div className="ac-h"><h2 id="aff-steps-h"><Svg body={ICONS.layers} />How it works</h2></div>
              <ol className="aff-steps">
                <li><i aria-hidden="true">1</i><span><b>Share your link</b><small>Send your code or link to friends, your alliance or your followers.</small></span></li>
                <li><i aria-hidden="true">2</i><span><b>They join the arena</b><small>Each friend who signs up and verifies counts as a referral.</small></span></li>
                <li><i aria-hidden="true">3</i><span><b>You collect rewards</b><small>Earn cash per referral plus 10% of their real-money entry fees.</small></span></li>
              </ol>
            </section>

            <section className="ac aff-span-12" aria-labelledby="aff-art-h" style={{ "--glow": "#FF33FF" } as CSSProperties}>
              <div className="ac-h"><h2 id="aff-art-h"><Svg body={ICONS.layers} />Campaign artworks</h2></div>
              <div className="aff-empty">
                <span className="aff-empty-ico"><Svg body={ICONS.layers} /></span>
                <b>No campaign artworks yet</b>
                <span>No campaign artworks available - check back later for promotional materials to share.</span>
                {copyButton("link", "aff-btn2", "Share your link instead", ICONS.share)}
              </div>
            </section>
          </div>

          <footer className="aff-foot">
            <p>Referral stats are sample figures until the referral backend goes live.</p>
            <button
              className="aff-leave"
              id="aff-leave-open"
              type="button"
              aria-haspopup="dialog"
              onClick={(e) => openDialog(leaveRef.current, e.currentTarget, document.getElementById("aff-leave-cancel"))}
            >
              <Svg body={ICONS.leave} />Leave program
            </button>
          </footer>
        </div>
      </div>

      <dialog className="aff-modal" id="aff-detail" aria-labelledby="aff-detail-h" aria-describedby="aff-detail-sub" ref={detailRef} onClick={onDialogClick} onClose={onDialogClose}>
        <div className="aff-modal-h">
          <h2 id="aff-detail-h">{info.title}</h2>
          <button className="aff-x" type="button" data-close="" aria-label="Close"><Svg body={ICONS.close} /></button>
        </div>
        <p className="aff-modal-sub" id="aff-detail-sub">{info.sub}</p>
        <ul className="aff-hist" id="aff-detail-list"></ul>
        <div className="aff-empty is-small" id="aff-detail-empty">
          <span className="aff-empty-ico"><Svg body={ICONS.clock} /></span>
          <b>No history yet</b>
          <span id="aff-detail-hint">{info.hint}</span>
          {copyButton("link", "aff-btn2", "Copy link", ICONS.share)}
        </div>
      </dialog>

      <dialog className="aff-modal" id="aff-leave" aria-labelledby="aff-leave-h" aria-describedby="aff-leave-txt" ref={leaveRef} onClick={onDialogClick} onClose={onDialogClose}>
        <div className="aff-modal-h">
          <h2 id="aff-leave-h">Leave Refer &amp; Earn?</h2>
          <button className="aff-x" type="button" data-close="" aria-label="Close"><Svg body={ICONS.close} /></button>
        </div>
        <p className="aff-modal-sub" id="aff-leave-txt">Your code <b id="aff-leave-code">{data?.code ?? ""}</b> stops working and your referral stats are cleared. You can generate a new code any time.</p>
        <div className="aff-modal-btns">
          <button className="aff-btn2" type="button" data-close="" id="aff-leave-cancel">Stay in program</button>
          <button className="aff-danger" type="button" id="aff-leave-confirm" onClick={leave}><Svg body={ICONS.leave} /><span>Leave program</span></button>
        </div>
      </dialog>
    </>
  );
}
