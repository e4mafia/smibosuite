/**
 * Initiative Editor
 * ------------------
 * Double-click a combatant's initiative value in the Combat Tracker to
 * replace it with a number input, type a new value, and press Enter
 * (or click away) to save it.
 *
 * Since Foundry v13, core already renders initiative as an always-editable
 * text input when every value in the encounter is a whole number - no
 * double-click needed there, and this module leaves that input alone.
 * Core only falls back to a plain, read-only <span> once *any* combatant
 * in the encounter has a decimal initiative (e.g. from a dex-tiebreak
 * house rule), which is the gap this module fills.
 *
 * Core's Combat Tracker also has its own dblclick listener on the same
 * root element that opens the combatant's actor sheet on that read-only
 * span. Our listener is bound in the capture phase and stops propagation
 * so it runs first and suppresses core's handler, instead of both firing
 * and the actor sheet stealing focus mid-edit.
 */

const MODULE_ID = "smibosuite";

/** Only the read-only initiative display; core's own editable input is left untouched. */
const INITIATIVE_SELECTOR = ".token-initiative > span";

/** Selector for the list item / row that carries the combatant's id. */
const COMBATANT_ROW_SELECTOR = "[data-combatant-id]";

Hooks.on("renderCombatTracker", (app, html) => {
  // ApplicationV2 (v13+) passes a raw HTMLElement; the legacy Application
  // passes a jQuery object. Normalize to a plain element either way.
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root) return;

  refreshTooltips(root);

  // The ApplicationV2 tracker keeps the same root element across re-renders
  // and only swaps out its inner parts, so guard against double-binding.
  if (root.dataset.manualInitiativeBound === "true") return;
  root.dataset.manualInitiativeBound = "true";

  root.addEventListener("dblclick", (event) => onDoubleClick(event, app), true);
});

/** Add a helpful tooltip to initiative displays for the GM. */
function refreshTooltips(root) {
  if (!game.user.isGM) return;
  for (const el of root.querySelectorAll(INITIATIVE_SELECTOR)) {
    el.title = "Double-click to set initiative manually";
  }
}

function getCombatantId(el) {
  const row = el.closest(COMBATANT_ROW_SELECTOR);
  return row?.dataset?.combatantId ?? null;
}

async function onDoubleClick(event, app) {
  // Only the GM should be hand-editing initiative values.
  if (!game.user.isGM) return;

  const target = event.target.closest(INITIATIVE_SELECTOR);
  if (!target) return;

  const combatantId = getCombatantId(target);
  if (!combatantId) return;

  const combat = app.viewed ?? game.combat;
  const combatant = combat?.combatants?.get(combatantId);
  if (!combat || !combatant) return;

  // Suppress core's own dblclick handler (bound to the same root element
  // in the bubble phase), which would otherwise open the actor sheet.
  event.preventDefault();
  event.stopPropagation();

  const originalHTML = target.innerHTML;
  const originalInitiative = combatant.initiative;
  const currentValue = originalInitiative ?? "";

  const input = document.createElement("input");
  input.type = "number";
  input.step = "any";
  input.value = currentValue;
  input.classList.add("smibosuite-initiative-input");

  target.innerHTML = "";
  target.appendChild(input);
  input.focus();
  input.select();

  let resolved = false;

  const restore = () => {
    if (target.contains(input)) target.innerHTML = originalHTML;
  };

  const commit = async () => {
    if (resolved) return;
    resolved = true;

    let value = parseFloat(input.value);
    if (Number.isNaN(value)) {
      restore();
      return;
    }

    // No decimal typed: keep whatever decimal portion the initiative
    // already had, only replacing the whole-number part.
    if (!input.value.includes(".") && Number.isFinite(originalInitiative)) {
      const originalFraction = originalInitiative - Math.trunc(originalInitiative);
      value = Math.trunc(value) + originalFraction;
    }

    try {
      // combat.setInitiative() updates the combatant and triggers a
      // re-render, which will naturally replace this input with the
      // freshly formatted initiative display.
      await combat.setInitiative(combatantId, value);
    } catch (err) {
      console.error(`${MODULE_ID} | Failed to set initiative`, err);
      ui.notifications?.error("Failed to set initiative. See console for details.");
      restore();
    }
  };

  const cancel = () => {
    if (resolved) return;
    resolved = true;
    restore();
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
    // Prevent Foundry's global hotkeys from firing while typing.
    e.stopPropagation();
  });

  input.addEventListener("blur", () => commit());
  input.addEventListener("click", (e) => e.stopPropagation());
  input.addEventListener("dblclick", (e) => e.stopPropagation());
}
