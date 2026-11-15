# Bomberman v2.1.4 — Rating Balance and Tactical AI (local candidate)

Based on the approved v2.1.3 release. No GitHub publication in this task.

## Scoring
- Competitive round win/loss +10/-10. Ordinary ranked elimination +10 attacker/-10 victim; ordinary CPU kill +5 and ranked victim death -10 (CPU has no rating). Nonlethal damage +5/-5. Self-damage/death is penalized without a self-award.
- Traveling elimination +5/-5 extra; Return to Sender elimination +10/-10 extra. Top-ten win bonus +20, top-ten loser -20. Three-round sweep +/-30 remains. Score clamped to 0–1000; existing browser score is not reset.
- Each actual kill/damage event scored once, including nested collision hooks. Guest score messages use existing deduplication. Joined public roster settles the round win on last-survivor resolution rather than the first unrelated simulated player death. Legacy head-to-head settlement otherwise retained.

## Kick tactics
- All simulated humans rated 300+ and Normal/Hard/Expert CPUs use more careful lane and distance decisions. Easy/rookie exemption. Typical spacing 3 tiles; strongest opponents aim for 4. Wood/walls and actual reachable paths matter, so targets are not treated as absolute movement bans.
- Incoming moving bomb predictions include arrival deadlines; committed exits and holding cover suppress immediate reentry. Existing stationary bomb avoidance remains.
- Defensive interceptions require an actual available charge, valid launch geometry and a reachable escape. A counter launches toward an approaching bomb and consumes the charge. Restore previously dormant contact/return physics only, without enabling legacy rematch or input owners. Require contact/AI readiness before gameplay. Original controls and simulation rate unchanged.

## Chat
- New state-aware kick, return, danger, spacing, observer, near-miss, strategy, scoring replies and conversation lines. Mid-tier speakers chattier, stable personalities, cooldowns/queue bounds, no generation on real guests. Remember eliminated participants within current round for spectator dialogue. No external AI service.

## Verification
Actual Chromium in-memory asset harness: controlled scoring cases (500->495->500, 480, 520, 475, 465); rating-300 spacing, rookie/Easy exemption, Normal and rating-350 actual defensive launch/charge/return collision, committed off-axis escape and hold; chat classification; delayed startup and four rounds of external HUD/kick generation; module failure fail-closed; five public rounds, rank parity 14,376 comparisons, desktop/mobile kick, mobile observer UI. Existing AI 22 tests, round bomb/speed regression (20 rounds), 10-minute synthetic wrapper stability and social controller tests pass. Not a live two-device WebRTC test or a guarantee of perfect AI decisions on every map.

Run: extract the ZIP, open the existing game folder's index.html, or run `python3 -m http.server 8766` inside that folder and visit http://localhost:8766/. New port has independent localStorage; existing ratings on the public URL are unaffected.
