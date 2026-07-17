import { MODULE_ID } from "../constants.js";
import { registerSettings } from "../settings.js";

/** Foundry `init` hook — core APIs available; world documents not yet ready. */
export function onInit() {
  console.log(`${MODULE_ID} | Initializing`);
  registerSettings();
}
