"use client";

import { useState, type FormEvent } from "react";
import { PARTNER_TOPICS, saveLead } from "@site/lib/store";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MESSAGE_MAX = 1000;

const TOPICS = [
  { value: "support", inbox: "support@battletrader.com", label: "Account or platform support" },
  { value: "results", inbox: "results@battletrader.com", label: "A result I want reviewed" },
  { value: "partners", inbox: "partners@battletrader.com", label: "Sponsorship or partnership" },
  { value: "whitelabel", inbox: "partners@battletrader.com", label: "Broker white-label event" },
  { value: "ib", inbox: "partners@battletrader.com", label: "IB or affiliate programme" },
  { value: "press", inbox: "press@battletrader.com", label: "Press and media" },
  { value: "other", inbox: "support@battletrader.com", label: "Something else" },
];

function topicFor(value: string) {
  return TOPICS.find((t) => t.value === value) ?? TOPICS[0];
}

interface FormMessage {
  ok: boolean;
  text: string;
}

export default function ContactPanel() {
  const [topic, setTopic] = useState("support");
  const [message, setMessage] = useState("");
  const [formMsg, setFormMsg] = useState<FormMessage | null>(null);
  const [sent, setSent] = useState(false);

  const inbox = topicFor(topic).inbox;
  // A channel lights up when the selected topic routes to its inbox (e.g. "IB" presses Partners).
  const isPressed = (channelTopic: string) => topicFor(channelTopic).inbox === inbox;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("cn") ?? "").trim();
    const email = String(data.get("ce") ?? "").trim();
    const body = message.trim();

    if (!name || !email || !body || !EMAIL_PATTERN.test(email)) {
      setFormMsg({ ok: false, text: "Fill in your name, a valid email and your message." });
      return;
    }

    const selected = topicFor(topic);
    saveLead({
      type: PARTNER_TOPICS.includes(selected.value) ? "partnership" : "contact",
      name,
      email,
      phone: "",
      country: "",
      topic: selected.label,
      message: body,
    });
    setFormMsg({ ok: true, text: "Message sent. You will hear back on the timeline shown below." });
    setSent(true);
  }

  return (
    <div className="block cx">
      <aside className="cx-side">
        <h3 className="sub">Pick your <span className="gt">channel</span></h3>
        <p className="lead">Four inboxes, each watched by the people who can actually answer. Pick one and your message is routed straight there.</p>
        <span className="cx-live"><i aria-hidden="true"></i>Support online</span>
        <div className="cx-chans" role="group" aria-label="Choose an inbox">
          <button className="cx-chan" type="button" data-topic="support" aria-pressed={isPressed("support")} onClick={() => setTopic("support")}>
            <span className="cx-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /></svg></span>
            <b>Support</b>
            <small>support@battletrader.com</small>
            <span className="cx-sla">Accounts, entries, platform problems. Within 12 hours &mdash; under 1 hour during a live event.</span>
          </button>
          <button className="cx-chan" type="button" data-topic="results" aria-pressed={isPressed("results")} onClick={() => setTopic("results")}>
            <span className="cx-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 21V4M5 4h12l-2.5 4L17 12H5" /></svg></span>
            <b>Results review</b>
            <small>results@battletrader.com</small>
            <span className="cx-sla">Objections to a published result, within 24 hours of posting. Include your handle and the event.</span>
          </button>
          <button className="cx-chan" type="button" data-topic="partners" aria-pressed={isPressed("partners")} onClick={() => setTopic("partners")}>
            <span className="cx-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg></span>
            <b>Partners</b>
            <small>partners@battletrader.com</small>
            <span className="cx-sla">Sponsorship, white-label events, broker and IB enquiries. Within two working days.</span>
          </button>
          <button className="cx-chan" type="button" data-topic="press" aria-pressed={isPressed("press")} onClick={() => setTopic("press")}>
            <span className="cx-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg></span>
            <b>Press</b>
            <small>press@battletrader.com</small>
            <span className="cx-sla">Media requests, footage and interviews with ranked traders.</span>
          </button>
        </div>
      </aside>

      <div className="cx-form">
        <div className="cx-head">
          <h3>New message</h3>
          <p className="cx-route" aria-live="polite">Routed to <b id="cx-route">{inbox}</b></p>
        </div>
        <form id="cf" className="g2" noValidate onSubmit={handleSubmit}>
          <div className="f"><label htmlFor="cn">Name</label><input id="cn" name="cn" autoComplete="name" placeholder="Your full name" required /></div>
          <div className="f"><label htmlFor="ce">Email</label><input id="ce" name="ce" type="email" autoComplete="email" placeholder="you@example.com" required /></div>
          <div className="f"><label htmlFor="ch">Trader handle <span className="cx-opt">optional</span></label><input id="ch" name="ch" placeholder="If you have an account" /></div>
          <div className="f"><label htmlFor="ct">Topic</label>
            <select id="ct" name="ct" value={topic} onChange={(e) => setTopic(e.target.value)}>
              {TOPICS.map((t) => (
                <option key={t.value} value={t.value} data-inbox={t.inbox}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="f full">
            <label htmlFor="cm">Message</label>
            <textarea
              id="cm"
              name="cm"
              rows={6}
              maxLength={MESSAGE_MAX}
              placeholder="What happened, which event, and what you need from us."
              aria-describedby="cm-count"
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
            <span className="cx-count" id="cm-count">{message.length} / {MESSAGE_MAX}</span>
          </div>
          <div className="full cx-submit">
            <button className="btn b-ember btn-block" type="submit" disabled={sent}>Send message<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" /></svg></button>
            <p className="cx-privacy">We only use these details to reply to you.</p>
          </div>
          <div className={formMsg ? (formMsg.ok ? "msg is-ok" : "msg is-err") : "msg"} id="cmsg" role="status" hidden={!formMsg}>
            {formMsg?.text}
          </div>
        </form>
      </div>
    </div>
  );
}
