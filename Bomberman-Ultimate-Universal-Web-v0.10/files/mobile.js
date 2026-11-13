(function () {
    'use strict';

    var held = {};
    var joystickAction = null;
    var joystickPointerId = null;

    function isGuest() {
        return !!(window.BomberOnline && typeof BomberOnline.isGuest === 'function' && BomberOnline.isGuest());
    }

    function isTouchPlatform() {
        var coarse = false;
        try { coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches; } catch (e) {}
        var touchPoints = Number(navigator.maxTouchPoints || 0);
        var mobileUA = /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent || '');
        return touchPoints > 0 && (coarse || mobileUA);
    }

    function setLocalAction(action, down) {
        if (!window.gInputEngine) return;
        gInputEngine.actions[action] = down;
        if (!down) {
            if(window.BomberEngine2Input)BomberEngine2Input.dispatch(gInputEngine,action);
            else {var listeners=gInputEngine.listeners[action]||[];listeners.slice().forEach(function(fn){try{fn()}catch(e){}})}
        }
    }

    function setAction(action, down) {
        if (isGuest() && window.BomberOnline && typeof BomberOnline.sendTouchAction === 'function') {
            BomberOnline.sendTouchAction(action, down);
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
            if (held[action]) {if(action==='bomb'&&!isGuest()&&window.gInputEngine)gInputEngine.actions[action]=false;else setAction(action,false);}
            held[action] = false;
        });
        joystickAction = null;joystickPointerId=null;
        var base=document.getElementById('mobileJoystick'),knob=document.getElementById('mobileJoystickKnob');if(base)base.classList.remove('active');if(knob)knob.style.transform='translate3d(0,0,0)';
    }

    function bindBombButton(btn) {
        if (!btn) return;
        var action = btn.getAttribute('data-action') || 'bomb';
        function down(e) {
            e.preventDefault();
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

    function selectDirection(dx,dy,old,engage,release){
        var distance=Math.hypot(dx,dy);if(distance<(old?release:engage))return null;
        var horizontal=Math.abs(dx),vertical=Math.abs(dy),h=dx<0?'left':'right',v=dy<0?'up':'down';
        // Small motion engages at full speed; a little angular hysteresis prevents diagonal flicker.
        if(old===h&&horizontal>=vertical*.82)return h;
        if(old===v&&vertical>=horizontal*.82)return v;
        return horizontal>=vertical?h:v;
    }
    window.BomberMobile212={isTouchPlatform:isTouchPlatform,selectDirection:function(dx,dy,old){return selectDirection(dx,dy,old,5,3)},releaseAll:releaseAll};
    function bindJoystick(base, knob) {
        if (!base || !knob) return;
        var maxRadius = 44;
        var deadZone = 5;
        var releaseZone = 3;

        function updateFromPointer(e) {
            var rect = base.getBoundingClientRect();
            var cx = rect.left + rect.width / 2;
            var cy = rect.top + rect.height / 2;
            var dx = e.clientX - cx;
            var dy = e.clientY - cy;
            var dist = Math.sqrt(dx*dx + dy*dy);
            var next = selectDirection(dx,dy,joystickAction,deadZone,releaseZone);
            var radius=Math.min(maxRadius,Math.max(0,(Math.min(rect.width,rect.height)-Math.max(knob.offsetWidth,knob.offsetHeight))/2-4));
            var kx=next==='left'?-radius:next==='right'?radius:0,ky=next==='up'?-radius:next==='down'?radius:0;
            knob.style.transform='translate3d('+kx.toFixed(1)+'px,'+ky.toFixed(1)+'px,0)';
            setJoystickAction(next);
        }

        function down(e) {
            e.preventDefault();
            if(joystickPointerId!==null&&joystickPointerId!==e.pointerId)return;
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

    function unlockAudio() {
        try {
            if (window.gGameEngine && gGameEngine.soundtrack && gGameEngine.soundtrackPlaying && !gGameEngine.mute) {
                gGameEngine.soundtrack.paused = false;
            }
        } catch (e) {}
    }

    function init() {
        var touch = isTouchPlatform();
        document.body.classList.toggle('touch-ui', touch);
        document.body.classList.toggle('desktop-ui', !touch);

        var controls = document.getElementById('mobileControls');
        if (!controls) return;

        bindJoystick(document.getElementById('mobileJoystick'), document.getElementById('mobileJoystickKnob'));
        bindBombButton(controls.querySelector('[data-action="bomb"]'));

        document.addEventListener('pointerdown', unlockAudio, {once:true, passive:true});
        window.addEventListener('blur', releaseAll);
        window.addEventListener('orientationchange',releaseAll);
        window.addEventListener('resize',function(){if(joystickPointerId!==null)releaseAll()});
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
            if (window.gGameEngine && gGameEngine.menu && !gGameEngine.menu.visible) gGameEngine.menu.show();
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
