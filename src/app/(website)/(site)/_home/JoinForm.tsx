"use client";

import { useState } from "react";
import { saveLead } from "@site/lib/store";

interface Message {
  ok: boolean;
  text: string;
}

const INVALID_TEXT = "Fill in your handle, email, mobile and country, and tick the rules box.";
const SUCCESS_TEXT = "Account requested. Check your email to confirm — your first Daily Battle opens the next trading day.";

// Home "Join the fight" form — port of the old main.js bindForm("jf", "m", …).
export default function JoinForm() {
  const [message, setMessage] = useState<Message | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const field = (name: string) => String(data.get(name) ?? "").trim();
    const isValid = ["h", "e", "p", "c"].every((name) => field(name) !== "") && data.get("a") !== null;
    if (!isValid) {
      setMessage({ ok: false, text: INVALID_TEXT });
      return;
    }
    saveLead({
      type: "join",
      name: field("h"),
      email: field("e"),
      phone: field("p"),
      country: field("c"),
      topic: "Join request",
      message: "",
    });
    setMessage({ ok: true, text: SUCCESS_TEXT });
    setSent(true);
  };

  return (
    <form id="jf" className="g2" noValidate onSubmit={onSubmit}>
      <div className="f">
        <label htmlFor="h">Trader handle</label>
        <input id="h" name="h" placeholder="Shown on the leaderboard" required />
      </div>
      <div className="f">
        <label htmlFor="e">Email</label>
        <input id="e" name="e" type="email" autoComplete="email" required />
      </div>
      <div className="f">
        <label htmlFor="p">Mobile (with country code)</label>
        <input id="p" name="p" type="tel" autoComplete="tel" required />
      </div>
      <div className="f">
        <label htmlFor="c">Country</label>
        <input id="c" name="c" autoComplete="country-name" required />
      </div>
      <div className="f full">
        <label htmlFor="x">Trading experience</label>
        <select id="x" name="x">
          <option>New to trading</option>
          <option>Under 1 year</option>
          <option>1 – 3 years</option>
          <option>Over 3 years</option>
        </select>
      </div>
      <label className="chk">
        <input type="checkbox" id="a" name="a" required /> I am 18 or over and accept the tournament rules.
      </label>
      <div className="full">
        <button className="btn b-ember btn-block" type="submit" disabled={sent}>
          Create my account
        </button>
      </div>
      <div className={message ? (message.ok ? "msg is-ok" : "msg is-err") : "msg"} id="m" hidden={!message}>
        {message?.text}
      </div>
    </form>
  );
}
