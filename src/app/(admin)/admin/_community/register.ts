// Registers the alliances + achievements data with the admin store, like the old pages did by loading
// alliances-data.js / achievements-data.js before community.js. Import this module for its side effect.
import { registerAdminModules } from "@admin/lib/store";
import * as BTAchievements from "./achievements";
import { BTAlliances } from "./alliances";

registerAdminModules({
  alliances: BTAlliances,
  achievements: {
    list: BTAchievements.list,
    progressFor: (profile) => BTAchievements.progressFor(profile),
    evaluate: (a, progress) => {
      const full = BTAchievements.list.find((x) => x.id === a.id);
      return full ? BTAchievements.evaluate(full, progress) : { pct: 0, unlocked: false };
    },
  },
});
