"use client";

// Top-bar notifications: bell button + dropdown panel. Sample notifications for now, read state kept in
// localStorage until the backend provides a real feed. Closes on outside click and Escape.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "@panel/components/Icon";
import type { IconName } from "@panel/lib/icons";
import { readJSON, writeJSON } from "@panel/lib/storage";

type Filter = "all" | "unread";

interface Note {
  id: string;
  icon: IconName;
  tone: "violet" | "green" | "blue" | "gold";
  title: string;
  text: string;
  ago: string;
  href: string;
}

const READ_KEY = "bt-notif-read";

const NOTES: Note[] = [
  { id: "wc-reg", icon: "trophy", tone: "violet", title: "Registration open", text: "BattleTrader World Championship 2026 is now taking entries.", ago: "2h ago", href: "/app/browse-tournaments/" },
  { id: "free-ticket", icon: "ticket", tone: "blue", title: "Free ticket added", text: "A Mini tournament ticket is waiting in your wallet.", ago: "5h ago", href: "/app/wallet/" },
  { id: "badge", icon: "medal", tone: "gold", title: "New achievement in reach", text: "Win one more battle to unlock First Blood.", ago: "Yesterday", href: "/app/achievements/" },
  { id: "welcome", icon: "checkCircle", tone: "green", title: "Welcome to BattleTrader", text: "Your practice arena is ready with $100,000 in virtual funds.", ago: "2d ago", href: "/app/arena/" },
];

const INITIAL_READ = ["badge", "welcome"];

export default function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [read, setRead] = useState<string[]>(INITIAL_READ);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setRead(readJSON<string[]>(READ_KEY, INITIAL_READ));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      btnRef.current?.focus();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const saveRead = (next: string[]) => {
    setRead(next);
    writeJSON(READ_KEY, next);
  };

  const unread = NOTES.filter((n) => !read.includes(n.id));
  const shown = filter === "unread" ? unread : NOTES;
  const bellLabel = unread.length ? "Notifications, " + unread.length + " unread" : "Notifications";

  return (
    <div className="ap-notif" ref={rootRef}>
      <button
        className="ap-icon-btn"
        id="ap-bell"
        type="button"
        aria-label={bellLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="ap-notif-panel"
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="bell" />
        {unread.length ? <i className="ap-dot"></i> : null}
      </button>

      {open ? (
        <div className="ap-notif-panel" id="ap-notif-panel" role="dialog" aria-label="Notifications">
          <div className="ap-notif-h">
            <b>Notifications</b>
            {unread.length ? <span className="ap-notif-count">{unread.length} new</span> : null}
            <button className="ap-notif-mark" type="button" disabled={!unread.length} onClick={() => saveRead(NOTES.map((n) => n.id))}>
              <Icon name="check" />Mark all read
            </button>
          </div>

          <div className="ap-notif-tabs" role="tablist" aria-label="Filter notifications">
            {(["all", "unread"] as Filter[]).map((f) => (
              <button key={f} type="button" role="tab" aria-selected={filter === f} className={filter === f ? "is-on" : undefined} onClick={() => setFilter(f)}>
                {f === "all" ? "All" : "Unread"}
              </button>
            ))}
          </div>

          {shown.length ? (
            <ul className="ap-notif-list">
              {shown.map((n) => {
                const isNew = !read.includes(n.id);
                return (
                  <li key={n.id}>
                    <Link
                      className={"ap-notif-item t-" + n.tone + (isNew ? " is-new" : "")}
                      href={n.href}
                      onClick={() => {
                        if (isNew) saveRead([...read, n.id]);
                        setOpen(false);
                      }}
                    >
                      <span className="ap-notif-ico" aria-hidden="true"><Icon name={n.icon} /></span>
                      <span className="ap-notif-txt">
                        <b>{n.title}</b>
                        <span>{n.text}</span>
                        <small>{n.ago}</small>
                      </span>
                      {isNew ? <i className="ap-notif-new" aria-label="Unread"></i> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="ap-notif-empty"><span aria-hidden="true"><Icon name="checkCircle" /></span>You&apos;re all caught up</p>
          )}

          <p className="ap-notif-foot">Sample notifications &middot; live alerts arrive with accounts</p>
        </div>
      ) : null}
    </div>
  );
}
