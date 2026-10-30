(function(){
'use strict';
var VERSION='v0.15.0';
if(!window.gGameEngine)return;
var game=window.gGameEngine;
game.load=function(){
 this.stage=new createjs.Stage('canvas');
 this.stage.enableMouseOver();
 if(createjs.Touch&&createjs.Touch.isSupported&&createjs.Touch.isSupported())createjs.Touch.enable(this.stage,true,false);
 var that=this,assets={playerBoy:'./files/img/george.png',playerGirl:'./files/img/betty.png',playerGirl2:'./files/img/betty2.png',tile_grass:'./files/img/tile_grass.png',tile_wall:'./files/img/tile_wall.png',tile_wood:'./files/img/tile_wood.png',bomb:'./files/img/bomb.png',fire:'./files/img/fire.png',bonuses:'./files/img/bonuses.png'},images={},keys=Object.keys(assets),pending=keys.length,done=false;
 function finish(){if(done||pending>0)return;done=true;that.playerBoyImg=images.playerBoy;that.playerGirlImg=images.playerGirl;that.playerGirl2Img=images.playerGirl2;that.botDarkImg=that.createDarkSkinBotImage(that.playerBoyImg);that.tilesImgs.grass=images.tile_grass;that.tilesImgs.wall=images.tile_wall;that.tilesImgs.wood=images.tile_wood;that.bombImg=images.bomb;that.fireImg=images.fire;that.bonusesImg=images.bonuses;that.setup()}
 keys.forEach(function(id){var img=new Image(),settled=false;function settle(ok){if(settled)return;settled=true;if(!ok)console.error('Bomberman asset failed to load:',assets[id]);images[id]=img;pending--;finish()}img.onload=function(){settle(true)};img.onerror=function(){settle(false)};img.src=assets[id]+'?v=0150';if(img.complete&&img.naturalWidth)settle(true)});
 createjs.Sound.addEventListener('fileload',this.onSoundLoaded);createjs.Sound.alternateExtensions=['mp3'];createjs.Sound.registerSound('./files/sound/bomb.ogg','bomb');createjs.Sound.registerSound('./files/sound/game.ogg','game');
 this.menu=new Menu();
};
window.BomberPreload150={version:VERSION,nativeImages:true};
})();
