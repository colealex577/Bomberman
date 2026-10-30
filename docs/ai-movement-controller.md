# AI movement ownership (v0.14.2)

The movement controller lives in the existing `runtime-v0140-stability-social.js`.
It replaces AI steering and strategic dispatch; it does not replace the engine's
update loop, map/collision rules, bomb timing, or multiplayer authority.

## Failure mechanisms

- v0134's independent reservation timer redirected overlapping actors, including
  committed escapes. v0136's pass-through setter did not disable that timer.
- v0135 could replace a chosen hunt step with a power-up step after the newer
  `getBestBonusPath()` suppression had already run.
- Multiple loop breakers could overwrite each other's targets. The v0141
  perpendicular exit lasted only one tile and then discarded its exit state.
- Logical positions round at half a tile. Reassigning that tile as a destination
  could produce zero direction while the bitmap was still short of its center.
  Turning mid-tile could also keep the bot on an offset collision lane.
- Tiny back-and-forth pixel motion refreshed the old progress clock. Conversely,
  the presence of a safe neighbor could incorrectly cancel a legitimate bomb-cover wait.

## Controller boundaries

v0134 exposes its pre-avoidance strategy and bonus selector. The latest controller
uses those strategic primitives without traversing the accumulated movement wrappers.
v0134's reservation timer and v0138's separate recovery watchdog retire when the
new owner installs. Social/UI behavior remains in those files.

Actor occupancy is a route preference only. Recovery plans prefer different paths
for different bot slots but can cross occupied tiles. Targets steer from actual
pixels, centering the current lane before a turn. Movement still invokes the
original collision checks and original Bot update through the network wrappers.

Recent centered positions and time-bounded traversal samples detect repeated axis
runs, including long corridors and small parallel-lane detours. Recovery seeks the
nearest reachable perpendicular exit and continues multiple tiles away. Returning
to the abandoned lane is temporarily forbidden for ordinary routes; escape plans
retain priority. Hunt route completion does not erase loop history.

The spatial watchdog requires meaningful displacement, not changed intent or
subpixel jitter. Real completed bomb-cover waits remain valid until their actual
bomb/fire clears. Stalled or stale escape plans are reconsidered using the existing
timed escape planner. No safe exit means no forced random dangerous step.

Open-board routing prefers living humans, keeps short route commitments, and
suppresses power-up farming. Earlier play retains safe power-up selection and
bounded, validated item traps. Speed is reconciled from difficulty, earned shoes,
and existing aggression speed rules. Guest replicas are not controlled locally.

## Validation

- `node .github/scripts/ai-controller-regression.mjs`: deterministic multi-frame
  scenarios using the original Bot and historical controller layers.
- `ai-controller-browser.mjs`: loaded application, actual Player collision and Bot
  update, overlapping actors, pixel centering, corridor exits, pursuit, cover/stale escape.
- The existing browser suite remains enabled, including authoritative network,
  match/rematch, settings, UI, power-ups, and social tests. Tests that asserted the
  retired governor's internal counters now exercise the current owner instead.

No changes to `files/js/Bot.js`, `Player.js`, `GameEngine.js`, bomb/tile rules,
`multiplayer-v0129.js`, or the `net-*` files are required.
