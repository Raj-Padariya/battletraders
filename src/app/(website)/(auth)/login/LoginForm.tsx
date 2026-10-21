"use client";

import Link from "next/link";
import { useState } from "react";
import SocialButtons, { EMAIL_PATTERN } from "../_components/SocialButtons";

// Login form — port of the old main.js bindAuthForm("lf", …) and the social-button notice.
export default function LoginForm() {
  const [canSubmit, setCanSubmit] = useState(false);
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isValid = (form: HTMLFormElement) => {
    const data = new FormData(form);
    return EMAIL_PATTERN.test(String(data.get("email") ?? "").trim()) && String(data.get("password") ?? "") !== "";
  };

  const onInput = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    setCanSubmit(isValid(form));
    const email = String(new FormData(form).get("email") ?? "").trim();
    if (emailInvalid && EMAIL_PATTERN.test(email)) setEmailInvalid(false);
  };

  const onEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value.trim();
    if (value && !EMAIL_PATTERN.test(value)) setEmailInvalid(true);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid(e.currentTarget)) return;
    setMessage("Logging you in…");
    setCanSubmit(false);
    // The panel has its own root layout, so crossing into it is a full page load anyway; keep it explicit.
    window.location.assign("/app/dashboard/");
  };

  return (
    <>
      <form id="lf" className="auth-form" noValidate onInput={onInput} onSubmit={onSubmit}>
        <div className="f">
          <label htmlFor="lf-email">Email Address</label>
          <input
            id="lf-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="john@example.com"
            required
            aria-invalid={emailInvalid ? "true" : undefined}
            onBlur={onEmailBlur}
          />
        </div>
        <div className="f">
          <div className="f-row">
            <label htmlFor="lf-pass">Password</label>
            <Link href="/contact/">Forgot password?</Link>
          </div>
          <input id="lf-pass" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required />
        </div>
        <button className="btn b-ember btn-block" type="submit" disabled={!canSubmit}>
          Log In
        </button>
        <div className="msg" id="lf-msg" role="status" hidden={message === null}>
          {message}
        </div>
      </form>

      <div className="auth-or">Or continue with</div>
      <SocialButtons onPick={setMessage} />
    </>
  );
}
