# Bomberman v2.1.2 — Public-match performance and touch controls

Published build for the existing Bomberman-Ultimate-Universal-Web-v0.10 application. Based on the exact v2.1.1 high-refresh release. The separately hosted Bomberman-Rebuilt application is not modified.

- The original 50 Hz authoritative simulation now accumulates elapsed tick time and recovers bounded short stalls (maximum five steps per callback). Guests retain their existing real-time prediction path; hidden tabs and round transitions reset the accumulator. Ordinary bomb fuses and tactical timing use the logical frequency rather than browser throughput.
- Indexed tile lookup during the simulation frame preserves tile identity and invalidates the index on map-array changes/removal. Timed path search computes reservation and edge costs once per search, keeping the same scoring and movement rules.
- Public chat and identity UI updates are less frequent, idempotent, and no longer walk the entire DOM or repeatedly scan past chat messages. The public spectator feed uses one 545x416 source canvas at 24 FPS, releases its tracks when no viewers remain, and retries failed calls with backoff. Existing real-player matchmaking, spectator queue, chat, and social personalities are retained.
- Auto graphics reduces render target and, if needed, backing resolution under sustained overload. Manual 60/120 FPS and Original/High/Ultra settings remain available; gameplay rate is independent of all graphics settings.
- Touch joystick engages at 5 px, releases at 3 px, snaps to full cardinal direction, and uses directional hysteresis. Touch and keyboard normal bombs share the same round-owned dispatch. Orientation changes and loss of focus release held movement.
- Mobile landscape has dedicated side gutters for movement and bomb controls. Spectator chat and the observer HUD live outside the arena, with a side column in landscape and an inline sheet on explicit request. Touch capability rather than viewport width alone selects mobile chat.
- Startup scripts are deferred, ordered runtime downloads are preloaded in parallel, versioned scripts can reuse the service-worker cache, and the main menu displays loading progress. New versioned assets use `?v=212`; navigation remains network-first. Existing protocol identifiers and the previous files remain intact.

## Validation

Automated core, AI, bomb-placement/speed, renderer, loader, social-AI, long-session, and clock regression tests are included. The Chromium harness runs actual game scripts with locally supplied assets; it exercises simulated-public matches and phone-sized portrait/landscape touch layouts. Real peer-to-peer transport, mobile Safari hardware and production GitHub Pages caching require live validation. Simulated browser tests do not establish sustained 120 FPS on every device.
