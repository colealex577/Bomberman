(function(){
'use strict';
var VERSION='v0.12.6',installed=false,markers=[];
var S=window.B115;
function G(){return window.gGameEngine||null}
function dataGuest(){return !!(window.BomberDataSync&&BomberDataSync.active&&BomberDataSync.role==='guest'&&S&&S.role==='guest')}
function showVersion(){
 ['buildVersion','buildVersion119','buildVersion120','buildVersion121','buildVersion122','buildVersion123','buildVersion124','buildVersion125'].forEach(function(id){var e=document.getElementById(id);if(e)e.style.display='none'});
 var v=document.getElementById('buildVersion126');if(!v){v=document.createElement('div');v.id='buildVersion126';v.setAttribute('aria-label','Game version');v.style.cssText='position:fixed;top:calc(env(safe-area-inset-top,0px) + 5px);left:calc(env(safe-area-inset-left,0px) + 6px);z-index:2147483647;padding:2px 5px;border-radius:4px;background:rgba(0,0,0,.62);color:rgba(255,255,255,.94);font:700 9px/1.25 Arial,sans-serif;pointer-events:none';(document.body||document.documentElement).appendChild(v)}v.textContent=VERSION
}
function allOpponents(bot){var g=G();return g&&g.getPlayersAndBots?g.getPlayersAndBots().filter(function(x){return x&&x!==bot&&x.alive!==false}):[]}
function existingBlastMap(){var g=G(),m={};if(!g)return m;for(var i=0;i<g.bombs.length;i++){var b=g.bombs[i];if(!b||b.exploded)continue;var a=[];try{a=b.getDangerPositions()}catch(e){}for(var j=0;j<a.length;j++)m[a[j].x+','+a[j].y]=1}return m}
function bombPlan(bot,origin){
 var g=G();if(!g||!bot||!origin||typeof bot.simulatedBlast!=='function')return{wood:0,targets:0,score:-999};
 var blast=bot.simulatedBlast(origin,bot.bombStrength),covered=existingBlastMap(),wood=0,targets=0;
 for(var i=0;i<blast.length;i++){var p=blast[i];if(g.getTileMaterial(p)==='wood'&&!covered[p.x+','+p.y])wood++}
 var opp=allOpponents(bot);for(var k=0;k<opp.length;k++){for(var q=0;q<blast.length;q++){if(Utils.comparePositions(blast[q],opp[k].position)){targets++;break}}}
 var skill=bot.simulatedHuman?Math.max(.08,Math.min(1,Number(bot.humanSkill)||0)):0;
 return{wood:wood,targets:targets,score:wood*24+targets*(140+Math.round(skill*30))}
}
function useful(bot,origin){var p=bombPlan(bot,origin);return p.wood>0||p.targets>0}
function patchBombLogic(){
 if(!window.Bot||Bot.prototype.__v126UsefulBombs)return;Bot.prototype.__v126UsefulBombs=true;
 var oldPlant=Bot.prototype.plantBomb;
 Bot.prototype.bombUtility=function(origin){return bombPlan(this,origin||this.position)};
 Bot.prototype.bombWouldAccomplishSomething=function(origin){return useful(this,origin||this.position)};
 Bot.prototype.scoreBombPlacement=function(origin){if(!origin||this.hasBomb(origin))return-999;return bombPlan(this,origin).score};
 Bot.prototype.shouldPlantStrategicBomb=function(){
  if(this.activeBombCount()>=this.bombsMax||this.hasBomb(this.position))return false;
  if(!useful(this,this.position))return false;
  var spare=this.bombsMax-(this.activeBombCount()+1),escape=this.findEscapePath(this.position,this.bombStrength,spare>0);
  return !!(escape&&escape.length>1)
 };
 Bot.prototype.plantBomb=function(){if(!useful(this,this.position))return false;return oldPlant.apply(this,arguments)}
}
function markerShape(){
 var c=new createjs.Container(),s=new createjs.Shape();
 s.graphics.setStrokeStyle(1).beginStroke('#5b4100').beginFill('#ffe45c').moveTo(6,0).lineTo(1,9).lineTo(5,9).lineTo(2,17).lineTo(13,6).lineTo(8,6).lineTo(11,0).closePath();
 c.addChild(s);c.regX=6;c.regY=8;c.visible=false;c.mouseEnabled=false;return c
}
function ensureMarker(bot){var g=G();if(!g||!g.stage||!bot)return null;if(bot.__v126AttackMarker)return bot.__v126AttackMarker;var m=markerShape();m.__owner=bot;bot.__v126AttackMarker=m;g.stage.addChild(m);markers.push(m);return m}
function attackThreshold(bot){
 if(bot&&bot.simulatedHuman){var sk=Math.max(.08,Math.min(1,Number(bot.humanSkill)||0));return 10+Math.round(sk*34)}
 var d=window.BomberV125&&BomberV125.getDifficulty?BomberV125.getDifficulty():'normal';return{easy:5,normal:10,hard:21,expert:36}[d]||10
}
function remainingWood(){var g=G(),n=0;if(!g)return 999;for(var i=0;i<g.tiles.length;i++)if(g.tiles[i]&&g.tiles[i].material==='wood')n++;return n}
function attackActive(bot){if(!bot||bot.alive===false)return false;if(bot.hyperAggressive)return true;return dataGuest()&&remainingWood()<=attackThreshold(bot)}
function setMarker(bot,on){var g=G(),m=ensureMarker(bot);if(!m||!g)return;bot.attackMode=!!on;m.visible=!!on;if(!on)return;m.x=bot.bmp.x+14;m.y=bot.bmp.y-(bot.nameLabel?27:19)+Math.sin(Date.now()/120)*1.5;m.alpha=.82+Math.sin(Date.now()/95)*.16;try{g.moveToFront(m)}catch(e){try{g.stage.setChildIndex(m,g.stage.numChildren-1)}catch(x){}}}
function patchAttackMode(){
 if(!window.Bot||Bot.prototype.__v126AttackMarker)return;Bot.prototype.__v126AttackMarker=true;
 Bot.prototype.setAttackMarkerVisible=function(v){setMarker(this,!!v)};
 var old=Bot.prototype.updateEndgameAggression;Bot.prototype.updateEndgameAggression=function(){var r=old.apply(this,arguments);setMarker(this,attackActive(this));return r};
 var die=Bot.prototype.die;Bot.prototype.die=function(){setMarker(this,false);return die.apply(this,arguments)}
}
function syncMarkers(){
 var g=G();if(!g||!g.bots)return;for(var i=0;i<g.bots.length;i++){var b=g.bots[i];if(b)setMarker(b,attackActive(b))}
 for(var j=markers.length-1;j>=0;j--){var m=markers[j],o=m&&m.__owner;if(!m||!o||g.bots.indexOf(o)<0){try{g.stage.removeChild(m)}catch(e){}if(o)o.__v126AttackMarker=null;markers.splice(j,1)}}
}
function expose(){window.BomberAI126={version:VERSION,bombPlan:bombPlan,usefulBomb:useful,attackActive:attackActive,syncMarkers:syncMarkers}}
function install(){if(installed)return true;if(!window.Bot||!window.createjs||!window.Utils||!G())return false;patchBombLogic();patchAttackMode();expose();installed=true;showVersion();syncMarkers();return true}
showVersion();var tries=0,t=setInterval(function(){showVersion();if(install()||++tries>700)clearInterval(t)},40);setInterval(function(){showVersion();if(installed)syncMarkers()},80);
})();
