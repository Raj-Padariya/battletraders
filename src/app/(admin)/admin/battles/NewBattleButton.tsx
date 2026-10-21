"use client";

// Head button #bt-new — sits in the shell's .ad-head-actions like the old page; the form dialog lives in BattlesBody,
// so the click is handed over with a window event carrying the button (for focus return).
import Icon from "@admin/components/Icon";

export const BATTLE_NEW_EVENT = "bt-admin:bt-new";

export default function NewBattleButton() {
  return (
    <button
      className="ad-btn ad-btn-primary"
      type="button"
      id="bt-new"
      onClick={(e) => window.dispatchEvent(new CustomEvent<Element>(BATTLE_NEW_EVENT, { detail: e.currentTarget }))}
    >
      <Icon name="plus" /><span>Add battle</span>
    </button>
  );
}
