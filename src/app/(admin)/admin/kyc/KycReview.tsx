"use client";

// KYC review — port of admin/assets/js/kyc.js (queue table + review panel, ?u=<username> opens one).
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "@admin/components/Icon";
import { FieldError, IconBtn, StatusBadge, TableCard, Toolbar, useAdminUi } from "@admin/components/AdminUi";
import { BTAdmin, type KycRow } from "@admin/lib/store";
import { ago, date, matches } from "@admin/lib/ui";

const STATUS_LABEL: Record<string, string> = { none: "Not started", draft: "Draft", pending: "Waiting for review", verified: "Verified", rejected: "Rejected" };

/** The panel keeps only the file NAME in this demo (sandbox); a backend would store the file itself. */
function Doc({ id, value }: { id: string; value?: string }) {
  let inner: React.ReactNode;
  if (!value) inner = <p className="ad-hint">Not uploaded.</p>;
  else if (/^data:image\//.test(value)) inner = <img src={value} alt="Uploaded document" loading="lazy" />;
  else if (/^data:application\/pdf/.test(value)) inner = <a className="ad-btn" href={value} download="document.pdf">Download PDF</a>;
  else inner = (
    <>
      <p className="ad-doc-name">{value}</p>
      <p className="ad-hint">Demo mode stores only the file name. The file itself appears here once a backend stores uploads.</p>
    </>
  );
  return <div className="ad-doc-view" id={id}>{inner}</div>;
}

export default function KycReview() {
  const params = useSearchParams();
  const { toast, confirmAction } = useAdminUi();
  const [list, setList] = useState<KycRow[]>([]);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState("");
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [msg, setMsg] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const focusAfterSelect = useRef<{ focus: boolean } | null>(null);

  useEffect(() => {
    const rows = BTAdmin.kycList();
    setList(rows);
    const deepLink = params.get("u") || "";
    if (deepLink) {
      setSelected(deepLink);
      setStatusFilter("");
    } else {
      // The first submission waiting for review.
      const first = rows.filter((x) => x.kyc.status === "pending")[0];
      setSelected(first ? first.username : "");
    }
    setReady(true);
  }, [params]);

  // The old onFilter debounced text input by 150 ms.
  useEffect(() => {
    const timer = window.setTimeout(() => setAppliedQuery(query), 150);
    return () => window.clearTimeout(timer);
  }, [query]);

  const rows = useMemo(() => list.filter((item) => {
    if (statusFilter && item.kyc.status !== statusFilter) return false;
    return matches(item, appliedQuery.trim(), ["username", "fullName"]);
  }), [list, statusFilter, appliedQuery]);

  const item = list.filter((x) => x.username === selected)[0];

  // Scroll to the review heading after a selection has rendered (old select()).
  useEffect(() => {
    const pending = focusAfterSelect.current;
    if (!pending || !headingRef.current) return;
    focusAfterSelect.current = null;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    headingRef.current.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    if (pending.focus) headingRef.current.focus({ preventScroll: true });
  }, [selected, list]);

  const select = (username: string, withFocus: boolean) => {
    focusAfterSelect.current = { focus: withFocus };
    setList(BTAdmin.kycList());
    setSelected(username);
    setNoteError("");
    setMsg("");
  };

  const decide = (decision: "verified" | "rejected") => {
    setMsg("");
    setNoteError("");
    const text = note.trim();
    if (decision === "rejected" && text.length < 5) {
      setNoteError("Tell the user what to fix (at least a few words).");
      noteRef.current?.focus();
      return;
    }
    const who = "@" + selected;
    const ask = decision === "verified"
      ? { title: "Approve " + who + "?", text: "Cash-outs unlock for this user right away.", confirm: "Approve" }
      : { title: "Reject " + who + "?", text: "The user sees your note and can submit again.", confirm: "Reject", tone: "bad" as const };
    confirmAction(ask).then((ok) => {
      if (!ok) return;
      const result = BTAdmin.reviewKyc(selected, decision, text);
      if (!result.ok) { setMsg(result.error); return; }
      setNote("");
      toast(decision === "verified" ? "KYC approved for " + who + "." : "KYC rejected — " + who + " has been asked to resubmit.", decision === "verified" ? "ok" : "warn");
      setList(BTAdmin.kycList());
    });
  };

  const k = item ? item.kyc : null;
  const status = k && STATUS_LABEL[k.status] ? k.status : "none";
  const pending = status === "pending";
  const doneText = !k ? ""
    : status === "verified" ? "Already approved" + (k.reviewedAt ? " on " + date(k.reviewedAt, true) : "") + ". Cash-outs are unlocked."
    : status === "rejected" ? "Rejected — waiting for the user to fix and resubmit."
    : "Nothing to review yet. The user hasn't submitted the form.";

  const pairs: [string, string | undefined][] = item && k ? [
    ["Account", "@" + item.username + (item.live ? " (signed in here)" : item.demo ? " (demo)" : "")],
    ["Legal name", k.fullName],
    ["Date of birth", k.dob ? date(k.dob) : ""],
    ["Country", k.country],
    ["ID type", k.idType],
    ["ID number", k.idNumber],
    ["Address", k.address],
    ["Submitted", k.submittedAt ? date(k.submittedAt, true) : ""],
    ["Reviewed", k.reviewedAt ? date(k.reviewedAt, true) : ""],
    ["Review note", k.reviewNote],
  ] : [];

  return (
    <>
      <Toolbar
        id="kq"
        searchLabel="Search submissions"
        placeholder="Search user or name…"
        query={query}
        onQuery={setQuery}
        selects={[{
          id: "kq-status",
          label: "Status",
          options: [["pending", "Waiting for review"], ["", "All"], ["verified", "Verified"], ["rejected", "Rejected"], ["draft", "Draft"]],
          value: statusFilter,
          onChange: setStatusFilter,
        }]}
      />
      <TableCard<KycRow>
        id="kq-table"
        caption="KYC submissions"
        columns={[{ label: "User" }, { label: "Legal name" }, { label: "ID type" }, { label: "Country" }, { label: "Submitted" }, { label: "Status" }, { label: "" }]}
        empty="Nothing here. New submissions from the user panel show up in this list."
        items={rows}
        total={list.length}
        rowKey={(row) => row.username}
        rowProps={(row) => ({
          className: "is-click" + (row.username === selected ? " is-selected" : ""),
          onClick: (e) => {
            if ((e.target as HTMLElement).closest("button, a")) return;
            select(row.username, true);
          },
        })}
        renderRow={(row) => [
          <Link key="u" className="ad-cell-link" href={"/admin/user/?u=" + encodeURIComponent(row.username)}>{"@" + row.username}</Link>,
          row.fullName || "—",
          row.kyc.idType || "—",
          row.kyc.country || "—",
          row.kyc.submittedAt ? ago(row.kyc.submittedAt) : "—",
          <StatusBadge key="s" status={row.kyc.status} label={STATUS_LABEL[row.kyc.status]} />,
          {
            node: <span className="ad-actions"><IconBtn icon="eye" label={"Review @" + row.username} onClick={() => select(row.username, true)} /></span>,
            label: "",
          },
        ]}
      />
      <h2 className="ad-section-h" id="kyc-review-h" style={{ marginTop: "22px" }} tabIndex={-1} ref={headingRef}>
        {item ? "Review — @" + item.username : "Review"}
      </h2>
      <div className="ad-empty ad-card" id="kyc-empty" hidden={!ready || !!item}><Icon name="idCard" /><p id="kyc-empty-t">Pick a submission above to review it.</p></div>
      <div id="kyc-page" hidden={!item}>
        <div className="ad-grid ad-grid-2">
          <section className="ad-card" aria-labelledby="kyc-h">
            <div className="ad-card-h">
              <h2 id="kyc-h"><Icon name="user" />Submitted details</h2>
              <span id="kyc-status">{item ? <StatusBadge status={status} label={STATUS_LABEL[status]} /> : null}</span>
            </div>
            <dl className="ad-dl" id="kyc-dl">
              {pairs.filter((p) => p[1]).map(([label, value]) => [<dt key={label + "-t"}>{label}</dt>, <dd key={label + "-d"}>{value}</dd>])}
            </dl>
          </section>
          <section className="ad-card" aria-labelledby="kyc-act-h">
            <div className="ad-card-h"><h2 id="kyc-act-h"><Icon name="checkCircle" />Decision</h2></div>
            <div id="kyc-decide" hidden={!pending}>
              <p className="ad-hint" style={{ marginBottom: "14px" }}>Approve unlocks cash-outs. Reject sends the user back to the form with your note.</p>
              <form className="ad-form" id="kyc-form" noValidate onSubmit={(e) => e.preventDefault()}>
                <label className="ad-field"><span>Note to the user (required to reject)</span>
                  <textarea
                    id="kyc-note"
                    maxLength={300}
                    placeholder="e.g. The address proof is older than 3 months. Upload a recent bank statement."
                    value={note}
                    ref={noteRef}
                    onChange={(e) => setNote(e.target.value)}
                    aria-invalid={noteError ? true : undefined}
                    aria-describedby={noteError ? "kyc-note-err" : undefined}
                  ></textarea>
                  <FieldError id="kyc-note" message={noteError} />
                </label>
                <p className="ad-form-msg is-err" id="kyc-msg" role="alert" hidden={!msg}>{msg}</p>
                <div className="ad-form-actions">
                  <button className="ad-btn ad-btn-danger" type="button" id="kyc-reject" onClick={() => decide("rejected")}><Icon name="close" /><span>Reject</span></button>
                  <button className="ad-btn ad-btn-ok" type="button" id="kyc-approve" onClick={() => decide("verified")}><Icon name="check" /><span>Approve</span></button>
                </div>
              </form>
            </div>
            <p className="ad-note" id="kyc-done" hidden={pending || !item}><Icon name="info" /><span id="kyc-done-t">{pending ? "" : doneText}</span></p>
          </section>
        </div>
        <h2 className="ad-section-h" style={{ marginTop: "22px" }}>Documents</h2>
        <div className="ad-grid ad-grid-2">
          <figure className="ad-card ad-doc"><figcaption>ID document</figcaption><Doc id="kyc-id" value={k?.idFile} /></figure>
          <figure className="ad-card ad-doc"><figcaption>Proof of address</figcaption><Doc id="kyc-addr" value={k?.addressFile} /></figure>
        </div>
      </div>
    </>
  );
}
