# Pf2e Talismans

A Foundry Virtual Tabletop module for Pathfinder Second Edition that makes affixing talismans easier to track.

## Requirements

- Foundry Virtual Tabletop 14
- Pathfinder Second Edition system 8.x

## Features

- Intercepts the **Use** action for consumables with the talisman category or trait.
- Reads the talisman's usage field to identify compatible inventory targets.
- Prompts the user to select the item receiving the talisman.
- Adds an Effect to the character named:

  `{Talisman Name} Talisman affixed to {Target Item}`

- Uses the talisman's artwork as the Effect icon.
- Removes one talisman from the character's inventory after it is affixed.
- Leaves the normal PF2e workflow unchanged for all other consumables.

## Installation

1. Create this directory in the Foundry user-data location:

   `Data/modules/pf2e-talismans`

2. Upload the contents of this project directly into that directory. The manifest must be located at:

   `Data/modules/pf2e-talismans/module.json`

3. Restart Foundry VTT.
4. Open a PF2e world and enable **Pf2e Talismans** under **Manage Modules**.

## Usage

1. Add a talisman and a compatible weapon, armor, shield, or other applicable item to a character.
2. Expand the talisman in the character's inventory and click **Use**. The Use button on a talisman chat card also works.
3. Select a target from the popup and click **Affix Talisman**.
4. The character receives an Effect recording the talisman and its target.

If the character has no compatible target, the module displays a warning and does not remove the talisman.

## Project Structure

```text
pf2e-talismans/
├── module.json
├── README.md
├── lang/
│   └── en.json
├── scripts/
│   ├── module.js
│   ├── constants.js
│   ├── settings.js
│   ├── talismans.js
│   └── hooks/
│       ├── init.js
│       └── ready.js
├── styles/
│   └── module.css
└── templates/
    └── talisman-target-dialog.hbs
```

## Development

The module wraps PF2e's consumable `consume()` method after Foundry is ready. Only talismans use the custom affixing workflow; calls for other consumables are passed to PF2e unchanged.

After changing module files on a hosted Foundry instance, upload the changed files and restart Foundry to ensure scripts and the manifest are reloaded.

