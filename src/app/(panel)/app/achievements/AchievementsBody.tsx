"use client";

// Achievements page: hero totals, level card, category tabs (role=tablist, arrow keys, #hash) and the card grid.
// Progress for a new account is 0, except "Reach level N" (level 1) and the profile-driven Growth items read from bt-profile.
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from "react";
import { Svg } from "@panel/components/Icon";
import { BTAchievements as A } from "@panel/lib/data/achievements";
import type { Achievement, AchievementProfile, AchievementResult, Rarity } from "@panel/lib/data/achievements";
import { PROFILE_KEY, readJSON } from "@panel/lib/storage";

const LOCK = '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>';
const CHECK = '<path d="m5 12.5 4.5 4.5L19 7.5"/>';

/* ---------- Rarity emblems (SVG, gradients defined once) ---------- */
const GRADS: Record<Rarity, [string, string, string]> = {
  Bronze: ["#FFD3A8", "#E09A5B", "#8A4A1C"],
  Silver: ["#FFFFFF", "#C9D1E0", "#6B7488"],
  Gold: ["#FFF3B0", "#FFC433", "#9A6400"],
  Platinum: ["#F4F7FF", "#B4C6FF", "#5562A8"],
  Diamond: ["#E6FBFF", "#5CDBFF", "#1767A8"],
  Legendary: ["#F3DCFF", "#C77DFF", "#5B1FA8"],
  Immortal: ["#FFE0FF", "#FF5CFF", "#7B2CFF"],
};

const star = (points: number, outer: number, inner: number, cx = 32, cy = 36): string => {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer;
    const ang = (Math.PI / points) * i - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(ang)).toFixed(1)} ${(cy + r * Math.sin(ang)).toFixed(1)}`);
  }
  return `M${pts.join(" L")}Z`;
};

// viewBox 0 0 64 72, centre (32,36)
const SHAPES: Record<Rarity, string> = {
  Bronze: "M32 2 L60 18 L60 54 L32 70 L4 54 L4 18Z",
  Silver: "M32 3 L58 11 L58 36 C58 52 46 63 32 70 C18 63 6 52 6 36 L6 11Z",
  Gold: "M32 2 L42 9 L59 6 L59 36 C59 52 46 63 32 70 C18 63 5 52 5 36 L5 6 L22 9Z",
  Platinum: "M22 3 L42 3 L60 20 L60 52 L42 69 L22 69 L4 52 L4 20Z",
  Diamond: "M15 5 L49 5 L62 24 L32 69 L2 24Z",
  Legendary: star(8, 33, 26),
  Immortal: star(12, 34, 27),
};

const CAT_BY_ID = new Map(A.categories.map((c) => [c.id, c]));
const CAT_IDS = A.categories.map((c) => c.id);

function EmblemDefs() {
  return (
    <svg className="av-defs" aria-hidden="true" focusable="false">
      <defs>
        {(Object.keys(GRADS) as Rarity[]).map((r) => (
          <linearGradient id={"av-g-" + r.toLowerCase()} x1="0" y1="0" x2="1" y2="1" key={r}>
            <stop offset="0" stopColor={GRADS[r][0]} />
            <stop offset=".45" stopColor={GRADS[r][1]} />
            <stop offset="1" stopColor={GRADS[r][2]} />
          </linearGradient>
        ))}
        <linearGradient id="av-g-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="av-g-hidden" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4A2A7A" />
          <stop offset="1" stopColor="#16101F" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Emblem({ a }: { a: Achievement }) {
  if (a.hidden) {
    return (
      <svg className="av-emb-svg" viewBox="0 0 64 72" aria-hidden="true">
        <path d={SHAPES.Bronze} fill="url(#av-g-hidden)" stroke="rgba(199,125,255,.55)" strokeWidth="1.5" />
        <text x="32" y="46" textAnchor="middle" className="av-emb-q">?</text>
      </svg>
    );
  }
  const shape = SHAPES[a.rarity];
  const glyph = CAT_BY_ID.get(a.category)?.glyph ?? "";
  return (
    <svg className="av-emb-svg" viewBox="0 0 64 72" aria-hidden="true">
      <path d={shape} fill={`url(#av-g-${a.rarity.toLowerCase()})`} stroke="rgba(255,255,255,.55)" strokeWidth="1" />
      <path d={shape} fill="rgba(10,10,18,.62)" stroke="none" transform="translate(32 36) scale(.74) translate(-32 -36)" />
      <path d={shape} fill="url(#av-g-shine)" stroke="none" opacity=".5" transform="translate(32 36) scale(.92) translate(-32 -36)" />
      <g transform="translate(20 24)" className="av-emb-glyph" dangerouslySetInnerHTML={{ __html: glyph }} />
    </svg>
  );
}

function AchievementCard({ a, r }: { a: Achievement; r: AchievementResult }) {
  const key = a.rarity.toLowerCase();
  const val = `${A.formatValue(a.metric, r.value)} / ${A.formatValue(a.metric, r.target)}`;
  return (
    <li className={`av-card r-${key} ${r.unlocked ? "is-unlocked" : "is-locked"}${a.hidden ? " is-hidden" : ""}`} data-glass="" data-id={a.id}>
      <span className="av-emb"><Emblem a={a} /></span>
      <div className="av-body">
        <div className="av-name">
          <h3>{a.name}</h3>
          <span className="av-state" role="img" aria-label={r.unlocked ? "Unlocked" : "Locked"}><Svg body={r.unlocked ? CHECK : LOCK} /></span>
        </div>
        <p className="av-desc">{a.description}</p>
        <div className="av-chips">
          <span className="av-c av-c-xp">+{A.formatValue("", a.xp)} XP</span>
          {a.credits > 0 && <span className="av-c av-c-cr">+{a.credits} Credits</span>}
          <span className={"av-c av-c-rar r-" + key}>{a.rarity}</span>
        </div>
        <p className="av-players"><b>{a.playersPct}%</b> of players have earned this</p>
        <div className="av-prog"><span className="av-prog-val">{val}</span><span className="av-prog-pct">{r.pct}%</span></div>
        <div className="av-bar" role="progressbar" aria-label={a.name + " progress"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={r.pct}>
          <i style={{ width: r.pct + "%" }}></i>
        </div>
      </div>
    </li>
  );
}

export default function AchievementsBody() {
  const [profile, setProfile] = useState<AchievementProfile>({});
  const [current, setCurrent] = useState(CAT_IDS[0]);
  const tabsRef = useRef<HTMLDivElement>(null);
  const focusOnSelect = useRef(false);

  useEffect(() => {
    setProfile(readJSON<AchievementProfile>(PROFILE_KEY, {}) || {});
  }, []);

  const results = useMemo(() => {
    const progress = A.progressFor(profile);
    return new Map(A.list.map((a) => [a.id, A.evaluate(a, progress)]));
  }, [profile]);

  const catStats = (catId: string) => {
    const items = A.list.filter((a) => a.category === catId);
    const unlocked = items.filter((a) => results.get(a.id)?.unlocked).length;
    return { items, unlocked, total: items.length, pct: Math.floor((unlocked / items.length) * 100) };
  };

  /* ---------- Tabs + #hash ---------- */
  const select = (id: string, opts: { focus?: boolean; updateHash?: boolean } = {}) => {
    const next = CAT_BY_ID.has(id) ? id : CAT_IDS[0];
    focusOnSelect.current = !!opts.focus;
    setCurrent(next);
    if (opts.updateHash !== false && window.location.hash !== "#" + next) window.history.replaceState(null, "", "#" + next);
  };

  useEffect(() => {
    const fromHash = window.location.hash.slice(1);
    if (CAT_BY_ID.has(fromHash)) setCurrent(fromHash);
    const onHash = () => {
      const id = window.location.hash.slice(1);
      if (CAT_BY_ID.has(id)) setCurrent(id);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Keep the active tab visible in the horizontally scrolling strip without jumping the page.
  useEffect(() => {
    const tabs = tabsRef.current;
    const btn = document.getElementById("av-tab-" + current);
    if (!tabs || !btn) return;
    if (focusOnSelect.current) btn.focus();
    focusOnSelect.current = false;
    const left = btn.offsetLeft - tabs.offsetLeft;
    if (left < tabs.scrollLeft || left + btn.offsetWidth > tabs.scrollLeft + tabs.clientWidth) {
      tabs.scrollLeft = Math.max(0, left - 12);
    }
  }, [current]);

  const onTabsKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End", "ArrowDown", "ArrowUp"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const i = CAT_IDS.indexOf(current);
    let next = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % CAT_IDS.length;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + CAT_IDS.length) % CAT_IDS.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = CAT_IDS.length - 1;
    select(CAT_IDS[next], { focus: true });
  };

  /* ---------- Hero + level ---------- */
  const total = A.list.length;
  const unlockedAll = A.list.filter((a) => results.get(a.id)?.unlocked);
  const pct = Math.floor((unlockedAll.length / total) * 100);
  const lv = A.level;
  const xp = unlockedAll.reduce((sum, a) => sum + a.xp, 0);

  const cat = CAT_BY_ID.get(current) ?? A.categories[0];
  const stats = catStats(cat.id);
  const emptyText =
    cat.id === "hidden"
      ? "Secret feats reveal themselves when you trip them. Keep battling to find out what they are."
      : `No ${cat.name.replace(/ I$/, "")} achievements yet. Every battle you fight moves these bars.`;

  return (
    <>
      <EmblemDefs />
      <section className="ah av-hero" aria-labelledby="av-title">
        <div className="ah-floor" aria-hidden="true"></div>
        <div className="ah-txt av-hero-txt">
          <span className="av-hero-ico" aria-hidden="true"><Svg body='<path d="M8 3 6 9M16 3l2 6M9 3h6"/><circle cx="12" cy="15" r="6"/><path d="m12 12 1 2 2 .3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1L9 14.3l2-.3z"/>' /></span>
          <div>
            <p className="av-chip"><Svg body='<path d="M7 3h10l-3 6h-4z"/><circle cx="12" cy="15" r="6"/>' />Achievements</p>
            <h1 id="av-title">Your <span>Hall of Honour</span></h1>
            <p className="av-sub">Track your trading milestones</p>
            <p className="av-pill" id="av-pill" aria-live="polite"><b id="av-pill-n">{unlockedAll.length}</b>&nbsp;/&nbsp;<span id="av-pill-total">{total}</span>&nbsp;Unlocked</p>
          </div>
        </div>
        <div className="av-stats" aria-label="Achievement summary">
          <div className="av-stat av-unlocked" data-glass="">
            <b id="av-s-unlocked">{unlockedAll.length}</b>
            <span>Unlocked</span>
          </div>
          <div className="av-stat av-total" data-glass="">
            <b id="av-s-total">{total}</b>
            <span>Total</span>
          </div>
          <div className="av-stat av-pct" data-glass="">
            <b id="av-s-pct">{pct}%</b>
            <span>Progress</span>
          </div>
        </div>
      </section>

      <section className="ac av-level" aria-labelledby="av-level-name">
        <span className="av-level-box" aria-hidden="true"><b id="av-level-n">{lv.n}</b><small>LVL</small></span>
        <div className="av-level-txt">
          <h2 id="av-level-name">{`Level ${lv.n} - ${lv.title}`}</h2>
          <p id="av-level-xp">{`${xp.toLocaleString("en-US")} Experience`}</p>
        </div>
        <div className="av-level-prog">
          <div className="av-level-row"><span>Progress level <b id="av-level-next">{lv.n + 1}</b></span><span id="av-level-of">{`${xp.toLocaleString("en-US")} / ${lv.nextXp} XP`}</span></div>
          <div className="av-bar av-bar-xp" aria-hidden="true"><i id="av-level-bar" style={{ width: Math.min(100, (xp / lv.nextXp) * 100) + "%" }}></i></div>
        </div>
      </section>

      <div className="av-tabs-wrap">
        <div className="av-tabs" id="av-tabs" role="tablist" aria-label="Achievement categories" ref={tabsRef} onKeyDown={onTabsKey}>
          {A.categories.map((c) => {
            const s = catStats(c.id);
            const on = c.id === cat.id;
            return (
              <button
                className={"av-tab" + (on ? " is-on" : "")}
                type="button"
                role="tab"
                id={"av-tab-" + c.id}
                data-cat={c.id}
                aria-controls="av-panel"
                aria-selected={on}
                tabIndex={on ? 0 : -1}
                style={{ "--c": c.color } as CSSProperties}
                key={c.id}
                onClick={() => select(c.id)}
              >
                <span className="av-tab-ico"><Svg body={c.glyph} /></span>
                <span className="av-tab-txt">
                  <b>{c.name}</b>
                  <span className="av-tab-meta">
                    <span className="av-tab-n">{s.unlocked}/{s.total}</span>
                    <span className="av-tab-bar" aria-hidden="true"><i style={{ width: s.pct + "%" }}></i></span>
                    <span className="av-tab-pct">{s.pct}%</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section className="ac av-panel" id="av-panel" role="tabpanel" tabIndex={0} aria-labelledby={"av-tab-" + cat.id} style={{ "--glow": cat.color } as CSSProperties}>
        <div className="av-panel-h">
          <h2>
            <span className="av-panel-ico" id="av-panel-ico" aria-hidden="true" style={{ "--c": cat.color } as CSSProperties}><Svg body={cat.glyph} /></span>
            <span id="av-panel-name">{cat.name}</span>
          </h2>
          <span className="ac-chip" id="av-panel-count"><b>{stats.unlocked}</b> / {stats.total} unlocked</span>
        </div>
        <div className="av-empty" id="av-empty" hidden={stats.unlocked > 0}>
          <span className="av-empty-ico" aria-hidden="true"><Svg body={LOCK} /></span>
          <p><b>Nothing unlocked here yet</b><span id="av-empty-txt">{emptyText}</span></p>
          <Link className="av-empty-btn" href="/app/browse-tournaments/"><Svg body='<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2"/>' />Enter a battle</Link>
        </div>
        <ul className="av-grid" id="av-grid" aria-live="polite">
          {stats.items.map((a) => {
            const r = results.get(a.id);
            return r ? <AchievementCard a={a} r={r} key={a.id} /> : null;
          })}
        </ul>
      </section>

      <footer className="ap-foot">
        <p>Sample progress &mdash; achievements unlock automatically once live trading data is connected. Player percentages are sample figures.</p>
      </footer>
    </>
  );
}
