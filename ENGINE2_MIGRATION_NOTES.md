# Bomberman 2.0 — Compatibility-first architecture migration (private development build)

> **Updated in 2.0.1:** The next stability phase fixed repeated `Bot.update()` / `Bot.plantBomb()` wrappers, eliminated Bomb Kick direct-action conflicts, reduced repeated score DOM writes, and added bounded long-session diagnostics. See **`ENGINE2_STABILITY_NOTES.md`** for the authoritative current file counts, tests, and limitations. The paragraphs below document the original 2.0 migration baseline, not the latest 2.0.1 file delta.

## Baseline and safety

- Original public GitHub repository: `colealex577/Bomberman`.
- Baseline commit: `210388cb9888e82b42ce9c844ba65e1c04f94aaf` (the November 11, 2026 Bomb Kick–restored public version).
- Baseline Git tree: `6a30dd8e8b2f7630c3617430dc13fb168115c75b`.
- **All 218 baseline files are included. No original file was deleted.**
- **213 original files remain byte-for-byte identical**, including all gameplay, AI, Bomb Kick, networking, matchmaking, scoring, graphics, audio, and multiplayer runtime files.
- Five existing files changed solely to connect the new architecture: `files/js/GameEngine.js`, `files/js/InputEngine.js`, `files/app.js`, `index.html`, and `sw.js`.
- New: `files/engine2/lifecycle.js`, `files/engine2/input-controller.js`, `files/engine2/runtime-loader.js`.
- Original extension and public GitHub game are untouched.

## Migrated components

1. `BomberEngine2Lifecycle` now owns the native GameEngine setup/restart/frame implementations. Those original function bodies were **moved without changing gameplay statements**, so extension wrappers can continue to call the same GameEngine methods.
2. `BomberEngine2Input` now owns exactly one `keydown` and one `keyup` DOM listener per game tab, and dispatches callbacks from a stable snapshot. InputEngine retains the same methods and `gInputEngine` API that the existing movement, networking, and Bomb Kick code expects.
3. `BomberEngine2Loader` replaces the deeply nested callback loader with a **declarative 39-module ordered manifest**, preserving all 39 original module names, URLs and load order, including three packed runtimes and the legacy `nodata` setting. Startup status is inspectable in the browser console via `BomberEngine2Loader.status()`.
4. Service worker cache version and module paths updated for the private development build.

## Feature-preservation policy

The following implementations are retained **unmodified**: normal/Ultimate modes, local multiplayer, private host/join, public human-priority matchmaking and time-of-day fallback, online host-authoritative synchronization, spectators, rematches, user names, saved scores, leaderboard, all nine scoring rules, simulated-human profiles, all existing AI personalities/pathfinding/decision-making, Bomb Kick/throw/corner travel, touch controls, tutorial, chat, maps, sprites, sounds, character appearance, drop rates, and game-over screens.

All localStorage keys remain unchanged. Do not clear your browser's site data just to try this development build.

## Tests that passed

Run from the extracted project directory with Node.js 22 (or compatible):

```bash
node .github/scripts/engine2-core-parity.mjs
node .github/scripts/engine2-loader-parity.mjs
node .github/scripts/engine2-feature-parity.mjs
```

- Core behavior matches the original over **40 consecutive restarts + 20 update frames** in direct JavaScript VM tests; no extra keyboard handlers were installed.
- Script startup preserves the original order of all 39 compatibility modules (36 scripts + 3 packed), including `nodata=1` behavior.
- Original file/feature inventory checks pass; all 218 baseline files are retained and 213 byte-identical.
- All JavaScript source files pass `node --check`.
- Service worker precache asset paths resolve locally.

### Important limitation

**This is a first-phase architectural rewrite, not a fully migrated, production-proven 2.0.** The high-risk, feature-rich AI and network runtime modules intentionally remain in their working legacy implementations, with their existing wrappers. Their eventual consolidation should only occur after full browser and two-device regression testing confirms parity. **The current environment prevents navigation to local development pages in Chromium**, and the existing Puppeteer test suite could not run here; tests that require real gameplay or two devices remain outstanding. No guarantees about exact runtime behavior are implied by static preservation.

## How to test offline

1. Extract the ZIP.
2. Open `Bomberman-Ultimate-Universal-Web-v0.10`.
3. On macOS, run `serve.command` (or in a terminal use `python3 -m http.server 8765` in that folder).
4. Open `http://localhost:8765/`.
5. Verify solo, Ultimate, Bomb Kick, local multiplayer, three to ten consecutive public simulated rounds and private friend hosting/joins on two devices.

The public game URL remains unchanged and still serves the previous published build.

## Next migration boundaries (not yet complete)

- Replace the current chained `Bot.prototype.chooseNextAction` wrappers with one tactical planner that calls unchanged pathfinding/bombing algorithms; compare deterministic action traces against the baseline.
- Replace fragmented per-round and networking state with explicit per-match resources, one authoritative state machine, and disposable timers/subscriptions.
- Add browser replay tests for 10+ consecutive matches, peer host/guest reconnection, spectators, Bomb Kick, collisions, and points.
- Only publish after successful feature-parity verification and an explicit publish request.
