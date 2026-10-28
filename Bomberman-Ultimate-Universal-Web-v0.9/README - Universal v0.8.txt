Bomberman Ultimate Online — Universal v0.8

MULTI-BOMB AI / ROLLING BOMB CYCLES
- AI now treats bomb capacity as an active tactical resource rather than a passive stat.
- With 2+ bombs, a bot can plant one, escape to safe cover, and plant another useful bomb before the first has finished.
- Escape destinations are biased toward safe staging tiles that can create the next useful attack.
- Follow-up bombs are scored for direct blast lines on players/bots, nearby blast pressure, useful wood destruction, and proximity to opponents.
- A bot will only chain another bomb when the combined danger map of all current bombs plus the proposed bomb still gives it a viable escape route.
- Once an earlier bomb explodes and frees capacity, a bot waiting behind cover can immediately reuse that slot if another safe/useful placement exists.
- This allows rolling cycles such as bomb 1 -> escape -> bomb 2 -> escape -> bomb 1 explodes -> bomb 3, while preserving the v0.7 survival logic.
- AI retains all bomb-capacity power-ups in normal and Ultimate modes.

AI SURVIVAL / COVER
- Bots commit to escape routes after planting instead of oscillating.
- Escape planning uses actual blast radius, current movement speed, remaining fuse time, active fire, and chain-reaction timing.
- Walls/wood provide blast cover when appropriate.
- Bots refuse follow-up bombs that do not have a safe exit.

SOUND
- Sound starts ON by default across desktop, Mac, iPhone, and iPad.
- Explicit user mute/unmute choices are remembered after the initial sound-default migration.
- Ultimate Mode music remains 1.5x speed.

UNIVERSAL CONTROLS / ONLINE
- Same web game code runs on desktop and mobile.
- Desktop uses keyboard controls; touch devices get the analog-style joystick and touch buttons.
- Room-code typing ignores gameplay hotkeys while an input field is focused.
- Online rooms remain cross-platform.

ULTIMATE MODE
- 100% power-up drops from destructible blocks.
- 5x pickup effects.
- Ultimate AI remains 2x base speed with the darker bot appearance.

WEB / IPHONE
Host over HTTPS (GitHub Pages works). Open the same URL on desktop/Mac or iPhone.
On iPhone: Safari > Share > Add to Home Screen for an app-like launcher.
