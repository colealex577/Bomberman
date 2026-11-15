# Bomberman v2.1.3 — Startup integrity (local test release)

Based on the approved v2.1.2 feature-preserving release. No AI tactics, movement rules, scoring formulas, ranks, or original game assets were redesigned.

- Wait for the five legacy network bootstrap modules to finish and verify B115/lobby/host/guest handlers before starting compatibility modules. Earlier eager runtime requests are queued, preloaded in parallel on HTTP(S), and executed in their existing order.
- Load each of the three byte-equivalent expanded packed runtimes directly once. Avoid re-evaluating partially executed patch code after a decompression/evaluation failure.
- Require initialized networking, arena, external HUD, four Kick inventory items, Kick core/polish/compatibility/controls, leaderboard, identity and social modules before marking startup ready. Missing essentials produce a named error after 30 seconds; a failed script rejects immediately.
- Guard the uninitialized social-module resize handler. Use one release cache revision (213) and one service-worker registration. Preserve saved localStorage data.
- New regression checks: delayed legacy and Kick startup, four consecutive rounds with actual Kick drops and exterior inventory boxes, simulated missing Kick-polish request, and full browser regression including desktop/mobile launches and rankings.

Testing is in Chromium with in-memory local asset loading and deliberately delayed script execution, not a real GitHub Pages session or two-device WebRTC test. Existing core/AI/round/render/social/stability regression tests also pass. GitHub is unchanged.
