(function(){
'use strict';
var VERSION='v0.16.2.13',installed=false,GAP=4;
var PLAYER_REG_X=10,PLAYER_REG_Y=12,BOMB_REG_X=5,BOMB_REG_Y=5;
function G(){return window.gGameEngine||null}
function $(id){return document.getElementById(id)}
function clone(p){return p?{x:Number(p.x)||0,y:Number(p.y)||0}:null}
function norm(d){if(!d)return null;var x=Number(d.x)||0,y=Number(d.y)||0;if(Math.abs(x)>=Math.abs(y)&&x)return{x:x>0?1:-1,y:0};if(y)return{x:0,y:y>0?1:-1};return null}
function sameDir(a,b){return!!(a&&b&&a.x===b.x&&a.y===b.y)}
function next(p,d){return{x:Number(p.x)+d.x,y:Number(p.y)+d.y}}
function same(a,b){return!!(a&&b&&Number(a.x)===Number(b.x)&&Number(a.y)===Number(b.y))}
function actorAt(p,except){var g=G(),all=g?((g.players||[]).concat(g.bots||[])):[];for(var i=0;i<all.length;i++){var a=all[i];if(a&&a!==except&&a.alive!==false&&same(a.position,p))return a}return null}
function bombAt(p,except){var g=G(),list=g&&g.bombs||[];for(var i=0;i<list.length;i++){var b=list[i];if(b&&b!==except&&!b.exploded&&same(b.position,p))return b}return null}
function clearAhead(b,owner,d){var g=G();if(!g||!b||!b.position)return false;var p=next(b.position,d);if(!g.getTileMaterial||g.getTileMaterial(p)!=='grass')return false;if(actorAt(p,owner))return false;if(bombAt(p,b))return false;return true}
function putSpriteInFront(b,owner,d){if(!b||!b.bmp||!owner||!owner.bmp)return;var ow=Number(owner.size&&owner.size.w)||48,oh=Number(owner.size&&owner.size.h)||48,bw=Number(b.size&&b.size.w)||28,bh=Number(b.size&&b.size.h)||28;
 var playerLeft=owner.bmp.x-PLAYER_REG_X,playerRight=playerLeft+ow,playerTop=owner.bmp.y-PLAYER_REG_Y,playerBottom=playerTop+oh;
 var bombVisibleW=bw,bombVisibleH=bh;
 if(d.x>0){b.bmp.x=playerRight+GAP+BOMB_REG_X;b.bmp.y=(playerTop+oh/2)-(bombVisibleH/2-BOMB_REG_Y)}
 else if(d.x<0){b.bmp.x=playerLeft-GAP-(bombVisibleW-BOMB_REG_X);b.bmp.y=(playerTop+oh/2)-(bombVisibleH/2-BOMB_REG_Y)}
 else if(d.y>0){b.bmp.y=playerBottom+GAP+BOMB_REG_Y;b.bmp.x=(playerLeft+ow/2)-(bombVisibleW/2-BOMB_REG_X)}
 else if(d.y<0){b.bmp.y=playerTop-GAP-(bombVisibleH-BOMB_REG_Y);b.bmp.x=(playerLeft+ow/2)-(bombVisibleW/2-BOMB_REG_X)}
}
function frontLaunch(b,owner,d){d=norm(d||b&&b.moveDirection);if(!b||b.exploded||!b.__v160Moving||!owner||!d)return b;var t=Date.now();if(t-(Number(b.__v16213LaunchAt)||0)<100&&b.__v16213LaunchOwner===owner&&sameDir(b.__v16213LaunchDir,d))return b;b.__v16213LaunchAt=t;b.__v16213LaunchOwner=owner;b.__v16213LaunchDir=clone(d);
 b.__v16211TravelOwner=owner;b.__v16212TravelOwner=owner;if(!b.__v16211TravelStartedAt&&!b.__v16212TravelStartedAt)b.__v16212TravelStartedAt=t;
 if(clearAhead(b,owner,d)){var ahead=next(b.position,d);b.__v16213LaunchOrigin=clone(b.position);b.position=clone(ahead);b.moveTargetPosition=null;b.__v161ImpactTarget=null;b.__v161Impact=null;b.__v161ImpactPosition=null;if(owner.escapeBomb===b)owner.escapeBomb=null;putSpriteInFront(b,owner,d);b.__v16213FrontAdvanced=true}
 return b}
function patchStarts(){var k=window.BomberKick160;if(k&&typeof k.startBombMoving==='function'&&!k.startBombMoving.__v16213FrontLaunch){var oldStart=k.startBombMoving,wrapStart=function(b,d,owner){var r=oldStart.apply(this,arguments);if(b&&b.__v160Moving)frontLaunch(b,owner||b.owner,d||b.moveDirection);return r};wrapStart.__v16213FrontLaunch=true;k.startBombMoving=wrapStart}
 if(window.Player){var kick=Player.prototype.tryKickBomb;if(kick&&!kick.__v16213FrontLaunch){var oldKick=kick,kickWrap=function(b,d){var r=oldKick.apply(this,arguments);if(r&&b&&b.__v160Moving)frontLaunch(b,this,d||b.moveDirection);return r};kickWrap.__v16213FrontLaunch=true;Player.prototype.tryKickBomb=kickWrap}
  var place=Player.prototype.placeBomb;if(place&&!place.__v16213FrontLaunch){var oldPlace=place,placeWrap=function(){var b=oldPlace.apply(this,arguments);if(b&&b.__v160Moving)frontLaunch(b,this,b.moveDirection);return b};placeWrap.__v16213FrontLaunch=true;Player.prototype.placeBomb=placeWrap}}
 if(window.Bot){var plant=Bot.prototype.plantBomb;if(plant&&!plant.__v16213FrontLaunch){var oldPlant=plant,plantWrap=function(){var b=oldPlant.apply(this,arguments);if(b&&b.__v160Moving)frontLaunch(b,this,b.moveDirection);return b};plantWrap.__v16213FrontLaunch=true;Bot.prototype.plantBomb=plantWrap}}
}
function ensureVersion(){window.BomberBuildVersion=VERSION;window.BomberVersionUIOwner='runtime-v016213-front-launch';var st=$('v016213-style');if(!st){st=document.createElement('style');st.id='v016213-style';st.textContent="#releaseBadge1561 strong{font-size:0!important;line-height:1.15!important}#releaseBadge1561 strong::before{content:'v0.16.2.13'!important;font-size:10px!important;font-weight:800!important;letter-spacing:.01em!important}";(document.head||document.documentElement).appendChild(st)}var b=$('releaseBadge1561');if(b)b.setAttribute('aria-label','Bomberman '+VERSION+', Remastered by Cole Alexander');if(document.title!=='Bomberman '+VERSION)document.title='Bomberman '+VERSION}
function watchVersion(){if(window.MutationObserver){var title=document.querySelector('title');if(title)new MutationObserver(function(){ensureVersion()}).observe(title,{childList:true,characterData:true,subtree:true})}setInterval(ensureVersion,60)}
function install(){if(installed)return true;if(!document.body||!window.Player||!window.Bomb||!window.BomberKick160)return false;patchStarts();ensureVersion();watchVersion();document.body.setAttribute('data-v016213-runtime','1');window.BomberFix16213={version:VERSION,frontLaunch:frontLaunch,clearAhead:clearAhead};installed=true;return true}
var tries=0,t=setInterval(function(){if(install()||++tries>1600)clearInterval(t)},25);setInterval(function(){if(installed)patchStarts()},120);
})();
