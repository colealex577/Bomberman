# Bomberman v2.1.2 — feature-preserving public-match and mobile refinements

This release is based on the exact v2.1.1 source. It deliberately preserves the existing game simulation, AI behavior, player identities and leaderboard numbers, Bomb Kick implementation, networking protocol, graphics assets, and 50 Hz simulation clock.

## Changes

- Public-match processing: avoid sorting the 599-profile simulated roster for every rank lookup by using an exact insertion-rank calculation; reduce redundant DOM writes and repeated full-page copy scans.
- Adaptive rendering: in Auto mode, reduce drawing workload to 60 or 30 FPS when measured stage throughput is low, then recover gradually. The simulation tick configuration, movement, timers, AI and network update rates are not modified.
- Mobile joystick: 5 px engagement, 3 px release, cardinal snapping, anti-jitter threshold, pointer ownership, and release on blur/orientation changes.
- Mobile observer layout: move existing chat and spectator elements into a separate dock below the arena in portrait or alongside it in landscape. Existing chat DOM and event handlers are retained.
- Startup: HTTP-only preload hints for the next six ordinary script modules; original script execution order and all three packed runtimes are retained. File-based startup is unchanged.
- Release metadata: consistent v2.1.2 title, badge, PWA manifest, service-worker cache key and asset cache-busting identifiers.

## Verification

- 39 compatibility modules loaded in the Chromium harness.
- 14,376 rank comparisons matched the original ranking algorithm, including ties.
- Five simulated public rounds retained visible leaderboard numbers and normal bomb placement after restarts.
- Desktop WASD and mobile yellow-button Bomb Kick travel checks passed.
- Mobile joystick activated with a 7 px movement in portrait and landscape.
- Spectator chat remained visible and non-overlapping in both orientations.
- Renderer test: 120 draws / 50 stage ticks, 60 FPS cap, interpolation state restored, all three resolutions, round/correction snaps, one RAF owner.
- Existing AI controller, core parity, normal-bomb, host placement, equal-speed, wrapper-stability, contextual chat and loader-parity regression suites passed.

## Known limits

The browser harness uses in-memory assets. This does not prove production HTTP load times, real mobile Safari/device behavior, two-device WebRTC behavior, or sustained live public-match performance. The short public-match tests are not a full extended-match soak test. The release does not change simulation timing to mask performance issues.
