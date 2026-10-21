"use client";

// User detail — port of admin/assets/js/user.js (user.html?u=<username>).
// Renders the whole AdminShell because the heading (@username) and the head "Block user" button depend on ?u=.
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import AdminShell from "@admin/components/AdminShell";
import Icon from "@admin/components/Icon";
import { Badge, StatusBadge, TableCard, useAdminUi } from "@admin/components/AdminUi";
import { BTAdmin, BTAdminAuth, type AllianceInfo, type EnrollmentRow, type Transaction, type UserDetail } from "@admin/lib/store";
import type { Voucher } from "@admin/lib/data/tournaments";
import { ago, cap, date, money, num } from "@admin/lib/ui";

type Pair = [label: string, value: React.ReactNode];

/** The old alliances-data.js records carry these extra fields; the store's AllianceInfo only types the common ones. */
type AllianceView = AllianceInfo & { tag?: string; seasonPoints?: number; founded?: string };

/** <dl> from [label, value] pairs, skipping empty ones (old fillDl). */
function Dl({ id, pairs, emptyText }: { id: string; pairs: Pair[]; emptyText?: string }) {
  const shown = pairs.filter((p) => p[1] !== undefined && p[1] !== null && p[1] !== "");
  return (
    <dl className="ad-dl" id={id}>
      {shown.length
        ? shown.map(([label, value], i) => [<dt key={"t" + i}>{label}</dt>, <dd key={"d" + i}>{typeof value === "number" ? String(value) : value}</dd>])
        : [<dt key="t">—</dt>, <dd key="d">{emptyText || "Nothing recorded."}</dd>]}
    </dl>
  );
}

function Card({ id, icon, title, extra, children }: { id: string; icon: Parameters<typeof Icon>[0]["name"]; title: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="ad-card" aria-labelledby={id + "-h"}>
      <div className="ad-card-h"><h2 id={id + "-h"}><Icon name={icon} />{title}</h2>{extra}</div>
      {children}
    </section>
  );
}

const kindBadge = (kind: UserDetail["kind"]) =>
  kind === "live" ? <Badge text="Signed in here" tone="info" />
    : kind === "demo" ? <Badge text="Demo" tone="muted" />
    // "violet" is an admin-base.css badge tone outside the shared Tone type.
    : <span className="ad-badge is-violet">Signed up here</span>;

// Rendered through AdminShell's `actions` slot, which sits inside AdminUiProvider — UserDetailView itself
// renders AdminShell, so it is outside the provider and cannot call useAdminUi().
function BlockButton({ user, blocked, onChange }: { user: UserDetail["user"] | null; blocked: boolean; onChange: (blocked: boolean) => void }) {
  const { toast, confirmAction } = useAdminUi();

  const toggleBlock = () => {
    if (!user) return;
    if (BTAdmin.blockedList().indexOf(user.username) !== -1) {
      BTAdmin.unblock(user.username);
      toast("@" + user.username + " can use their account again.");
      onChange(false);
      return;
    }
    confirmAction({
      title: "Block @" + user.username + "?",
      text: "They will see an \"Account suspended\" screen in the user panel until you unblock them.",
      confirm: "Block user",
      tone: "bad",
    }).then((ok) => {
      if (!ok) return;
      BTAdmin.block(user.username);
      toast("@" + user.username + " is blocked.", "warn");
      onChange(true);
    });
  };

  return (
    <button className={"ad-btn " + (user && blocked ? "ad-btn-ok" : "ad-btn-danger")} type="button" id="ud-block" hidden={!user} onClick={toggleBlock}>
      <Icon name="ban" /><span>{user && blocked ? "Unblock user" : "Block user"}</span>
    </button>
  );
}

export default function UserDetailView() {
  const params = useSearchParams();
  const username = params.get("u") || "";
  // undefined = not loaded yet (server HTML + first render), null = user not found.
  const [detail, setDetail] = useState<UserDetail | null | undefined>(undefined);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!BTAdminAuth.session()) return; // AdminShell redirects to login
    const found = username ? BTAdmin.userDetail(username) : null;
    setDetail(found);
    if (found) {
      setBlocked(BTAdmin.blockedList().indexOf(found.user.username) !== -1);
      document.title = "@" + found.user.username + " — BattleTrader Admin";
    }
  }, [username]);

  const u = detail ? detail.user : null;

  const heading = detail === null ? "User not found" : u ? "@" + u.username : "User";
  const blockButton = <BlockButton user={u} blocked={blocked} onChange={setBlocked} />;

  return (
    <AdminShell
      current="users"
      heading={heading}
      lead={<Link className="ad-cell-link" href="/admin/users/">&larr; All users</Link>}
      actions={blockButton}
    >
      <div className="ad-empty ad-card" id="ud-missing" hidden={detail !== null}>
        <Icon name="users" /><p>This user doesn&apos;t exist in this browser. <Link className="ad-cell-link" href="/admin/users/">Back to all users</Link></p>
      </div>
      <div id="ud-page" hidden={!detail}>
        {detail && u ? <DetailBody detail={detail} blocked={blocked} /> : null}
      </div>
    </AdminShell>
  );
}

function DetailBody({ detail, blocked }: { detail: UserDetail; blocked: boolean }) {
  const u = detail.user;
  const p = detail.profile;

  const scope = detail.kind === "demo"
    ? "Demo account — generated so every screen has data. Changes you make here are saved, but nothing is sent anywhere. Hide demo data in Settings."
    : !detail.isCurrent
      ? "@" + u.username + " signed up on this browser but isn't signed in now, so their wallet, KYC and activity aren't stored here. A backend will show them."
      : "";

  const profilePairs: Pair[] = [
    ["Status", <StatusBadge key="s" status={blocked ? "blocked" : "active"} />],
    ["Type", kindBadge(detail.kind)],
    ["Last active", u.lastActive ? ago(u.lastActive) : ""],
    ["Full name", p.fullName || u.fullName],
    ["Email", p.email || u.email],
    ["Phone", p.phone ? p.phone + (p.phoneVerified ? " (verified)" : " (not verified)") : ""],
    ["Country", p.countryName || u.countryName],
    ["Time zone", p.timezone],
    ["Gender", p.gender],
    ["Discord", p.discord],
    ["Telegram", p.telegram],
    ["Joined", u.joined ? date(u.joined, true) : ""],
    ["Rank", u.rank ? "#" + u.rank + " · " + num(u.points) + " pts · " + (u.tier || "") : ""],
  ];

  const w = detail.wallet;
  const walletPairs: Pair[] = w ? [["Balance", money(w.balance)], ["Credits", num(w.credits)], ["Tickets", num(w.tickets)]] : [];

  const k = detail.kyc;
  const kycPairs: Pair[] = k ? [
    ["Status", <StatusBadge key="k" status={k.status || "none"} label={k.status === "none" || !k.status ? "Not started" : cap(k.status)} />],
    ["Legal name", k.fullName],
    ["ID type", k.idType],
    ["Submitted", k.submittedAt ? date(k.submittedAt, true) : ""],
    ["Reviewed", k.reviewedAt ? date(k.reviewedAt, true) : ""],
    ["Note", k.reviewNote],
  ] : [];

  const al = detail.alliance as AllianceView | null;
  const alliancePairs: Pair[] = al ? [
    ["Alliance", al.name + (al.tag ? " [" + al.tag + "]" : "")],
    ["Role", al.leader === u.username ? "Leader" : "Member"],
    ["Members", al.members ? al.members.length : ""],
    ["Season points", num(al.seasonPoints)],
    ["Founded", al.founded ? date(al.founded) : ""],
  ] : [];

  const arenaPairs: Pair[] = [];
  const arena = detail.arena as Record<string, unknown> | null;
  if (arena && typeof arena === "object") {
    Object.keys(arena).forEach((key) => {
      const v = arena[key];
      if (typeof v === "number" || typeof v === "string" || typeof v === "boolean") {
        arenaPairs.push([cap(key.replace(/([A-Z])/g, " $1").toLowerCase()), String(v)]);
      }
    });
  }
  const aff = detail.affiliate;
  if (aff) {
    arenaPairs.push(["Referral code", aff.code]);
    arenaPairs.push(["Referrals", num(aff.referrals)]);
    arenaPairs.push(["Earned", money(aff.cash) + " · " + num(aff.credits) + " credits"]);
  }

  return (
    <>
      <p className="ad-note is-warn" id="ud-scope" style={{ marginBottom: "16px" }} hidden={!scope}><Icon name="info" /><span id="ud-scope-t">{scope}</span></p>
      <div className="ad-grid ad-grid-3" style={{ marginBottom: "16px" }}>
        <Card id="ud-profile" icon="user" title="Profile"><Dl id="ud-profile-dl" pairs={profilePairs} /></Card>
        <Card id="ud-wallet" icon="wallet" title="Wallet" extra={<Link href="/admin/transactions/">Adjust</Link>}>
          <Dl id="ud-wallet-dl" pairs={walletPairs} emptyText="Not available for this user." />
        </Card>
        <Card id="ud-kyc" icon="idCard" title="KYC" extra={<Link href="/admin/kyc/">Review</Link>}>
          <Dl id="ud-kyc-dl" pairs={kycPairs} emptyText="Not available for this user." />
        </Card>
      </div>
      <div className="ad-grid ad-grid-2" style={{ marginBottom: "16px" }}>
        <Card id="ud-alliance" icon="shield" title="Alliance">
          <Dl id="ud-alliance-dl" pairs={alliancePairs} emptyText={detail.isCurrent ? "Not in an alliance." : "Not available for this user."} />
        </Card>
        <Card id="ud-arena" icon="target" title="Arena & affiliate">
          <Dl id="ud-arena-dl" pairs={arenaPairs.slice(0, 12)} emptyText={detail.isCurrent ? "No arena or affiliate activity yet." : "Not available for this user."} />
        </Card>
      </div>
      <div className="ad-stack">
        <div>
          <h2 className="ad-section-h">Transactions</h2>
          <TableCard<Transaction>
            id="ud-tx"
            caption="Transactions"
            columns={[{ label: "Date" }, { label: "Type" }, { label: "Note" }, { label: "Status" }, { label: "Amount", num: true }]}
            empty="No transactions."
            items={detail.transactions}
            rowKey={(t) => t.id}
            renderRow={(t) => [
              date(t.at, true),
              cap(t.type),
              t.note || "—",
              <StatusBadge key="st" status={t.status === "completed" ? "completed_tx" : t.status} label={cap(t.status)} />,
              { node: (t.type === "topup" || t.type === "refund" || t.type === "reward" ? "+" : "−") + money(t.amount), num: true },
            ]}
          />
        </div>
        <div>
          <h2 className="ad-section-h">Battle entries</h2>
          <TableCard<EnrollmentRow>
            id="ud-en"
            caption="Battle entries"
            columns={[{ label: "Battle" }, { label: "Entered" }, { label: "Paid with" }, { label: "Amount", num: true }]}
            empty="Not entered in any battle."
            items={detail.enrollments}
            rowKey={(e) => e.id}
            renderRow={(e) => [
              <Link key="b" className="ad-cell-link" href={"/admin/battles/?id=" + encodeURIComponent(e.id)}>{e.name}</Link>,
              date(e.at, true),
              cap(e.paidWith || "—"),
              { node: money(e.amount), num: true },
            ]}
          />
        </div>
        <div>
          <h2 className="ad-section-h">Vouchers</h2>
          <TableCard<Voucher>
            id="ud-vo"
            caption="Vouchers"
            columns={[{ label: "Code" }, { label: "Value" }, { label: "Applies to" }, { label: "Uses left", num: true }, { label: "Expires" }]}
            empty="No vouchers."
            items={detail.vouchers}
            rowKey={(v) => v.id}
            renderRow={(v) => [
              <code key="c">{v.code}</code>,
              v.kind === "percent" ? v.value + "% off" : v.kind === "free-entry" ? "Free entry" : money(v.value) + " off",
              (v.appliesTo || []).map(cap).join(", "),
              { node: v.usesLeft + " / " + v.usesTotal, num: true },
              date(v.expiresAt),
            ]}
          />
        </div>
      </div>
    </>
  );
}
