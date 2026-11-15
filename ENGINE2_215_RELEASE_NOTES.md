# Bomberman v2.1.5 — Committed Kick-lane crossings

Local development candidate based on the complete v2.1.4 local release. The public repository is not changed.

## Tactical changes
- Armed opponents' lanes are potential exposure, not forbidden tiles. A normal route may cross if estimated contact time exceeds the time needed to clear the projectile's collision envelope. The estimate uses the existing managed throw speed, current actor movement speed, walls/wood, and a personality-dependent buffer. The estimate is deliberately conservative, not a guarantee against a moving opponent or an indirect shot.
- A short per-bot crossing or detour plan is followed across tile decisions. Safe crossings preserve the ordinary AI intent; detours have a small anti-reversal penalty and unsafe edges receive a temporary planner penalty. Actual imminent explosions, blocked tiles, and traveling bomb deadlines override this commitment. An already committed crossing can continue while a distant traveling bomb approaches when the expanded hazard envelope permits it.
- Normal/Hard/Expert AI and simulated humans at rating 300+ retain Kick awareness. More aggressive personalities and late-game contestants accept closer positioning and smaller timing margins. Easy AI and lower-rated simulated humans retain their previous simpler behavior.
- Disable cosmetic arrival correction, micro movement and deliberate fumbles while a committed lane route is active; movement speed itself is unchanged. No extra Kick charges are granted.
- The existing defensive Return to Sender, rating balance, contextual chat, startup integrity and HUD/leaderboard fixes are preserved.
- Synchronized expanded/packed AI source; standardized live release version and cache query keys to 215. Historical filenames, protocols and notes remain intact.

## Verification
- `python .github/scripts/engine2-lane-crossing-215.py`: actual Chromium game scripts, controlled routes; direct and production chooseNextAction crossing, real tile-by-tile movement, nearby and fast shooter detours, wall-protected path, Normal AI, live distant shot versus imminent live shot, personality and endgame variation.
- `python .github/scripts/engine2-tactics-rating-214.py`: scoring and actual controlled defensive bomb collision, ordinary avoidance and chat classification.
- `python .github/scripts/engine2-browser-215.py`: five simulated-public rounds, ranks, repeated bomb placement, desktop/mobile kick, joystick and spectator layout.
- `python .github/scripts/engine2-startup-213.py`: delayed startup and failure-closed tests.
- Node: 22 controller regressions, ten-minute synthetic wrapper stability, 20-round bomb placement/32 speed combinations.

Browser tests use in-memory asset loading and controlled scenarios. They do not establish natural match behavior frequencies, full live WebRTC compatibility, or eliminate all possible oscillations. Gameplay feedback is still needed.
