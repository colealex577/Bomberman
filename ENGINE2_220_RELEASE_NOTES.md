# Bomberman v2.2.0 — contextual dialogue and cumulative gameplay update

Includes the full v2.1.6 candidate: balanced rating changes, tactical kick defense and lane crossing, balanced quadrant pickups, stable max-rating HUD, and startup integrity.

New: simulated players react to actual death attribution (opponent, self-elimination, return to sender), pickups, observer arrivals, queued status and joining. The existing tier/personality, cooldowns, message validation and direct-reply logic remain. Guests receive host-generated messages rather than generating duplicates. Observer stage reactions are tracked across round boundaries. Death reactions may survive the final result transition.

Verified: existing direct-reply and new contextual-event deterministic regressions; Chromium 25 round generations, 24 map/rate combinations, max-rating HUD stability, and guest generation guard; 22 AI regressions and JavaScript syntax. These tests do not establish live two-device WebRTC performance or natural dialogue frequency.
