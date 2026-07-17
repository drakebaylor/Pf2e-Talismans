/** @typedef {typeof MODULE_ID} ModuleId */

export const MODULE_ID = "example-module";

/** Localization key helper: `example-module.some.key` */
export function localize(key, data) {
  const path = key.startsWith(`${MODULE_ID}.`) ? key : `${MODULE_ID}.${key}`;
  return game.i18n.format(path, data);
}
