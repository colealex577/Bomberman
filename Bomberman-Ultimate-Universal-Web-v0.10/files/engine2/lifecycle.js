/* Bomberman 2.0: native engine lifecycle and frame coordinator.
 * These are the original GameEngine implementations moved intact into named
 * services. All legacy prototype hooks remain compatible during migration.
 * This module owns round initialization, restart and the active frame path.
 */
(function(global){
  'use strict';
  var stats={setups:0,restarts:0,frames:0,errors:0};
  var current=null,phase='boot',generation=0;
  var accumulator=0,clockStats={callbacks:0,steps:0,catchUpSteps:0,droppedMs:0,lastDelta:20};
  function tick(event){
    var g=global.gGameEngine;if(!g)return;
    var delta=event&&Number(event.delta);if(!Number.isFinite(delta)||delta<=0)delta=20;
    clockStats.callbacks++;clockStats.lastDelta=delta;
    if(global.document&&global.document.hidden){accumulator=0;return}
    if(global.B115&&(B115.role==='guest'||B115.role==='spectator')||!g.playing||g.lobbyOpen||g.menu&&g.menu.visible){accumulator=0;g.update();clockStats.steps++;return}
    if(delta>120){clockStats.droppedMs+=delta-120;delta=120}
    accumulator+=delta;var steps=0,round=g.__setupSerial;
    while(accumulator>=20&&steps<5){accumulator-=20;g.update();steps++;clockStats.steps++;if(g.__setupSerial!==round){accumulator=0;break}}
    if(steps>1)clockStats.catchUpSteps+=steps-1;
    if(accumulator>=20){clockStats.droppedMs+=accumulator-(accumulator%20);accumulator%=20}
  }
  function clock(){return Object.assign({accumulatorMs:accumulator},clockStats)}
  if(global.document&&global.document.addEventListener)global.document.addEventListener('visibilitychange',function(){accumulator=0});

  function setupGame(game){
    if(!game) throw new Error('Missing game for setup');
    current=game;accumulator=0;generation++;phase='setting-up';stats.setups++;
    if(global.BomberEngine2Render)global.BomberEngine2Render.attach(game);
    try { var result=originalSetup.call(game);if(global.BomberEngine2Diagnostics)global.BomberEngine2Diagnostics.afterSetup(game);return result; }
    catch(err){stats.errors++;phase='error';throw err}
    finally { if(phase==='setting-up') phase='ready'; }
  }
  function originalSetup(){
            // A rapid restart must not leave a delayed listener from an older round.
            if (this.__restartListenerTimer) clearTimeout(this.__restartListenerTimer);
            var setupSerial = this.__setupSerial = (Number(this.__setupSerial) || 0) + 1;
            // InputEngine.setup installs document listeners. It must run exactly once per tab.
            if (!gInputEngine.__setupComplete) gInputEngine.setup();
    
            this.bombs = [];
            this.tiles = [];
            this.bonuses = [];
            this.matchFinished = false;
            this.resetSpectating();
    
            // Draw tiles
            this.drawTiles();
            this.drawBonuses();
    
            this.spawnBots();
            this.spawnPlayers();
            if(global.BomberEngine2Round)global.BomberEngine2Round.afterSpawn(this);
    
            // Toggle sound
            gInputEngine.addListener('mute', this.toggleSound);
    
            // Restart listener
            // Timeout because when you press enter in address bar too long, it would not show menu
            this.__restartListenerTimer = setTimeout(function() {
                if (gGameEngine.__setupSerial !== setupSerial) return;
                gGameEngine.__restartListenerTimer = null;
                gInputEngine.addListener('restart', function() {
                    if (gGameEngine.playersCount == 0) {
                        gGameEngine.menu.setMode('single');
                    } else {
                        gGameEngine.menu.hide();
                        gGameEngine.restart();
                    }
                });
            }, 200);
            // Escape listener
            gInputEngine.addListener('escape', function() {
                if (!gGameEngine.menu.visible) {
                    gGameEngine.menu.show();
                }
            });
    
            // Start loop
            if (!createjs.Ticker.hasEventListener('tick')) {
                createjs.Ticker.addEventListener('tick', tick);
                createjs.Ticker.setFPS(this.fps);
            }
            var v07SoundDefaultApplied = Boolean(Storage.getValue('soundDefaultV07Applied'));
            if (!v07SoundDefaultApplied) {
                // v0.7 migration: force the first launch of this release to start with
                // sound ON even if an older build left a muted value in localStorage.
                gGameEngine.mute = false;
                Storage.setValue('muted', false);
                Storage.setValue('soundDefaultV07Applied', true);
            } else {
                var soundPreferenceSet = Boolean(Storage.getValue('soundPreferenceSet'));
                // After the first v0.7 launch, respect explicit user mute/unmute choices.
                gGameEngine.mute = soundPreferenceSet ? Boolean(Storage.getValue('muted')) : false;
            }
            if (gGameEngine.playersCount > 0) {
                if (this.soundtrackLoaded) {
                    this.playSoundtrack();
                }
            }
    
            if (!this.playing) {
                this.menu.show();
            }
        
  }

  function frame(game){
    if(!game)return;
    stats.frames++;
    var d=global.BomberEngine2Diagnostics;game.__engine2TileIndexActive=true;game.__engine2TileIndex=null;try{return d?d.measureFrame(game,function(){return originalFrame.call(game)}):originalFrame.call(game)}finally{game.__engine2TileIndexActive=false;game.__engine2TileIndex=null}
  }
  function originalFrame(){
            if (window.BomberMultiplayer && BomberMultiplayer.frame()) return;
            if (gGameEngine.lobbyOpen) {
                gGameEngine.menu.update();
                gGameEngine.stage.update();
                return;
            }
    
            if (gGameEngine.spectatorFinished) {
                gGameEngine.stage.update();
                return;
            }
    
            // Player
            for (var i = 0; i < gGameEngine.players.length; i++) {
                var player = gGameEngine.players[i];
                player.update();
            }
    
            // Bots
            for (var i = 0; i < gGameEngine.bots.length; i++) {
                var bot = gGameEngine.bots[i];
                bot.update();
            }
    
            // Bombs
            for (var i = 0; i < gGameEngine.bombs.length; i++) {
                var bomb = gGameEngine.bombs[i];
                bomb.update();
            }
    
            if (window.BomberMultiplayer) BomberMultiplayer.afterFrame();
    
            // Menu
            gGameEngine.menu.update();
    
            // Stage
            gGameEngine.stage.update();
        
  }

  function restart(game){
    if(!game)throw new Error('Missing game for restart');
    stats.restarts++;phase='restarting';if(global.BomberEngine2Diagnostics)global.BomberEngine2Diagnostics.beforeRestart(game);
    try{return originalRestart.call(game)}
    catch(err){stats.errors++;phase='error';throw err}
  }
  function originalRestart(){
            gInputEngine.removeAllListeners();
            if(global.BomberEngine2Input)global.BomberEngine2Input.resetActions(gInputEngine);
            gGameEngine.resetSpectating();
            gGameEngine.stage.removeAllChildren();
            gGameEngine.setup();
        
  }

  global.BomberEngine2Lifecycle=Object.freeze({
    version:'2.1.2',setupGame:setupGame,frame:frame,restart:restart,clock:clock,tick:tick,
    snapshot:function(){return{phase:phase,generation:generation,roundToken:current&&current.__setupSerial||0,setups:stats.setups,restarts:stats.restarts,frames:stats.frames,errors:stats.errors}}
  });
})(window);
