"use client";

// Port of admin/login.html + admin/assets/js/login.js — sign in with attempt limiting / lockout.
import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@admin/components/Icon";
import ThemeButton from "@admin/components/ThemeButton";
import { AdminUiProvider, FieldError } from "@admin/components/AdminUi";
import { BTAdmin, BTAdminAuth } from "@admin/lib/store";
import { asset } from "@admin/lib/ui";

const DEMO_EMAIL = "admin@battletrader.com";
const DEMO_PASSWORD = "BattleAdmin@2026";

type Errors = { email?: string; pass?: string };

function LoginForm() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const lockTimer = useRef<number | undefined>(undefined);
  const focusInvalid = useRef(false);

  const checkLock = useCallback((): boolean => {
    const a = BTAdminAuth.attempts();
    const left = a.lockedUntil - Date.now();
    if (left > 0) {
      setLocked(true);
      setMsg("Too many wrong attempts. Try again in " + Math.ceil(left / 60000) + " min.");
      window.clearTimeout(lockTimer.current);
      lockTimer.current = window.setTimeout(checkLock, Math.min(left, 30000));
      return true;
    }
    if (a.lockedUntil) BTAdminAuth.saveAttempts({ count: 0, lockedUntil: 0 });
    setLocked(false);
    return false;
  }, []);

  useEffect(() => {
    // Already signed in → straight to the dashboard.
    if (BTAdminAuth.session()) {
      location.replace(asset("/dashboard/"));
      return;
    }
    checkLock();
    emailRef.current?.focus();
    return () => window.clearTimeout(lockTimer.current);
  }, [checkLock]);

  useEffect(() => {
    if (!focusInvalid.current) return;
    focusInvalid.current = false;
    (errors.email ? emailRef.current : passRef.current)?.focus();
  }, [errors]);

  const onToggleShow = () => {
    setShowPass((visible) => !visible);
    passRef.current?.focus();
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (checkLock()) return;
    setErrors({});
    setMsg("");
    const form = e.currentTarget;
    // Read the inputs directly so the demo button's fill-then-submit sees the new values.
    const emailInput = form.elements.namedItem("email") as HTMLInputElement;
    const passInput = form.elements.namedItem("password") as HTMLInputElement;
    const emailValue = emailInput.value.trim().toLowerCase();
    const passValue = passInput.value;
    const next: Errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) next.email = "Enter your admin email.";
    if (!passValue) next.pass = "Enter your password.";
    if (next.email || next.pass) {
      focusInvalid.current = true;
      setErrors(next);
      return;
    }

    setBusy(true);
    const cfg = BTAdminAuth.config();
    BTAdminAuth.hash(passValue).then((hash) => {
      if (emailValue === String(cfg.email).toLowerCase() && hash === cfg.passwordHash) {
        BTAdminAuth.saveAttempts({ count: 0, lockedUntil: 0 });
        BTAdminAuth.startSession(cfg.email);
        BTAdmin.log("Signed in", cfg.email);
        location.replace(asset("/dashboard/"));
        return;
      }
      const a = BTAdminAuth.attempts();
      a.count += 1;
      if (a.count >= BTAdminAuth.maxAttempts) {
        a.lockedUntil = Date.now() + BTAdminAuth.lockMs;
        a.count = 0;
        BTAdminAuth.saveAttempts(a);
        setBusy(false);
        checkLock();
        return;
      }
      BTAdminAuth.saveAttempts(a);
      setBusy(false);
      const left = BTAdminAuth.maxAttempts - a.count;
      setMsg("Email or password is wrong. " + left + (left === 1 ? " attempt" : " attempts") + " left.");
      passRef.current?.select();
    }).catch(() => {
      setBusy(false);
      setMsg("This browser can't verify the password here. Open the admin in Chrome, Edge or Firefox.");
    });
  };

  // Demo only: fills the default login shown on the page and signs in through the same check as typing it.
  const onDemo = () => {
    if (emailRef.current) emailRef.current.value = DEMO_EMAIL;
    if (passRef.current) passRef.current.value = DEMO_PASSWORD;
    setEmail(DEMO_EMAIL);
    setPass(DEMO_PASSWORD);
    formRef.current?.requestSubmit();
  };

  return (
    <main className="ad-login" id="ad-main">
      <section className="ad-card ad-login-card" aria-labelledby="lg-h">
        <a href={asset("/login/")} className="ad-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="is-dark-logo" src={asset("/assets/img/battel-logo.svg")} alt="BattleTrader" width={1214} height={162} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="is-light-logo" src={asset("/assets/img/battel-logo-light.svg")} alt="BattleTrader" width={1214} height={162} />
          <span>Admin</span>
        </a>
        <h1 id="lg-h">Sign in to admin</h1>
        <p className="ad-lead">Manage users, leads, battles and payouts.</p>
        <form className="ad-form" id="lg-form" noValidate onSubmit={onSubmit} ref={formRef}>
          <label className="ad-field"><span>Email</span>
            <input
              type="email" id="lg-email" name="email" autoComplete="username" required ref={emailRef}
              value={email} onChange={(e) => setEmail(e.target.value)}
              aria-invalid={errors.email ? true : undefined} aria-describedby={errors.email ? "lg-email-err" : undefined}
            />
            <FieldError id="lg-email" message={errors.email} />
          </label>
          <label className="ad-field"><span>Password</span>
            <span className="ad-pass">
              <input
                type={showPass ? "text" : "password"} id="lg-pass" name="password" autoComplete="current-password" required ref={passRef}
                value={pass} onChange={(e) => setPass(e.target.value)}
                aria-invalid={errors.pass ? true : undefined} aria-describedby={errors.pass ? "lg-pass-err" : undefined}
              />
              <button className="ad-icon-btn" type="button" id="lg-show" aria-label={showPass ? "Hide password" : "Show password"} aria-pressed={showPass} onClick={onToggleShow}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
              </button>
            </span>
            <FieldError id="lg-pass" message={errors.pass} />
          </label>
          <p className="ad-form-msg is-err" id="lg-msg" role="alert" hidden={!msg}>{msg}</p>
          <button className="ad-btn ad-btn-primary" type="submit" id="lg-submit" disabled={busy || locked}><Icon name="lock" /><span>Sign in</span></button>
        </form>
        <section className="ad-demo-login" aria-labelledby="lg-demo-h">
          <p className="ad-label" id="lg-demo-h">Demo login</p>
          <dl className="ad-dl">
            <dt>Email</dt><dd><code>{DEMO_EMAIL}</code></dd>
            <dt>Password</dt><dd><code>{DEMO_PASSWORD}</code></dd>
          </dl>
          <button className="ad-btn" type="button" id="lg-demo" onClick={onDemo}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg><span>Use demo login</span>
          </button>
        </section>
        <p className="ad-login-foot">Demo admin &mdash; data is read from this browser only. <a href="/">Back to website</a></p>
      </section>
    </main>
  );
}

export default function LoginBody() {
  useEffect(() => {
    document.documentElement.dataset.adminLogin = "";
    return () => {
      delete document.documentElement.dataset.adminLogin;
    };
  }, []);

  return (
    <AdminUiProvider>
      <ThemeButton className="ad-login-theme" />
      <LoginForm />
    </AdminUiProvider>
  );
}
