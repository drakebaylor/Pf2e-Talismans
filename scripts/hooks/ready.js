import { MODULE_ID, localize } from "../constants.js";
import { registerTalismanUse } from "../talismans.js";

/** Foundry `ready` hook — world data and documents are available. */
export function onReady() {
  console.log(`${MODULE_ID} | Ready`);

  if (game.system.id !== "pf2e") {
    ui.notifications.warn(localize("notifications.wrongSystem"));
    return;
  }

  registerTalismanUse();
  console.log(`${MODULE_ID} | ${localize("notifications.loaded")}`);
}
