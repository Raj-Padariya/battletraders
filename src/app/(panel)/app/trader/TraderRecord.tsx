"use client";

// Public trader record — port of the old trader.js. ?u=<handle> (or ?t=) shows another trader; no param shows the
// signed-in user. Owns localStorage "bt-following" (array of handles you follow).
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Svg } from "@panel/components/Icon";

import { buildTraders, hashString, seededRandom, type SampleTrader } from "@panel/lib/data/sample";
import { usePanel, type PanelProfile } from "@panel/lib/panel";
import { readJSON, writeJSON } from "@panel/lib/storage";

const FOLLOW_KEY = "bt-following";
const IC = {
  crown: '<path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 12H5z"/>',
  swords: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5"/>',
  swordsFull: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2"/>',
  userPlus: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  medal: '<path d="M7 3h10l-3 6h-4z"/><circle cx="12" cy="15" r="6"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
};

interface TraderRecord {
  events: number;
  victories: number;
  podiums: number;
  winRate: number;
  followers: number;
  aggression: number | null;
  roi: number | null;
}

interface LedgerRow {
  place: number;
  minutesAgo: number;
}

interface TraderView {
  handle: string;
  isSelf: boolean;
  known: SampleTrader | null;
  record: TraderRecord;
  styleName: string | null;
  ledger: LedgerRow[];
  online: boolean;
  sub: string;
  recId: string;

}

function buildView(requested: string, profile: PanelProfile): TraderView {
  const me = profile.username;
  const isSelf = !requested || requested.toLowerCase() === me.toLowerCase();
  let handle = isSelf ? me : requested;
  const known = buildTraders().find((t) => t.handle.toLowerCase() === handle.toLowerCase()) || null;
  if (known) handle = known.handle;
  const rand = seededRandom(hashString("tr:" + handle.toLowerCase()) + 11);

  let record: TraderRecord;
  if (isSelf) {
    record = { events: 0, victories: 0, podiums: 0, winRate: 0, followers: 0, aggression: null, roi: null };
  } else if (known) {
    record = {
      events: known.events, victories: known.victories, podiums: known.podiums, winRate: known.winRate,
      followers: Math.round(40 + (21 - known.rank) * (30 + rand() * 40)),
      aggression: Math.round(30 + rand() * 65), roi: Math.round(45 + rand() * 50),
    };
  } else {
    const events = Math.round(rand() * 26);
    const victories = events ? Math.round(events * rand() * 0.18) : 0;
    const podiums = Math.min(events, victories + Math.round(events * rand() * 0.2));
    record = {
      events, victories, podiums, winRate: events ? (victories / events) * 100 : 0,
      followers: Math.round(rand() * 140),
      aggression: events ? Math.round(20 + rand() * 75) : null, roi: events ? Math.round(25 + rand() * 70) : null,
    };
  }
  const styleName = record.aggression === null ? null : record.aggression >= 66 ? "Aggressive" : record.aggression >= 40 ? "Balanced" : "Conservative";

  // Recent placements: newest first, spread over the last weeks.
  const ledger: LedgerRow[] = [];
  const ledgerCount = Math.min(record.events, 8);
  let wins = Math.min(record.victories, ledgerCount);
  let podiumsLeft = Math.min(record.podiums - record.victories, ledgerCount - wins);
  let minutesAgo = 30 + Math.round(rand() * 300);
  for (let i = 0; i < ledgerCount; i++) {
    let place: number;
    if (i % 3 === 0 && wins > 0) {
      place = 1;
      wins--;
    } else if (i % 2 === 0 && podiumsLeft > 0) {
      place = 2 + Math.round(rand());
      podiumsLeft--;
    } else place = 4 + Math.round(rand() * 60);
    ledger.push({ place, minutesAgo });
    minutesAgo += Math.round(600 + rand() * 4800);
  }

  const online = isSelf || rand() > 0.45;
  const sub = isSelf ? "That's you · " + profile.countryName : known ? known.tier + " · Lv " + known.level + " · " + known.city : "Rookie fighter";
  return {
    handle, isSelf, known, record, styleName, ledger, online, sub,
    recId: (hashString(handle.toLowerCase()).toString(36).toUpperCase() + "0000").slice(0, 4),
  };
}

const fmtPct = (n: number): string => (Math.round(n * 10) / 10).toFixed(1) + "%";

const ago = (minutes: number): string => {
  if (minutes < 60) return minutes + " min ago";
  if (minutes < 1440) return Math.floor(minutes / 60) + "h ago";
  const days = Math.floor(minutes / 1440);
  return days === 1 ? "Yesterday" : days < 7 ? days + " days ago" : Math.floor(days / 7) + "w ago";
};

const readFollowing = (): string[] => {
  const arr = readJSON<unknown>(FOLLOW_KEY, []);
  return Array.isArray(arr) ? arr.filter((h): h is string => typeof h === "string") : [];
};

function Bar({ id, label, tone, value, pct }: { id: string; label: string; tone: string; value: number | null; pct?: boolean }) {
  const clamped = value === null ? 0 : Math.max(0, Math.min(100, value));
  const text = value === null ? "—" : pct ? fmtPct(clamped) : Math.round(clamped) + "%";
  return (
    <div className={"tr-bar " + tone}>
      <p><span>{label}</span><b id={id + "-v"}>{text}</b></p>
      <div
        className="tr-bar-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped)}
        aria-valuetext={value === null ? "Not enough data" : Math.round(clamped) + "%"}
        id={id}
      >
        <i style={{ "--w": clamped + "%" } as React.CSSProperties}></i>
      </div>
    </div>
  );
}

export default function TraderRecordView() {
  const { ready, profile, reduceMotion, toast } = usePanel();
  const params = useSearchParams();
  const router = useRouter();
  const requested = (params.get("u") || params.get("t") || "").trim().slice(0, 40);
  const [view, setView] = useState<TraderView | null>(null);
  const [following, setFollowing] = useState(false);
  const [grown, setGrown] = useState(false);

  // Needs the signed-in username (profile) and localStorage (following): build after the panel is ready.
  useEffect(() => {
    if (!ready) return;
    const next = buildView(requested, profile);
    setView(next);
    setFollowing(readFollowing().includes(next.handle));
    document.title = next.handle + " — Trader record — BattleTrader";
  }, [ready, requested, profile]);

  // Animate the bars in on the next frame (the CSS transition is disabled for reduced motion).
  useEffect(() => {
    if (!view) return;
    if (reduceMotion) {
      setGrown(true);
      return;
    }
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setGrown(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [view, reduceMotion]);

  const onBack = () => {
    if (window.history.length <= 1) {
      router.push("/app/leaderboards/");
      return;
    }
    // history.back() does nothing when there is no previous entry; fall back after a moment.
    const here = window.location.href;
    window.history.back();
    window.setTimeout(() => {
      if (window.location.href === here) router.push("/app/leaderboards/");
    }, 400);
  };

  const onShare = () => {
    if (!view) return;
    const url = window.location.href.split("?")[0].split("#")[0] + "?u=" + encodeURIComponent(view.handle);
    if (navigator.share) {
      navigator.share({ title: view.handle + " on BattleTrader", text: "Check out " + view.handle + "'s battle record", url }).catch(() => {
        /* dismissed */
      });
      return;
    }
    const copied = () => toast("Link copied", "Share " + view.handle + "'s record anywhere.");
    const failed = () => toast("Couldn't copy", "Copy the address bar to share this record.", "error");
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(copied, failed);
    else failed();
  };

  const onReport = () => {
    if (!view) return;
    if (view.isSelf) {
      toast("That's your record", "You can't report your own profile.", "error");
      return;
    }
    toast("Report received", "Thanks — our fair-play team will review " + view.handle + ".");
  };

  const onFollow = () => {
    if (!view) return;
    const list = readFollowing();
    const at = list.indexOf(view.handle);
    if (at === -1) list.push(view.handle);
    else list.splice(at, 1);
    writeJSON(FOLLOW_KEY, list);
    setFollowing(at === -1);
    if (at === -1) toast("Following " + view.handle, "Their battles will show in your feed.");
  };

  const handle = view?.handle || "trader";
  const record = view?.record;
  const initials = handle.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "TR";
  const followers = record ? (view.isSelf ? String(record.followers) : (record.followers + (following ? 1 : 0)).toLocaleString("en-US")) : "0";
  const emptyLedger = !!view && view.ledger.length === 0;
  const cardStyle = view?.known ? ({ "--av": view.known.color } as React.CSSProperties) : undefined;

  return (
    <div className={"tr-page" + (grown ? " is-ready" : "")} id="tr-page">
      <div className="tr-topbar">
        <button className="tr-back" id="tr-back" type="button" onClick={onBack}><Svg body={IC.back} /><span>Back</span></button>
        <p className="tr-recid"><span>Member record</span> / <b id="tr-recid">{view?.recId || "----"}</b></p>
        <div className="tr-top-act">
          <button className="tr-icon" id="tr-report" type="button" aria-label="Report this trader" onClick={onReport}><Svg body={IC.shield} /></button>
          <button className="tr-share" id="tr-share" type="button" onClick={onShare}><Svg body={IC.share} /><span>Share</span></button>
        </div>
      </div>

      <div className="tr-grid">
        <aside className="tr-card" id="tr-card" data-glass="" aria-labelledby="tr-handle" style={cardStyle}>
          <div className="tr-av-wrap">
            <span className="tr-av" id="tr-av" aria-hidden="true">{initials}</span>
            <i className="tr-online" id="tr-online" title="Online" hidden={!view?.online}></i>
          </div>
          <h1 className="tr-handle" id="tr-handle">{handle}</h1>
          <p className="tr-sub" id="tr-sub">{view?.sub}</p>
          <button
            className={"tr-follow" + (following ? " is-on" : "")}
            id="tr-follow"
            type="button"
            aria-pressed={following}
            hidden={!view || view.isSelf}
            onClick={onFollow}
          >
            <Svg body={following ? IC.check : IC.userPlus} /><span>{following ? "Following" : "Follow"}</span>
          </button>
          <Link className="tr-follow tr-edit" id="tr-edit" href="/app/profile/" hidden={!view?.isSelf}><Svg body={IC.gear} /><span>Edit profile</span></Link>
          <p className="tr-community"><span>Community</span><b><span id="tr-followers">{followers}</span> followers</b></p>

          <div className={"tr-style" + (view && !view.styleName ? " is-empty" : "")} id="tr-style-box">
            <p className="tr-style-h"><span>Style</span><b id="tr-style">{view ? view.styleName || "Style unavailable" : "Balanced"}</b></p>
            <Bar id="tr-aggr" label="Aggression" tone="b-magenta" value={record ? record.aggression : 0} />
            <Bar id="tr-roi-s" label="ROI consistency" tone="b-cyan" value={record ? record.roi : 0} />
          </div>
          <p className="tr-status"><span>Profile status</span><b><Svg body={IC.globe} />Public</b></p>
        </aside>

        <div className="tr-main">
          <div className="tr-tiles">
            <div className="ak  tr-tile"><span className="ak-ico" aria-hidden="true"><Svg body={IC.trophy} /></span><span className="ak-lbl">Tournaments</span><span className="ak-val" id="tr-t-events">{record?.events ?? 0}</span></div>
            <div className="ak k-gold tr-tile"><span className="ak-ico" aria-hidden="true"><Svg body={IC.crown} /></span><span className="ak-lbl">Victories</span><span className="ak-val" id="tr-t-wins">{record?.victories ?? 0}</span></div>
            <div className="ak k-pink tr-tile"><span className="ak-ico" aria-hidden="true"><Svg body={IC.medal} /></span><span className="ak-lbl">Podiums</span><span className="ak-val" id="tr-t-podiums">{record?.podiums ?? 0}</span></div>
            <div className="ak k-green tr-tile"><span className="ak-ico" aria-hidden="true"><Svg body={IC.target} /></span><span className="ak-lbl">Win rate</span><span className="ak-val" id="tr-t-rate">{record ? fmtPct(record.winRate) : "0"}</span></div>
          </div>

          <section className="ac tr-record" aria-labelledby="tr-rec-h">
            <div className="ac-h"><h2 id="tr-rec-h"><Svg body={IC.trophy} />Tournament record</h2><span className="tr-chip">Public record</span></div>
            <div className="tr-bars">
              <Bar id="tr-roi" label="ROI consistency" tone="b-cyan" value={record ? record.roi : 0} />
              <Bar id="tr-wr" label="Tournament win rate" tone="b-gold" value={record ? record.winRate : 0} pct />
            </div>
            <dl className="tr-mini">
              <div className="m-gold"><dt><Svg body={IC.crown} />1st place</dt><dd id="tr-m-first">{record?.victories ?? 0}</dd></div>
              <div className="m-pink"><dt><Svg body={IC.medal} />Top three</dt><dd id="tr-m-top3">{record?.podiums ?? 0}</dd></div>
              <div className="m-cyan"><dt><Svg body={IC.swordsFull} />Entered</dt><dd id="tr-m-entered">{record?.events ?? 0}</dd></div>
            </dl>
          </section>

          <section className="ac tr-ledger" aria-labelledby="tr-led-h">
            <div className="ac-h"><h2 id="tr-led-h"><Svg body={IC.pulse} />Activity ledger</h2><span className="tr-chip">Public</span></div>
            <ul className="tr-led-list" id="tr-led-list" hidden={emptyLedger}>
              {view?.ledger.map((row, i) => (
                <li key={i} className={row.place <= 3 ? "is-top p" + row.place : ""}>
                  <span className="tr-led-ico" aria-hidden="true"><Svg body={row.place <= 3 ? IC.crown : IC.swords} /></span>
                  <span className="tr-led-txt"><b>{"Tournament placement: #" + row.place}</b><small>{ago(row.minutesAgo)}</small></span>
                  <span className="tr-led-place">{"#" + row.place}</span>
                </li>
              ))}
            </ul>
            <div className="tr-empty" id="tr-led-empty" hidden={!emptyLedger}>
              <span aria-hidden="true"><Svg body={IC.swordsFull} /></span>
              <b id="tr-empty-t">{view && !view.isSelf ? handle + " hasn't battled yet" : "No battles yet"}</b>
              <p id="tr-empty-p">
                {view && !view.isSelf
                  ? "Their placements will appear here after their first tournament."
                  : "Enter your first tournament and your placements will appear here."}
              </p>
              <Link className="ab2" id="tr-empty-cta" href="/app/browse-tournaments/">
                <Svg body={IC.bolt} />{view && !view.isSelf ? "Browse tournaments" : "Find a battle"}
              </Link>
            </div>
          </section>
        </div>
      </div>
      <p className="tr-note"><Svg body={IC.info} />Sample record &mdash; real results sync once tournaments go live.</p>
    </div>
  );
}
