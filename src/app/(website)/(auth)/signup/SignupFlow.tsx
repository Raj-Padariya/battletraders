"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PROFILE_KEY, TOUR_DONE_KEY, USERS_KEY } from "@site/lib/store";
import SocialButtons, { EMAIL_PATTERN } from "../_components/SocialButtons";

// Signup: details form → email code → 4-step profile setup. Port of the old main.js 600-990.
const OTP_LENGTH = 6;
const OTP_RESEND_SECONDS = 30;
const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;
const USERNAME_CHARS = /^[A-Za-z0-9_]*$/;
const MIN_AGE = 18;
const USER_HINT = "3–20 characters: letters, numbers and underscores.";
const DOB_HINT = "We only use this to confirm you're eligible.";
const STEP_COUNT = 4;
const COUNTRY_CODES = (
  "AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ " +
  "CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR " +
  "GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP " +
  "KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ " +
  "NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW " +
  "SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ " +
  "UA UG US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW"
).split(" ");

type Stage = "form" | "otp" | "onboard";
type HintState = "" | "ok" | "err";

interface Option {
  value: string;
  label: string;
}

interface Hint {
  text: string;
  state: HintState;
}

interface OtpMessage {
  className: string;
  text: string;
}

const pad2 = (n: number) => (n < 10 ? "0" : "") + n;
const isoDate = (date: Date) => date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());

// Parse YYYY-MM-DD as local calendar parts so the age never shifts by a day across timezones.
function ageFrom(value: string): number {
  const parts = value.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - parts[0];
  const month = today.getMonth() + 1;
  if (month < parts[1] || (month === parts[1] && today.getDate() < parts[2])) age--;
  return age;
}

function usernameHint(name: string): Hint {
  if (!USERNAME_CHARS.test(name)) return { text: "Use only letters, numbers and underscores — no spaces.", state: "err" };
  if (name.length < 3) return { text: USER_HINT, state: "" };
  return { text: "Looks good — you'll appear as @" + name + ".", state: "ok" };
}

function dobCheck(value: string): { hint: Hint; valid: boolean } {
  if (!value) return { hint: { text: DOB_HINT, state: "" }, valid: false };
  const age = ageFrom(value);
  if (age < 0) return { hint: { text: "That date is in the future.", state: "err" }, valid: false };
  if (Number(value.split("-")[0]) < 1900) return { hint: { text: "Enter a real date of birth.", state: "err" }, valid: false };
  if (age < MIN_AGE) return { hint: { text: "You must be 18 or older to compete.", state: "err" }, valid: false };
  return { hint: { text: "Age " + age + " — you're eligible to compete.", state: "ok" }, valid: true };
}

const hintClass = (hint: Hint) => "ob-hint" + (hint.state ? " is-" + hint.state : "");

function zoneOffset(zone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "shortOffset" }).formatToParts(new Date());
    const label = parts.find((part) => part.type === "timeZoneName");
    return label ? label.value.replace("GMT", "UTC") : "";
  } catch {
    return ""; // shortOffset unsupported: show the zone name alone
  }
}

function localTime(zone: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: zone, weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date());
}

function buildCountries(): Option[] {
  let regionNames: Intl.DisplayNames | null = null;
  try {
    regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    regionNames = null; // older browsers: fall back to ISO codes as labels
  }
  return COUNTRY_CODES.map((code) => ({ value: code, label: (regionNames && regionNames.of(code)) || code })).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

const NextArrow = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="ob-back" type="button" aria-label="Back" onClick={onClick}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 12H5M11 6l-6 6 6 6" />
      </svg>
    </button>
  );
}

export default function SignupFlow() {
  const reducedRef = useRef(true);
  const pendingFocus = useRef<(() => void) | null>(null);

  const [stage, setStage] = useState<Stage>("form");

  // Step 1: details
  const sfEmailRef = useRef<HTMLInputElement>(null);
  const [sfCanSubmit, setSfCanSubmit] = useState(false);
  const [sfEmailInvalid, setSfEmailInvalid] = useState(false);
  const [sfMessage, setSfMessage] = useState<string | null>(null);
  const [account, setAccount] = useState({ name: "", email: "" });

  // Step 2: email code
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpTimer = useRef<number | undefined>(undefined);
  const [otpDigits, setOtpDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(""));
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpMessage, setOtpMessage] = useState<OtpMessage | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);

  // Step 3: profile setup
  const stepFormRefs = useRef<(HTMLFormElement | null)[]>([]);
  const doneTitleRef = useRef<HTMLHeadingElement>(null);
  const tzTimer = useRef<number | undefined>(undefined);
  const tzRef = useRef("");
  const [step, setStep] = useState(0);
  const [stepAnim, setStepAnim] = useState<"fwd" | "back" | null>(null);
  const [finished, setFinished] = useState(false);
  const [username, setUsername] = useState("");
  const [confirms, setConfirms] = useState({ age: false, terms: false, privacy: false });
  const [dob, setDob] = useState("");
  const [dobRange, setDobRange] = useState<{ min?: string; max?: string }>({});
  const [countries, setCountries] = useState<Option[]>([]);
  const [country, setCountry] = useState("");
  const [zones, setZones] = useState<Option[]>([]);
  const [tz, setTz] = useState("");
  const [tzNow, setTzNow] = useState("—");

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const today = new Date();
    setDobRange({ min: "1900-01-01", max: isoDate(new Date(today.getFullYear() - MIN_AGE, today.getMonth(), today.getDate())) });
    setCountries(buildCountries());
    return () => {
      window.clearInterval(otpTimer.current);
      window.clearInterval(tzTimer.current);
    };
  }, []);

  // Focus requests are queued during event handlers and run once the DOM they target is visible.
  useEffect(() => {
    const focus = pendingFocus.current;
    if (!focus) return;
    pendingFocus.current = null;
    focus();
  });

  /* ---------- Step 1: details form ---------- */
  const sfIsValid = (form: HTMLFormElement) => {
    const data = new FormData(form);
    return String(data.get("name") ?? "").trim() !== "" && EMAIL_PATTERN.test(String(data.get("email") ?? "").trim());
  };

  const onSfInput = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    setSfCanSubmit(sfIsValid(form));
    const email = String(new FormData(form).get("email") ?? "").trim();
    if (sfEmailInvalid && EMAIL_PATTERN.test(email)) setSfEmailInvalid(false);
  };

  const onSfEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value.trim();
    if (value && !EMAIL_PATTERN.test(value)) setSfEmailInvalid(true);
  };

  const onSfSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!sfIsValid(form)) return;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim();
    setAccount({ name: String(data.get("name") ?? "").trim(), email });
    startOtp();
  };

  /* ---------- Step 2: email code ---------- */
  const otpSync = () => setOtpDigits(otpRefs.current.map((box) => (box ? box.value : "")));

  // Spread digits from `index` onward so paste and one-time-code autofill fill every box.
  const otpFill = (index: number, digits: string) => {
    const boxes = otpRefs.current;
    for (let i = 0; i < digits.length && index + i < OTP_LENGTH; i++) {
      const box = boxes[index + i];
      if (box) box.value = digits.charAt(i);
    }
    boxes[Math.min(index + digits.length, OTP_LENGTH - 1)]?.focus();
    otpSync();
  };

  const otpStartCooldown = () => {
    let secondsLeft = OTP_RESEND_SECONDS;
    window.clearInterval(otpTimer.current);
    setResendSeconds(secondsLeft);
    otpTimer.current = window.setInterval(() => {
      secondsLeft--;
      setResendSeconds(secondsLeft);
      if (secondsLeft <= 0) window.clearInterval(otpTimer.current);
    }, 1000);
  };

  const otpReset = () => {
    otpRefs.current.forEach((box) => {
      if (box) box.value = "";
    });
    setOtpVerified(false);
    setOtpMessage(null);
    otpSync();
  };

  const startOtp = () => {
    otpReset();
    setStage("otp");
    otpStartCooldown();
    pendingFocus.current = () => otpRefs.current[0]?.focus();
  };

  const onOtpInput = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const box = e.currentTarget;
    const digits = box.value.replace(/\D/g, "");
    box.value = "";
    if (digits) otpFill(index, digits);
    else otpSync();
  };

  const onOtpKeyDown = (index: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    const box = e.currentTarget;
    const boxes = otpRefs.current;
    if (/^\d$/.test(e.key)) {
      box.value = ""; // typing over a filled box replaces its digit
    } else if (e.key === "Backspace" && box.value === "" && index > 0) {
      e.preventDefault();
      const previous = boxes[index - 1];
      if (previous) {
        previous.value = "";
        previous.focus();
      }
      otpSync();
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      boxes[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      e.preventDefault();
      boxes[index + 1]?.focus();
    }
  };

  const onOtpPaste = (index: number) => (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "");
    if (digits) otpFill(index, digits);
  };

  const otpComplete = otpDigits.join("").length === OTP_LENGTH;

  const onOtpSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!otpComplete) return;
    window.clearInterval(otpTimer.current);
    setOtpVerified(true);
    setOtpMessage({ className: "msg is-ok", text: "Email verified. Let's set up your profile." });
    window.setTimeout(startOnboarding, 800);
  };

  const onResend = () => {
    otpReset();
    setOtpMessage({ className: "msg", text: "We've sent a new code to " + account.email + "." });
    otpStartCooldown();
    otpRefs.current[0]?.focus();
  };

  const onChangeEmail = () => {
    window.clearInterval(otpTimer.current);
    setStage("form");
    pendingFocus.current = () => {
      sfEmailRef.current?.focus();
      sfEmailRef.current?.select();
    };
  };

  /* ---------- Step 3: profile setup ---------- */
  const userHint = usernameHint(username.trim());
  const dobResult = dobCheck(dob);
  const stepValid = [
    USERNAME_PATTERN.test(username.trim()) && confirms.age && confirms.terms && confirms.privacy,
    dobResult.valid,
    country !== "",
    tz !== "",
  ];

  const showStep = (index: number, direction: "fwd" | "back") => {
    setStep(index);
    setStepAnim(reducedRef.current ? null : direction);
    pendingFocus.current = () => stepFormRefs.current[index]?.querySelector<HTMLElement>("input, select")?.focus();
  };

  const startOnboarding = () => {
    setStage("onboard");
    showStep(0, "fwd");
  };

  const selectTimezone = (zone: string) => {
    tzRef.current = zone;
    setTz(zone);
    if (zone) setTzNow(localTime(zone));
  };

  const buildTimezones = () => {
    if (zones.length) return;
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const list = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone").slice() : [];
    if (list.indexOf(detected) === -1) list.unshift(detected);
    if (list.indexOf("UTC") === -1) list.push("UTC");
    setZones(
      list.map((zone) => {
        const offset = zoneOffset(zone);
        return { value: zone, label: zone.replace(/_/g, " ") + (offset ? " (" + offset + ")" : "") };
      }),
    );
    selectTimezone(detected);
    tzTimer.current = window.setInterval(() => {
      if (tzRef.current) setTzNow(localTime(tzRef.current));
    }, 15000);
  };

  const finishSetup = () => {
    const name = username.trim();
    const countryName = countries.find((c) => c.value === country)?.label ?? "";
    const joined = new Date().toISOString();
    // Front-end only: the dashboard reads this until a real account API exists.
    try {
      localStorage.setItem(
        PROFILE_KEY,
        JSON.stringify({
          username: name,
          fullName: account.name,
          email: account.email,
          country,
          countryName,
          timezone: tz,
          joined,
        }),
      );
      // Registry of every account created in this browser, so the admin can list them all.
      const stored: unknown = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
      const users = Array.isArray(stored) ? (stored as Record<string, unknown>[]) : [];
      const others = users.filter((u) => u.username !== name);
      others.unshift({
        username: name,
        fullName: account.name,
        email: account.email,
        country,
        countryName,
        joined: new Date().toISOString(),
      });
      localStorage.setItem(USERS_KEY, JSON.stringify(others));
      localStorage.removeItem(TOUR_DONE_KEY);
    } catch {
      // Storage blocked (private mode): the dashboard falls back to a guest profile.
    }
    setFinished(true);
    pendingFocus.current = () => doneTitleRef.current?.focus();
  };

  const onStepSubmit = (index: number) => (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stepValid[index]) return;
    if (index === STEP_COUNT - 1) {
      finishSetup();
      return;
    }
    if (index + 1 === STEP_COUNT - 1) buildTimezones();
    showStep(index + 1, "fwd");
  };

  const stepClass = (index: number) => (index === step && stepAnim ? "ob-step in-" + stepAnim : "ob-step");
  const stepHidden = (index: number) => finished || index !== step;
  const countryLabel = countries.find((c) => c.value === country)?.label ?? "";
  const tzLabel = zones.find((z) => z.value === tz)?.label ?? "";
  const doneName = username.trim();

  return (
    <div className={stage === "onboard" ? "auth-card is-onboarding" : "auth-card"}>
      <h2>Create Account</h2>
      <p className="auth-sub">Join the global trading arena</p>

      <div id="su-step-1" hidden={stage !== "form"}>
        <form id="sf" className="auth-form" noValidate onInput={onSfInput} onSubmit={onSfSubmit}>
          <div className="f">
            <label htmlFor="sf-name">Full Name</label>
            <input id="sf-name" name="name" autoComplete="name" placeholder="Enter your full name" required />
          </div>
          <div className="f">
            <label htmlFor="sf-email">Email Address</label>
            <input
              id="sf-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="john@example.com"
              required
              ref={sfEmailRef}
              aria-invalid={sfEmailInvalid ? "true" : undefined}
              onBlur={onSfEmailBlur}
            />
          </div>
          <div className="f">
            <label htmlFor="sf-ref">
              Referral Code <span className="opt">(optional)</span>
            </label>
            <input id="sf-ref" name="ref" autoComplete="off" placeholder="Got a code?" />
          </div>
          <button className="btn b-ember btn-block" type="submit" disabled={!sfCanSubmit}>
            Continue with Email
          </button>
          <div className="msg" id="sf-msg" role="status" hidden={sfMessage === null}>
            {sfMessage}
          </div>
        </form>

        <div className="auth-or">Or continue with</div>
        <SocialButtons onPick={setSfMessage} />
      </div>

      <div id="su-step-2" hidden={stage !== "otp"}>
        <form id="otp-form" className="auth-form" noValidate onSubmit={onOtpSubmit}>
          <div className="otp-sent">
            <span className="otp-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="14" rx="2.5" />
                <path d="m4 7 8 6 8-6" />
              </svg>
            </span>
            <p>We sent a 6-digit code to</p>
            <b id="otp-email">{account.email}</b>
          </div>
          <div className="otp-field">
            <p className="otp-label" id="otp-label">
              Verification Code
            </p>
            <div className={otpVerified ? "otp-boxes ok" : "otp-boxes"} role="group" aria-labelledby="otp-label">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  className={digit !== "" ? "otp-box filled" : "otp-box"}
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  aria-label={"Digit " + (index + 1) + " of " + OTP_LENGTH}
                  disabled={otpVerified}
                  ref={(el) => {
                    otpRefs.current[index] = el;
                  }}
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={onOtpInput(index)}
                  onKeyDown={onOtpKeyDown(index)}
                  onPaste={onOtpPaste(index)}
                />
              ))}
            </div>
          </div>
          <button className="btn b-ember btn-block" type="submit" disabled={!otpComplete || otpVerified}>
            Verify &amp; Create Account
          </button>
          <div className={otpMessage ? otpMessage.className : "msg"} id="otp-msg" role="status" hidden={otpMessage === null}>
            {otpMessage?.text}
          </div>
        </form>
        <div className="otp-links">
          <button className="otp-link" id="otp-resend" type="button" disabled={resendSeconds > 0 || otpVerified} onClick={onResend}>
            {resendSeconds > 0 ? "Resend code in 0:" + (resendSeconds < 10 ? "0" : "") + resendSeconds : "Resend Code"}
          </button>
          <button className="otp-link" id="otp-change" type="button" onClick={onChangeEmail}>
            Use a different email
          </button>
        </div>
      </div>

      <div className="ob" id="su-onboard" hidden={stage !== "onboard"}>
        <div className="ob-progress" hidden={finished}>
          <div className="ob-dots" aria-hidden="true">
            {Array.from({ length: STEP_COUNT }, (_, i) => (
              <i key={i} className={stage !== "onboard" ? undefined : i === step ? "on" : i < step ? "done" : undefined}></i>
            ))}
          </div>
          <p className="ob-count" id="ob-count" aria-live="polite">
            Step {step + 1} of {STEP_COUNT}
          </p>
        </div>

        <section className={stepClass(0)} aria-labelledby="ob-t1" hidden={stepHidden(0)}>
          <h2 className="ob-title" id="ob-t1">
            Choose your username
          </h2>
          <p className="ob-sub">This will be your public identity on the rankings.</p>
          <form className="auth-form" noValidate onSubmit={onStepSubmit(0)} ref={(el) => { stepFormRefs.current[0] = el; }}>
            <div className="f">
              <label className="ob-label" htmlFor="ob-user">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
                Username
              </label>
              <div className="ob-input">
                <span className="ob-at" aria-hidden="true">
                  @
                </span>
                <input
                  id="ob-user"
                  name="username"
                  autoComplete="username"
                  maxLength={20}
                  spellCheck={false}
                  autoCapitalize="off"
                  aria-describedby="ob-user-hint"
                  aria-invalid={userHint.state === "err" ? "true" : undefined}
                  required
                  value={username}
                  onChange={(e) => setUsername(e.currentTarget.value)}
                />
              </div>
              <p className={hintClass(userHint)} id="ob-user-hint" aria-live="polite">
                {userHint.text}
              </p>
            </div>
            <fieldset className="ob-confirm">
              <legend>Please confirm to continue</legend>
              <label className="ob-check">
                <input type="checkbox" name="age" checked={confirms.age} onChange={(e) => setConfirms({ ...confirms, age: e.currentTarget.checked })} />
                <span className="ob-box" aria-hidden="true"></span>
                <span>I confirm that I am 18 years old or above.</span>
              </label>
              <label className="ob-check">
                <input type="checkbox" name="terms" checked={confirms.terms} onChange={(e) => setConfirms({ ...confirms, terms: e.currentTarget.checked })} />
                <span className="ob-box" aria-hidden="true"></span>
                <span>
                  I agree to the{" "}
                  <Link href="/rules/" target="_blank" rel="noopener">
                    Terms &amp; Conditions
                  </Link>
                  .
                </span>
              </label>
              <label className="ob-check">
                <input
                  type="checkbox"
                  name="privacy"
                  checked={confirms.privacy}
                  onChange={(e) => setConfirms({ ...confirms, privacy: e.currentTarget.checked })}
                />
                <span className="ob-box" aria-hidden="true"></span>
                <span>
                  I agree to the{" "}
                  <Link href="/rules/" target="_blank" rel="noopener">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            </fieldset>
            <div className="ob-actions">
              <button className="btn b-ember btn-block ob-next" type="submit" disabled={!stepValid[0]}>
                Continue
                <NextArrow />
              </button>
            </div>
          </form>
        </section>

        <section className={stepClass(1)} aria-labelledby="ob-t2" hidden={stepHidden(1)}>
          <h2 className="ob-title" id="ob-t2">
            When were you born?
          </h2>
          <p className="ob-sub">You must be at least 18 to participate.</p>
          <form className="auth-form" noValidate onSubmit={onStepSubmit(1)} ref={(el) => { stepFormRefs.current[1] = el; }}>
            <div className="f">
              <label className="ob-label" htmlFor="ob-dob">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M3 10h18M8 3v4M16 3v4" />
                </svg>
                Date of Birth
              </label>
              <input
                id="ob-dob"
                name="dob"
                type="date"
                autoComplete="bday"
                aria-describedby="ob-dob-hint"
                aria-invalid={dobResult.hint.state === "err" ? "true" : undefined}
                required
                min={dobRange.min}
                max={dobRange.max}
                value={dob}
                onChange={(e) => setDob(e.currentTarget.value)}
              />
              <p className={hintClass(dobResult.hint)} id="ob-dob-hint" aria-live="polite">
                {dobResult.hint.text}
              </p>
            </div>
            <div className="ob-actions">
              <BackButton onClick={() => showStep(0, "back")} />
              <button className="btn b-ember btn-block ob-next" type="submit" disabled={!stepValid[1]}>
                Continue
                <NextArrow />
              </button>
            </div>
          </form>
        </section>

        <section className={stepClass(2)} aria-labelledby="ob-t3" hidden={stepHidden(2)}>
          <h2 className="ob-title" id="ob-t3">
            Where are you from?
          </h2>
          <p className="ob-sub">We use this to verify regional eligibility.</p>
          <form className="auth-form" noValidate onSubmit={onStepSubmit(2)} ref={(el) => { stepFormRefs.current[2] = el; }}>
            <div className="f">
              <label className="ob-label" htmlFor="ob-country">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
                </svg>
                Country
              </label>
              <select id="ob-country" name="country" autoComplete="country" required value={country} onChange={(e) => setCountry(e.currentTarget.value)}>
                <option value="">Select country</option>
                {countries.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="ob-actions">
              <BackButton onClick={() => showStep(1, "back")} />
              <button className="btn b-ember btn-block ob-next" type="submit" disabled={!stepValid[2]}>
                Continue
                <NextArrow />
              </button>
            </div>
          </form>
        </section>

        <section className={stepClass(3)} aria-labelledby="ob-t4" hidden={stepHidden(3)}>
          <h2 className="ob-title" id="ob-t4">
            Set your timezone
          </h2>
          <p className="ob-sub">We use this to show you tournament times accurately.</p>
          <form className="auth-form" noValidate onSubmit={onStepSubmit(3)} ref={(el) => { stepFormRefs.current[3] = el; }}>
            <div className="f">
              <label className="ob-label" htmlFor="ob-tz">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                Local Timezone
              </label>
              <select id="ob-tz" name="timezone" required value={tz} onChange={(e) => selectTimezone(e.currentTarget.value)}>
                {zones.map((z) => (
                  <option key={z.value} value={z.value}>
                    {z.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="ob-time">
              Your local time<b id="ob-tz-now">{tzNow}</b>
            </p>
            <div className="ob-actions">
              <BackButton onClick={() => showStep(2, "back")} />
              <button className="btn b-ember btn-block ob-next" type="submit" disabled={!stepValid[3]}>
                Complete Setup
              </button>
            </div>
          </form>
        </section>

        <div className="ob-done" id="ob-done" hidden={!finished}>
          <span className="ob-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          </span>
          <h2 className="ob-title" id="ob-done-title" tabIndex={-1} ref={doneTitleRef}>
            You&apos;re in the arena
          </h2>
          <p className="ob-sub">Your profile is ready. This is how you&apos;ll appear on the board.</p>
          <div className="ob-card">
            <span className="ob-card-av" id="ob-done-initial" aria-hidden="true">
              {finished ? doneName.charAt(0).toUpperCase() : ""}
            </span>
            <span className="ob-card-who">
              <b id="ob-done-name">{finished ? "@" + doneName : ""}</b>
              <small>Bronze · Lv 1 · 0 pts</small>
            </span>
          </div>
          <dl className="ob-sum">
            <div>
              <dt>Country</dt>
              <dd id="ob-done-country">{finished ? countryLabel : ""}</dd>
            </div>
            <div>
              <dt>Timezone</dt>
              <dd id="ob-done-tz">{finished ? tzLabel : ""}</dd>
            </div>
          </dl>
          <a className="btn b-ember btn-block" href="/app/dashboard/">
            Go to my dashboard
          </a>
          <Link className="ob-alt" href="/schedule/">
            See today&apos;s battles
          </Link>
        </div>
      </div>

      <p className="auth-switch">
        Already have an account?<Link href="/login/">Log in</Link>
      </p>
      <nav className="auth-legal" aria-label="Legal">
        <Link href="/rules/">Terms &amp; Conditions</Link>
        <Link href="/rules/">Privacy Policy</Link>
      </nav>
    </div>
  );
}
