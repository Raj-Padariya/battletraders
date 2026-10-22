"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Svg } from "@panel/components/Icon";
import PanelShell from "@panel/components/PanelShell";
import { BTAlliances as A, type Alliance, type Relation } from "@panel/lib/data/alliances";
import { usePanel } from "@panel/lib/panel";
import { AL_ICONS as I, attemptJoin, num, winText } from "./shared";

interface CardView {
  alliance: Alliance;
  relation: Relation;
}

interface ListState {
  all: number;
  shown: CardView[];
  mine: Alliance | null;
}

interface FormErrors {
  name: string;
  tag: string;
}

const NO_ERRORS: FormErrors = { name: "", tag: "" };

function nameError(value: string): string {
  const v = value.trim();
  if (!v) return "Enter an alliance name.";
  return v.length < 3 || v.length > 30 ? "Use 3–30 characters." : "";
}

function tagError(value: string): string {
  const v = value.trim();
  if (!v) return "Enter a tag.";
  if (!/^[A-Z0-9]{2,5}$/.test(v)) return "Use 2–5 letters (A–Z) or numbers, no spaces.";
  return A.isTagTaken(v) ? "[" + v + "] is already taken. Try another tag." : "";
}

function Action({ view, onJoin }: { view: CardView; onJoin: (a: Alliance) => void }) {
  const { alliance: a, relation: rel } = view;
  if (rel === "leader" || rel === "member") {
    return (
      <span className="al-act al-act-in">
        <Svg body={rel === "leader" ? I.crown : I.check} /><span>{rel === "leader" ? "Leading" : "Joined"}</span>
      </span>
    );
  }
  if (a.joinPolicy === "invite") {
    return <span className="al-act al-act-invite"><Svg body={I.lock} /><span>Invite-only</span></span>;
  }
  if (rel === "requested") {
    return (
      <button type="button" className="al-act al-act-btn is-requested" disabled aria-label={"Request sent to " + a.name}>
        <Svg body={I.clock} /><span>Requested</span>
      </button>
    );
  }
  const label = a.joinPolicy === "approval" ? "Request to join" : "Join";
  return (
    <button type="button" className="al-act al-act-btn" aria-label={label + " " + a.name} onClick={() => onJoin(a)}>
      <Svg body={a.joinPolicy === "approval" ? I.userPlus : I.check} /><span>{label}</span>
    </button>
  );
}

function Card({ view, onJoin }: { view: CardView; onJoin: (a: Alliance) => void }) {
  const a = view.alliance;
  const crest = { "--crest": A.crestColor(a.name) } as React.CSSProperties;
  return (
    <li className="al-card" data-glass="" style={crest}>
      <Link
        className="al-card-link"
        href={"/app/alliance/?id=" + encodeURIComponent(a.id)}
        aria-label={a.name + " [" + a.tag + "], " + a.tier + " tier, " + a.members.length + " of " + A.CAPACITY + " members, dominance " + num(a.dominance)}
      >
        <div className="al-card-h">
          <span className="al-crest" aria-hidden="true" style={crest}>{A.initials(a.name)}</span>
          <span className="al-card-id">
            <b className="al-card-name">{a.name}</b>
            <span className="al-card-meta"><em className="al-card-tag">{"[" + a.tag + "]"}</em><i className={"al-tier t-" + a.tier.toLowerCase()}>{a.tier}</i></span>
          </span>
          <span className="al-card-cap"><Svg body={I.users} /><span>{a.members.length + "/" + A.CAPACITY}</span></span>
        </div>
        <dl className="al-card-stats">
          <div className="c-pts"><dt><Svg body={I.trophy} />Season points</dt><dd>{num(a.seasonPoints)}</dd></div>
          <div className="c-win"><dt><Svg body={I.target} />Win rate</dt><dd>{winText(a)}</dd></div>
          <div className="c-mom"><dt><Svg body={I.trend} />Momentum</dt><dd>{"+" + a.momentum}</dd></div>
          <div className="c-rec"><dt><Svg body={I.swords} />Record</dt><dd>{a.record.w + "W / " + a.record.l + "L"}</dd></div>
        </dl>
      </Link>
      <div className="al-card-f">
        <p className="al-dom"><Svg body={I.star} /><span>Dominance: <b>{num(a.dominance)}</b></span></p>
        <Action view={view} onJoin={onJoin} />
      </div>
    </li>
  );
}

/** What sat inside <main>: hero, search, grid, empty state. */
function AlliancesBody({ onOpenCreate }: { onOpenCreate: (from: HTMLElement) => void }) {
  const { toast, ready } = usePanel();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<ListState | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback((q: string) => {
    const needle = q.trim().toLowerCase();
    const all = A.list();
    const shown = all
      .filter((a) => !needle || a.name.toLowerCase().includes(needle) || a.tag.toLowerCase().includes(needle))
      .map((a) => ({ alliance: a, relation: A.relation(a) }));
    setState({ all: all.length, shown, mine: A.mine() });
  }, []);

  // Reads localStorage (joined / created / requested) and the username: build after mount, and again once the
  // panel has loaded the profile.
  const queryRef = useRef(query);
  queryRef.current = query;
  useEffect(() => {
    refresh(queryRef.current);
  }, [ready, refresh]);

  const onSearch = (value: string) => {
    setQuery(value);
    refresh(value);
  };

  const onJoin = (a: Alliance) => {
    if (attemptJoin(a, toast)) refresh(query);
  };

  const openCreate = (from: HTMLElement) => {
    if (A.mine()) {
      toast("You're already in an alliance", "Leave your current alliance before founding a new one.", "error");
      return;
    }
    onOpenCreate(from);
  };

  const mine = state?.mine || null;
  const shownCount = state?.shown.length ?? 0;
  const trimmed = query.trim();
  const countText = !state ? "" : trimmed ? shownCount + " of " + state.all : state.all + " alliances";
  const isEmpty = !!state && shownCount === 0;

  return (
    <div className="al-page" id="al-list-page">
      <section className="ah al-hero" aria-labelledby="al-title">
        <div className="ah-txt al-hero-txt">
          <span className="al-hero-ico" aria-hidden="true"><Svg body={I.shield} /></span>
          <h1 id="al-title">Alliances</h1>
          <p>Create or join an alliance to compete as a team. Team up with up to 25 fighters, stack season points together and climb the dominance board.</p>
        </div>
        <div className="al-hero-side">
          <ul className="al-hero-stats" aria-label="Alliance facts">
            <li><span>Alliances</span><b>{state ? String(state.all) : "\u2014"}</b></li>
            <li><span>Max fighters</span><b>25</b></li>
            <li><span>Your team</span><b className={mine ? "is-in" : undefined}>{mine ? mine.name : "None yet"}</b></li>
          </ul>
          <button className="al-create" id="al-create-btn" type="button" hidden={!!mine} onClick={(e) => openCreate(e.currentTarget)}>
            <Svg body={I.plus} /><span>Create alliance</span>
          </button>
          <Link className="al-create" id="al-my-btn" href={mine ? "/app/alliance/?id=" + encodeURIComponent(mine.id) : "/app/alliances/"} hidden={!mine}>
            <Svg body={I.shield} /><span>My alliance</span>
          </Link>
        </div>
      </section>

      <div className="al-search" role="search">
        <label className="al-sr" htmlFor="al-q">Search alliances</label>
        <Svg body={I.search} />
        <input
          ref={searchRef}
          id="al-q"
          type="search"
          placeholder="Search alliances by name or tag..."
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => onSearch(e.target.value)}
        />
        <span className="al-count" id="al-count" aria-live="polite">{countText}</span>
      </div>

      <ul className="al-grid" id="al-grid" aria-label="Alliances" hidden={isEmpty}>
        {state?.shown.map((view) => <Card key={view.alliance.id} view={view} onJoin={onJoin} />)}
      </ul>

      <div className="al-empty" id="al-empty" hidden={!isEmpty}>
        <span className="al-empty-ico" aria-hidden="true"><Svg body={I.search} /></span>
        <b>No alliance matches &ldquo;<span id="al-empty-q">{trimmed}</span>&rdquo;</b>
        <p>Check the spelling or the tag &mdash; or start your own crew.</p>
        <div className="al-empty-btns">
          <button
            className="ab2"
            id="al-clear"
            type="button"
            onClick={() => {
              onSearch("");
              searchRef.current?.focus();
            }}
          >
            <Svg body={I.close} />Clear search
          </button>
          <button className="ab2" id="al-empty-create" type="button" hidden={!!mine} onClick={(e) => openCreate(e.currentTarget)}>
            <Svg body={I.plus} />Create alliance
          </button>
        </div>
      </div>

      <p className="al-note"><Svg body={I.info} />Sample alliances &mdash; live alliance data arrives with accounts.</p>
    </div>
  );
}

/** The #al-create dialog that sat after </main>. */
function CreateDialog({ open, onClosed }: { open: boolean; onClosed: (created: boolean) => void }) {
  const { toast } = usePanel();
  const router = useRouter();
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [desc, setDesc] = useState("");
  const [policy, setPolicy] = useState("open");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>(NO_ERRORS);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const tagRef = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const created = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      // form.reset() equivalent
      setName("");
      setTag("");
      setDesc("");
      setPolicy("open");
      setSubmitted(false);
      setErrors(NO_ERRORS);
      created.current = false;
      dialog.showModal();
      nameRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (pendingCaret.current === null || !tagRef.current) return;
    tagRef.current.setSelectionRange(pendingCaret.current, pendingCaret.current);
    pendingCaret.current = null;
  }, [tag]);

  const close = () => dialogRef.current?.close();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    const next = { name: nameError(name), tag: tagError(tag) };
    setErrors(next);
    if (next.name || next.tag) {
      (next.name ? nameRef : tagRef).current?.focus();
      return;
    }
    const res = A.create({ name, tag, description: desc, joinPolicy: policy });
    if (!res.ok) {
      if (res.reason === "tag") setErrors({ ...next, tag: tagError(tag) });
      else toast("Couldn't create alliance", res.reason === "already" ? "You're already in an alliance." : "Check the form and try again.", "error");
      return;
    }
    created.current = true;
    close();
    router.push("/app/alliance/?id=" + encodeURIComponent(res.alliance.id) + "&new=1");
  };

  return (
    <dialog
      className="al-modal"
      id="al-create"
      ref={dialogRef}
      aria-labelledby="al-create-h"
      aria-describedby="al-create-sub"
      onClose={() => onClosed(created.current)}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <form className="al-form" id="al-form" noValidate onSubmit={onSubmit}>
        <div className="al-modal-h">
          <span className="al-modal-ico" aria-hidden="true"><Svg body={I.shield} /></span>
          <div>
            <h2 id="al-create-h">Create alliance</h2>
            <p id="al-create-sub">Form a team to compete in alliance tournaments</p>
          </div>
          <button className="al-x" id="al-create-x" type="button" aria-label="Close create alliance" onClick={close}>
            <Svg body={I.close} />
          </button>
        </div>

        <div className="al-field">
          <label htmlFor="al-name">Alliance name <i aria-hidden="true">*</i></label>
          <input
            ref={nameRef}
            id="al-name"
            name="name"
            type="text"
            maxLength={30}
            autoComplete="off"
            required
            aria-invalid={errors.name ? "true" : undefined}
            aria-describedby={errors.name ? "al-name-hint al-name-err" : "al-name-hint"}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (submitted) setErrors((prev) => ({ ...prev, name: nameError(e.target.value) }));
            }}
          />
          <p className="al-hint" id="al-name-hint">3&ndash;30 characters.</p>
          <p className="al-err" id="al-name-err" hidden={!errors.name}>{errors.name}</p>
        </div>

        <div className="al-field">
          <label htmlFor="al-tag">Alliance tag <i aria-hidden="true">*</i></label>
          <input
            ref={tagRef}
            id="al-tag"
            name="tag"
            type="text"
            maxLength={5}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            required
            aria-invalid={errors.tag ? "true" : undefined}
            aria-describedby={errors.tag ? "al-tag-hint al-tag-err" : "al-tag-hint"}
            value={tag}
            onChange={(e) => {
              const upper = e.target.value.toUpperCase();
              pendingCaret.current = e.target.selectionStart;
              setTag(upper);
              if (submitted) setErrors((prev) => ({ ...prev, tag: tagError(upper) }));
            }}
          />
          <p className="al-hint" id="al-tag-hint">2&ndash;5 letters or numbers, shown as [TAG]. Must be unique.</p>
          <p className="al-err" id="al-tag-err" hidden={!errors.tag}>{errors.tag}</p>
        </div>

        <div className="al-field">
          <label htmlFor="al-desc">Description <small>optional</small></label>
          <textarea id="al-desc" name="description" rows={3} maxLength={200} aria-describedby="al-desc-count" value={desc} onChange={(e) => setDesc(e.target.value)}></textarea>
          <p className="al-hint al-counter" id="al-desc-count" aria-live="polite">{desc.length + " / 200"}</p>
        </div>

        <div className="al-field">
          <label htmlFor="al-policy">Join policy</label>
          <div className="al-select">
            <select id="al-policy" name="joinPolicy" value={policy} onChange={(e) => setPolicy(e.target.value)}>
              <option value="open">Open &mdash; anyone can join</option>
              <option value="approval">Approval &mdash; requires approval</option>
              <option value="invite">Invite only</option>
            </select>
            <Svg body={I.chevDown} />
          </div>
        </div>

        <div className="al-modal-f">
          <button className="al-btn-ghost" id="al-create-cancel" type="button" onClick={close}>Cancel</button>
          <button className="al-btn" type="submit"><Svg body={I.plus} />Create alliance</button>
        </div>
      </form>
    </dialog>
  );
}

/** Client wrapper: the dialog lives in PanelShell's `after` slot, so the open/opener state sits above both. */
export default function AlliancesView() {
  const [createOpen, setCreateOpen] = useState(false);
  const openerRef = useRef<HTMLElement | null>(null);

  const onOpenCreate = (from: HTMLElement) => {
    openerRef.current = from;
    setCreateOpen(true);
  };

  const onClosed = (created: boolean) => {
    setCreateOpen(false);
    if (created) return; // navigating to the new alliance
    const opener = openerRef.current;
    if (opener && document.contains(opener) && !opener.hidden) opener.focus();
    else document.getElementById("al-q")?.focus();
  };

  return (
    <PanelShell current="alliances" crumb="Alliances" after={<CreateDialog open={createOpen} onClosed={onClosed} />}>
      <AlliancesBody onOpenCreate={onOpenCreate} />
    </PanelShell>
  );
}
