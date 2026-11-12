# Bomberman 2.0.1 — Long-session stability migration (private development)

## Purpose

This release continues the compatibility-first Bomberman 2.0 architecture migration and fixes three independently reproduced long-session runtime conflicts. It is based on the previous **2.0 development build**, ultimately derived from public GitHub `main` at `210388cb9888e82b42ce9c844ba65e1c04f94aaf`. **Nothing was pushed to GitHub.** The original published application remains unchanged.

## Identified root causes and fixes

1. **Unbounded `Bot.update()` wrapper chain**: `runtime-v0161-speed-standard.js` and `runtime-v016230-round-skill-version.js` periodically reinstalled wrappers on one another because each checked only the latest function's marker. An isolated timer reproduction observed **401 prototype assignments in 30 simulated seconds**. Both now keep durable installation state on the `Bot.prototype` and install the guards once. Synthetic 10-minute regression: **2 assignments**.
2. **Unbounded `Bot.plantBomb()` wrapper chain**: `runtime-v016211-travel-chat-drops.js`, `runtime-v016215-bomb-travel.js`, and `runtime-v016221-return-controls.js` alternated wrapper ownership and rewrapped each other repeatedly. An isolated reproduction exceeded **1,000 assignments in 30 simulated seconds** with the associated optional v016214 compatibility code, or **754** without it. Each installer now records its stable installation on the prototype, preserving the exact original wrapping logic and bomb behaviors. Synthetic 10-minute regression: **3 assignments** for the loaded stack.
3. **Competing Bomb Kick direct-throw owners**: the v016221 and v016222 throw controls could repeatedly replace `Player.prototype.throwBombNow` because the newer owner did not carry the older compatibility marker. The v016222 handler now exposes both markers, becoming the stable direct-throw owner. Synthetic 10-minute regression: **2 initial assignments and no further changes**.
4. **Unnecessary repeated UI mutations**: the social/scoring runtime was rewriting score/post-match HTML on a 100 ms timer even when the content was identical. Writes now occur only when the desired content actually differs. Existing score calculations and event rules were not changed.
5. **Long-session diagnostics**: `BomberEngine2Diagnostics` now records bounded round and frame data without introducing a background timer. Browser console:
   ```js
   BomberEngine2Diagnostics.snapshot()
   BomberEngine2Diagnostics.history()
   ```
   `snapshot()` shows round/frame counts, game entity counts, stage children, recent frame execution samples, input listener count, and selected network metrics. `history()` retains only the most recent 40 round initializations. The timing metric measures only JavaScript frame-update work every tenth frame and is **not** equivalent to actual display FPS.

## Feature and source preservation

- **218 of 218 original public files retained**, verified using the public base-commit SHA-256 manifest.
- **204 of those originals are byte-for-byte unchanged**; 14 existing files changed for the 2.0 architecture migration, this stability fix, and cache busting. No original source or media asset was removed.
- All original AI tactical algorithms, personalities, local multiplayer, hosted/guest multiplayer, public matchmaking delays, simulated human fallback, leaderboard, all stacking scoring rules, all Bomb Kick mechanics and older compatibility modules, maps, sound, chat, and UI remain present.
- Current modules are still partially layered rather than fully consolidated. Remaining wrappers were retained intentionally until behavior parity can be established with actual browser gameplay.
- WebRTC connection reliability is still dependent on the connection environment; these fixes target degradation during repeated rounds, not all external connectivity failures.

## Tests that passed

Run from the top level of the extracted ZIP (requires Node.js 22 or compatible):

```bash
node .github/scripts/engine2-core-parity.mjs
node .github/scripts/engine2-loader-parity.mjs
node .github/scripts/engine2-feature-parity.mjs
node .github/scripts/engine2-long-session-regression.mjs
node .github/scripts/engine2-diagnostics-regression.mjs
node .github/scripts/ai-controller-regression.mjs
node .github/scripts/v16212-owner-drop-smoke.mjs
```

Results in the build environment:

- 40 consecutive simulated game restarts and 20 frame-update comparisons against the original engine: **PASS**.
- Exact 39-module compatibility loader order, including three packed runtime modules: **PASS**.
- All 218 public baseline paths exist; all 204 designated unchanged originals match recorded SHA-256 hashes: **PASS**.
- Repeated patch checks over a **synthetic 10-minute clock**: `Bot.update` 2 assignments, `Bot.plantBomb` 3, `Player.throwBombNow` 2; **PASS**.
- Diagnostic frame/history bounds checked across 180 synthetic round starts and 5,000 frame calls: **PASS**.
- AI controller regression: **22 of 22 PASS**.
- Bomb and power-up ownership/drop smoke: **PASS**.
- All 120 `.js` sources: `node --check` **PASS**.
- Tests now include local fixtures + baseline checksum manifest, so the parity tests work without requiring the developer's original working directory.

### Not yet verified

- **Actual browser gameplay across 5–10 consecutive rounds** and gameplay performance over an extended live session.
- **Two-device WebRTC private/public matches**, spectator promotion, host disconnect/reconnect, and client synchronization after repeated rematches.
- Full GUI-driven Bomb Kick and return-to-sender regression with real DOM, animation, and browser networking.

Some existing GUI regression scripts depend on `puppeteer-core`, which is not installed in this environment; local Chromium navigation was also unavailable. The synthetic tests demonstrate that the observed unbounded wrapper growth has been stopped; they **do not guarantee every possible cause of freezing has been eliminated**.

## How to test

1. Extract the ZIP, open `Bomberman-Ultimate-Universal-Web-v0.10`.
2. Double-click `serve.command` on macOS, or use `python3 -m http.server 8765` from the game directory.
3. Open `http://localhost:8765/` in Chrome or another modern browser.
4. Play at least ten consecutive public simulated rounds, then a multi-round private match with a friend if available. Include regular bombs, Bomb Kick, return-to-sender, rematch, and spectator controls.
5. If lag returns, open Developer Tools > Console and run `BomberEngine2Diagnostics.snapshot()` and `BomberEngine2Diagnostics.history()`; sharing these readouts along with the console error text will help isolate the remaining issue.

Do not replace the existing public GitHub build until live regression tests have been completed and you expressly request publication.
