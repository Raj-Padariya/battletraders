"use client";

// Port of admin/assets/js/battles.js — list + filters + CSV, add/edit form (#bt-dialog with the #bt-rounds editor),
// delete, and the results editor (#rs-dialog). Deep links: /battles/?id=<id> opens that battle, /battles/#new the add form.
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Icon from "@admin/components/Icon";
import { AdminDialog, FieldError, IconBtn, Select, StatusBadge, TableCard, Toolbar, useAdminUi, type DialogHandle } from "@admin/components/AdminUi";
import type { Round, TournamentStatus } from "@admin/lib/data/tournaments";
import { BTAdmin, type AdminTournament, type CsvColumn, type TournamentInput, type TournamentResult } from "@admin/lib/store";
import { cap, date, matches, money, num } from "@admin/lib/ui";
import { BATTLE_NEW_EVENT } from "./NewBattleButton";

const STATUS_LABEL: Record<TournamentStatus, string> = { live: "Live", registering: "Registering", upcoming: "Upcoming", completed: "Completed" };
const TYPE_LABEL: Record<string, string> = { main: "Main", circuit: "Circuit", mini: "Mini" };

const CSV_COLUMNS: CsvColumn<AdminTournament>[] = [
  ["id", "ID"], ["name", "Name"], ["type", "Type"], [(t) => BTAdmin.statusOf(t), "Status"],
  ["start", "Starts"], ["end", "Ends"], ["registrationCloses", "Registration closes"],
  ["entryFee", "Entry fee"], ["prizePool", "Prize pool"], ["participants", "Players"], ["maxParticipants", "Max players"],
  ["instruments", "Instruments"], ["location", "Location"],
];

/* ---------- Date helpers: <input type=datetime-local> works in local time ---------- */
const toLocalInput = (iso?: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => ("0" + n).slice(-2);
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
};
const fromLocalInput = (value: string): string => {
  if (!value) return "";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "" : d.toISOString();
};

interface FormState {
  id: string; name: string; type: string; structure: string; tagline: string; accent: string; featured: boolean;
  start: string; end: string; regclose: string; fee: string; pool: string; max: string; participants: string; prizes: string;
  instruments: string; platform: string; organizer: string; location: string; cc: string; online: boolean;
}
type TextKey = { [K in keyof FormState]: FormState[K] extends string ? K : never }[keyof FormState];

interface RoundRow { key: number; n: number; name: string; start: string; end: string; advance: string; final: boolean }
interface ResultRow { key: number; rank: string; handle: string; points: string; prize: string }

const EMPTY_FORM: FormState = {
  id: "", name: "", type: "main", structure: "Multi-Round", tagline: "", accent: "purple", featured: false,
  start: "", end: "", regclose: "", fee: "0", pool: "", max: "500", participants: "0", prizes: "",
  instruments: "", platform: "BattleTrader Arena", organizer: "BattleTrader", location: "Online", cc: "", online: true,
};

const str = (v: unknown): string => (v === undefined || v === null ? "" : String(v));

export default function BattlesBody() {
  const { toast, confirmAction } = useAdminUi();
  const params = useSearchParams();
  const [all, setAll] = useState<AdminTournament[]>([]);
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fType, setFType] = useState("");

  // Add / edit form
  const btDlg = useRef<DialogHandle>(null);
  const [editing, setEditing] = useState<AdminTournament | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [rounds, setRounds] = useState<RoundRow[]>([]);
  const roundCount = useRef(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formMsg, setFormMsg] = useState("");
  const [focusId, setFocusId] = useState<string | null>(null);

  // Results
  const rsDlg = useRef<DialogHandle>(null);
  const [resultsFor, setResultsFor] = useState<AdminTournament | null>(null);
  const [results, setResults] = useState<ResultRow[]>([]);
  const resultKey = useRef(0);
  const [rsMsg, setRsMsg] = useState("");

  const render = () => setAll(BTAdmin.tournaments().slice().sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()));

  const filtered = all.filter((t) => {
    if (fStatus && BTAdmin.statusOf(t) !== fStatus) return false;
    if (fType && t.type !== fType) return false;
    return matches(t, q.trim(), ["name", "tagline", "instruments", "location", "organizer"]);
  });

  // Focus a freshly added round / result row (or the first bad field) once React has rendered it.
  useEffect(() => {
    if (!focusId) return;
    const node = document.getElementById(focusId);
    if (node) node.focus();
    setFocusId(null);
  }, [focusId]);

  /* ---------- Rounds editor ---------- */
  const makeRound = (r: Partial<Round>): RoundRow => {
    roundCount.current++;
    const n = roundCount.current;
    return {
      key: n, n,
      name: r.name || "",
      start: toLocalInput(r.start),
      end: toLocalInput(r.end),
      advance: str(r.advance || r.winners || ""),
      final: !!r.final,
    };
  };
  const addRound = () => {
    const row = makeRound({});
    setRounds((list) => list.concat(row));
    setFocusId("bt-round-" + row.key + "-name");
  };
  const patchRound = (key: number, patch: Partial<RoundRow>) =>
    setRounds((list) => list.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const readRounds = (): Round[] =>
    rounds.map((row) => {
      const name = row.name.trim();
      const start = fromLocalInput(row.start);
      const end = fromLocalInput(row.end);
      const advance = parseInt(row.advance, 10);
      if (!name && !start && !end) return null;
      const round: Round = { name: name || "Round", start, end };
      if (row.final) { round.final = true; if (advance) round.winners = advance; }
      else if (advance) round.advance = advance;
      return round;
    }).filter((r): r is Round => r !== null);

  /* ---------- Add / edit form ---------- */
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const openForm = (id: string | null, opener?: Element | null) => {
    setErrors({});
    setFormMsg("");
    roundCount.current = 0;
    const found = id ? BTAdmin.tournaments().filter((t) => t.id === id)[0] || null : null;
    setEditing(found);
    const t: Partial<AdminTournament> = found || {};
    // New battles default to a week out, one week long, registration closing an hour before.
    const defStart = new Date(Date.now() + 7 * BTAdmin.DAY_MS);
    defStart.setMinutes(0, 0, 0);
    setForm({
      id: t.id || "",
      name: str(t.name),
      type: t.type || "main",
      structure: t.structure || "Multi-Round",
      tagline: str(t.tagline),
      accent: t.accent || "purple",
      featured: !!t.featured,
      start: toLocalInput(t.start || defStart.toISOString()),
      end: toLocalInput(t.end || new Date(defStart.getTime() + 7 * BTAdmin.DAY_MS).toISOString()),
      regclose: toLocalInput(t.registrationCloses || new Date(defStart.getTime() - 3600000).toISOString()),
      fee: str(t.entryFee !== undefined ? t.entryFee : 0),
      pool: str(t.prizePool !== undefined ? t.prizePool : ""),
      max: str(t.maxParticipants || 500),
      participants: str(t.participants || 0),
      prizes: (t.prizes || []).join(", "),
      instruments: t.instruments || "",
      platform: t.platform || "BattleTrader Arena",
      organizer: t.organizer || "BattleTrader",
      location: t.location || "Online",
      cc: t.countryCode || "",
      online: t.online !== false,
    });
    setRounds((t.rounds && t.rounds.length ? t.rounds : [{ name: "Final", final: true } as Partial<Round>]).map(makeRound));
    btDlg.current?.open(opener);
  };

  const numOf = (v: string): number => (v.trim() === "" ? NaN : Number(v.trim()));

  const submitForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormMsg("");
    const bad: Record<string, string> = {};
    let firstBad = "";
    const fail = (id: string, text: string) => { bad[id] = text; if (!firstBad) firstBad = id; };

    const name = form.name.trim();
    if (name.length < 3) fail("bt-name", "Give the battle a name (at least 3 characters).");
    const start = fromLocalInput(form.start);
    const end = fromLocalInput(form.end);
    const reg = fromLocalInput(form.regclose);
    if (!start) fail("bt-start", "Pick a start date and time.");
    if (!end) fail("bt-end", "Pick an end date and time.");
    else if (start && new Date(end) <= new Date(start)) fail("bt-end", "The end must be after the start.");
    if (!reg) fail("bt-regclose", "Pick when registration closes.");
    else if (start && new Date(reg) > new Date(start)) fail("bt-regclose", "Registration must close on or before the start.");
    const fee = numOf(form.fee);
    if (isNaN(fee) || fee < 0) fail("bt-fee", "Enter 0 or more.");
    const pool = numOf(form.pool);
    if (isNaN(pool) || pool < 0) fail("bt-pool", "Enter the prize pool in dollars.");
    const max = numOf(form.max);
    if (isNaN(max) || max < 2 || max % 1) fail("bt-max", "At least 2 players, whole number.");
    let participants = numOf(form.participants);
    if (isNaN(participants)) participants = 0;
    if (participants < 0 || participants % 1) fail("bt-participants", "Whole number, 0 or more.");
    else if (!isNaN(max) && participants > max) fail("bt-participants", "Can't be more than the maximum.");
    const prizeText = form.prizes.trim();
    const prizes = prizeText ? prizeText.split(",").map((p) => Number(p.replace(/[$\s]/g, ""))) : [];
    if (prizes.some((p) => isNaN(p) || p < 0)) fail("bt-prizes", "Use numbers separated by commas, e.g. 5000, 2500, 1000.");
    else if (!isNaN(pool) && prizes.reduce((s, p) => s + p, 0) > pool) fail("bt-prizes", "Prizes add up to more than the prize pool.");
    const cc = form.cc.trim().toUpperCase();
    if (cc && !/^[A-Z]{2}$/.test(cc)) fail("bt-cc", "Two letters, like GB or IN.");

    setErrors(bad);
    if (firstBad) {
      setFormMsg("Fix the highlighted fields.");
      setFocusId(firstBad);
      return;
    }

    // Keep fields this form doesn't edit (bonus, sponsors, results, entryLabel…) when editing.
    const base: Partial<AdminTournament> = editing ? JSON.parse(JSON.stringify(editing)) : {};
    const battle: TournamentInput = {
      ...(base as AdminTournament),
      id: form.id || undefined,
      name,
      type: form.type as AdminTournament["type"],
      structure: form.structure,
      tagline: form.tagline.trim(),
      accent: form.accent,
      featured: form.featured,
      start,
      end,
      registrationCloses: reg,
      entryFee: fee,
      prizePool: pool,
      maxParticipants: max,
      participants,
      prizes,
      instruments: form.instruments.trim(),
      platform: form.platform.trim() || "BattleTrader Arena",
      organizer: form.organizer.trim() || "BattleTrader",
      location: form.location.trim() || "Online",
      countryCode: cc,
      online: form.online,
      rounds: readRounds(),
      bonus: base.bonus || [],
      sponsors: base.sponsors || [],
    };

    const saved = BTAdmin.saveTournament(battle);
    btDlg.current?.close();
    toast((editing ? "Saved " : "Added ") + saved.name + ".");
    render();
  };

  /* ---------- Delete ---------- */
  const removeBattle = (t: AdminTournament, opener?: HTMLElement | null) => {
    confirmAction({
      title: "Delete " + t.name + "?",
      text: "It disappears from Browse Tournaments for everyone. Users already entered keep their entry record.",
      confirm: "Delete battle",
      tone: "bad",
    }).then((ok) => {
      if (!ok) { if (opener) opener.focus(); return; }
      BTAdmin.deleteTournament(t.id);
      toast(t.name + " deleted.", "warn");
      render();
    });
  };

  /* ---------- Results ---------- */
  const makeResult = (r: Partial<TournamentResult> | { rank?: number; prize?: number | "" }, place: number): ResultRow => {
    resultKey.current++;
    const full = r as Partial<TournamentResult>;
    return {
      key: resultKey.current,
      rank: str(full.rank || place),
      handle: full.handle || "",
      points: full.points !== undefined ? str(full.points) : "",
      prize: full.prize !== undefined ? str(full.prize) : "",
    };
  };
  const openResults = (id: string, opener?: Element | null) => {
    const t = BTAdmin.tournaments().filter((x) => x.id === id)[0];
    if (!t) return;
    setResultsFor(t);
    setRsMsg("");
    const rows = t.results && t.results.length
      ? t.results.map((r, i) => makeResult(r, i + 1))
      : (t.prizes && t.prizes.length ? t.prizes : [0, 0, 0]).map((p, i) => makeResult({ rank: i + 1, prize: p || "" }, i + 1));
    setResults(rows);
    rsDlg.current?.open(opener);
  };
  const addResult = () => {
    const row = makeResult({}, results.length + 1);
    setResults((list) => list.concat(row));
    setFocusId("rs-row-" + row.key + "-handle");
  };
  const patchResult = (key: number, patch: Partial<ResultRow>) =>
    setResults((list) => list.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const submitResults = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!resultsFor) return;
    setRsMsg("");
    const list: TournamentResult[] = [];
    let problem = "";
    results.forEach((row) => {
      const handle = row.handle.trim().replace(/^@/, "");
      const rank = parseInt(row.rank, 10);
      const points = Number(row.points || 0);
      const prize = Number(row.prize || 0);
      if (!handle) return; // empty rows are ignored
      if (!rank || rank < 1) problem = "Every place needs a number of 1 or more.";
      if (prize < 0 || isNaN(prize)) problem = "Prizes can't be negative.";
      list.push({ rank, handle, points: isNaN(points) ? 0 : points, prize: isNaN(prize) ? 0 : prize });
    });
    const ranks = list.map((r) => r.rank);
    if (!problem && ranks.some((r, i) => ranks.indexOf(r) !== i)) problem = "Two traders have the same place.";
    if (problem) { setRsMsg(problem); return; }
    BTAdmin.setResults(resultsFor.id, list);
    rsDlg.current?.close();
    toast(list.length ? "Results published for " + resultsFor.name + "." : "Results cleared for " + resultsFor.name + ".");
    render();
  };

  const openFormRef = useRef(openForm);
  openFormRef.current = openForm;

  useEffect(() => {
    render();
    const deepId = params.get("id");
    if (deepId && BTAdmin.tournaments().some((t) => t.id === deepId)) openFormRef.current(deepId);
    else if (window.location.hash === "#new") openFormRef.current(null);
    const onNew = (e: Event) => openFormRef.current(null, (e as CustomEvent<Element>).detail || null);
    window.addEventListener(BATTLE_NEW_EVENT, onNew);
    return () => window.removeEventListener(BATTLE_NEW_EVENT, onNew);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search debounced 150 ms like the old onFilter; the list is re-read on each filter change.
  useEffect(() => {
    const timer = window.setTimeout(() => setQ(query), 150);
    return () => window.clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    render();
  }, [q, fStatus, fType]);

  const exportCsv = () => {
    BTAdmin.exportCSV("battletrader-battles.csv", CSV_COLUMNS, filtered);
    toast("CSV downloaded.");
  };

  /* ---------- Form field helpers (mirror the generator's field()/inp()) ---------- */
  const errAttrs = (id: string) => (errors[id] ? { "aria-invalid": true as const, "aria-describedby": id + "-err" } : {});
  const textInput = (id: string, key: TextKey, type: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input type={type} id={id} name={id} value={form[key]} onChange={(e) => set(key, e.target.value)} {...extra} {...errAttrs(id)} />
  );
  const field = (id: string, label: string, input: React.ReactNode, full = false) => (
    <label className={"ad-field" + (full ? " is-full" : "")}>
      <span>{label}</span>
      {input}
      {HINTS[id] ? <small className="ad-hint" id={id + "-hint"}>{HINTS[id]}</small> : null}
      <FieldError id={id} message={errors[id]} />
    </label>
  );

  return (
    <>
      <Toolbar
        id="bt"
        searchLabel="Search battles"
        placeholder="Search battles…"
        query={query}
        onQuery={setQuery}
        selects={[
          { id: "bt-f-status", label: "Status", options: [["", "All"], ["live", "Live"], ["registering", "Registering"], ["upcoming", "Upcoming"], ["completed", "Completed"]], value: fStatus, onChange: setFStatus },
          { id: "bt-f-type", label: "Type", options: [["", "All types"], ["main", "Main"], ["circuit", "Circuit"], ["mini", "Mini"]], value: fType, onChange: setFType },
        ]}
      >
        <button className="ad-btn" type="button" id="bt-export" onClick={exportCsv}><Icon name="download" /><span>Export CSV</span></button>
      </Toolbar>
      <TableCard<AdminTournament>
        id="bt-table"
        caption="Battles"
        columns={[{ label: "Battle" }, { label: "Type" }, { label: "Status" }, { label: "Starts" }, { label: "Entry", num: true }, { label: "Prize pool", num: true }, { label: "Players", num: true }, { label: "" }]}
        empty="No battles match these filters."
        items={filtered}
        total={all.length}
        rowKey={(t) => t.id}
        renderRow={(t) => {
          const status = BTAdmin.statusOf(t);
          return [
            <span className="ad-cell-main" key="n">
              <span>
                <b>{t.name}</b>
                <small>{(t.tagline || t.location || "") + (BTAdmin.isBuiltIn(t.id) ? "" : " · added by admin")}</small>
              </span>
            </span>,
            TYPE_LABEL[t.type] || cap(t.type),
            <StatusBadge status={status} label={STATUS_LABEL[status]} key="st" />,
            date(t.start, true),
            { node: Number(t.entryFee) ? money(t.entryFee) : "Free", num: true },
            { node: money(t.prizePool), num: true },
            { node: num(t.participants || 0) + " / " + num(t.maxParticipants || 0), num: true },
            {
              node: (
                <span className="ad-actions">
                  <IconBtn icon="edit" label={"Edit " + t.name} onClick={(e) => openForm(t.id, e.currentTarget)} />
                  <IconBtn icon="trophy" label={"Results for " + t.name} onClick={(e) => openResults(t.id, e.currentTarget)} />
                  <IconBtn icon="trash" label={"Delete " + t.name} onClick={(e) => removeBattle(t, e.currentTarget)} variant="bad" />
                </span>
              ),
              label: "",
            },
          ];
        }}
      />

      <AdminDialog ref={btDlg} id="bt-dialog" wide title={<span id="bt-d-title">{editing ? "Edit " + editing.name : "Add battle"}</span>}>
        <form className="ad-form" id="bt-form" noValidate onSubmit={submitForm}>
          <input type="hidden" id="bt-id" value={form.id} />
          <fieldset className="ad-fieldset">
            <legend>Basics</legend>
            <div className="ad-form-grid">
              {field("bt-name", "Battle name", textInput("bt-name", "name", "text", { required: true, maxLength: 80 }), true)}
              {field("bt-type", "Type", (
                <Select id="bt-type" name="bt-type" value={form.type} options={[["main", "Main tournament"], ["circuit", "Circuit"], ["mini", "Mini"]]} onChange={(v) => set("type", v)} />
              ))}
              {field("bt-structure", "Structure", (
                <Select id="bt-structure" name="bt-structure" value={form.structure} options={[["Multi-Round", "Multi-Round"], ["Single Round", "Single Round"]]} onChange={(v) => set("structure", v)} />
              ))}
              {field("bt-tagline", "Tagline", textInput("bt-tagline", "tagline", "text", { maxLength: 140 }), true)}
              {field("bt-accent", "Card colour", (
                <Select id="bt-accent" name="bt-accent" value={form.accent} options={[["purple", "Purple"], ["cyan", "Cyan"], ["pink", "Pink"], ["gold", "Gold"]]} onChange={(v) => set("accent", v)} />
              ))}
              <label className="ad-check" style={{ alignSelf: "end" }}><input type="checkbox" id="bt-featured" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} /> Featured on Browse page</label>
            </div>
          </fieldset>

          <fieldset className="ad-fieldset">
            <legend>Dates</legend>
            <div className="ad-form-grid">
              {field("bt-start", "Starts", textInput("bt-start", "start", "datetime-local", { required: true }))}
              {field("bt-end", "Ends", textInput("bt-end", "end", "datetime-local", { required: true }))}
              {field("bt-regclose", "Registration closes", textInput("bt-regclose", "regclose", "datetime-local", { required: true }), true)}
            </div>
          </fieldset>

          <fieldset className="ad-fieldset">
            <legend>Entry &amp; prizes</legend>
            <div className="ad-form-grid">
              {field("bt-fee", "Entry fee ($)", textInput("bt-fee", "fee", "number", { min: "0", step: "1", required: true }))}
              {field("bt-pool", "Prize pool ($)", textInput("bt-pool", "pool", "number", { min: "0", step: "1", required: true }))}
              {field("bt-max", "Max participants", textInput("bt-max", "max", "number", { min: "2", step: "1", required: true }))}
              {field("bt-participants", "Registered so far", textInput("bt-participants", "participants", "number", { min: "0", step: "1" }))}
              {field("bt-prizes", "Prizes by place ($)", textInput("bt-prizes", "prizes", "text", { placeholder: "5000, 2500, 1000", inputMode: "numeric" }), true)}
            </div>
          </fieldset>

          <fieldset className="ad-fieldset">
            <legend>Trading &amp; venue</legend>
            <div className="ad-form-grid">
              {field("bt-instruments", "Instruments", textInput("bt-instruments", "instruments", "text", { placeholder: "EURUSD, XAUUSD, NAS100" }), true)}
              {field("bt-platform", "Platform", textInput("bt-platform", "platform", "text", { placeholder: "BattleTrader Arena" }))}
              {field("bt-organizer", "Organiser", textInput("bt-organizer", "organizer", "text", { placeholder: "BattleTrader" }))}
              {field("bt-location", "Location", textInput("bt-location", "location", "text", { placeholder: "Online" }))}
              {field("bt-cc", "Country code", textInput("bt-cc", "cc", "text", { maxLength: 2, placeholder: "GB" }))}
              <label className="ad-check"><input type="checkbox" id="bt-online" checked={form.online} onChange={(e) => set("online", e.target.checked)} /> Online event</label>
            </div>
          </fieldset>

          <fieldset className="ad-fieldset">
            <legend>Rounds</legend>
            <div className="ad-rounds" id="bt-rounds">
              {rounds.map((r) => (
                <div className="ad-round" key={r.key}>
                  <label className="ad-field"><span>Round name</span><input type="text" className="rd-name" id={"bt-round-" + r.key + "-name"} value={r.name} aria-label={"Round " + r.n + " name"} maxLength={40} onChange={(e) => patchRound(r.key, { name: e.target.value })} /></label>
                  <label className="ad-field"><span>Starts</span><input type="datetime-local" className="rd-start" value={r.start} aria-label={"Round " + r.n + " start"} onChange={(e) => patchRound(r.key, { start: e.target.value })} /></label>
                  <label className="ad-field"><span>Ends</span><input type="datetime-local" className="rd-end" value={r.end} aria-label={"Round " + r.n + " end"} onChange={(e) => patchRound(r.key, { end: e.target.value })} /></label>
                  <label className="ad-field"><span>Advance / winners</span><input type="number" min="1" className="rd-advance" value={r.advance} aria-label={"Round " + r.n + " players advancing"} placeholder="e.g. 100" onChange={(e) => patchRound(r.key, { advance: e.target.value })} /></label>
                  <label className="ad-check"><input type="checkbox" className="rd-final" checked={r.final} onChange={(e) => patchRound(r.key, { final: e.target.checked })} /> Final</label>
                  <IconBtn icon="trash" label={"Remove round " + r.n} onClick={() => setRounds((list) => list.filter((x) => x.key !== r.key))} variant="bad" />
                </div>
              ))}
            </div>
            <button className="ad-btn ad-btn-sm" type="button" id="bt-add-round" onClick={addRound}><Icon name="plus" /><span>Add round</span></button>
          </fieldset>

          <p className="ad-form-msg is-err" id="bt-form-msg" role="alert" hidden={!formMsg}>{formMsg}</p>
          <div className="ad-form-actions">
            <button className="ad-btn ad-btn-ghost" type="button" data-close>Cancel</button>
            <button className="ad-btn ad-btn-primary" type="submit" id="bt-save"><Icon name="check" /><span>Save battle</span></button>
          </div>
        </form>
      </AdminDialog>

      <AdminDialog ref={rsDlg} id="rs-dialog" wide title={<>Results &mdash; <span id="rs-d-title">{resultsFor ? resultsFor.name : ""}</span></>}>
        <p className="ad-hint" style={{ marginBottom: "12px" }}>Publishing results marks the battle as completed for everyone. Clear all rows to reopen it.</p>
        <form className="ad-form" id="rs-form" noValidate onSubmit={submitResults}>
          <div className="ad-table-wrap">
            <table className="ad-table ad-results">
              <caption className="ad-sr">Results</caption>
              <thead><tr><th scope="col">Place</th><th scope="col">Trader handle</th><th scope="col" className="is-num">Points</th><th scope="col" className="is-num">Prize ($)</th><th scope="col"><span className="ad-sr">Remove</span></th></tr></thead>
              <tbody id="rs-rows">
                {results.map((r) => (
                  <tr key={r.key}>
                    <td data-label="Place"><input type="number" min="1" className="rs-rank" value={r.rank} aria-label="Place" onChange={(e) => patchResult(r.key, { rank: e.target.value })} /></td>
                    <td data-label="Trader handle"><input type="text" className="rs-handle" id={"rs-row-" + r.key + "-handle"} value={r.handle} aria-label="Trader handle" maxLength={32} placeholder="wolf_of_fx" onChange={(e) => patchResult(r.key, { handle: e.target.value })} /></td>
                    <td data-label="Points" className="is-num"><input type="number" className="rs-points" value={r.points} aria-label="Points" onChange={(e) => patchResult(r.key, { points: e.target.value })} /></td>
                    <td data-label="Prize ($)" className="is-num"><input type="number" min="0" className="rs-prize" value={r.prize} aria-label="Prize in dollars" onChange={(e) => patchResult(r.key, { prize: e.target.value })} /></td>
                    <td data-label=""><IconBtn icon="trash" label="Remove this place" onClick={() => setResults((list) => list.filter((x) => x.key !== r.key))} variant="bad" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="ad-btn ad-btn-sm" type="button" id="rs-add" style={{ width: "fit-content" }} onClick={addResult}><Icon name="plus" /><span>Add place</span></button>
          <p className="ad-form-msg is-err" id="rs-msg" role="alert" hidden={!rsMsg}>{rsMsg}</p>
          <div className="ad-form-actions">
            <button className="ad-btn ad-btn-ghost" type="button" data-close>Cancel</button>
            <button className="ad-btn ad-btn-primary" type="submit"><Icon name="trophy" /><span>Publish results</span></button>
          </div>
        </form>
      </AdminDialog>
    </>
  );
}

const HINTS: Record<string, string> = {
  "bt-tagline": "One line shown on the battle card.",
  "bt-regclose": "Must be on or before the start.",
  "bt-fee": "0 = free entry.",
  "bt-prizes": "Comma separated, 1st place first.",
  "bt-cc": "2 letters, for the flag.",
};
