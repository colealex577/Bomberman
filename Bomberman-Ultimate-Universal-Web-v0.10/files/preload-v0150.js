(function(){
'use strict';
var VERSION='v0.16.0';
function early(id,src){if(document.getElementById(id))return;var s=document.createElement('script');s.id=id;s.src=src;(document.head||document.documentElement).appendChild(s)}
early('matchmaking-v0151-loader','./files/matchmaking-v0151.js?v=01544');
early('runtime-v0151-polish-loader','./files/runtime-v0151-polish.js?v=0152');
early('runtime-v0152-human-observer-loader','./files/runtime-v0152-human-observer.js?v=0153');
early('runtime-v0153-observer-progression-loader','./files/runtime-v0153-observer-progression.js?v=01541');
early('runtime-v0154-observer-controls-loader','./files/runtime-v0154-observer-controls.js?v=01541');
early('runtime-v0150-release-loader','./files/runtime-v0150-release.js?v=0155');
early('runtime-v0156-gameplay-polish-loader','./files/runtime-v0156-gameplay-polish.js?v=0156');
early('runtime-v0156-killnames-loader','./files/runtime-v0156-killnames.js?v=0156');
early('runtime-v01561-onboarding-brand-loader','./files/runtime-v01561-onboarding-brand.js?v=0158');
early('runtime-v01562-public-chat-stability-loader','./files/runtime-v01562-public-chat-stability.js?v=01562');
early('runtime-v0157-public-behavior-loader','./files/runtime-v0157-public-behavior.js?v=0157');
early('runtime-v0158-round-social-loader','./files/runtime-v0158-round-social.js?v=0158');
early('runtime-v0160-bomb-kick-loader','./files/runtime-v0160-bomb-kick.js?v=0160');
early('runtime-v0161-bomb-kick-polish-loader','./files/runtime-v0161-bomb-kick-polish.js?v=0161');
if(!window.gGameEngine)return;
var game=window.gGameEngine;
game.load=function(){
 this.stage=new createjs.Stage('canvas');
 this.stage.enableMouseOver();
 if(createjs.Touch&&createjs.Touch.isSupported&&createjs.Touch.isSupported())createjs.Touch.enable(this.stage,true,false);
 var that=this,assets={playerBoy:'./files/img/george.png',playerGirl:'./files/img/betty.png',playerGirl2:'./files/img/betty2.png',tile_grass:'./files/img/tile_grass.png',tile_wall:'./files/img/tile_wall.png',tile_wood:'./files/img/tile_wood.png',bomb:'./files/img/bomb.png',fire:'./files/img/fire.png',bonuses:'./files/img/bonuses.png',kickBonus:'./files/img/bomb_kick.png'},images={},keys=Object.keys(assets),pending=keys.length,done=false;
 function finish(){if(done||pending>0)return;done=true;that.playerBoyImg=images.playerBoy;that.playerGirlImg=images.playerGirl;that.playerGirl2Img=images.playerGirl2;that.botDarkImg=that.createDarkSkinBotImage(that.playerBoyImg);that.tilesImgs.grass=images.tile_grass;that.tilesImgs.wall=images.tile_wall;that.tilesImgs.wood=images.tile_wood;that.bombImg=images.bomb;that.fireImg=images.fire;that.bonusesImg=images.bonuses;that.kickBonusImg=images.kickBonus;that.setup()}
 keys.forEach(function(id){var img=new Image(),settled=false;function settle(ok){if(settled)return;settled=true;if(!ok)console.error('Bomberman asset failed to load:',assets[id]);images[id]=img;pending--;finish()}img.onload=function(){settle(true)};img.onerror=function(){settle(false)};img.src=assets[id]+'?v=0161';if(img.complete&&img.naturalWidth)settle(true)});
 createjs.Sound.addEventListener('fileload',this.onSoundLoaded);createjs.Sound.alternateExtensions=['mp3'];createjs.Sound.registerSound('./files/sound/bomb.ogg','bomb');createjs.Sound.registerSound('./files/sound/game.ogg','game');
 this.menu=new Menu();
};
window.BomberPreload150={version:VERSION,nativeImages:true};
})();