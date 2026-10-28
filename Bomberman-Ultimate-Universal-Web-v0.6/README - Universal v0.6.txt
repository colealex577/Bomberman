Bomberman Ultimate Online — Universal v0.6

ONE GAME BUILD, AUTOMATIC CONTROLS
- Desktop/Mac browser: keyboard controls, no touch overlay.
- iPhone/iPad/touch devices: analog-style joystick + bomb/sound/menu controls appear automatically.
- Online rooms use the same protocol across desktop and mobile.

ROOM CODE FIX
- Game keyboard shortcuts no longer intercept typing inside lobby fields.
- Codes containing W, A, S, D, M, Enter-related input, etc. can be entered normally.
- Codes are normalized only when joining/leaving the field rather than on every keystroke.

SMARTER AI
- Shortest-path pursuit of the nearest living human or AI.
- Prioritizes exposed power-ups when safe.
- Tracks bomb danger zones and searches for escape routes before planting.
- Plants bombs in clear blast lines toward opponents.
- Routes to destructible wood to open blocked paths.
- Keeps bomb-capacity upgrades and can use multiple bombs.
- Ultimate Mode AI remains 2x base speed and uses the darker bot appearance.

ULTIMATE MODE
- 100% power-up drops from destructible blocks.
- 5x pickup effects.
- 1.5x soundtrack speed.

WEB / IPHONE
Host these files over HTTPS (GitHub Pages works). Open the same URL on Mac/desktop or iPhone.
On iPhone: Safari > Share > Add to Home Screen for an app-like launcher.

MAC APP
The separate .app package in this release uses these exact same game files and simply starts a local server/open browser.
