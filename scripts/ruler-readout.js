/**
 * Ruler Readout
 * -------------
 * Core draws the ruler's distance label inside the HUD layer, which scales
 * with canvas zoom, so it is unreadable when zoomed out. This adds a second,
 * fixed-size readout of the same distance on top of the screen. The core
 * label is left alone.
 *
 * It reads the text core already rendered rather than hooking a specific
 * Ruler class, so it works for both the measure tool and token drag rulers.
 */

const READOUT_ID = "manual-initiative-editor-ruler-readout";
const MEASUREMENT_SELECTOR = "#hud #measurement";

let observer = null;
let observed = null;
let readout = null;

function getReadout() {
  if (readout?.isConnected) return readout;
  readout = document.createElement("div");
  readout.id = READOUT_ID;
  readout.hidden = true;
  document.body.appendChild(readout);
  return readout;
}

/** Pick the ruler to show: the local user's if measuring, else the last one with labels. */
function pickTotalText(measurement) {
  const containers = [...measurement.querySelectorAll(".ruler-labels")]
    .filter((c) => c.querySelector(".total-measurement"));
  if (!containers.length) return null;
  const own = containers.find((c) => c.id.includes(game.user.id));
  const container = own ?? containers.at(-1);
  const totals = container.querySelectorAll(".total-measurement");
  return totals.item(totals.length - 1).textContent.trim() || null;
}

function update() {
  const el = getReadout();
  const measurement = document.querySelector(MEASUREMENT_SELECTOR);
  const text = measurement ? pickTotalText(measurement) : null;
  el.hidden = !text;
  el.textContent = text ?? "";
}

function attach() {
  const measurement = document.querySelector(MEASUREMENT_SELECTOR);
  if (!measurement || measurement === observed) return;
  observer?.disconnect();
  observed = measurement;
  observer = new MutationObserver(update);
  observer.observe(measurement, { childList: true, subtree: true, characterData: true });
  update();
}

Hooks.on("canvasReady", attach);
Hooks.once("ready", attach);
