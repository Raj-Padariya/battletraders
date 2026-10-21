"use client";

// Alliance detail body (old alliances.js, DETAIL PAGE): banner, join card, stat cards and the member roster.
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Svg } from "@panel/components/Icon";
import { BTAlliances as A, type Alliance, type AllianceMember, type Relation } from "@panel/lib/data/alliances";
import { usePanel } from "@panel/lib/panel";
import { AL_ICONS as I, POLICY_LABEL, attemptJoin, num, winText } from "../alliances/shared";

interface View {
  alliance: Alliance;
  relation: Relation;
}

const agoText = (minutes: number): string => {
  if (minutes <= 2) return "Online now";
  if (minutes < 60) return minutes + " min ago";
  if (minutes < 1440) return Math.floor(minutes / 60) + "h ago";
  return Math.floor(minutes / 1440) + "d ago";
};

interface JoinView {
  title: string;
  text: string;
  icon: keyof typeof I;
  label: string;
  disabled: boolean;
  modifier: string;
}

function joinView({ alliance: a, relation: rel }: View): JoinView {
  if (rel === "leader") {
    return { title: "Your alliance", text: "You founded [" + a.tag + "]. Recruit fighters and lead them into alliance battles.", icon: "crown", label: "You lead this alliance", disabled: true, modifier: "is-gold" };
  }
  if (rel === "member") {
    return { title: "Your alliance", text: "You fight for [" + a.tag + "]. Every battle you play adds to the team's season points.", icon: "check", label: "You're a member", disabled: true, modifier: "is-green" };
  }
  const title = "Join this alliance";
  if (a.joinPolicy === "invite") {
    return { title, text: "This alliance is invite-only. A leader or officer has to invite you.", icon: "lock", label: "Invitation required", disabled: true, modifier: "is-locked" };
  }
  if (rel === "requested") {
    return { title, text: "Your request is waiting for a leader to approve it.", icon: "clock", label: "Requested", disabled: true, modifier: "" };
  }
  if (a.joinPolicy === "approval") {
    return { title, text: "Leaders review every request. Send yours and get ready to battle.", icon: "userPlus", label: "Request to join", disabled: false, modifier: "" };
  }
  return { title, text: "Open to all fighters. Join instantly and start adding to the team's points.", icon: "check", label: "Join", disabled: false, modifier: "" };
}

function InfoTip({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="al-info" type="button" aria-label={label} aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
        <Svg body={I.info} />
      </button>
      <p className="al-tip" id={id} hidden={!open}>{children}</p>
    </>
  );
}

function MemberRow({ m }: { m: AllianceMember }) {
  const online = m.you || m.lastOnline <= 2;
  return (
    <li>
      <Link className="al-mem" href={"/app/trader/?u=" + encodeURIComponent(m.handle)}>
        <span className="al-mem-who">
          <span className="al-mem-av" aria-hidden="true" style={{ "--av": A.crestColor(m.handle) } as React.CSSProperties}>
            {m.handle.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "TR"}
          </span>
          <span className="al-mem-id">
            <b>{m.handle + (m.you ? " (you)" : "")}</b>
            <em className={"al-role r-" + m.role.toLowerCase()}>{m.role === "Leader" && <Svg body={I.crown} />}<span>{m.role}</span></em>
          </span>
        </span>
        <span className="al-mem-c c-trades"><small>Avg trades / tourney</small><b>{m.avgTrades.toFixed(1)}</b></span>
        <span className="al-mem-c c-style"><small>Profile style</small><b>{m.style}</b></span>
        <span className="al-mem-c c-online"><small>Last online</small><b className={online ? "is-on" : undefined}>{m.you ? "Online now" : agoText(m.lastOnline)}</b></span>
        <span className="al-mem-c c-pts"><small>Points</small><b>{num(m.points)}</b></span>
        <span className="al-mem-go" aria-hidden="true"><Svg body={I.chev} /></span>
      </Link>
    </li>
  );
}

export default function AllianceDetail() {
  const { toast, ready } = usePanel();
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id");
  const isNew = params.get("new") === "1";
  // undefined = not read yet (localStorage), null = missing
  const [view, setView] = useState<View | null | undefined>(undefined);
  const announced = useRef(false);

  const refresh = useCallback(() => {
    const alliance = A.get(id);
    setView(alliance ? { alliance, relation: A.relation(alliance) } : null);
  }, [id]);

  useEffect(() => {
    refresh();
  }, [ready, refresh]);

  useEffect(() => {
    if (view === undefined) return;
    document.title = view ? view.alliance.name + " [" + view.alliance.tag + "] — BattleTrader" : "Alliance not found — BattleTrader";
  }, [view]);

  useEffect(() => {
    if (!view || !isNew || announced.current) return;
    announced.current = true;
    toast("Alliance created", "[" + view.alliance.tag + "] " + view.alliance.name + " is live. You're the leader.");
    const next = new URLSearchParams(params.toString());
    next.delete("new");
    router.replace("/app/alliance/?" + next.toString(), { scroll: false });
  }, [view, isNew, params, router, toast]);

  const a = view?.alliance;
  const join = view ? joinView(view) : null;
  const policyIcon = a ? (a.joinPolicy === "invite" ? I.lock : a.joinPolicy === "approval" ? I.userPlus : I.globe) : "";
  const crest = a ? ({ "--crest": A.crestColor(a.name) } as React.CSSProperties) : undefined;

  return (
    <div className="al-page" id="al-detail">
      <Link className="al-back" href="/app/alliances/"><Svg body={I.back} />Back to alliances</Link>

      <section className="ac al-missing" id="al-missing" hidden={view !== null} aria-labelledby="al-missing-h">
        <span className="al-empty-ico" aria-hidden="true"><Svg body={I.shield} /></span>
        <h1 id="al-missing-h">Alliance not found</h1>
        <p>This alliance may have been disbanded, or the link is wrong.</p>
        <Link className="al-btn" href="/app/alliances/"><Svg body={I.search} />Browse alliances</Link>
      </section>

      {a && join && (
        <div id="al-found">
          <div className="al-top">
            <section className="al-banner" id="al-banner" data-glass="" aria-labelledby="al-name-h" style={crest}>
              <span className="al-crest al-crest-xl" id="al-d-crest" aria-hidden="true" style={crest}>{A.initials(a.name)}</span>
              <div className="al-banner-txt">
                <p className={"al-tierchip t-" + a.tier.toLowerCase()} id="al-d-tier">{a.tier + " tier"}</p>
                <h1 className="al-d-name"><span id="al-name-h">{a.name}</span> <span className="al-tagbadge" id="al-d-tag">{"[" + a.tag + "]"}</span></h1>
                <p className={"al-d-desc" + (a.description ? "" : " is-empty")} id="al-d-desc">{a.description || "No description provided."}</p>
                <ul className="al-chips" aria-label="Alliance facts">
                  <li id="al-d-level"><Svg body={I.layers} /><span>{"Level " + a.level}</span></li>
                  <li id="al-d-cap"><Svg body={I.users} /><span>{a.members.length + "/" + A.CAPACITY}</span></li>
                  <li className={"al-policy p-" + a.joinPolicy} id="al-d-policy"><Svg body={policyIcon} /><span>{POLICY_LABEL[a.joinPolicy]}</span></li>
                  <li id="al-d-founded"><Svg body={I.calendar} /><span>{"Founded " + new Date(a.founded + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span></li>
                  <li className="al-led" id="al-d-led"><Svg body={I.crown} /><span>{"Led by " + a.leader}</span></li>
                </ul>
              </div>
            </section>

            <div className="al-side">
              <section className="ac al-joincard" id="al-joincard" aria-labelledby="al-join-h">
                <div className="al-join-ico" aria-hidden="true"><Svg body={I.shield} /></div>
                <h2 id="al-join-h">{join.title}</h2>
                <p id="al-join-text">{join.text}</p>
                <button
                  className={"al-btn al-join-btn" + (join.modifier ? " " + join.modifier : "")}
                  id="al-join-btn"
                  type="button"
                  disabled={join.disabled}
                  onClick={() => {
                    if (attemptJoin(a, toast)) refresh();
                  }}
                >
                  <Svg body={I[join.icon]} /><span>{join.label}</span>
                </button>
              </section>
              <section className="ac al-ach" aria-labelledby="al-ach-h">
                <div className="ac-h"><h2 id="al-ach-h"><Svg body={I.medal} />Achievements</h2></div>
                <div className="al-ach-empty">
                  <span aria-hidden="true"><Svg body={I.trophy} /></span>
                  <b>No achievements yet</b>
                  <p>Win alliance battles to unlock team badges.</p>
                </div>
              </section>
            </div>
          </div>

          <div className="al-kpis" id="al-kpis">
            <section className="al-stat s-dom" data-glass="" aria-labelledby="al-k-dom-h">
              <div className="al-stat-h">
                <span className="al-stat-ico" aria-hidden="true"><Svg body={I.star} /></span>
                <h2 id="al-k-dom-h">Dominance score</h2>
                <InfoTip id="al-tip-dom" label="How dominance is calculated">Dominance blends season points (45%), win rate (30%) and momentum (25%). It decides the order of the alliance board.</InfoTip>
              </div>
              <p className="al-stat-val" id="al-k-dom">{num(a.dominance)}</p>
              <dl className="al-stat-rows">
                <div><dt>Season (45%)</dt><dd id="al-k-dom-s">{num(a.dominanceParts.season)}</dd></div>
                <div><dt>Win rate (30%)</dt><dd id="al-k-dom-w">{num(a.dominanceParts.win)}</dd></div>
                <div><dt>Momentum (25%)</dt><dd id="al-k-dom-m">{num(a.dominanceParts.momentum)}</dd></div>
              </dl>
            </section>

            <section className="al-stat s-mom" data-glass="" aria-labelledby="al-k-mom-h">
              <div className="al-stat-h">
                <span className="al-stat-ico" aria-hidden="true"><Svg body={I.trend} /></span>
                <h2 id="al-k-mom-h">Momentum</h2>
                <InfoTip id="al-tip-mom" label="How momentum works">Momentum grows with every battle the alliance plays and decays a little each day nobody competes.</InfoTip>
              </div>
              <p className="al-stat-val" id="al-k-mom">{"+" + a.momentum}</p>
              <dl className="al-stat-rows">
                <div><dt>Days since activity</dt><dd id="al-k-mom-d">{a.daysIdle === 0 ? "Today" : a.daysIdle + (a.daysIdle === 1 ? " day" : " days")}</dd></div>
                <div><dt>Decay rate</dt><dd id="al-k-mom-r">-2 / day</dd></div>
              </dl>
            </section>

            <section className="al-stat s-rec" data-glass="" aria-labelledby="al-k-rec-h">
              <div className="al-stat-h">
                <span className="al-stat-ico" aria-hidden="true"><Svg body={I.swords} /></span>
                <h2 id="al-k-rec-h">Battle record</h2>
                <InfoTip id="al-tip-rec" label="About the battle record">Wins and losses in alliance-versus-alliance battles this season.</InfoTip>
              </div>
              <p className="al-stat-val" id="al-k-rec">{a.record.w + "W / " + a.record.l + "L"}</p>
              <dl className="al-stat-rows">
                <div><dt>Win rate</dt><dd id="al-k-rec-w">{winText(a)}</dd></div>
                <div><dt>Current streak</dt><dd id="al-k-rec-c">{a.streak}</dd></div>
                <div><dt>Best streak</dt><dd id="al-k-rec-b">{a.bestStreak}</dd></div>
              </dl>
            </section>

            <section className="al-stat s-pts" data-glass="" aria-labelledby="al-k-pts-h">
              <div className="al-stat-h">
                <span className="al-stat-ico" aria-hidden="true"><Svg body={I.trophy} /></span>
                <h2 id="al-k-pts-h">Season points</h2>
                <InfoTip id="al-tip-pts" label="Where season points come from">Points earned by members in tournaments: placements, participation, profit bonuses and match wins.</InfoTip>
              </div>
              <p className="al-stat-val" id="al-k-pts">{num(a.seasonPoints)}</p>
              <dl className="al-stat-rows">
                <div><dt>Placements</dt><dd id="al-k-pts-p">{num(a.breakdown.placements)}</dd></div>
                <div><dt>Participation</dt><dd id="al-k-pts-a">{num(a.breakdown.participation)}</dd></div>
                <div><dt>Profit bonuses</dt><dd id="al-k-pts-b">{num(a.breakdown.profit)}</dd></div>
                <div><dt>Match wins</dt><dd id="al-k-pts-m">{num(a.breakdown.matches)}</dd></div>
              </dl>
            </section>
          </div>

          <section className="ac al-members" id="al-members" aria-labelledby="al-mem-h">
            <div className="ac-h">
              <h2 id="al-mem-h"><Svg body={I.users} /><span>Members (<span id="al-mem-n">{a.members.length}</span>)</span></h2>
              <span className="ac-chip">Sample roster</span>
            </div>
            <div className="al-mem-head" aria-hidden="true"><span>Fighter</span><span>Avg trades / tourney</span><span>Profile style</span><span>Last online</span><span>Points</span></div>
            <ul className="al-mem-list" id="al-mem-list">
              {a.members.map((m) => <MemberRow key={m.handle} m={m} />)}
            </ul>
          </section>

          <footer className="ap-foot">
            <p>Sample alliance data &mdash; standings update once alliance battles go live.</p>
            <button className="ap-replay" id="al-replay" type="button"><Svg body={I.replay} />Replay tour</button>
          </footer>
        </div>
      )}
    </div>
  );
}
