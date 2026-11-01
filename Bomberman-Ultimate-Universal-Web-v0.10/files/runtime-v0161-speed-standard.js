(function(){
'use strict';
var VERSION='v0.16.1',BASE=2,STEP=.8;
function G(){return window.gGameEngine||null}
function isAI(e){return !!(e&&e.isBot)}
function num(v,d){v=Number(v);return isFinite(v)?v:d}
function speedCount(e){return Math.max(0,Math.floor(num(e&&e.bonusCounts&&e.bonusCounts.speed,0)))}
function hiddenBaseline(e){
 if(!e)return BASE;
 if(e.simulatedHuman){var s=Math.max(.08,Math.min(1,num(e.humanSkill,.55)));return Math.max(BASE,BASE+s*.45)}
 var d=(window.BomberV125&&BomberV125.getDifficulty&&BomberV125.getDifficulty())||e.v125Difficulty||'normal';
 return {easy:1.55,normal:2,hard:2.4,expert:2.75}[d]||BASE
}
function initialize(e){
 if(!isAI(e)||e.__v161SpeedInitialized)return;
 e.__v161SpeedInitialized=true;e.bonusCounts=e.bonusCounts||{};
 var count=speedCount(e),mult=G()&&G().ultimateMode?5:1,bonus=count*STEP*mult;
 // Drop-in observer rounds may represent a speed pickup that happened before
 // the viewer arrived. Preserve only an exact pickup-sized excess over the old
 // hidden skill/difficulty baseline; all other hidden speed is discarded.
 if(!count&&G()&&G().__v152RosterMode){var excess=num(e.velocity,BASE)-hiddenBaseline(e);if(excess>=STEP-.08){count=Math.max(1,Math.round(excess/STEP));e.bonusCounts.speed=count;bonus=count*STEP}}
 e.__v161LegitSpeedBonus=Math.max(0,bonus);
 e.hyperAggroSpeedApplied=true;
}
function desired(e){initialize(e);return BASE+Math.max(0,num(e&&e.__v161LegitSpeedBonus,0))}
function normalize(e){if(!isAI(e))return false;initialize(e);var v=desired(e);if(Math.abs(num(e.velocity,v)-v)>.0001)e.velocity=v;e.hyperAggroSpeedApplied=true;return true}
function normalizeAll(){var g=G();if(!g)return;(g.bots||[]).forEach(normalize);if(g.simulatedOpponent)normalize(g.simulatedOpponent)}
function patchApplyBonus(){
 if(!window.Player||!Player.prototype.applyBonus)return false;var cur=Player.prototype.applyBonus;if(cur.__v161SpeedRule)return true;
 function wrapped(bonus){
  if(!isAI(this))return cur.apply(this,arguments);
  initialize(this);var speed=bonus&&bonus.type==='speed',beforeCount=speedCount(this),before=num(this.velocity,desired(this)),nested=num(this.__v161SpeedApplyDepth,0);this.__v161SpeedApplyDepth=nested+1;
  var r;try{r=cur.apply(this,arguments)}finally{this.__v161SpeedApplyDepth=nested}
  if(speed&&!nested){var delta=num(this.velocity,before)-before,expected=STEP*(G()&&G().ultimateMode?5:1);if(delta<.01||delta>expected+.05)delta=expected;this.__v161LegitSpeedBonus=Math.max(0,num(this.__v161LegitSpeedBonus,0)+delta);this.bonusCounts=this.bonusCounts||{};this.bonusCounts.speed=Math.max(speedCount(this),beforeCount+1)}
  normalize(this);return r
 }
 wrapped.__v161SpeedRule=true;wrapped.__v161Wrapped=cur;Player.prototype.applyBonus=wrapped;return true
}
function patchBotUpdate(){
 if(!window.Bot||!Bot.prototype.update)return false;var cur=Bot.prototype.update;if(cur.__v161SpeedRule)return true;
 function wrapped(){normalize(this);var r=cur.apply(this,arguments);normalize(this);return r}
 wrapped.__v161SpeedRule=true;wrapped.__v161Wrapped=cur;Bot.prototype.update=wrapped;return true
}
function patchBotInit(){
 if(!window.Bot||!Bot.prototype.init)return false;var cur=Bot.prototype.init;if(cur.__v161SpeedRule)return true;
 function wrapped(){var r=cur.apply(this,arguments);this.__v161SpeedInitialized=false;initialize(this);normalize(this);return r}
 wrapped.__v161SpeedRule=true;wrapped.__v161Wrapped=cur;Bot.prototype.init=wrapped;return true
}
function patchAggro(){
 if(!window.Bot||!Bot.prototype.updateEndgameAggression)return false;var cur=Bot.prototype.updateEndgameAggression;if(cur.__v161SpeedRule)return true;
 function wrapped(){normalize(this);var r=cur.apply(this,arguments);normalize(this);return r}
 wrapped.__v161SpeedRule=true;wrapped.__v161Wrapped=cur;Bot.prototype.updateEndgameAggression=wrapped;return true
}
function patchSpawn(){
 if(!window.GameEngine||!GameEngine.prototype.spawnBots)return false;var cur=GameEngine.prototype.spawnBots;if(cur.__v161SpeedRule)return true;
 function wrapped(){var r=cur.apply(this,arguments);(this.bots||[]).forEach(normalize);if(this.simulatedOpponent)normalize(this.simulatedOpponent);return r}
 wrapped.__v161SpeedRule=true;wrapped.__v161Wrapped=cur;GameEngine.prototype.spawnBots=wrapped;return true
}
function difficultyCopy(){var el=document.querySelector('#v125DifficultySetting .v125_diff_note');if(!el||!window.BomberV125||!BomberV125.getDifficulty)return;var d=BomberV125.getDifficulty(),t={easy:'Slower reactions and less aggressive bombing.',normal:'Balanced reactions and decision-making.',hard:'Quicker decisions and earlier late-game pressure.',expert:'Fastest reactions, aggressive bombing, and early pressure.'}[d];if(t&&el.textContent!==t)el.textContent=t}
function install(){patchApplyBonus();patchBotInit();patchBotUpdate();patchAggro();patchSpawn();normalizeAll();difficultyCopy();return !!(window.Bot&&window.Player)}
window.BomberSpeed161={version:VERSION,base:BASE,step:STEP,desiredSpeed:desired,normalize:normalize,normalizeAll:normalizeAll};
var tries=0,t=setInterval(function(){install();if(++tries>1200)clearInterval(t)},25);setInterval(function(){install()},90);
})();
