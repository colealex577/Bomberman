(function(){
'use strict';
var VERSION='v0.16.2.5',installed=false;
function G(){return window.gGameEngine||null}
function same(a,b){return!!(a&&b&&Number(a.x)===Number(b.x)&&Number(a.y)===Number(b.y))}
function key(p){return p?Number(p.x)+','+Number(p.y):''}
var DIRS=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
function next(p,d){return{x:Number(p.x)+d.x,y:Number(p.y)+d.y}}
function material(p){var g=G();try{return g&&g.getTileMaterial?g.getTileMaterial(p):''}catch(e){return''}}
function openConnected(a,b){
 var g=G();if(!g||!a||!b)return false;if(same(a,b))return true;if(material(a)!=='grass'||material(b)!=='grass')return false;
 var q=[{x:Number(a.x),y:Number(a.y)}],seen={};seen[key(a)]=1;var limit=Math.max(64,(g.tilesX||17)*(g.tilesY||13)+8),steps=0;
 while(q.length&&steps++<limit){var cur=q.shift();for(var i=0;i<DIRS.length;i++){var n=next(cur,DIRS[i]),k=key(n);if(seen[k]||material(n)!=='grass')continue;if(same(n,b))return true;seen[k]=1;q.push(n)}}return false
}
function rating(bot){var r=Number(bot&&((isFinite(Number(bot.humanRating))&&bot.humanRating)||bot.rating));return isFinite(r)?r:999}
function isNoob(bot){return!!(bot&&bot.simulatedHuman&&rating(bot)<300)}
function target(bot,preferred){if(preferred&&preferred.alive!==false)return preferred;var g=G(),all=[];try{all=g&&g.getPlayersAndBots?g.getPlayersAndBots():[].concat(g&&g.players||[],g&&g.bots||[])}catch(e){}var best=null,bd=1e9;(all||[]).forEach(function(a){if(!a||a===bot||a.alive===false||!a.position)return;var d=Math.abs(Number(a.position.x)-Number(bot.position.x))+Math.abs(Number(a.position.y)-Number(bot.position.y));if(d<bd){bd=d;best=a}});return best}
function connectedTarget(bot,preferred){var t=target(bot,preferred);return!!(t&&openConnected(bot.position,t.position))}
function defensive(bot){try{return!!(bot&&bot.isSafe&&!bot.isSafe(bot.position))}catch(e){return false}}
function install(){
 if(installed)return true;var A=window.BomberAI162;if(!A||!window.Bot)return false;installed=true;
 if(A.planTravelKick&&!A.planTravelKick.__v1625Guard){var old=A.planTravelKick;var f=function(bot,opp){var t=target(bot,opp);if(t&&!openConnected(bot.position,t.position)){if(!isNoob(bot)||Math.random()>=.025){try{var st=A.state&&A.state(bot);if(st){st.kickPlan=null;st.forcedKick=null;st.pendingKickEscape=null;st.nextKickScan=Date.now()+900}}catch(e){}return null}}return old.apply(A,arguments)};f.__v1625Guard=true;A.planTravelKick=f}
 if(A.shouldAutoKick&&!A.shouldAutoKick.__v1625Guard){var oldK=A.shouldAutoKick;var fk=function(bot,bomb,dir){if(!defensive(bot)&&!connectedTarget(bot,null)){if(!isNoob(bot)||Math.random()>=.025)return false}return oldK.apply(A,arguments)};fk.__v1625Guard=true;A.shouldAutoKick=fk}
 window.BomberAIGuard1625={version:VERSION,openConnected:openConnected,connectedTarget:connectedTarget};return true
}
var tries=0,t=setInterval(function(){if(install()||++tries>800)clearInterval(t)},25);
})();
