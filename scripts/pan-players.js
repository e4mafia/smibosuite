/**
 * Pan Players
 * -----------
 * Lets the GM pan every connected player's camera to a chosen point,
 * token, or the GM's current view - via socketlib, no player interaction
 * required.
 *
 * Registers a socketlib function that every client can receive. Only the
 * GM should ever call the "trigger" functions below, but the receiving
 * function is registered on ALL clients automatically as soon as the
 * module loads.
 */

const MODULE_ID = "smibosuite";
const MODULE_DISPLAY_NAME = "SmiboSuite";

function isEnabled() {
  return game.settings.get(MODULE_ID, "enablePanPlayers");
}

let panSocket;

function registerSocket() {
  if (panSocket) return; // already registered, avoid double-registration
  panSocket = socketlib.registerModule(MODULE_ID);
  panSocket.register("panTo", receivePan);
  console.log(`${MODULE_ID} | socketlib registered for pan`);
}

// Settings are registered on "init" (see settings.js, which loads first),
// so the setting is safe to read as soon as "init" fires here.
Hooks.once("init", () => {
  if (!isEnabled()) return;

  // Normal path: socketlib fires this hook once it's ready.
  Hooks.once("socketlib.ready", registerSocket);

  // Fallback path: if socketlib.ready already fired before this script
  // finished loading (a real race condition on some setups, especially
  // with CDN-served assets like Forge), poll for the global until it
  // shows up, then register directly instead of waiting on a hook that
  // already fired.
  if (typeof socketlib !== "undefined") {
    registerSocket();
  } else {
    let attempts = 0;
    const maxAttempts = 50; // ~10 seconds at 200ms
    const poll = setInterval(() => {
      attempts++;
      if (typeof socketlib !== "undefined") {
        clearInterval(poll);
        registerSocket();
      } else if (attempts >= maxAttempts) {
        clearInterval(poll);
        console.error(`${MODULE_ID} | socketlib never became available. Is the socketlib module enabled?`);
      }
    }, 200);
  }
});

/**
 * Executed on every client (including the GM's own) when a pan
 * is broadcast.
 */
function receivePan({ x, y, scale, duration = 600 }) {
  if (!canvas?.ready) return;
  const panData = { x, y, duration };
  if (typeof scale === "number") panData.scale = scale;
  canvas.animatePan(panData);
}

/**
 * Public API: pan everyone to explicit coordinates.
 */
async function waitForPanSocket(timeoutMs = 3000) {
  const start = Date.now();
  while (!panSocket) {
    if (Date.now() - start > timeoutMs) return null;
    await new Promise((r) => setTimeout(r, 100));
  }
  return panSocket;
}

async function panAllTo(x, y, scale) {
  if (!game.user.isGM) {
    ui.notifications.warn("Only the GM can pan all players.");
    return;
  }
  if (!isEnabled()) {
    ui.notifications.warn(`${MODULE_DISPLAY_NAME}: Pan Players is disabled in Configure Settings.`);
    return;
  }
  const socket = await waitForPanSocket();
  if (!socket) {
    ui.notifications.error(`${MODULE_DISPLAY_NAME}: socketlib not ready. Check that the socketlib module is enabled.`);
    return;
  }
  // Default to the GM's current zoom so players land on the same view,
  // not just the same point. Pass an explicit scale to override this.
  const data = { x, y, scale: scale ?? canvas.stage.scale.x };
  await socket.executeForEveryone("panTo", data);
}

/**
 * Public API: pan everyone to a specific token (defaults to the
 * GM's currently controlled token if none is passed).
 */
async function panAllToToken(token) {
  const t = token ?? canvas.tokens.controlled[0];
  if (!t) {
    ui.notifications.warn("No token selected to pan to.");
    return;
  }
  await panAllTo(t.center.x, t.center.y);
}

/**
 * Public API: let the GM click a point on the canvas, then pan
 * everyone there.
 */
function panAllByClick() {
  if (!game.user.isGM) {
    ui.notifications.warn("Only the GM can pan all players.");
    return;
  }
  ui.notifications.info("Click anywhere on the canvas to pan everyone's view there.");
  const clickHandler = (event) => {
    const pos = event.data?.getLocalPosition
      ? event.data.getLocalPosition(canvas.stage)
      : event.getLocalPosition(canvas.stage);
    panAllTo(pos.x, pos.y);
    canvas.stage.off("pointerdown", clickHandler);
  };
  canvas.stage.once("pointerdown", clickHandler);
}

// Expose a small API on the global game object so macros can call it,
// e.g. game.modules.get("smibosuite").api.panAllToToken()
Hooks.once("ready", () => {
  if (!isEnabled()) return;
  const mod = game.modules.get(MODULE_ID);
  mod.api = Object.assign(mod.api ?? {}, { panAllTo, panAllToToken, panAllByClick });
});

// Optional: add a scene control button for one-click GM access
// v13 changed controls/tools from arrays to keyed objects.
Hooks.on("getSceneControlButtons", (controls) => {
  if (!game.user.isGM || !isEnabled()) return;

  const tokenControls = foundry.utils.isNewerVersion(game.version, "13.0.0")
    ? controls.tokens ?? controls.token
    : controls.find?.((c) => c.name === "token");

  if (!tokenControls) return;

  const tool = {
    name: "pan-all-players",
    title: "Pan All Players Here",
    icon: "fas fa-crosshairs",
    button: true,
    onClick: () => panAllByClick()
  };

  if (foundry.utils.isNewerVersion(game.version, "13.0.0")) {
    // v13: tools is a keyed object
    tokenControls.tools["pan-all-players"] = tool;
  } else {
    // v11/v12: tools is an array
    tokenControls.tools.push(tool);
  }
});
