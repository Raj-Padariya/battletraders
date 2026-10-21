/* BattleTrader Admin — login config. Port of admin/assets/js/admin-config.js (window.BTAdminConfig).
   Demo protection only: anyone can read client-side code. Real auth arrives with the backend.
   Only a SHA-256 hash of "bt-admin:" + password is stored, never the password itself.
   Regenerate with: node .tenaxcode/scripts/admin-hash.js "<new password>"
   A password changed in Settings is stored in localStorage `bt-admin-config` and wins over this default. */

export interface AdminConfig {
  email: string;
  passwordHash: string;
  sessionHours: number;
  maxAttempts: number;
  lockMinutes: number;
}

export const BTAdminConfig: AdminConfig = {
  email: "admin@battletrader.com",
  passwordHash: "79c36abd7d7e4d44ba129c852b51677bc889d02bf86764ff15ed387992d4e8b7",
  sessionHours: 8,
  maxAttempts: 5,
  lockMinutes: 5,
};
