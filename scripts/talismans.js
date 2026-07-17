import { MODULE_ID, localize } from "./constants.js";

const CONSUME_WRAPPED = Symbol.for(`${MODULE_ID}.consumeWrapped`);
const PHYSICAL_TARGET_TYPES = new Set(["armor", "equipment", "shield", "weapon"]);

/**
 * Wrap PF2e's consumable workflow so every Use button follows the same
 * talisman-affixing flow, including buttons in inventory summaries and chat.
 */
export function registerTalismanUse() {
  const Consumable = CONFIG.PF2E?.Item?.documentClasses?.consumable;
  const prototype = Consumable?.prototype;

  if (!prototype || prototype[CONSUME_WRAPPED]) return;

  const consume = prototype.consume;
  Object.defineProperty(prototype, CONSUME_WRAPPED, { value: true });

  prototype.consume = async function (...args) {
    if (!isTalisman(this)) {
      return consume.apply(this, args);
    }

    return affixTalisman(this);
  };
}

function isTalisman(item) {
  return (
    item.category === "talisman" ||
    item.traits?.has?.("talisman") ||
    item.system.traits?.value?.includes("talisman")
  );
}

async function affixTalisman(talisman) {
  const actor = talisman.actor;
  if (!actor?.canUserModify(game.user, "update")) {
    ui.notifications.warn(localize("notifications.noPermission"));
    return;
  }

  const usage = talisman.system.usage?.value ?? "";
  const targets = actor.items
    .filter((item) => PHYSICAL_TARGET_TYPES.has(item.type) && isValidTarget(item, usage))
    .sort((a, b) => a.name.localeCompare(b.name, game.i18n.lang));

  if (targets.length === 0) {
    ui.notifications.warn(
      localize("notifications.noTargets", {
        usage: getUsageLabel(usage),
      }),
    );
    return;
  }

  const targetId = await chooseTarget(talisman, targets, usage);
  if (!targetId) return;

  const target = actor.items.get(targetId);
  if (!target) {
    ui.notifications.error(localize("notifications.targetMissing"));
    return;
  }

  const effectName = localize("effect.name", {
    talisman: talisman.name,
    target: target.name,
  });
  const effectSource = {
    name: effectName,
    type: "effect",
    img: talisman.img,
    system: {
      description: {
        value: localize("effect.description", {
          talisman: foundry.utils.escapeHTML(talisman.name),
          target: `@UUID[${target.uuid}]{${foundry.utils.escapeHTML(target.name)}}`,
        }),
      },
      rules: [],
      tokenIcon: { show: true },
    },
    flags: {
      [MODULE_ID]: {
        sourceTalismanId: talisman.id,
        sourceTalismanName: talisman.name,
        targetItemId: target.id,
        targetItemName: target.name,
        usage,
      },
    },
  };

  const created = await actor.createEmbeddedDocuments("Item", [effectSource]);
  if (created.length === 0) return;

  try {
    await removeOneTalisman(talisman);
  } catch (error) {
    await created[0].delete();
    throw error;
  }

  ui.notifications.info(localize("notifications.affixed", {
    talisman: talisman.name,
    target: target.name,
  }));
}

async function chooseTarget(talisman, targets, usage) {
  const content = await renderTemplate(
    `modules/${MODULE_ID}/templates/talisman-target-dialog.hbs`,
    {
      prompt: localize("dialog.prompt", {
        talisman: talisman.name,
        usage: getUsageLabel(usage),
      }),
      targetLabel: localize("dialog.target"),
      targets: targets.map((target) => ({
        id: target.id,
        name: target.name,
        type: getItemTypeLabel(target),
      })),
    },
  );

  const result = await foundry.applications.api.DialogV2.input({
    window: { title: localize("dialog.title", { talisman: talisman.name }) },
    content,
    ok: {
      label: localize("dialog.affix"),
      icon: "fa-solid fa-hammer",
    },
    rejectClose: false,
    modal: true,
  });

  return typeof result?.targetId === "string" ? result.targetId : null;
}

function getUsageLabel(usage) {
  const key = CONFIG.PF2E.usages?.[usage];
  return key ? game.i18n.localize(key) : usage.replaceAll("-", " ");
}

function getItemTypeLabel(item) {
  const key = CONFIG.Item.typeLabels?.[item.type];
  return key ? game.i18n.localize(key) : item.type;
}

/**
 * Match the broad object classes encoded in PF2e usage values. More-specific
 * wording (metal, handedness, and similar restrictions) remains visible in the
 * dialog so the player can make the rules-appropriate choice.
 */
function isValidTarget(item, usage) {
  const normalized = usage.toLowerCase();
  const mentionsWeapon = /(weapon|firearm|crossbow|magical-staff)/.test(normalized);
  const mentionsArmor = /(armor|unarmored-defense-item|travelers-clothing)/.test(normalized);
  const mentionsShield = normalized.includes("shield");

  if (mentionsWeapon || mentionsArmor || mentionsShield) {
    return (
      (mentionsWeapon && item.type === "weapon") ||
      (mentionsArmor && item.type === "armor") ||
      (mentionsShield && item.type === "shield")
    );
  }

  if (normalized.includes("headgear")) {
    return item.type === "equipment" && item.system.usage?.where === "headwear";
  }

  return PHYSICAL_TARGET_TYPES.has(item.type);
}

/** Remove the represented talisman without posting PF2e's "used" chat card. */
async function removeOneTalisman(talisman) {
  const uses = talisman.system.uses;

  if (uses.autoDestroy && uses.value <= 1) {
    if (talisman.quantity <= 1) {
      await talisman.delete();
    } else {
      await talisman.update({
        "system.quantity": talisman.quantity - 1,
        "system.uses.value": uses.max,
      });
    }
  } else {
    await talisman.update({
      "system.uses.value": Math.max(uses.value - 1, 0),
    });
  }
}
