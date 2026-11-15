# Bomberman v2.1.6 — Balanced Kick drops and stable max-rating HUD

Local candidate based on the full v2.1.5 build. No public GitHub changes.

## Round generation
The authoritative owner-pass generator reserves round-start Kick Bomb pickups by the configured drop rate: round(4 + 8 × (rate − 16) / 84), with the rate clamped to 16–100%. Ultimate Mode uses 100%. The target is bounded by the number of eligible wood tiles. Randomized round-robin allocation gives each quadrant one pickup before adding a second, and so on; differences are at most one when all quadrants have enough wood. Normal selected pickups remain speed, bomb, fire and heart. The total sampled number of pickups is preserved where possible, but is increased to the Kick target when the random sample would be smaller. Guest mirrors do not generate their own pickups; the host remains authoritative. The legacy render-only repair cannot reallocate collected Kick pickups. Tutorial and custom test scenarios retain their own rules. Ordinary maps all contain enough wood.

## Score cards
The identity HUD owns rating text and rank display. Older score-card writers defer to it, and the formatter displays `1000 MAX · #rank` at the cap. Actual rating and rank changes still update the text; below 1000 the MAX label is removed. Numeric rating attributes are kept separate from the formatted text. Max-rated cards reserve additional space for the rating label. The scoring rules themselves are unchanged.

## Verification
- `python .github/scripts/engine2-drops-hud-216.py`: 25 actual restart generations (five at each rate), 24 map/rate cases across all 12 map layouts, Ultimate Mode, empty random sample, guest generation guard, no pickup refill on renderer refresh, and MutationObserver verification of unchanged max-rating text across repeated UI updates.
- Existing committed-lane crossing, delayed startup/failure-closed, and 22 AI-controller regression cases passed.
- Existing 20-round bomb-placement/32 speed combinations and 10-minute synthetic wrapper tests passed; updated owner/drop smoke passes.
- All previous files and original graphics/audio retained. Expanded and packed runtime copies agree. JavaScript syntax checked.

Browser tests execute the actual game in Chromium with in-memory assets. The guest generation guard is a controlled state test, not a live two-device network session. Distribution refers to the initial hidden pickups, not a requirement to keep four or more pickups present after players collect or consume them. Native mobile Safari and full live WebRTC are not verified.
