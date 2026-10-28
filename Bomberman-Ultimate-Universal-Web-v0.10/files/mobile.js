(function () {
    'use strict';

    var held = {};
    var joystickAction = null;
    var joystickPointerId = null;
    var dpadAction = null;
    var dpadPointerId = null;
    var controlMode = 'arrows';
    var initialized = false;
    var audioPrimed = false;

    function isGuest() {
        return !!(window.BomberOnline && typeof BomberOnline.isGuest === 'function' && BomberOnline.isGuest());
    }

    function isTouchPlatform() {
        var coarse = false;
        var noHover = false;
        try {
            coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
            noHover = !!(window.matchMedia && window.matchMedia('(hover: none)').matches);
        } catch (e) {}
        var touchPoints = Number(navigator.maxTouchPoints || navigator.msMaxTouchPoints || 0);
        var mobileUA = /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent || '');
        var touchEvent = 'ontouchstart' in window;
        // iOS/PWA restore can report pointer media queries late, so any positive
        // touch signal is enough.  This is intentionally more permissive than v0.10.
        return mobileUA || touchPoints > 0 || touchEvent || coarse || (noHover && window.innerWidth <= 1024);
    }

    function applyPlatformClass() {
        if (!document.body) return false;
        var touch = isTouchPlatform();
        document.body.classList.toggle('touch-ui', touch);
        document.body.classList.toggle('desktop-ui', !touch);
        return touch;
    }

    function setLocalAction(action, down) {
        if (!window.gInputEngine) return;
        gInputEngine.actions[action] = down;
        if (!down) {
            var listeners = gInputEngine.listeners[action];
            if (listeners) {
                for (var i = 0; i < listeners.length; i++) {
                    try { listeners[i](); } catch (e) {}
                }
            }
        }
    }

    function setAction(action, down) {
        // Real online matches are simulated locally on both devices. The
        // network layer applies this action immediately to the correct local
        // player and sends only the tiny press/release packet to the peer.
        if (window.BomberOnline && typeof BomberOnline.isDataMatch === 'function' &&
            BomberOnline.isDataMatch() && typeof BomberOnline.handleLocalAction === 'function') {
            BomberOnline.handleLocalAction(action, down);
        } else {
            setLocalAction(action, down);
        }
    }

    function hold(action, down) {
        if (!action) return;
        if (!!held[action] === !!down) return;
        held[action] = !!down;
        setAction(action, !!down);
    }

    function releaseAll() {
        Object.keys(held).forEach(function (action) {
            if (held[action]) setAction(action, false);
            held[action] = false;
        });
        joystickAction = null;
        dpadAction = null;
        document.querySelectorAll('.dpad_key.active').forEach(function (n) { n.classList.remove('active'); });
    }

    function bindBombButton(btn) {
        if (!btn) return;
        var action = btn.getAttribute('data-action') || 'bomb';
        function down(e) {
            e.preventDefault();
            primeAudio();
            try { btn.setPointerCapture(e.pointerId); } catch (ignore) {}
            if (held[action]) return;
            hold(action, true);
            btn.classList.add('pressed');
        }
        function up(e) {
            e.preventDefault();
            hold(action, false);
            btn.classList.remove('pressed');
        }
        btn.addEventListener('pointerdown', down, {passive:false});
        btn.addEventListener('pointerup', up, {passive:false});
        btn.addEventListener('pointercancel', up, {passive:false});
        btn.addEventListener('lostpointercapture', up, {passive:false});
        btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }

    function setJoystickAction(next) {
        if (next === joystickAction) return;
        if (joystickAction) hold(joystickAction, false);
        joystickAction = next;
        if (joystickAction) hold(joystickAction, true);
    }

    function setDpadAction(next) {
        if (next === dpadAction) return;
        if (dpadAction) hold(dpadAction, false);
        dpadAction = next;
        document.querySelectorAll('.dpad_key').forEach(function (n) {
            n.classList.toggle('active', n.getAttribute('data-dir') === next);
        });
        if (dpadAction) hold(dpadAction, true);
    }

    function bindDpad(base) {
        if (!base) return;
        function updateFromPointer(e) {
            var r = base.getBoundingClientRect();
            var cx = r.left + r.width / 2;
            var cy = r.top + r.height / 2;
            var dx = e.clientX - cx;
            var dy = e.clientY - cy;
            var dead = Math.min(r.width, r.height) * 0.13;
            if (Math.abs(dx) < dead && Math.abs(dy) < dead) {
                setDpadAction(null);
                return;
            }
            setDpadAction(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
        }
        function down(e) {
            e.preventDefault();
            primeAudio();
            dpadPointerId = e.pointerId;
            try { base.setPointerCapture(e.pointerId); } catch (ignore) {}
            updateFromPointer(e);
        }
        function move(e) {
            if (dpadPointerId !== e.pointerId) return;
            e.preventDefault();
            updateFromPointer(e);
        }
        function up(e) {
            if (dpadPointerId !== null && e.pointerId !== dpadPointerId) return;
            e.preventDefault();
            dpadPointerId = null;
            setDpadAction(null);
        }
        base.addEventListener('pointerdown', down, {passive:false});
        base.addEventListener('pointermove', move, {passive:false});
        base.addEventListener('pointerup', up, {passive:false});
        base.addEventListener('pointercancel', up, {passive:false});
        base.addEventListener('lostpointercapture', up, {passive:false});
        base.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }

    function readControlMode() {
        try {
            var saved = localStorage.getItem('BombermanMobileControlMode');
            return saved === 'joystick' ? 'joystick' : 'arrows';
        } catch (e) { return 'arrows'; }
    }

    function applyControlMode(mode, save) {
        controlMode = mode === 'joystick' ? 'joystick' : 'arrows';
        releaseAll();
        var dpad = document.getElementById('mobileDpad');
        var joy = document.getElementById('mobileJoystick');
        if (dpad) dpad.hidden = controlMode !== 'arrows';
        if (joy) joy.hidden = controlMode !== 'joystick';
        document.querySelectorAll('[data-control-mode]').forEach(function (b) {
            b.classList.toggle('active', b.getAttribute('data-control-mode') === controlMode);
        });
        if (save) {
            try { localStorage.setItem('BombermanMobileControlMode', controlMode); } catch (e) {}
        }
    }

    function bindJoystick(base, knob) {
        if (!base || !knob) return;
        var maxRadius = 44;
        var deadZone = 12;

        function updateFromPointer(e) {
            var rect = base.getBoundingClientRect();
            var cx = rect.left + rect.width / 2;
            var cy = rect.top + rect.height / 2;
            var dx = e.clientX - cx;
            var dy = e.clientY - cy;
            var dist = Math.sqrt(dx*dx + dy*dy);
            var scale = dist > maxRadius ? maxRadius / dist : 1;
            var kx = dx * scale;
            var ky = dy * scale;
            knob.style.transform = 'translate3d(' + kx.toFixed(1) + 'px,' + ky.toFixed(1) + 'px,0)';

            if (dist < deadZone) {
                setJoystickAction(null);
                return;
            }
            if (Math.abs(dx) > Math.abs(dy)) setJoystickAction(dx > 0 ? 'right' : 'left');
            else setJoystickAction(dy > 0 ? 'down' : 'up');
        }

        function down(e) {
            e.preventDefault();
            primeAudio();
            joystickPointerId = e.pointerId;
            try { base.setPointerCapture(e.pointerId); } catch (ignore) {}
            base.classList.add('active');
            updateFromPointer(e);
        }
        function move(e) {
            if (joystickPointerId !== e.pointerId) return;
            e.preventDefault();
            updateFromPointer(e);
        }
        function up(e) {
            if (joystickPointerId !== null && e.pointerId !== joystickPointerId) return;
            e.preventDefault();
            joystickPointerId = null;
            base.classList.remove('active');
            knob.style.transform = 'translate3d(0,0,0)';
            setJoystickAction(null);
        }

        base.addEventListener('pointerdown', down, {passive:false});
        base.addEventListener('pointermove', move, {passive:false});
        base.addEventListener('pointerup', up, {passive:false});
        base.addEventListener('pointercancel', up, {passive:false});
        base.addEventListener('lostpointercapture', up, {passive:false});
        base.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }

    function resumeCreateJsAudio() {
        try {
            var context = null;
            if (window.createjs && createjs.WebAudioPlugin) context = createjs.WebAudioPlugin.context || createjs.WebAudioPlugin._context;
            if (!context && window.createjs && createjs.Sound && createjs.Sound.activePlugin) {
                context = createjs.Sound.activePlugin.context || createjs.Sound.activePlugin._context;
            }
            if (context && context.state === 'suspended' && typeof context.resume === 'function') {
                var promise = context.resume();
                if (promise && typeof promise.catch === 'function') promise.catch(function () {});
            }
        } catch (e) {}
    }

    function primeAudio() {
        // iOS requires audio to be unlocked directly from a user gesture.
        // WebAudio remains only for bomb SFX; music itself is the one shared
        // #gameMusic element, so repeated gestures cannot start a second loop.
        resumeCreateJsAudio();
        try {
            if (window.gGameEngine) {
                if (!audioPrimed) {
                    gGameEngine.mute = false;
                    if (window.Storage) {
                        Storage.setValue('muted', false);
                        Storage.setValue('soundPreferenceSet', true);
                    }
                }
                if (typeof gGameEngine.playSoundtrack === 'function') gGameEngine.playSoundtrack();
            } else {
                var music = document.getElementById('gameMusic');
                if (music) {
                    music.loop = true;
                    music.volume = 1;
                    var playPromise = music.play();
                    if (playPromise && playPromise.catch) playPromise.catch(function(){});
                }
            }
        } catch (e) {}
        audioPrimed = true;
    }

    function init() {
        applyPlatformClass();
        if (initialized) return;
        initialized = true;

        var controls = document.getElementById('mobileControls');
        if (!controls) return;

        bindDpad(document.getElementById('mobileDpad'));
        bindJoystick(document.getElementById('mobileJoystick'), document.getElementById('mobileJoystickKnob'));
        bindBombButton(controls.querySelector('[data-action="bomb"]'));
        applyControlMode(readControlMode(), false);

        // Multiple gesture types cover Safari, Home Screen PWAs and Chromium.
        document.addEventListener('pointerdown', primeAudio, {passive:true, capture:true});
        document.addEventListener('touchstart', primeAudio, {passive:true, capture:true});
        document.addEventListener('click', primeAudio, {passive:true, capture:true});
        window.addEventListener('blur', releaseAll);
        document.addEventListener('visibilitychange', function () { if (document.hidden) releaseAll(); });

        var mute = document.getElementById('mobileMuteBtn');
        var menu = document.getElementById('mobileMenuBtn');
        var settings = document.getElementById('mobileSettingsBtn');
        var settingsPanel = document.getElementById('mobileSettingsPanel');
        var settingsClose = document.getElementById('mobileSettingsClose');
        if (settings) settings.addEventListener('click', function () {
            primeAudio();
            if (settingsPanel) settingsPanel.hidden = false;
        });
        if (settingsClose) settingsClose.addEventListener('click', function () { if (settingsPanel) settingsPanel.hidden = true; });
        if (settingsPanel) settingsPanel.addEventListener('click', function (e) { if (e.target === settingsPanel) settingsPanel.hidden = true; });
        document.querySelectorAll('[data-control-mode]').forEach(function (button) {
            button.addEventListener('click', function () {
                applyControlMode(button.getAttribute('data-control-mode'), true);
                if (settingsPanel) settingsPanel.hidden = true;
            });
        });
        if (mute) mute.addEventListener('click', function () {
            // Do not call primeAudio first here or it would force sound on before
            // toggling. The single soundtrack is controlled directly by the engine.
            resumeCreateJsAudio();
            if (window.gGameEngine && typeof gGameEngine.toggleSound === 'function') {
                gGameEngine.toggleSound();
            } else {
                var music = document.getElementById('gameMusic');
                if (!music) return;
                try {
                    if (music.paused) {
                        var p = music.play(); if (p && p.catch) p.catch(function(){});
                    } else music.pause();
                } catch (e) {}
            }
        });
        if (menu) menu.addEventListener('click', function () {
            primeAudio();
            if (isGuest()) return;
            if (window.gGameEngine && gGameEngine.menu && !gGameEngine.menu.visible) gGameEngine.menu.show();
        });
    }

    // Do not rely on DOMContentLoaded firing again when an iPhone PWA is
    // restored from the background/bfcache.
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
    window.addEventListener('pageshow', function () { applyPlatformClass(); init(); });
    window.addEventListener('resize', applyPlatformClass);
})();