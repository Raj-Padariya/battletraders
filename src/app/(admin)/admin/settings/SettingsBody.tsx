"use client";

// Port of admin/assets/js/settings.js — change login, demo data, data export/reset, audit log.
import { useEffect, useRef, useState } from "react";
import Icon from "@admin/components/Icon";
import { FieldError, TableCard, Toolbar, useAdminUi } from "@admin/components/AdminUi";
import { BTAdmin, BTAdminAuth, type AuditEntry } from "@admin/lib/store";
import { date, matches, num } from "@admin/lib/ui";

const QUOTA_WARN = 4 * 1024 * 1024; // browsers allow ~5 MB per site

type PassField = "st-email" | "st-current" | "st-new" | "st-repeat";
type PassErrors = Partial<Record<PassField, string>>;

const formatSize = (used: number): string =>
  used < 1024 ? used + " B" : used < 1048576 ? (used / 1024).toFixed(1) + " KB" : (used / 1048576).toFixed(2) + " MB";

const countKeys = (): number => {
  let count = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) if ((localStorage.key(i) || "").indexOf("bt-") === 0) count++;
  } catch {
    // storage blocked
  }
  return count;
};

export default function SettingsBody() {
  const { toast, confirmAction } = useAdminUi();

  const [email, setEmail] = useState("");
  const [current, setCurrent] = useState("");
  const [nextPass, setNextPass] = useState("");
  const [repeat, setRepeat] = useState("");
  const [errors, setErrors] = useState<PassErrors>({});
  const [msg, setMsg] = useState<{ text: string; ok: boolean }>({ text: "", ok: false });
  const formRef = useRef<HTMLFormElement>(null);
  const focusInvalid = useRef(false);

  const [data, setData] = useState<{ size: string; keys: string; quota: boolean }>({ size: "—", keys: "—", quota: false });
  const [demoOn, setDemoOn] = useState(false);

  const [log, setLog] = useState<AuditEntry[]>([]);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");

  const renderData = () => {
    const used = BTAdmin.storageUsed();
    setData({ size: formatSize(used), keys: num(countKeys()), quota: used >= QUOTA_WARN });
  };
  const renderLog = () => setLog(BTAdmin.auditLog());

  useEffect(() => {
    setEmail(BTAdminAuth.config().email);
    setDemoOn(BTAdmin.demoEnabled());
    renderData();
    renderLog();
  }, []);

  // Old UI.onFilter: text input debounced 150 ms.
  useEffect(() => {
    const timer = window.setTimeout(() => setAppliedQuery(query), 150);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!focusInvalid.current) return;
    focusInvalid.current = false;
    formRef.current?.querySelector<HTMLElement>("[aria-invalid]")?.focus();
  }, [errors]);

  const filtered = log.filter((l) => matches(l, appliedQuery.trim(), ["action", "detail"]));

  const fieldProps = (id: PassField) => ({
    id,
    "aria-invalid": errors[id] ? (true as const) : undefined,
    "aria-describedby": errors[id] ? id + "-err" : undefined,
  });

  const showMsg = (text: string, ok = false) => setMsg({ text, ok });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    showMsg("");
    const emailValue = email.trim();
    const next: PassErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) next["st-email"] = "Enter a valid email.";
    if (!current) next["st-current"] = "Enter your current password.";
    if (nextPass.length < 10 || !/[A-Za-z]/.test(nextPass) || !/[0-9]/.test(nextPass)) next["st-new"] = "At least 10 characters, with a letter and a number.";
    else if (nextPass !== repeat) next["st-repeat"] = "The two new passwords don't match.";
    focusInvalid.current = Object.keys(next).length > 0;
    setErrors(next);
    if (focusInvalid.current) return;

    const cfg = BTAdminAuth.config();
    BTAdminAuth.hash(current).then((currentHash) => {
      if (currentHash !== cfg.passwordHash) {
        focusInvalid.current = true;
        setErrors({ "st-current": "That's not the current password." });
        return null;
      }
      return BTAdminAuth.hash(nextPass);
    }).then((newHash) => {
      if (!newHash) return;
      if (!BTAdmin.write("bt-admin-config", { email: emailValue, passwordHash: newHash })) {
        showMsg("Couldn't save — browser storage is full.");
        return;
      }
      BTAdmin.log("Changed admin login", emailValue);
      setCurrent("");
      setNextPass("");
      setRepeat("");
      setEmail(emailValue);
      BTAdminAuth.startSession(emailValue); // keep this session, under the new email
      // The shell's top bar shows the email; update it in place like the old code did.
      document.querySelectorAll("[data-admin-email]").forEach((n) => { n.textContent = emailValue; });
      showMsg("Saved. Use the new password next time you sign in.", true);
      renderLog();
    }).catch(() => {
      showMsg("This browser can't hash passwords here. Use Chrome, Edge or Firefox.");
    });
  };

  const onDemoChange = (checked: boolean) => {
    setDemoOn(checked);
    BTAdmin.setDemoEnabled(checked);
    toast(checked ? "Demo users and leads are shown." : "Demo data hidden — only real sign-ups from this browser are shown.");
    renderData();
    renderLog();
  };

  const onRegen = (e: React.MouseEvent<HTMLButtonElement>) => {
    const opener = e.currentTarget;
    confirmAction({
      title: "Regenerate demo data?",
      text: "Demo users and leads go back to their starting state. Changes you made to them (KYC decisions, wallet adjustments, lead statuses) are lost. Real data is not touched.",
      confirm: "Regenerate",
    }).then((ok) => {
      if (!ok) { opener.focus(); return; }
      BTAdmin.regenerateDemo();
      setDemoOn(true);
      toast("Demo data regenerated.");
      renderData();
      renderLog();
    });
  };

  const onExport = () => {
    BTAdmin.exportAll();
    toast("Download started.");
    renderLog();
  };

  const onReset = (e: React.MouseEvent<HTMLButtonElement>) => {
    const opener = e.currentTarget;
    confirmAction({
      title: "Reset all data?",
      text: "This deletes every user, lead, battle change, transaction, voucher and KYC record in this browser, real and demo. Demo data is rebuilt fresh next time you open a page. Your admin login and the audit log are kept. Export first if you need a copy.",
      confirm: "Reset everything",
      tone: "bad",
    }).then((ok) => {
      if (!ok) { opener.focus(); return; }
      BTAdmin.resetDemo();
      toast("All data cleared.", "warn");
      setDemoOn(true);
      renderData();
      renderLog();
    });
  };

  const onLogExport = () => {
    BTAdmin.exportCSV<AuditEntry>("battletrader-audit-log.csv", [["at", "When"], ["action", "Action"], ["detail", "Details"]], filtered);
    toast("CSV downloaded.");
    renderLog();
  };

  return (
    <>
      <div className="ad-grid ad-grid-2">
        <section className="ad-card" aria-labelledby="st-pass-h">
          <div className="ad-card-h"><h2 id="st-pass-h"><Icon name="lock" />Change password</h2></div>
          <form className="ad-form" id="st-pass" noValidate onSubmit={onSubmit} ref={formRef}>
            <label className="ad-field">
              <span>Admin email</span>
              <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} {...fieldProps("st-email")} />
              <FieldError id="st-email" message={errors["st-email"]} />
            </label>
            <label className="ad-field">
              <span>Current password</span>
              <input type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} {...fieldProps("st-current")} />
              <FieldError id="st-current" message={errors["st-current"]} />
            </label>
            <label className="ad-field">
              <span>New password</span>
              <input type="password" autoComplete="new-password" minLength={10} required value={nextPass} onChange={(e) => setNextPass(e.target.value)} {...fieldProps("st-new")} />
              <small className="ad-hint">At least 10 characters, with a letter and a number.</small>
              <FieldError id="st-new" message={errors["st-new"]} />
            </label>
            <label className="ad-field">
              <span>Repeat new password</span>
              <input type="password" autoComplete="new-password" required value={repeat} onChange={(e) => setRepeat(e.target.value)} {...fieldProps("st-repeat")} />
              <FieldError id="st-repeat" message={errors["st-repeat"]} />
            </label>
            <p className={"ad-form-msg" + (msg.text ? (msg.ok ? " is-ok" : " is-err") : "")} id="st-pass-msg" role="status" hidden={!msg.text}>{msg.text}</p>
            <div className="ad-form-actions"><button className="ad-btn ad-btn-primary" type="submit"><Icon name="check" /><span>Save login</span></button></div>
          </form>
        </section>

        <div className="ad-stack">
          <section className="ad-card" aria-labelledby="st-demo-h">
            <div className="ad-card-h"><h2 id="st-demo-h"><Icon name="users" />Demo data</h2></div>
            <p className="ad-hint" style={{ marginBottom: "14px" }}>20 demo users with wallets, transactions, KYC, battle entries and vouchers, plus 12 website leads, so every screen can be reviewed before the backend exists. Real sign-ups from this browser always show.</p>
            <label className="ad-check" style={{ marginBottom: "12px" }}><input type="checkbox" id="st-demo-on" checked={demoOn} onChange={(e) => onDemoChange(e.target.checked)} /> Show demo users and leads</label>
            <div className="ad-head-actions">
              <button className="ad-btn" type="button" id="st-demo-regen" onClick={onRegen}><Icon name="replay" /><span>Regenerate demo data</span></button>
            </div>
          </section>
          <section className="ad-card" aria-labelledby="st-data-h">
            <div className="ad-card-h"><h2 id="st-data-h"><Icon name="download" />Data</h2></div>
            <dl className="ad-dl" style={{ marginBottom: "14px" }}>
              <dt>Stored in this browser</dt><dd id="st-size">{data.size}</dd>
              <dt>Keys</dt><dd id="st-keys">{data.keys}</dd>
            </dl>
            <p className="ad-note is-warn" id="st-quota" style={{ marginBottom: "14px" }} hidden={!data.quota}><Icon name="alert" /><span>Browser storage is nearly full (about 5&nbsp;MB). Export and reset old demo data, or uploads may start failing.</span></p>
            <div className="ad-head-actions">
              <button className="ad-btn" type="button" id="st-export" onClick={onExport}><Icon name="download" /><span>Export all data (JSON)</span></button>
              <button className="ad-btn ad-btn-danger" type="button" id="st-reset" onClick={onReset}><Icon name="trash" /><span>Reset all data</span></button>
            </div>
          </section>
          <section className="ad-card" aria-labelledby="st-about-h">
            <div className="ad-card-h"><h2 id="st-about-h"><Icon name="info" />About this admin</h2></div>
            <p className="ad-hint">This is a front-end demo. All data lives in this browser&rsquo;s storage, and the login only keeps casual visitors out. Connect a backend before putting real user data here.</p>
          </section>
        </div>
      </div>

      <h2 className="ad-section-h" style={{ marginTop: "22px" }}>Audit log</h2>
      <Toolbar id="lg" searchLabel="Search the log" placeholder="Search actions…" query={query} onQuery={setQuery}>
        <button className="ad-btn" type="button" id="lg-export" onClick={onLogExport}><Icon name="download" /><span>Export CSV</span></button>
      </Toolbar>
      <TableCard<AuditEntry>
        id="lg-table"
        caption="Audit log"
        columns={[{ label: "When" }, { label: "Action" }, { label: "Details" }]}
        empty="Nothing logged yet. Every change you make in the admin is recorded here."
        items={filtered}
        rowKey={(l) => l.at + "|" + l.action + "|" + l.detail}
        renderRow={(l) => [date(l.at, true), l.action, l.detail || "—"]}
        total={log.length}
      />
    </>
  );
}
