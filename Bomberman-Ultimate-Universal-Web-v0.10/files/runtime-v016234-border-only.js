(function(){
'use strict';
// v0.16.2.34: Border Bomb Kick guard only. No Bot/AI behavior modifications.
var VERSION='v0.16.2.34',blocked=0;
function G(){return window.gGameEngine||null}
function direction(actor){
 if(!actor)return null;
 var d=null;try{if(actor.getBombKickDirection)d=actor.getBombKickDirection()}catch(e){}
 d=d||actor.lastMoveDirection;
 if(!d)return null;
 var x=Number(d.x)||0,y=Number(d.y)||0;
 if(Math.abs(x)>=Math.abs(y)&&x)return{x:x>0?1:-1,y:0};
 if(y)return{x:0,y:y>0?1:-1};
 return null
}
function outward(actor){
 var g=G(),p=actor&&actor.position,d=direction(actor);
 if(!g||!p||!d||!isFinite(Number(g.tilesX))||!isFinite(Number(g.tilesY)))return false;
 var n={x:p.x+d.x,y:p.y+d.y};
 return (n.x<=0||n.y<=0||n.x>=g.tilesX-1||n.y>=g.tilesY-1)&&(!g.getTileMaterial||g.getTileMaterial(n)==='wall')
}
function install(){
 var P=window.Player;
 if(!P||!P.prototype||!P.prototype.placeBomb)return false;
 var old=P.prototype.placeBomb;
 if(old.__v16234BorderOnly)return true;
 function placeBomb(){
  if(this.bombKickArmed&&Number(this.bombKickCharges)>0&&outward(this)){blocked++;return false}
  return old.apply(this,arguments)
 }
 placeBomb.__v16234BorderOnly=true;
 P.prototype.placeBomb=placeBomb;return true
}
window.BomberBorderGuard16234={version:VERSION,install:install,outward:outward,stats:function(){return{blockedOutwardThrows:blocked}}};
install();setInterval(install,180);
})();