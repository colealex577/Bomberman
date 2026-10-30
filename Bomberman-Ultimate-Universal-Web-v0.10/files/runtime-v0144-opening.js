(function(){
'use strict';
var VERSION='v0.14.4',S=window.B115,installed=false;
if(!S)return;
function G(){return window.gGameEngine||null}
function same(a,b){return!!(a&&b&&Number(a.x)===Number(b.x)&&Number(a.y)===Number(b.y))}
function key(p){return p?Number(p.x)+','+Number(p.y):''}
function authority(){return S.role!=='guest'}
function simBot(){var g=G();return g&&(g.simulatedOpponent||(g.bots||[]).find(function(b){return b&&b.simulatedHuman}))||null}
function liveRegularBots(){var g=G(),sim=simBot();return(g&&g.bots||[]).filter(function(b){return b&&b!==sim&&!b.simulatedHuman&&b.alive!==false})}
function grass(bot,p){var g=G();try{return!!(p&&bot.inBounds(p)&&g.getTileMaterial(p)==='grass'&&!bot.hasBomb(p))}catch(e){return false}}
function woodAround(p){var g=G(),dirs=[[1,0],[-1,0],[0,1],[0,-1]],n=0;for(var i=0;i<dirs.length;i++)if(g.getTileMaterial({x:p.x+dirs[i][0],y:p.y+dirs[i][1]})==='wood')n++;return n}
function pocket(bot,limit){if(!bot||!bot.position)return[];var q=[{x:bot.position.x,y:bot.position.y}],seen={},out=[],dirs=[[1,0],[-1,0],[0,1],[0,-1]],cap=limit||8;seen[key(q[0])]=1;while(q.length&&out.length<=cap){var p=q.shift();out.push(p);for(var i=0;i<dirs.length;i++){var n={x:p.x+dirs[i][0],y:p.y+dirs[i][1]},k=key(n);if(seen[k]||!grass(bot,n))continue;seen[k]=1;q.push(n)}}return out}
function escapeFrom(bot,origin){var old=bot.position,path=null;try{bot.position={x:origin.x,y:origin.y};var spare=bot.bombsMax-(bot.activeBombCount()+1);path=bot.findEscapePath(origin,bot.bombStrength,spare>0)}catch(e){}finally{bot.position=old}return path}
function candidate(bot,cells){var best=null,bestScore=Infinity;for(var i=0;i<cells.length;i++){var p=cells[i],wood=woodAround(p);if(!wood)continue;var esc=escapeFrom(bot,p);if(!esc||esc.length<2)continue;var path=null;try{path=bot.findPath(bot.position,p,true)}catch(e){}if(!path)continue;var score=path.length-wood*1.4;if(same(p,bot.position))score-=1.5;if(score<bestScore){best={position:{x:p.x,y:p.y},path:path,escape:esc,wood:wood};bestScore=score}}return best}
function eligible(bot){var g=G();if(!authority()||S.role!=='simulated'||!g||!g.playing||g.matchFinished||g.menu.visible||!bot||bot!==simBot()||!bot.simulatedHuman||bot.alive===false||!bot.started||bot.escapeMode)return false;if(liveRegularBots().length)return false;if(bot.activeBombCount&&bot.activeBombCount()>0)return false;try{if(!bot.isSafe(bot.position))return false}catch(e){return false}return true}
function analyze(bot){var cells=pocket(bot,7),frontier=0;for(var i=0;i<cells.length;i++)frontier+=woodAround(cells[i]);return{eligible:eligible(bot),size:cells.length,frontier:frontier,cells:cells}}
function clear(bot){if(bot){bot.__v144BreakoutTarget=null;bot.__v144BreakoutSince=0}}
function tryBreakout(bot,force){if(!eligible(bot)){clear(bot);return false}var cells=pocket(bot,7);if(cells.length>4){clear(bot);return false}var frontier=0;for(var i=0;i<cells.length;i++)frontier+=woodAround(cells[i]);if(!frontier){clear(bot);return false}
 var now=Date.now(),target=bot.__v144BreakoutTarget,valid=target&&cells.some(function(p){return same(p,target)})&&woodAround(target)>0&&escapeFrom(bot,target)&&escapeFrom(bot,target).length>1;
 if(!valid){var c=candidate(bot,cells);if(!c)return false;target=c.position;bot.__v144BreakoutTarget={x:target.x,y:target.y};bot.__v144BreakoutSince=now}
 if(same(bot.position,target)){
  if(bot.activeBombCount()>=bot.bombsMax||bot.hasBomb(bot.position))return false;
  var spare=bot.bombsMax-(bot.activeBombCount()+1),esc=bot.findEscapePath(bot.position,bot.bombStrength,spare>0);if(!esc||esc.length<2)return false;
  var bomb=bot.plantBomb();if(!bomb)return false;clear(bot);bot.beginEscapePlan(esc,bomb);bot.setNextTile(esc[1]);return true;
 }
 var path=bot.findPath(bot.position,target,true);if(path&&path.length>1){bot.setNextTile(path[1]);return true}
 clear(bot);return false
}
function patch(){if(!window.Bot||Bot.prototype.__v144Opening)return false;Bot.prototype.__v144Opening=true;var old=Bot.prototype.chooseNextAction;Bot.prototype.chooseNextAction=function(){if(tryBreakout(this,false))return;return old.apply(this,arguments)};return true}
function badge(){var old=document.getElementById('buildVersion143');if(old)old.style.display='none';var b=document.getElementById('buildVersion144');if(!b){b=document.createElement('div');b.id='buildVersion144';b.style.cssText='position:fixed;top:calc(env(safe-area-inset-top,0px) + 5px);left:calc(env(safe-area-inset-left,0px) + 6px);z-index:2147483647;padding:2px 5px;border-radius:4px;background:rgba(0,0,0,.68);color:#fff;font:700 9px/1.25 Arial,sans-serif;pointer-events:none';document.body.appendChild(b)}b.textContent=VERSION}
function install(){if(installed)return true;if(!window.Bot||!window.BomberStability140||!window.BomberIntelligence143||!G())return false;installed=true;patch();badge();window.BomberOpening144={version:VERSION,analyze:analyze,tryBreakout:tryBreakout};if(/[?&]netdebug=1(?:&|$)/.test(location.search))BomberOpening144.debug={analyze:analyze,force:function(bot){return tryBreakout(bot,true)},pocket:function(bot){return pocket(bot,7)}};return true}
var tries=0,t=setInterval(function(){if(install()||++tries>900)clearInterval(t)},40);setInterval(function(){if(installed)badge()},500);
})();