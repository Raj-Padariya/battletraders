"use client";

// Head buttons (#vo-new, #bt-new) sit in the shell's .ad-head-actions like the old pages, while the dialogs they open
// live in the page body — the click is handed over with a window event carrying the button (for focus return).
import Icon from "@admin/components/Icon";

export const VOUCHER_NEW_EVENT = "bt-admin:vo-new";

export default function NewCodeButton() {
  return (
    <button
      className="ad-btn ad-btn-primary"
      type="button"
      id="vo-new"
      onClick={(e) => window.dispatchEvent(new CustomEvent<Element>(VOUCHER_NEW_EVENT, { detail: e.currentTarget }))}
    >
      <Icon name="plus" /><span>Create code</span>
    </button>
  );
}
