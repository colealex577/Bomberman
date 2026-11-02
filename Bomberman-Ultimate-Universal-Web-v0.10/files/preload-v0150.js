(function(){
'use strict';
window.BomberBuildVersion='v0.16.2.24';
window.BomberVersionUIOwner='runtime-v016224-observer-sim-chat';
var VERSION=window.BomberBuildVersion,TITLE='Bomberman v0.16.2.24',OWNER='runtime-v016224-observer-sim-chat';
(function(){var t=document.querySelector('title');if(!t){t=document.createElement('title');(document.head||document.documentElement).appendChild(t)}try{t.textContent=TITLE;document.title=TITLE}catch(e){}try{Object.defineProperty(window,'BomberBuildVersion',{configurable:false,enumerable:true,get:function(){return VERSION},set:function(){}})}catch(e){}try{Object.defineProperty(window,'BomberVersionUIOwner',{configurable:false,enumerable:true,get:function(){return OWNER},set:function(){}})}catch(e){}try{Object.defineProperty(t,'textContent',{configurable:false,get:function(){return TITLE},set:function(){}})}catch(e){t.textContent=TITLE}try{Object.defineProperty(document,'title',{configurable:false,get:function(){return TITLE},set:function(){}})}catch(e){}})();
/* Install before the legacy Bomb Kick runtime: E/Q are direct throws, never arm toggles. */
(function(){if(window.__v16222PreloadKeyCapture)return;window.__v16222PreloadKeyCapture=true;function editable(t){var q=String(t&&t.tagName||'').toLowerCase();return q==='input'||q==='textarea'||q==='select'||!!(t&&t.isContentEditable)}function dispatch(code,down){try{if(window.BomberFix16222&&BomberFix16222.directKey)return BomberFix16222.directKey(code,down)}catch(e){}if(!down)return true;var idx=code==='KeyQ'?1:0,g=window.gGameEngine,p=g&&g.players&&g.players[idx];if(p&&p.throwBombNow){p.throwBombNow();return true}return false}function handle(e,down){if(editable(e.target)||!({KeyE:1,KeyQ:1})[e.code])return;e.preventDefault();e.stopImmediatePropagation();if(down&&e.repeat)return;dispatch(e.code,down)}window.addEventListener('keydown',function(e){handle(e,true)},true);window.addEventListener('keyup',function(e){handle(e,false)},true)})();
function early(id,src){if(document.getElementById(id))return;var s=document.createElement('script');s.id=id;s.src=src;(document.head||document.documentElement).appendChild(s)}
early('runtime-v016222-return-defense-controls-loader','./files/runtime-v016222-return-defense-controls.js?v=016222');
early('runtime-v016223-public-presence-controls-loader','./files/runtime-v016223-public-presence-controls.js?v=016223c');
early('runtime-v016224-observer-sim-chat-loader','./files/runtime-v016224-observer-sim-chat.js?v=016224');
early('runtime-v016224-authoritative-spectator-chat-loader','./files/runtime-v016224-authoritative-spectator-chat.js?v=016224a');
early('runtime-v016224-spectator-chat-bridge-loader','./files/runtime-v016224-spectator-chat-bridge.js?v=016224b');
early('runtime-v016221-return-controls-loader','./files/runtime-v016221-return-controls.js?v=016221');
early('runtime-v016220-round-end-delay-rematch-loader','./files/runtime-v016220-round-end-delay-rematch.js?v=016220');
early('runtime-v016219-travel-capacity-ai-loader','./files/runtime-v016219-travel-capacity-ai.js?v=016219');
early('runtime-v016218-round-integrity-rematch-loader','./files/runtime-v016218-round-integrity-rematch.js?v=016218');
early('runtime-v016215-bomb-travel-loader','./files/runtime-v016215-bomb-travel.js?v=016215');
early('runtime-v016216-wall-response-loader','./files/runtime-v016216-wall-response.js?v=016217');
early('matchmaking-v0151-loader','./files/matchmaking-v0151.js?v=01544');
early('runtime-v0151-polish-loader','./files/runtime-v0151-polish.js?v=01629');
early('runtime-v0152-human-observer-loader','./files/runtime-v0152-human-observer.js?v=0153');
early('runtime-v0153-observer-progression-loader','./files/runtime-v0153-observer-progression.js?v=01541');
early('runtime-v0154-observer-controls-loader','./files/runtime-v0154-observer-controls.js?v=01541');
early('runtime-v0150-release-loader','./files/runtime-v0150-release.js?v=0155');
early('runtime-v0156-gameplay-polish-loader','./files/runtime-v0156-gameplay-polish.js?v=0156');
early('runtime-v0156-killnames-loader','./files/runtime-v0156-killnames.js?v=0156');
early('runtime-v01561-onboarding-brand-loader','./files/runtime-v01561-onboarding-brand.js?v=016211b');
early('runtime-v01562-public-chat-stability-loader','./files/runtime-v01562-public-chat-stability.js?v=01562');
early('runtime-v0157-public-behavior-loader','./files/runtime-v0157-public-behavior.js?v=0157');
early('runtime-v0158-round-social-loader','./files/runtime-v0158-round-social.js?v=0158');
if(window.BomberPackedLoader)BomberPackedLoader.load('runtime-v0160-bomb-kick-loader','./files/runtime-v0160-bomb-kick.js.gz.b64?v=01629');else early('runtime-v0160-bomb-kick-loader','./files/runtime-v0160-bomb-kick.js?v=01629');
early('runtime-v0161-bomb-kick-polish-loader','./files/runtime-v0161-bomb-kick-polish.js?v=01622d');
early('runtime-v0161-bomb-kick-compat-loader','./files/runtime-v0161-bomb-kick-compat.js?v=0161d');
early('runtime-v0161-speed-standard-loader','./files/runtime-v0161-speed-standard.js?v=0161s');
early('runtime-v0161-lobby-chat-cleanup-loader','./files/runtime-v0161-lobby-chat-cleanup.js?v=0161l');
early('runtime-v016210-ai-policy-loader','./files/runtime-v016210-ai-policy.js?v=016210');
early('runtime-v016217-ai-mining-spacing-loader','./files/runtime-v016217-ai-mining-spacing.js?v=016217');
early('runtime-v016211-stability-loader','./files/runtime-v016211-travel-chat-drops.js?v=016211a');
early('runtime-v016212-owner-pass-loader','./files/runtime-v016212-owner-pass.js?v=016212');
(function(){var n=0,m=setInterval(function(){if(window.BomberFix16216&&window.BomberAI16217&&window.BomberFix16218&&window.BomberFix16219&&window.BomberFix16220&&window.BomberFix16221&&window.BomberFix16222&&window.BomberFix16223&&window.BomberFix16224&&window.BomberAuthoritativeSpectatorChat16224&&window.BomberChatBridge16224){if(document.body){document.body.setAttribute('data-v016216-runtime','1');document.body.setAttribute('data-v016217-ai','1');document.body.setAttribute('data-v016218-runtime','1');document.body.setAttribute('data-v016219-runtime','1');document.body.setAttribute('data-v016220-runtime','1');document.body.setAttribute('data-v016221-runtime','1');document.body.setAttribute('data-v016222-runtime','1');document.body.setAttribute('data-v016223-runtime','1');document.body.setAttribute('data-v016224-runtime','1');document.body.setAttribute('data-v016224-authoritative-chat','1');document.body.setAttribute('data-v016224-chat-bridge','1')}clearInterval(m)}else if(++n>1200)clearInterval(m)},50)})();
if(!window.gGameEngine)return;
var game=window.gGameEngine;
game.load=function(){
 this.stage=new createjs.Stage('canvas');
 this.stage.enableMouseOver();
 if(createjs.Touch&&createjs.Touch.isSupported&&createjs.Touch.isSupported())createjs.Touch.enable(this.stage,true,false);
 var that=this,assets={playerBoy:'./files/img/george.png',playerGirl:'./files/img/betty.png',playerGirl2:'./files/img/betty2.png',tile_grass:'./files/img/tile_grass.png',tile_wall:'./files/img/tile_wall.png',tile_wood:'./files/img/tile_wood.png',bomb:'./files/img/bomb.png',fire:'./files/img/fire.png',bonuses:'./files/img/bonuses.png',kickBonus:'./files/img/bomb_kick.png'},images={},keys=Object.keys(assets),pending=keys.length,done=false;
 function finish(){if(done||pending>0)return;done=true;that.playerBoyImg=images.playerBoy;that.playerGirlImg=images.playerGirl;that.playerGirl2Img=images.playerGirl2;that.botDarkImg=that.createDarkSkinBotImage(that.playerBoyImg);that.tilesImgs.grass=images.tile_grass;that.tilesImgs.wall=images.tile_wall;that.tilesImgs.wood=images.tile_wood;that.bombImg=images.bomb;that.fireImg=images.fire;that.bonusesImg=images.bonuses;that.kickBonusImg=images.kickBonus;that.setup()}
 keys.forEach(function(id){var img=new Image(),settled=false;function settle(ok){if(settled)return;settled=true;if(!ok)console.error('Bomberman asset failed to load:',assets[id]);images[id]=img;pending--;finish()}img.onload=function(){settle(true)};img.onerror=function(){settle(false)};img.src=assets[id]+'?v=0161b';if(img.complete&&img.naturalWidth)settle(true)});
 createjs.Sound.addEventListener('fileload',this.onSoundLoaded);createjs.Sound.alternateExtensions=['mp3'];createjs.Sound.registerSound('./files/sound/bomb.ogg','bomb');createjs.Sound.registerSound('./files/sound/game.ogg','game');
 this.menu=new Menu();
};
window.BomberPreload150={version:VERSION,nativeImages:true};
})();
