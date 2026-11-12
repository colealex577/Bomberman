# Bomberman v2.1.0 — Social AI & Arcade UI

Private development build; the public GitHub game remains v2.0.2. Based on the complete 2.0.2 release.

## What's new
- A responsive HTML title screen replaces the original canvas menu. New branded arena artwork, large mode buttons, accessible controls/help, shortcuts for character, leaderboard, settings and the AI test room. Existing menu, lobby, and game engine entry points remain. The original simulated lobby count is labeled as an estimate.
- Consistent midnight-blue/gold styling for existing lobby, settings, profile, ranking, tutorial, post-match, spectator, chat, and mobile controls. Existing board and art assets are preserved.
- One state-aware social controller owns simulated chat. Stable name/skill personalities: below 300 quieter rookies with occasional typos, 300–849 sociable and varied players, 850+ terse elite players. Match events, actor inventory, phase, elimination, observation, and results govern dialogue. Targeted questions use current game facts; explicit bot-identity questions are answered truthfully. Scripts are short multi-speaker conversations with validated follow-ups. Delayed messages expire or cancel when round, phase, or role changes.
- Old generated-chat entry points are guarded to avoid overlapping dialogue; real player chat, spectator notices, and network relay paths are retained. Gameplay AI, bomb physics, scoring, match routing, and existing 2.0.2 speed/stability fixes are not redesigned.
- Version title, build badge, manifest, and cache keys updated to v2.1.0. Historical module identifiers remain for compatibility.

## Validation
- Original 2.0.2 inventory: 239 files retained. Changed paths explicitly listed in ENGINE2_210_CHANGED_FILES.json; unchanged files verified by SHA-256.
- Real Chromium exercised the actual page with an in-memory asset/script transport (not live HTTP, service-worker deployment, or WebRTC). Home at 1280, 768 and 390 px; settings/lobby navigation; single-player launch and normal bomb; five restarts, normal bomb placement and equal baseline speed. Simulated public chat answered a named control question.
- Node regression suites: 22 AI-controller cases; 40-round core parity; 20-round bomb/speed tests; ten-minute simulated wrapper stability; startup loader parity; diagnostics; contextual social behavior including stable tiers, role/phase/round cancellation and host relay.
- The browser harness is .github/scripts/engine2-browser-210.py (requires Python Playwright and Chromium). It uses local in-memory resources; no live peer connection is tested.

## Run locally
Extract the ZIP and open the game folder. Use serve.command or a static HTTP server, e.g. python3 -m http.server 8765, then browse http://localhost:8765/. Internet is required for actual peer networking. Verify the version badge reads v2.1.0.

## Remaining checks
Live two-device multiplayer, deployed service-worker/cache behavior, real mobile touch input, and prolonged natural conversations require manual testing. New generated dialogue is intentionally rule/template-based, not an external language model. No claim of complete real-world feature parity is made.
