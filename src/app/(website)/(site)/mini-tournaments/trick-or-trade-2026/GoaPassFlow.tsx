"use client";

/* Goa Live Final checkout on the public event page.
   Signed out -> "Log in to register" (login returns here via ?next=).
   Signed in  -> 1 Details -> 2 Payment -> 3 Confirmed.
   Rules: one registration per email, at most GOA_SEATS seats (both enforced in @panel/lib/pass).
   Payment is a placeholder until the real gateway is wired in (see payDummy). */
import Link from "next/link";
import { useEffect, useState } from "react";
import { BTTournaments } from "@panel/lib/data/tournaments";
import { GOA_ENTRY_FEE, GOA_EVENT_ID, GOA_SEATS, GOA_SEATS_DEMO_TAKEN, usd } from "@panel/lib/data/goa";
import { canRegister, findRegistration, goaSeatsTaken, reserveSeat, type GoaRegistration } from "@panel/lib/pass";

const PROFILE_KEY = "bt-profile";
const EVENT_PATH = "/mini-tournaments/trick-or-trade-2026/";

type Method = "card" | "upi" | "crypto";
type Step = "loading" | "guest" | "intro" | "details" | "payment" | "paying" | "done";

const METHODS: { id: Method; label: string; note: string }[] = [
  { id: "card", label: "Card", note: "Visa, Mastercard, RuPay" },
  { id: "upi", label: "UPI", note: "GPay, PhonePe, Paytm" },
  { id: "crypto", label: "Crypto", note: "USDT on TRC20" },
];

const STEPS = ["Details", "Payment", "Confirmed"];

const ERRORS = {
  "email-used": "This email is already registered for the Goa Live Final. Each email can register once.",
  "sold-out": `All ${GOA_SEATS} seats are taken. Registration is closed.`,
};

interface Profile {
  username?: string;
  fullName?: string;
  email?: string;
}

function readProfile(): Profile | null {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null") as Profile | null;
  } catch {
    return null;
  }
}

function MethodIcon({ method }: { method: Method }) {
  if (method === "card") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3 10h18M7 15h4" /></svg>;
  if (method === "upi") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M10.5 18h3M9 8.5l3 3 3-3" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8 8h8M12 8v9M9 12h6" /></svg>;
}

function Seats({ taken }: { taken: number }) {
  const left = GOA_SEATS - taken;
  return (
    <div className="gp-seats">
      <div><span>Seats filled</span><b>{taken} / {GOA_SEATS}</b></div>
      <span className="gp-fill" aria-hidden="true"><i style={{ width: (taken / GOA_SEATS) * 100 + "%" }} /></span>
      <small>{left > 0 ? `Only ${left} seats left` : "Sold out"}</small>
    </div>
  );
}

/** Progress across the three checkout steps; `current` is 0-based. */
function Stepper({ current }: { current: number }) {
  return (
    <ol className="gp-stepper" aria-label="Checkout progress">
      {STEPS.map((label, i) => (
        <li key={label} className={i < current ? "is-done" : i === current ? "is-on" : undefined} aria-current={i === current ? "step" : undefined}>
          <span className="gp-stepper-dot" aria-hidden="true">{i < current ? "\u2713" : i + 1}</span>
          <span>{label}</span>
        </li>
      ))}
    </ol>
  );
}

export default function GoaPassFlow() {
  const [step, setStep] = useState<Step>("loading");
  const [taken, setTaken] = useState(GOA_SEATS_DEMO_TAKEN);
  const [registration, setRegistration] = useState<GoaRegistration | null>(null);
  const [holder, setHolder] = useState("");
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<Method>("card");
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/28");
  const [cvc, setCvc] = useState("123");
  const [upi, setUpi] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTaken(goaSeatsTaken());
    const profile = readProfile();
    if (!profile) {
      setStep("guest");
      return;
    }
    const existing = profile.email ? findRegistration(GOA_EVENT_ID, profile.email) : null;
    if (existing) {
      setRegistration(existing);
      setStep("done");
      return;
    }
    setHolder(profile.fullName || profile.username || "");
    setEmail(profile.email || "");
    setStep("intro");
  }, []);

  const submitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (holder.trim().length < 2) return setError("Enter your full name as it should appear on the registration.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Enter a valid email address.");
    const check = canRegister(GOA_EVENT_ID, email);
    if (!check.ok) return setError(ERRORS[check.reason]);
    setError("");
    setStep("payment");
  };

  const methodError = (): string => {
    if (method === "card") {
      if (card.replace(/\s/g, "").length < 12) return "Enter a card number (test mode accepts any).";
      if (!/^\d{2}\/\d{2}$/.test(expiry.trim())) return "Enter the card expiry as MM/YY.";
      if (!/^\d{3,4}$/.test(cvc.trim())) return "Enter the 3 or 4 digit CVC.";
    }
    if (method === "upi" && !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upi.trim())) return "Enter a UPI ID like name@okaxis.";
    return "";
  };

  // Placeholder gateway: always succeeds after a short delay. Replace with the real gateway call when it is provided.
  const payDummy = (e: React.FormEvent) => {
    e.preventDefault();
    const problem = methodError();
    if (problem) return setError(problem);
    if (!agree) return setError("Please accept the event terms to continue.");
    setError("");
    setStep("paying");
    window.setTimeout(() => {
      const ref = "TEST-" + method.toUpperCase() + "-" + Date.now().toString(36).toUpperCase();
      // Seats or the email may have been taken while the payment ran, so the store re-checks both here.
      const result = reserveSeat(GOA_EVENT_ID, holder, email, GOA_ENTRY_FEE, method, ref);
      if (!result.ok) {
        setError(ERRORS[result.reason] + " You have not been charged.");
        setTaken(goaSeatsTaken());
        setStep("payment");
        return;
      }
      BTTournaments.enroll(GOA_EVENT_ID, { paidWith: "card", amount: GOA_ENTRY_FEE });
      setRegistration(result.registration);
      setTaken(goaSeatsTaken());
      setStep("done");
    }, 1600);
  };

  if (step === "loading") return <aside className="gp-card" aria-busy="true"><p className="gp-muted">Loading&hellip;</p></aside>;

  const soldOut = taken >= GOA_SEATS;

  if (step === "guest" || step === "intro") {
    return (
      <aside className="gp-card">
        <div className="gp-card-head">
          <small className="gp-label">Entry</small>
          <span className="gp-badge">Hotel included</span>
        </div>
        <p className="gp-price">{usd(GOA_ENTRY_FEE)}<small> / trader</small></p>
        <Seats taken={taken} />
        <ul className="gp-incl">
          <li>Seat at the 24-hour live final</li>
          <li>Hotel stay in Goa, paid by BattleTrader</li>
          <li>One registration per email</li>
        </ul>
        <div className="gp-pay-with" aria-label="Accepted payment methods">
          {METHODS.map((m) => <span key={m.id}><MethodIcon method={m.id} />{m.label}</span>)}
        </div>
        {soldOut ? (
          <button className="gp-btn" type="button" disabled>Sold out</button>
        ) : step === "guest" ? (
          <>
            <Link className="gp-btn" href={"/login/?next=" + encodeURIComponent(EVENT_PATH)}>Log in to register</Link>
            <p className="gp-muted gp-center">New here? <Link href="/signup/">Create an account</Link>, then come back to this page.</p>
          </>
        ) : (
          <>
            <button className="gp-btn" type="button" onClick={() => setStep("details")}>Register now</button>
            <p className="gp-muted gp-center">Registration closes 22 Nov 2026, 18:00 IST.</p>
          </>
        )}
      </aside>
    );
  }

  if (step === "done" && registration) {
    return (
      <aside className="gp-card gp-done" aria-labelledby="gp-done-h">
        <Stepper current={3} />
        <div className="gp-done-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </div>
        <h2 id="gp-done-h">You&rsquo;re registered</h2>
        <p className="gp-muted gp-center">Your seat at the Goa Live Final is confirmed.</p>
        <dl className="gp-receipt">
          <div><dt>Name</dt><dd>{registration.holder}</dd></div>
          <div><dt>Email</dt><dd>{registration.email}</dd></div>
          <div><dt>Seat</dt><dd>#{registration.seat} of {GOA_SEATS}</dd></div>
          <div><dt>Registration ID</dt><dd className="gp-mono">{registration.serial}</dd></div>
          <div><dt>Paid</dt><dd>{usd(registration.amount)} &middot; {METHODS.find((m) => m.id === registration.method)?.label ?? registration.method}</dd></div>
          <div><dt>Payment ref</dt><dd className="gp-mono">{registration.paymentRef}</dd></div>
        </dl>
        <ul className="gp-next">
          <li>Your pass will be sent to <b>{registration.email}</b> before the event.</li>
          <li>The pass is checked at the door against this registration and works once.</li>
        </ul>
      </aside>
    );
  }

  const paying = step === "paying";
  const onPayment = step === "payment" || paying;

  return (
    <form className="gp-card gp-checkout" onSubmit={onPayment ? payDummy : submitDetails} noValidate aria-labelledby="gp-pay-h">
      <div className="gp-card-head">
        <h2 id="gp-pay-h">Checkout</h2>
        <span className="gp-badge gp-badge-test">Test mode</span>
      </div>
      <Stepper current={onPayment ? 1 : 0} />

      {!onPayment ? (
        <fieldset className="gp-fs">
          <legend>Your details</legend>
          <label>Full name<input value={holder} onChange={(e) => setHolder(e.target.value)} autoComplete="name" maxLength={40} required /></label>
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
          <p className="gp-muted">Each email can register once. Your pass is sent to this address.</p>
        </fieldset>
      ) : (
        <>
          <div className="gp-who">
            <span><b>{holder.trim()}</b><small>{email.trim()}</small></span>
            <button className="gp-link" type="button" onClick={() => { setError(""); setStep("details"); }} disabled={paying}>Edit</button>
          </div>

          <fieldset className="gp-fs">
            <legend>Pay with</legend>
            <div className="gp-methods" role="radiogroup" aria-label="Payment method">
              {METHODS.map((m) => (
                <label key={m.id} className={"gp-method" + (method === m.id ? " is-on" : "")}>
                  <input type="radio" name="gp-method" value={m.id} checked={method === m.id} onChange={() => { setMethod(m.id); setError(""); }} disabled={paying} />
                  <MethodIcon method={m.id} />
                  <b>{m.label}</b>
                  <small>{m.note}</small>
                </label>
              ))}
            </div>

            {method === "card" ? (
              <div className="gp-method-body">
                <label>Card number<input value={card} onChange={(e) => setCard(e.target.value)} inputMode="numeric" autoComplete="off" maxLength={23} disabled={paying} /></label>
                <div className="gp-two">
                  <label>Expiry<input value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM/YY" inputMode="numeric" autoComplete="off" maxLength={5} disabled={paying} /></label>
                  <label>CVC<input value={cvc} onChange={(e) => setCvc(e.target.value)} inputMode="numeric" autoComplete="off" maxLength={4} disabled={paying} /></label>
                </div>
              </div>
            ) : null}

            {method === "upi" ? (
              <div className="gp-method-body">
                <label>UPI ID<input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="name@okaxis" autoComplete="off" disabled={paying} /></label>
                <p className="gp-muted">You will get a collect request in your UPI app to approve the payment.</p>
              </div>
            ) : null}

            {method === "crypto" ? (
              <div className="gp-method-body">
                <p className="gp-muted">Send exactly <b>{GOA_ENTRY_FEE} USDT</b> on the TRC20 network. The deposit address is shown here once the live gateway is connected.</p>
              </div>
            ) : null}
          </fieldset>

          <div className="gp-summary">
            <div><span>Entry &times; 1</span><span>{usd(GOA_ENTRY_FEE)}</span></div>
            <div><span>Hotel stay in Goa</span><span className="gp-free">Included</span></div>
            <div className="gp-summary-total"><span>Total</span><b>{usd(GOA_ENTRY_FEE)}</b></div>
          </div>

          <label className="gp-agree"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} disabled={paying} />I agree the registration is personal and non-transferable.</label>
        </>
      )}

      {error ? <p className="gp-error" role="alert">{error}</p> : null}

      {onPayment ? (
        <button className="gp-btn" type="submit" disabled={paying}>
          {paying ? <><span className="gp-spin" aria-hidden="true" />Processing payment&hellip;</> : "Pay " + usd(GOA_ENTRY_FEE)}
        </button>
      ) : (
        <button className="gp-btn" type="submit">Continue to payment</button>
      )}
      {onPayment ? <p className="gp-muted gp-center">Test mode: no real money is charged. The live gateway is added later.</p> : null}
      <button className="gp-link" type="button" onClick={() => { setError(""); setStep("intro"); }} disabled={paying}>Cancel</button>
    </form>
  );
}
