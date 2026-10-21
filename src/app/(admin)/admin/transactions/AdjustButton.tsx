"use client";

// Head button #tx-adjust. It lives in the shell's .ad-head-actions (like the old page) while the dialog lives in
// TransactionsBody, so the click is handed over with a window event.
import Icon from "@admin/components/Icon";

export const ADJUST_EVENT = "bt-admin:tx-adjust";

export default function AdjustButton() {
  return (
    <button
      className="ad-btn ad-btn-primary"
      type="button"
      id="tx-adjust"
      onClick={(e) => window.dispatchEvent(new CustomEvent<Element>(ADJUST_EVENT, { detail: e.currentTarget }))}
    >
      <Icon name="dollar" /><span>Adjust a balance</span>
    </button>
  );
}
