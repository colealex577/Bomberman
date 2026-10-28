(function () {
    'use strict';

    var held = {};

    function isGuest() {
        return !!(window.BomberOnline && typeof BomberOnline.isGuest === 'function' && BomberOnline.isGuest());
    }

    function localActionName(action) {
        return action;
    }

    function setLocalAction(action, down) {
        if (!window.gInputEngine) return;
        var name = localActionName(action);
        gInputEngine.actions[name] = down;
        if (!down) {
            var listeners = gInputEngine.listeners[name];
            if (listeners) {
                for (var i = 0; i < listeners.length; i++) {
                    try { listeners[i](); } catch (e) {}
                }
            }
        }
    }

    function setAction(action, down) {
        if (isGuest() && window.BomberOnline && typeof BomberOnline.sendTouchAction === 'function') {
            BomberOnline.sendTouchAction(action, down);
        } else {
            setLocalAction(action, down);
        }
    }

    function releaseAll() {
        Object.keys(held).forEach(function (action) {
            if (held[action]) setAction(action, false);
            held[action] = false;
        });
    }

    function bindButton(btn) {
        var action = btn.getAttribute('data-action');
        if (!action) return;

        function down(e) {
            e.preventDefault();
            try { btn.setPointerCapture(e.pointerId); } catch (ignore) {}
            if (held[action]) return;
            held[action] = true;
            btn.classList.add('pressed');
            setAction(action, true);
        }
        function up(e) {
            e.preventDefault();
            if (!held[action]) return;
            held[action] = false;
            btn.classList.remove('pressed');
            setAction(action, false);
        }
        btn.addEventListener('pointerdown', down, {passive:false});
        btn.addEventListener('pointerup', up, {passive:false});
        btn.addEventListener('pointercancel', up, {passive:false});
        btn.addEventListener('lostpointercapture', up, {passive:false});
        btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }

    function unlockAudio() {
        try {
            if (window.gGameEngine && gGameEngine.soundtrack && gGameEngine.soundtrackPlaying && !gGameEngine.mute) {
                gGameEngine.soundtrack.paused = false;
            }
        } catch (e) {}
    }

    function init() {
        var controls = document.getElementById('mobileControls');
        if (!controls) return;
        Array.prototype.forEach.call(controls.querySelectorAll('[data-action]'), bindButton);

        document.addEventListener('pointerdown', unlockAudio, {once:true, passive:true});
        window.addEventListener('blur', releaseAll);
        document.addEventListener('visibilitychange', function () { if (document.hidden) releaseAll(); });

        var mute = document.getElementById('mobileMuteBtn');
        var menu = document.getElementById('mobileMenuBtn');
        if (mute) mute.addEventListener('click', function () {
            if (isGuest() && window.BomberOnline && typeof BomberOnline.toggleGuestMusic === 'function') {
                BomberOnline.toggleGuestMusic();
            } else if (window.gGameEngine && typeof gGameEngine.toggleSound === 'function') {
                gGameEngine.toggleSound();
            }
        });
        if (menu) menu.addEventListener('click', function () {
            if (isGuest()) return;
            if (window.gGameEngine && gGameEngine.menu) {
                if (!gGameEngine.menu.visible) gGameEngine.menu.show();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
