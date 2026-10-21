"use client";

// Shared admin UI pieces — React versions of the old BTUI DOM helpers (admin.js) and admin-shell.js builders.
// Markup and class names are unchanged so admin-base.css styles them exactly as before.
import { createContext, useCallback, useContext, useEffect, useImperativeHandle, useRef, useState } from "react";
import Icon from "@admin/components/Icon";
import type { IconName } from "@admin/lib/icons";
import { STATUS_TONE, cap, num, type Tone } from "@admin/lib/ui";

/* ---------- Badges + icon buttons ---------- */

export function Badge({ text, tone = "muted" }: { text: string; tone?: Tone }) {
  return <span className={"ad-badge is-" + tone}>{text}</span>;
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return <Badge text={label || cap(status)} tone={STATUS_TONE[status] || "muted"} />;
}

/** Icon-only button with an accessible label and tooltip. */
export function IconBtn({ icon, label, onClick, variant }: { icon: IconName; label: string; onClick: (e: React.MouseEvent<HTMLButtonElement>) => void; variant?: string }) {
  return (
    <button type="button" className={"ad-icon-btn" + (variant ? " is-" + variant : "")} aria-label={label} title={label} onClick={onClick}>
      <Icon name={icon} />
    </button>
  );
}

/* ---------- Toolbar + table card (admin-shell `toolbar` / `tableCard`) ---------- */

export interface ToolbarSelect {
  id: string;
  label: string;
  options: [value: string, text: string][];
  value: string;
  onChange: (value: string) => void;
}

/** Search box (debounce in the caller if needed) + optional selects + right-side buttons. */
export function Toolbar({ id, searchLabel = "Search", placeholder = "Search…", query, onQuery, selects = [], children }: {
  id: string;
  searchLabel?: string;
  placeholder?: string;
  query: string;
  onQuery: (q: string) => void;
  selects?: ToolbarSelect[];
  children?: React.ReactNode;
}) {
  return (
    <div className="ad-toolbar" id={id}>
      <label className="ad-search">
        <span className="ad-sr">{searchLabel}</span>
        <Icon name="search" />
        <input type="search" id={id + "-q"} placeholder={placeholder} autoComplete="off" value={query} onChange={(e) => onQuery(e.target.value)} />
      </label>
      {selects.map((s) => (
        <label className="ad-field ad-field-inline" key={s.id}>
          <span>{s.label}</span>
          <Select id={s.id} value={s.value} options={s.options} onChange={s.onChange} />
        </label>
      ))}
      <div className="ad-toolbar-end">{children}</div>
    </div>
  );
}

/* ---------- Select (replaces the browser's native dropdown so it matches the admin theme) ---------- */

export function Select({ id, value, options, onChange, placeholder = "Select…", name, ref, ...aria }: {
  id: string;
  value: string;
  options: [value: string, text: string][];
  onChange: (value: string) => void;
  /** Shown when `value` matches no option. */
  placeholder?: string;
  /** Mirrors the value into a hidden input so form markup keeps its field name. */
  name?: string;
  ref?: React.Ref<HTMLButtonElement>;
} & React.AriaAttributes) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement, []);

  const selectedIndex = options.findIndex(([v]) => v === value);
  const current = selectedIndex >= 0 ? options[selectedIndex][1] : "";

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.querySelector('[data-i="' + active + '"]')?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const openList = () => {
    setActive(Math.max(selectedIndex, 0));
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };
  const choose = (i: number) => {
    const picked = options[i];
    if (picked && picked[0] !== value) onChange(picked[0]);
    close();
  };

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    openList();
  };
  const onListKey = (e: React.KeyboardEvent) => {
    const last = options.length - 1;
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); setActive((i) => Math.min(i + 1, last)); return;
      case "ArrowUp": e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); return;
      case "Home": e.preventDefault(); setActive(0); return;
      case "End": e.preventDefault(); setActive(last); return;
      case "Enter":
      case " ": e.preventDefault(); choose(active); return;
      // preventDefault also stops a surrounding <dialog> from closing on Escape.
      case "Escape": e.preventDefault(); close(); return;
      case "Tab": close(false); return;
    }
    if (e.key.length !== 1) return;
    // Type-ahead: jump to the next option starting with the typed letter (ignoring a leading "@").
    const letter = e.key.toLowerCase();
    for (let step = 1; step <= options.length; step++) {
      const i = (active + step) % options.length;
      if (options[i][1].replace(/^@/, "").toLowerCase().startsWith(letter)) { setActive(i); return; }
    }
  };

  return (
    <div className={"ad-select" + (open ? " is-open" : "")} ref={rootRef}>
      <button
        type="button"
        id={id}
        className={"ad-select-btn" + (current ? "" : " is-empty")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id + "-list" : undefined}
        ref={triggerRef}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onTriggerKey}
        {...aria}
      >
        <span>{current || placeholder}</span><Icon name="chevronDown" />
      </button>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      {open ? (
        // preventDefault: most Selects sit inside a <label>, whose click would otherwise re-toggle the trigger.
        <ul className="ad-select-pop" id={id + "-list"} role="listbox" tabIndex={-1} ref={listRef} aria-activedescendant={id + "-opt-" + active} onKeyDown={onListKey} onClick={(e) => e.preventDefault()}>
          {options.map(([v, text], i) => (
            <li
              key={v}
              id={id + "-opt-" + i}
              data-i={i}
              role="option"
              aria-selected={v === value}
              className={"ad-select-opt" + (i === active ? " is-active" : "") + (v === value ? " is-on" : "")}
              onPointerEnter={() => setActive(i)}
              onClick={() => choose(i)}
            >
              <span>{text}</span>{v === value ? <Icon name="check" /> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* ---------- Date picker (replaces the browser's native calendar so it matches the admin theme) ---------- */

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const pad2 = (n: number) => String(n).padStart(2, "0");
/** Local-date "YYYY-MM-DD", the same format <input type="date"> produced, so filters keep working unchanged. */
const isoDate = (d: Date) => d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
const parseIso = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};

export function DatePicker({ id, label, value, onChange, placeholder = "Any date" }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const selected = parseIso(value);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const base = selected || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open) {
      const base = selected || new Date();
      setView(new Date(base.getFullYear(), base.getMonth(), 1));
    }
    setOpen(!open);
  };
  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
    triggerRef.current?.focus();
  };

  // 6 rows × 7 days, Monday first, padded with the neighbouring months' days.
  const lead = (view.getDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, i) => new Date(view.getFullYear(), view.getMonth(), i - lead + 1));
  const today = isoDate(new Date());
  const monthName = view.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const shown = selected ? selected.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : placeholder;

  return (
    <div className="ad-field ad-field-inline ad-date" ref={rootRef}>
      <span id={id + "-l"}>{label}</span>
      <button
        type="button"
        id={id}
        className={"ad-date-btn" + (selected ? "" : " is-empty")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={id + "-l " + id}
        ref={triggerRef}
        onClick={toggle}
      >
        <Icon name="calendar" /><span>{shown}</span>
      </button>
      {open ? (
        <div className="ad-date-pop" role="dialog" aria-label={"Choose " + label.toLowerCase() + " date"}>
          <div className="ad-date-h">
            <button type="button" className="ad-date-nav" aria-label="Previous month" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}><Icon name="chevronLeft" /></button>
            <b aria-live="polite">{monthName}</b>
            <button type="button" className="ad-date-nav" aria-label="Next month" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}><Icon name="chevronRight" /></button>
          </div>
          <div className="ad-date-grid">
            {WEEKDAYS.map((d) => <span className="ad-date-wd" key={d} aria-hidden="true">{d}</span>)}
            {days.map((d) => {
              const iso = isoDate(d);
              const cls = "ad-date-day"
                + (d.getMonth() !== view.getMonth() ? " is-out" : "")
                + (iso === today ? " is-today" : "")
                + (iso === value ? " is-on" : "");
              return (
                <button type="button" className={cls} key={iso} aria-pressed={iso === value} aria-label={d.toDateString()} onClick={() => pick(iso)}>
                  {d.getDate()}
                </button>
              );
            })}
          </div>
          <div className="ad-date-f">
            <button type="button" onClick={() => pick("")} disabled={!value}>Clear</button>
            <button type="button" onClick={() => pick(today)}>Today</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** One table cell: plain content, or {node, num, label} like the old renderTable spec. */
export type Cell = React.ReactNode | { node: React.ReactNode; num?: boolean; label?: string };

export interface Column {
  label: string;
  num?: boolean;
}

const isSpec = (cell: Cell): cell is { node: React.ReactNode; num?: boolean; label?: string } =>
  !!cell && typeof cell === "object" && "node" in (cell as object) && !("$$typeof" in (cell as object));

/** Table card with caption, empty state and "Showing N of M" footer (old renderTable). */
export function TableCard<T>({ id, caption, columns, empty, items, rowKey, renderRow, total, rowProps }: {
  id: string;
  caption: string;
  columns: Column[];
  empty: string;
  items: T[];
  rowKey: (item: T) => string;
  renderRow: (item: T) => Cell[];
  /** Total before filtering — shows "Showing N of M" when given. */
  total?: number;
  rowProps?: (item: T) => React.HTMLAttributes<HTMLTableRowElement>;
}) {
  return (
    <section className="ad-card ad-table-card" aria-labelledby={id + "-cap"}>
      <div className="ad-table-wrap" hidden={items.length === 0}>
        <table className="ad-table" id={id}>
          <caption id={id + "-cap"} className="ad-sr">{caption}</caption>
          <thead>
            <tr>{columns.map((c) => <th scope="col" className={c.num ? "is-num" : undefined} key={c.label}>{c.label}</th>)}</tr>
          </thead>
          <tbody id={id + "-rows"}>
            {items.map((item) => (
              <tr key={rowKey(item)} {...(rowProps ? rowProps(item) : {})}>
                {renderRow(item).map((cell, i) => {
                  const spec = isSpec(cell) ? cell : { node: cell };
                  const content = spec.node === undefined || spec.node === null || spec.node === "" ? "—" : spec.node;
                  // Phone layout shows each cell as "Label: value" — the label comes from the column header.
                  return (
                    <td key={i} className={spec.num ? "is-num" : undefined} data-label={spec.label || columns[i]?.label || ""}>
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ad-empty" id={id + "-empty"} hidden={items.length > 0}><Icon name="inbox" /><p>{empty}</p></div>
      <p className="ad-table-foot" id={id + "-foot"}>
        {total !== undefined && items.length ? "Showing " + num(items.length) + " of " + num(total) : ""}
      </p>
    </section>
  );
}

/* ---------- Dialog (admin-shell `dialog` + BTUI openDialog/closeDialog) ---------- */

export interface DialogHandle {
  open: (opener?: Element | null) => void;
  close: () => void;
}

/**
 * Native <dialog>. Control it with a ref: `dlgRef.current?.open(e.currentTarget)`.
 * Clicking the backdrop or a [data-close] button closes it; focus goes back to the opener.
 */
export function AdminDialog({ ref, id, title, wide, small, onClose, children }: {
  ref: React.Ref<DialogHandle>;
  id: string;
  title: React.ReactNode;
  wide?: boolean;
  small?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}) {
  const dlg = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useImperativeHandle(ref, () => ({
    open(from) {
      const node = dlg.current;
      if (!node) return;
      opener.current = (from as HTMLElement | null | undefined) || (document.activeElement as HTMLElement | null);
      if (!node.open) node.showModal();
      const first = node.querySelector<HTMLElement>("[autofocus], input:not([type=hidden]):not([disabled]), select, textarea, button:not([data-close])");
      first?.focus();
    },
    close() {
      if (dlg.current?.open) dlg.current.close();
    },
  }), []);

  const onClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-close]") || target === dlg.current) dlg.current?.close();
  };

  const handleClose = () => {
    if (opener.current && document.contains(opener.current)) opener.current.focus();
    opener.current = null;
    onClose?.();
  };

  return (
    <dialog className={"ad-dialog" + (wide ? " is-wide" : "") + (small ? " is-small" : "")} id={id} aria-labelledby={id + "-h"} ref={dlg} onClick={onClick} onClose={handleClose}>
      <div className="ad-dialog-head">
        <h2 id={id + "-h"}>{title}</h2>
        <button className="ad-icon-btn" type="button" data-close aria-label="Close"><Icon name="close" /></button>
      </div>
      <div className="ad-dialog-body">{children}</div>
    </dialog>
  );
}

/* ---------- Toasts + confirm (provided by AdminShell / the login page) ---------- */

export type ToastTone = "ok" | "warn" | "bad" | "info";

export interface ConfirmOptions {
  title: string;
  text?: string;
  confirm?: string;
  tone?: "bad";
}

export interface AdminUi {
  toast: (message: string, tone?: ToastTone) => void;
  /** Resolves true/false, like the old BTUI.confirmAction. */
  confirmAction: (opts: ConfirmOptions) => Promise<boolean>;
}

const AdminUiContext = createContext<AdminUi | null>(null);

export function useAdminUi(): AdminUi {
  const api = useContext(AdminUiContext);
  if (!api) throw new Error("useAdminUi() must be used inside <AdminUiProvider> (AdminShell provides it)");
  return api;
}

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
  out: boolean;
}

/** Toast region #ad-toasts + the reusable #ad-confirm dialog. */
export function AdminUiProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmOpts, setConfirmOpts] = useState<ConfirmOptions>({ title: "" });
  const seq = useRef(0);
  const confirmDlg = useRef<HTMLDialogElement>(null);
  const noBtn = useRef<HTMLButtonElement>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  const toast = useCallback((message: string, tone: ToastTone = "ok") => {
    const id = ++seq.current;
    setToasts((list) => [...list, { id, message, tone, out: false }]);
    window.setTimeout(() => setToasts((list) => list.map((t) => (t.id === id ? { ...t, out: true } : t))), 3200);
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3700);
  }, []);

  const settle = useCallback((value: boolean) => {
    const resolve = resolver.current;
    resolver.current = null;
    if (confirmDlg.current?.open) confirmDlg.current.close();
    resolve?.(value);
  }, []);

  const confirmAction = useCallback((opts: ConfirmOptions) => {
    settle(false); // a second confirm replaces an open one
    opener.current = document.activeElement as HTMLElement | null;
    setConfirmOpts(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, [settle]);

  // Open after the new title/text have rendered.
  useEffect(() => {
    if (!resolver.current || !confirmDlg.current) return;
    if (!confirmDlg.current.open) confirmDlg.current.showModal();
    noBtn.current?.focus();
  }, [confirmOpts]);

  const onConfirmClose = () => {
    if (resolver.current) settle(false);
    if (opener.current && document.contains(opener.current)) opener.current.focus();
    opener.current = null;
  };

  return (
    <AdminUiContext.Provider value={{ toast, confirmAction }}>
      {children}
      <div className="ad-toasts" id="ad-toasts" role="status" aria-live="polite">
        {toasts.map((t) => <div className={"ad-toast is-" + t.tone + (t.out ? " is-out" : "")} key={t.id}>{t.message}</div>)}
      </div>
      <dialog
        className="ad-dialog is-small"
        id="ad-confirm"
        aria-labelledby="ad-confirm-h"
        aria-describedby="ad-confirm-t"
        ref={confirmDlg}
        onClose={onConfirmClose}
        onClick={(e) => { if (e.target === confirmDlg.current) settle(false); }}
      >
        <div className="ad-dialog-head"><h2 id="ad-confirm-h">{confirmOpts.title}</h2></div>
        <div className="ad-dialog-body">
          <p id="ad-confirm-t" className="ad-confirm-text">{confirmOpts.text || ""}</p>
          <div className="ad-form-actions">
            <button type="button" className="ad-btn ad-btn-ghost" id="ad-confirm-no" ref={noBtn} onClick={() => settle(false)}>Cancel</button>
            <button type="button" className={"ad-btn" + (confirmOpts.tone === "bad" ? " ad-btn-danger" : " ad-btn-primary")} id="ad-confirm-yes" onClick={() => settle(true)}>
              {confirmOpts.confirm || "Confirm"}
            </button>
          </div>
        </div>
      </dialog>
    </AdminUiContext.Provider>
  );
}

/* ---------- Inline form errors (old BTUI.setError) ---------- */

/** <p class="ad-err"> under a field. Pair with aria-invalid + aria-describedby={id+"-err"} on the input. */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <p className="ad-err" id={id + "-err"}>{message}</p>;
}
