BOMBERMAN ULTIMATE ONLINE — WEB / iPHONE v0.5

This folder is a static Progressive Web App (PWA). It is designed for:
- iPhone / iPad Safari
- Mac Safari / Chrome
- Windows / Android browsers

IPHONE
1. Publish this folder to any HTTPS static web host (GitHub Pages, Netlify, Cloudflare Pages, etc.).
2. Open the HTTPS address in Safari on iPhone.
3. Tap Share > Add to Home Screen.
4. Launch Bomberman from the Home Screen.

Touch controls:
- D-pad: move
- Bomb button: plant bomb
- Sound: mute/unmute
- Menu: return to game menu

ONLINE CROSS-PLAY
The web/iPhone build uses the same room-code protocol as the v0.5 Mac build.
A Mac can host and an iPhone can join, or the iPhone can host when its browser supports canvas WebRTC capture correctly.
Both players need internet access.

IMPORTANT
Opening index.html directly from the iPhone Files app is not the intended setup. Use an HTTPS-hosted copy so the PWA, networking, and caching features work correctly.
