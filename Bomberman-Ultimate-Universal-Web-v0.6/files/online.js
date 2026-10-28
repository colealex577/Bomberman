(function () {
    'use strict';

    var peer = null;
    var conn = null;
    var mediaCall = null;
    var role = 'offline';
    var activeRemoteKeys = {};
    var hostRoomCode = '';
    var scriptLoaded = false;
    var ultimateMode = false;
    var dropRate = 16;
    var els = {};

    function $(id) { return document.getElementById(id); }

    function isEditableTarget(target) {
        if (!target) return false;
        var tag = String(target.tagName || '').toLowerCase();
        return tag === 'input' || tag === 'textarea' || tag === 'select' || !!target.isContentEditable;
    }

    function status(text, kind) {
        var targets = [els.status, els.joinStatus];
        for (var i = 0; i < targets.length; i++) {
            if (!targets[i] || targets[i].hidden) continue;
            targets[i].textContent = text || '';
            targets[i].className = 'online_status ' + (kind || '');
        }
    }

    function setRole(next) {
        role = next;
        document.body.setAttribute('data-online-role', next);
        renderUltimateMode();
    }

    function renderUltimateMode() {
        var buttons = [els.ultimateBtn, els.ultimateLobbyBtn];
        for (var i = 0; i < buttons.length; i++) {
            var b = buttons[i];
            if (!b) continue;
            b.textContent = ultimateMode ? 'ULTIMATE MODE: ON' : 'ULTIMATE MODE: OFF';
            b.classList.toggle('on', ultimateMode);
            b.setAttribute('aria-pressed', ultimateMode ? 'true' : 'false');
            b.disabled = (role === 'guest');
        }
        if (els.ultimateHint) {
            els.ultimateHint.textContent = ultimateMode
                ? 'ACTIVE • 100% drops • 5× power-ups • 1.5× music • 2× AI speed'
                : '100% block drops • power-ups 5× stronger';
        }
        renderDropRate();
    }

    function clampDropRate(value) {
        var n = Math.round(Number(value));
        if (!isFinite(n)) n = 16;
        return Math.max(16, Math.min(100, n));
    }

    function renderDropRate() {
        if (!els.dropRateSlider || !els.dropRateValue) return;
        var shown = ultimateMode ? 100 : dropRate;
        els.dropRateSlider.value = shown;
        els.dropRateSlider.disabled = ultimateMode || role === 'guest';
        els.dropRateValue.textContent = ultimateMode
            ? '100% · ULTIMATE'
            : (dropRate === 16 ? '16% · DEFAULT' : dropRate + '%');
        if (els.dropRateNote) {
            els.dropRateNote.textContent = ultimateMode
                ? 'ULTIMATE MODE forces a power-up under every destructible block. Turn it off to use your custom drop rate.'
                : 'Normal power-up strength. ULTIMATE MODE overrides drops to 100%.';
        }
    }

    function applyDropRate(value, fromRemote) {
        dropRate = clampDropRate(value);
        if (window.gGameEngine) gGameEngine.bonusesPercent = dropRate;
        renderDropRate();
        if (!fromRemote && role === 'host') {
            broadcast({type: 'settings', ultimate: ultimateMode, dropRate: dropRate});
        }
    }

    function applyMusicRate() {
        var rate = ultimateMode ? 1.5 : 1;
        if (window.gGameEngine && typeof gGameEngine.setMusicRate === 'function') {
            gGameEngine.setMusicRate(rate);
        }
        if (els.guestMusic) {
            try { els.guestMusic.playbackRate = rate; } catch (e) {}
        }
    }

    function applyUltimateMode(enabled, fromRemote) {
        ultimateMode = !!enabled;
        if (window.gGameEngine) gGameEngine.ultimateMode = ultimateMode;
        renderUltimateMode();
        applyMusicRate();

        if (!fromRemote && role === 'host') {
            broadcast({type: 'mode', ultimate: ultimateMode, dropRate: dropRate});
        }

        // Rebuild a running local/host match so bot appearance/speed and drops
        // all change together. Do not rebuild the guest's unused local board.
        if (!fromRemote && role !== 'guest' && window.gGameEngine && gGameEngine.playing && !gGameEngine.lobbyOpen) {
            gGameEngine.restart();
        }
    }

    function toggleUltimateMode() {
        if (role === 'guest') return;
        applyUltimateMode(!ultimateMode, false);
    }

    function normalizeCode(value) {
        return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    }

    function randomCode() {
        var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        var out = '';
        if (window.crypto && window.crypto.getRandomValues) {
            var bytes = new Uint8Array(6);
            window.crypto.getRandomValues(bytes);
            for (var i = 0; i < bytes.length; i++) out += chars[bytes[i] % chars.length];
            return out;
        }
        for (var j = 0; j < 6; j++) out += chars[Math.floor(Math.random() * chars.length)];
        return out;
    }

    function peerIdFromRoom(code) { return 'bomberman-' + normalizeCode(code).toLowerCase(); }

    function loadPeerJs(callback) {
        if (window.Peer) { callback(); return; }
        if (scriptLoaded) {
            var tries = 0;
            var timer = setInterval(function () {
                tries++;
                if (window.Peer) { clearInterval(timer); callback(); }
                else if (tries > 100) { clearInterval(timer); status('Could not load online networking. Check your internet connection.', 'error'); }
            }, 100);
            return;
        }
        scriptLoaded = true;
        var urls = [
            'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js',
            'https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js'
        ];
        var index = 0;
        function tryNext() {
            if (index >= urls.length) {
                status('Could not load online networking. Check your internet connection.', 'error');
                return;
            }
            var script = document.createElement('script');
            script.src = urls[index++];
            script.onload = callback;
            script.onerror = tryNext;
            document.head.appendChild(script);
        }
        tryNext();
    }

    function destroyPeer() {
        try { if (mediaCall) mediaCall.close(); } catch (e) {}
        try { if (conn) conn.close(); } catch (e) {}
        try { if (peer) peer.destroy(); } catch (e) {}
        peer = null;
        conn = null;
        mediaCall = null;
        activeRemoteKeys = {};
    }

    function showLobbyPanel(name) {
        els.choice.hidden = name !== 'choice';
        els.hostControls.hidden = name !== 'host';
        els.joinControls.hidden = name !== 'join';
        if (els.status) els.status.hidden = name !== 'host';
        if (els.joinStatus) els.joinStatus.hidden = name !== 'join';
    }

    function openLobby() {
        destroyPeer();
        setRole('offline');
        if (window.gGameEngine) gGameEngine.lobbyOpen = true;
        els.lobby.hidden = false;
        showLobbyPanel('choice');
        status('', '');
    }

    function closeLobby() {
        if (role === 'host' || role === 'guest') destroyPeer();
        setRole('offline');
        if (window.gGameEngine) gGameEngine.lobbyOpen = false;
        els.lobby.hidden = true;
        showLobbyPanel('choice');
    }

    function peerError(err) {
        var msg = err && (err.message || err.type) ? (err.message || err.type) : String(err || 'Unknown connection error');
        status('Connection error: ' + msg, 'error');
    }

    function setupPeerHandlers(p) {
        p.on('error', peerError);
        p.on('disconnected', function () {
            if (role !== 'offline') status('Signaling disconnected. Existing match may continue.', 'warn');
        });
    }

    function host() {
        destroyPeer();
        setRole('host');
        showLobbyPanel('host');
        applyDropRate(dropRate, true);
        hostRoomCode = randomCode();
        els.roomCode.value = hostRoomCode;
        status('Creating room…', 'working');

        loadPeerJs(function () {
            peer = new Peer(peerIdFromRoom(hostRoomCode));
            setupPeerHandlers(peer);
            peer.on('open', function () {
                status('Waiting for Player 2…', 'working');
            });
            peer.on('connection', function (incoming) {
                if (conn && conn.open) {
                    try { incoming.send({type: 'reject', reason: 'Room already has a Player 2.'}); } catch (e) {}
                    setTimeout(function () { try { incoming.close(); } catch (e) {} }, 250);
                    return;
                }
                conn = incoming;
                attachHostConnection(incoming);
            });
        });
    }

    function beginHostMatch(guestPeerId) {
        if (!window.gGameEngine || !gGameEngine.menu) return;
        gGameEngine.lobbyOpen = false;
        els.lobby.hidden = true;
        els.matchBar.hidden = false;
        els.matchStatus.textContent = 'ONLINE • PLAYER 1 • ROOM ' + hostRoomCode;
        gGameEngine.menu.setMode('multi');
        applyMusicRate();
        setTimeout(function () {
            startCanvasStreamToGuest(guestPeerId);
            try { conn.send({type: 'start', ultimate: ultimateMode, dropRate: dropRate}); } catch (e) {}
        }, 250);
    }

    function attachHostConnection(c) {
        c.on('open', function () {
            status('Player 2 connected — starting match…', 'good');
            try {
                c.send({type: 'hello', role: 'guest'});
                c.send({type: 'mode', ultimate: ultimateMode, dropRate: dropRate});
            } catch (e) {}
            beginHostMatch(c.peer);
        });
        c.on('data', function (data) {
            if (!data || typeof data !== 'object') return;
            if (data.type === 'key') applyRemoteAction(data.action, !!data.down);
            if (data.type === 'ping') { try { c.send({type: 'pong', t: data.t}); } catch (e) {} }
        });
        c.on('close', function () {
            clearRemoteActions();
            if (els.matchStatus) els.matchStatus.textContent = 'PLAYER 2 DISCONNECTED • ROOM ' + hostRoomCode;
            conn = null;
        });
        c.on('error', peerError);
    }

    function startCanvasStreamToGuest(guestPeerId) {
        var canvas = $('canvas');
        if (!canvas || typeof canvas.captureStream !== 'function') {
            if (els.matchStatus) els.matchStatus.textContent = 'STREAM ERROR — TRY CURRENT CHROME';
            return;
        }
        try {
            var stream = canvas.captureStream(30);
            var tracks = stream.getVideoTracks();
            if (tracks.length) tracks[0].contentHint = 'motion';
            mediaCall = peer.call(guestPeerId, stream, { metadata: {type: 'bomberman-canvas'} });
            mediaCall.on('error', peerError);
        } catch (e) { peerError(e); }
    }

    function showJoin() {
        destroyPeer();
        setRole('offline');
        showLobbyPanel('join');
        els.joinCode.value = '';
        els.joinCode.focus();
        status('', '');
    }

    function join() {
        var code = normalizeCode(els.joinCode.value);
        els.joinCode.value = code;
        if (code.length < 4) {
            status('Enter the room code your friend sent you.', 'error');
            return;
        }
        destroyPeer();
        setRole('guest');
        status('Connecting to ' + code + '…', 'working');

        // User gesture enables guest-side soundtrack; host mode will set its speed.
        try {
            els.guestMusic.volume = 1;
            els.guestMusic.loop = true;
            els.guestMusic.playbackRate = ultimateMode ? 1.5 : 1;
            els.guestMusic.play().catch(function () {});
        } catch (e) {}

        loadPeerJs(function () {
            peer = new Peer();
            setupPeerHandlers(peer);
            peer.on('call', function (call) {
                mediaCall = call;
                call.answer();
                call.on('stream', function (stream) {
                    els.remoteVideo.srcObject = stream;
                    els.remoteStage.hidden = false;
                    els.localStage.hidden = true;
                    els.lobby.hidden = true;
                    els.matchBar.hidden = false;
                    els.matchStatus.textContent = 'ONLINE • PLAYER 2 • ROOM ' + code;
                    if (window.gGameEngine) gGameEngine.lobbyOpen = false;
                    try { els.remoteVideo.play(); } catch (e) {}
                });
                call.on('error', peerError);
                call.on('close', function () {
                    if (els.matchStatus) els.matchStatus.textContent = 'HOST STREAM ENDED';
                });
            });
            peer.on('open', function () {
                conn = peer.connect(peerIdFromRoom(code), {serialization: 'json'});
                attachGuestConnection(conn, code);
            });
        });
    }

    function attachGuestConnection(c, code) {
        c.on('open', function () { status('Connected. Waiting for host to start…', 'working'); });
        c.on('data', function (data) {
            if (!data || typeof data !== 'object') return;
            if (data.type === 'reject') status(data.reason || 'Host rejected the connection.', 'error');
            if (data.type === 'bomb') playGuestBomb();
            if (data.type === 'mode' || data.type === 'settings') {
                if (typeof data.dropRate !== 'undefined') applyDropRate(data.dropRate, true);
                applyUltimateMode(!!data.ultimate, true);
                var effectiveRate = data.ultimate ? 100 : dropRate;
                status(data.ultimate
                    ? 'Connected • ULTIMATE MODE • 100% drops • starting…'
                    : 'Connected • ' + effectiveRate + '% item drops • starting…',
                    data.ultimate ? 'warn' : 'good');
            }
            if (data.type === 'start') {
                if (typeof data.dropRate !== 'undefined') applyDropRate(data.dropRate, true);
                applyUltimateMode(!!data.ultimate, true);
                status('Starting match…', 'good');
            }
        });
        c.on('close', function () {
            if (els.matchStatus) els.matchStatus.textContent = 'DISCONNECTED FROM HOST';
            els.remoteStage.hidden = true;
            els.localStage.hidden = false;
        });
        c.on('error', peerError);
    }

    function startLocalMultiplayer() {
        destroyPeer();
        setRole('offline');
        els.lobby.hidden = true;
        els.matchBar.hidden = true;
        if (window.gGameEngine) {
            gGameEngine.lobbyOpen = false;
            gGameEngine.menu.setMode('multi');
        }
    }

    function disconnectOnline() {
        destroyPeer();
        try { els.guestMusic.pause(); els.guestMusic.currentTime = 0; } catch (e) {}
        els.matchBar.hidden = true;
        els.remoteStage.hidden = true;
        els.localStage.hidden = false;
        setRole('offline');
        if (window.gGameEngine) {
            gGameEngine.lobbyOpen = false;
            gGameEngine.menu.show();
        }
    }

    function applyRemoteAction(action, down) {
        var allowed = {up2:1, down2:1, left2:1, right2:1, bomb2:1};
        if (!allowed[action] || !window.gInputEngine) return;
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

    function clearRemoteActions() {
        var actions = ['up2','down2','left2','right2','bomb2'];
        for (var i = 0; i < actions.length; i++) {
            if (window.gInputEngine) gInputEngine.actions[actions[i]] = false;
        }
    }

    var guestKeyMap = {
        'ArrowUp': 'up2', 'KeyW': 'up2',
        'ArrowDown': 'down2', 'KeyS': 'down2',
        'ArrowLeft': 'left2', 'KeyA': 'left2',
        'ArrowRight': 'right2', 'KeyD': 'right2',
        'Space': 'bomb2', 'ShiftLeft': 'bomb2', 'ShiftRight': 'bomb2'
    };

    function sendGuestAction(baseAction, down) {
        if (role !== 'guest' || !conn || !conn.open) return;
        var map = {up:'up2', down:'down2', left:'left2', right:'right2', bomb:'bomb2'};
        var action = map[baseAction] || baseAction;
        if (!map[baseAction] && !({up2:1,down2:1,left2:1,right2:1,bomb2:1})[action]) return;
        if (down && activeRemoteKeys[action]) return;
        if (!down && !activeRemoteKeys[action]) return;
        activeRemoteKeys[action] = !!down;
        try { conn.send({type:'key', action:action, down:!!down}); } catch (e) {}
    }

    function guestKeyEvent(event, down) {
        // Lobby/code fields must always receive normal typing.
        if (isEditableTarget(event.target)) return;
        if (role !== 'guest' || !conn || !conn.open) return;
        var action = guestKeyMap[event.code];
        if (!action) return;
        event.preventDefault();
        sendGuestAction(action, down);
    }

    function playGuestBomb() {
        try {
            var sfx = new Audio('./files/sound/bomb.mp3');
            sfx.volume = 0.2;
            sfx.play().catch(function () {});
        } catch (e) {}
    }

    function broadcast(data) {
        if (role === 'host' && conn && conn.open) { try { conn.send(data); } catch (e) {} }
    }
    function broadcastBomb() { broadcast({type: 'bomb'}); }

    function toggleGuestMusic() {
        if (role !== 'guest') return;
        try {
            if (els.guestMusic.paused) els.guestMusic.play().catch(function () {});
            else els.guestMusic.pause();
        } catch (e) {}
    }

    function init() {
        els.lobby = $('multiplayerLobby');
        els.choice = $('lobbyChoice');
        els.closeBtn = $('lobbyCloseBtn');
        els.hostBtn = $('onlineHostBtn');
        els.showJoinBtn = $('onlineShowJoinBtn');
        els.joinBtn = $('onlineJoinBtn');
        els.localMultiBtn = $('localMultiBtn');
        els.hostCancelBtn = $('hostCancelBtn');
        els.joinBackBtn = $('joinBackBtn');
        els.hostControls = $('onlineHostControls');
        els.joinControls = $('onlineJoinControls');
        els.status = $('onlineStatus');
        els.joinStatus = $('joinStatus');
        els.roomCode = $('onlineRoomCode');
        els.joinCode = $('onlineJoinCode');
        els.copyBtn = $('onlineCopyBtn');
        els.ultimateBtn = $('ultimateModeBtn');
        els.ultimateLobbyBtn = $('ultimateLobbyBtn');
        els.ultimateHint = $('ultimateModeHint');
        els.dropRateSlider = $('dropRateSlider');
        els.dropRateValue = $('dropRateValue');
        els.dropRateNote = $('dropRateNote');
        els.localStage = $('localStage');
        els.remoteStage = $('remoteStage');
        els.remoteVideo = $('remoteVideo');
        els.guestMusic = $('guestMusic');
        els.matchBar = $('onlineMatchBar');
        els.matchStatus = $('onlineMatchStatus');
        els.disconnectBtn = $('onlineDisconnectBtn');

        els.hostBtn.addEventListener('click', host);
        els.showJoinBtn.addEventListener('click', showJoin);
        els.joinBtn.addEventListener('click', join);
        els.localMultiBtn.addEventListener('click', startLocalMultiplayer);
        els.closeBtn.addEventListener('click', closeLobby);
        els.hostCancelBtn.addEventListener('click', function () { destroyPeer(); setRole('offline'); showLobbyPanel('choice'); });
        els.joinBackBtn.addEventListener('click', function () { destroyPeer(); setRole('offline'); showLobbyPanel('choice'); });
        els.disconnectBtn.addEventListener('click', disconnectOnline);
        els.ultimateBtn.addEventListener('click', toggleUltimateMode);
        els.ultimateLobbyBtn.addEventListener('click', toggleUltimateMode);
        els.dropRateSlider.addEventListener('input', function () {
            if (ultimateMode || role === 'guest') return;
            applyDropRate(this.value, false);
        });
        els.joinCode.addEventListener('blur', function () { this.value = normalizeCode(this.value); });
        els.joinCode.addEventListener('keydown', function (e) {
            // Keep normal typing intact; only Enter submits.
            if (e.key === 'Enter') { e.preventDefault(); join(); }
        });
        els.copyBtn.addEventListener('click', function () {
            var value = els.roomCode.value;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(value).then(function () {
                    var old = els.copyBtn.textContent;
                    els.copyBtn.textContent = 'Copied!';
                    setTimeout(function () { els.copyBtn.textContent = old; }, 1000);
                }).catch(function () {});
            } else {
                els.roomCode.select();
                document.execCommand('copy');
            }
        });

        window.addEventListener('keydown', function (e) {
            if (isEditableTarget(e.target)) return;
            if (!els.lobby.hidden && e.key === 'Escape') { e.preventDefault(); closeLobby(); return; }
            if (role === 'guest' && e.code === 'KeyM') { e.preventDefault(); toggleGuestMusic(); return; }
            guestKeyEvent(e, true);
        }, true);
        window.addEventListener('keyup', function (e) {
            if (isEditableTarget(e.target)) return;
            guestKeyEvent(e, false);
        }, true);
        window.addEventListener('blur', function () {
            if (role === 'guest' && conn && conn.open) {
                Object.keys(activeRemoteKeys).forEach(function (action) {
                    if (activeRemoteKeys[action]) {
                        activeRemoteKeys[action] = false;
                        try { conn.send({type:'key', action:action, down:false}); } catch (e) {}
                    }
                });
            }
        });

        setRole('offline');
        applyDropRate(16, true);
        renderUltimateMode();
    }

    window.BomberOnline = {
        init: init,
        openLobby: openLobby,
        broadcast: broadcast,
        broadcastBomb: broadcastBomb,
        setUltimateMode: function (enabled) { applyUltimateMode(!!enabled, false); },
        setDropRate: function (value) { applyDropRate(value, false); },
        getDropRate: function () { return dropRate; },
        isUltimate: function () { return ultimateMode; },
        isHost: function () { return role === 'host'; },
        isGuest: function () { return role === 'guest'; },
        sendTouchAction: sendGuestAction,
        toggleGuestMusic: toggleGuestMusic
    };

    document.addEventListener('DOMContentLoaded', init);
})();
