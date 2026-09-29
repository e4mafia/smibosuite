/**
 * Settings
 * --------
 * Registers one on/off checkbox per feature under Configure Settings, so
 * each part of the suite can be disabled independently for diagnostics
 * (e.g. to check whether a specific feature is the cause of some other
 * conflict). Changing any of these requires a reload to take effect.
 */

const MODULE_ID = "smibosuite";

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "enableInitiativeEditor", {
    name: "Enable Initiative Editor",
    hint: "Double-click a combatant's initiative in the Combat Tracker to type in a new value by hand.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true
  });

  game.settings.register(MODULE_ID, "enableRulerReadout", {
    name: "Enable Ruler Readout",
    hint: "Show a large, zoom-independent readout of the ruler's total distance.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true
  });

  game.settings.register(MODULE_ID, "enablePanPlayers", {
    name: "Enable Pan Players",
    hint: "Let the GM pan every connected player's camera to a point, token, or click (requires socketlib).",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true
  });
});
