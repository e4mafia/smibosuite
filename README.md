# SmiboSuite

A small suite of Foundry VTT (v13+) quality-of-life tools:

- **Initiative Editor** — double-click a combatant's initiative value in
  the Combat Tracker to type in a new number by hand.
- **Ruler Readout** — shows the ruler's distance in a large, fixed-size
  readout that doesn't shrink when you zoom out, unlike core's label.
- **Pan Players** — lets the GM pan every connected player's camera to a
  chosen point, token, or clicked location — and matches the GM's current
  zoom level too — with zero action required from players. Requires the
  [socketlib](https://foundryvtt.com/packages/socketlib) module.

Each feature can be turned off independently — see
[Settings](#settings) below.

## Installation

### Option A — via manifest URL (recommended once published on GitHub)

1. In Foundry, go to **Add-on Modules → Install Module**.
2. Paste this into the Manifest URL field:
   `https://raw.githubusercontent.com/e4mafia/smibosuite/main/module.json`
3. Click **Install**, then enable **SmiboSuite** in your World's
   **Manage Modules** settings.

### Option B — manual install

1. Download/unzip this folder so it becomes:
   `<FoundryData>/Data/modules/smibosuite/`
   (it must contain `module.json` directly inside that folder).
2. Restart Foundry (or reload the Setup page) so it picks up the new module.
3. In your World, go to **Settings → Manage Modules**, enable
   **SmiboSuite**, and save.

## Publishing this to your own GitHub (e4mafia)

No GitHub Release needed — `module.json`'s `download` field points at
GitHub's auto-generated branch archive:
`https://github.com/e4mafia/smibosuite/archive/refs/heads/main.zip`
GitHub builds that zip on the fly from whatever is currently on `main`, so
it's always available with zero extra steps.

1. Create a new repo, e.g. `smibosuite`, under your account.
2. Push the contents of this folder to the `main` branch, keeping the
   layout intact: `module.json` at the repo root, JS in `scripts/`, CSS in
   `styles/`.
3. That's it — the manifest URL and download URL both work immediately.
4. Whenever you make changes, just commit to `main` and bump `version` in
   `module.json`. The branch archive always reflects the latest commit, so
   there's nothing else to update.

## Usage

### Initiative Editor

- Open the Combat Tracker with an active encounter.
- If every combatant's initiative is a whole number, Foundry (v13+) already
  shows it as an editable text box — just click in and type, no need for
  this module.
- If *any* combatant in the encounter has a decimal initiative (e.g. from a
  dex-tiebreak house rule or module), Foundry falls back to plain,
  read-only text for everyone. As the GM, double-click that number to turn
  it into an editable box, type the new value, and press **Enter** (or
  click elsewhere) to save it, or **Esc** to cancel.
- Typing a plain whole number keeps whatever decimal portion the
  initiative already had (e.g. `15.37` → type `20` → `20.37`). Typing an
  explicit decimal (e.g. `20.5`) overrides it exactly.

### Ruler Readout

- Use the measure tool, or drag a token, as normal.
- A large, fixed-size readout of the total distance appears at the top of
  the screen, staying readable no matter how far you're zoomed out. Core's
  own (zoom-scaled) label is left untouched.

### Pan Players

- Requires the [socketlib](https://foundryvtt.com/packages/socketlib)
  module to also be installed and enabled — it's on the official Foundry
  package list.
- Every pan also sets players' zoom to match the GM's current zoom, unless
  an explicit `scale` is passed.
- **Scene control button** — a crosshair icon appears in the token
  controls toolbar. Click it, then click anywhere on the canvas to pan
  every player there (at your current zoom).
- **Macro — pan to a token** (uses your currently selected token if none
  is passed):
  ```js
  game.modules.get("smibosuite").api.panAllToToken();
  ```
- **Macro — pan to a click:**
  ```js
  game.modules.get("smibosuite").api.panAllByClick();
  ```
- **Macro — pan to exact coordinates** (`x`, `y`, optional `scale` to
  override the default of matching your current zoom):
  ```js
  game.modules.get("smibosuite").api.panAllTo(1200, 800, 1);
  ```

## Settings

In **Settings → Configure Settings**, under the SmiboSuite section, there's
an on/off checkbox for each feature (Initiative Editor, Ruler Readout, Pan
Players) — useful for diagnostics, e.g. to rule out whether a specific
feature is the cause of some other conflict. These are world settings (set
once for everyone, GM-only), and changing one prompts a reload to take
effect.

## Notes

- Only the GM can edit initiative this way (matches how initiative is
  normally managed).
- This only changes how you *enter* a value manually — it doesn't touch
  dice rolling, turn order, or any other combat behavior.
- Built against the Foundry v13/v14 Combat Tracker and Ruler; it uses
  generic selectors and should keep working if minor markup tweaks happen
  in later point releases, but let me know if a specific system's custom
  tracker doesn't pick it up.
