# Bomberman v2.0.2 — Round bombs and equal starting speed

Public release, continuing v2.0.1. Published to the existing GitHub Pages application.

## Changes

- Round-owned bomb inventory: reconcile owned bombs against the current world's bomb list before placement, eliminate stale and duplicate entries, and enforce real capacity and occupied tiles. Preserve original explosion callbacks and existing traveling-bomb capacity rules.
- Normal bomb input dispatch resolves the current actor instead of relying solely on a closure captured in an earlier round. Round setup clears pressed keys; key release over chat also clears input state. Authoritative remote normal placement uses the same canonical placement path. Guests do not spawn authoritative bombs locally.
- Keep wrapper installation markers across the older bomb, travel, return, bonus, and control compatibility layers. Prevent competing normal-bomb and kick input listeners from repeatedly replacing one another. Preserve Bomb Kick mechanics and existing ownership/impact rules.
- All fresh human and AI actors start at 2 pixels per engine tick, including simulated humans of every rating and Ultimate Mode. Earned speed pickups add 0.8 (4 in Ultimate Mode); retained in-progress observer loadouts preserve their actual pickup counts. Difficulty and aggression do not grant extra starting speed. Legacy speed writers delegate to the canonical speed rule before actual movement.
- Current release UI, title, application manifest, shared build identifier, and service worker/cache keys identify v2.0.2. Historical file/module names and network protocol identifiers remain unchanged for compatibility. All packed gameplay code matches its expanded source.

## Verification

Run from the extracted release root (Node.js 22 or compatible):

```
node .github/scripts/engine2-round-bomb-speed-regression.mjs
node .github/scripts/engine2-core-parity.mjs
node .github/scripts/engine2-loader-parity.mjs
node .github/scripts/engine2-feature-parity.mjs
node .github/scripts/engine2-long-session-regression.mjs
node .github/scripts/engine2-diagnostics-regression.mjs
node .github/scripts/ai-controller-regression.mjs
node .github/scripts/v16212-owner-drop-smoke.mjs
```

Results: 20 synthetic rounds, 80 canonical normal placements including 20 local second-player placements and 20 host-side remote normal placements; 20 additional host-side remote traveling placements. Stale inventory, capacity, occupied tile, obsolete actors, input listeners and guest authority assertions passed. The 29-installers, synthetic 10-minute regression has no further wrapper growth after installation: Player.placeBomb 9 assignments, Player.setBombsListener 2, Player.throwBombNow 2, Bomb.update 6, Bonus.init 2. All 32 tested difficulty/rating/mode combinations normalize to 2 baseline and preserve genuine speed bonuses. 40 core restart comparisons, 20 frame comparisons, 39 runtime load-order checks, 22 AI controller regressions, diagnostic bounds over 180 rounds/5000 frames, and JavaScript syntax checks passed. All 218 original public paths retained (168 unchanged by byte comparison). All 121 precache entries resolve to included assets.

## Limits and live testing

These are isolated and synthetic tests, not a live browser multiplayer run. Browser access to the local game was blocked by the execution environment. In particular, extended actual multiplayer gameplay and all interactions between compatibility modules require live validation. The changes address concrete accumulating wrapper and stale ownership problems but do not prove that every cause of failed bomb placement has been eliminated.

Extract the ZIP into a new folder. Open the game directory using `serve.command` or `python3 -m http.server 8765`, then open http://localhost:8765/ in a modern browser. If the browser serves an older cached build, use a hard refresh or clear only this game's site data; clearing site data also removes locally stored game progress, so avoid that if possible. Verify that the displayed version is v2.0.2. Play at least 5–10 consecutive rounds, using normal bombs and Bomb Kick, in both simulated and private online play. If placement fails, open the console and run `BomberEngine2Diagnostics.snapshot()` and share the full output, especially `roundState.last`, along with any console errors.
