import { MODULE_ID } from "./constants.js";
import { onInit } from "./hooks/init.js";
import { onReady } from "./hooks/ready.js";

console.log(`${MODULE_ID} | Module script loaded`);

Hooks.once("init", onInit);
Hooks.once("ready", onReady);
