(function(){
'use strict';
var VERSION='v0.13.5',S=window.B115,installed=false;
if(!S)return;
function G(){return window.gGameEngine||null}
function same(a,b){return!!(a&&b&&Number(a.x)===Number(b.x)&&Number(a.y)===Number(b.y))}
function key(p){return p?Number(p.x)+','+Number(p.y):''}
function clone(p){return p?{x:Number(p.x),y:Number(p.y)}:null}
function clean(v,fallback){v=String(v||fallback||'Player').replace(/[<>]/g,'').replace(/\s+/g,' ').trim();return(v||fallback||'Player').slice(0,14)}
function allOtherBots(bot){var g=G(),a=g&&g.getPlayersAndBots?g.getPlayersAndBots():[];return a.filter(function(x){return x&&x!==bot&&x.isBot&&x.alive!==false})}
function occupiedByBot(bot,p){var a=allOtherBots(bot);for(var i=0;i<a.length;i++){if(same(a[i].position,p)||same(a[i].targetPosition,p))return true}return false}
function reservedBait(bot,p){return!!(bot&&bot.__v134Bait&&!bot.__v134Bait.triggered&&same(bot.__v134Bait,p))}
function recent(bot){return bot.__v135RecentPositions||(bot.__v135RecentPositions=[])}
function rememberPosition(bot){var h=recent(bot),k=key(bot.position);if(!k)return h;if(!h.length||h[h.length-1]!==k)h.push(k);while(h.length>10)h.shift();return h}
function isLooping(bot){var h=recent(bot),n=h.length;if((bot.__v135ReverseStreak||0)>=2)return true;if(n>=4&&h[n-1]===h[n-3]&&h[n-2]===h[n-4]&&h[n-1]!==h[n-2])return true;if(n>=6&&h[n-1]===h[n-4]&&h[n-2]===h[n-5]&&h[n-3]===h[n-6])return true;return false}
function visitPenalty(bot,p){var h=recent(bot),k=key(p),score=0;for(var i=h.length-1,w=9;i>=0;i--,w=Math.max(1,w-1))if(h[i]===k)score+=w;return score}
function exposedBonusAt(p){var g=G(),a=g&&g.bonuses||[];for(var i=0;i<a.length;i++){var b=a[i];if(b&&same(b.position,p)&&g.getTileMaterial(b.position)==='grass')return b}return null}
function validPowerup(bot,p){var g=G();return!!(g&&p&&g.getTileMaterial(p)==='grass'&&bot.isSafe(p)&&exposedBonusAt(p)&&!reservedBait(bot,p))}
function bestPowerupPath(bot){
 var g=G();if(!g||!bot||bot.alive===false||bot.escapeMode||!bot.isSafe(bot.position))return null;
 var target=bot.__v135PowerupTarget,path=null;
 if(target&&validPowerup(bot,target)){path=bot.findPath(bot.position,target,true);if(path&&path.length)return path}
 bot.__v135PowerupTarget=null;var best=null,bestScore=Infinity;
 for(var i=0;i<(g.bonuses||[]).length;i++){
  var b=g.bonuses[i];if(!b||!validPowerup(bot,b.position))continue;
  var p=bot.findPath(bot.position,b.position,true);if(!p||!p.length)continue;
  var first=p.length>1?p[1]:p[0],score=p.length+visitPenalty(bot,first)*0.45;
  if(score<bestScore){best=p;bestScore=score;bot.__v135PowerupTarget=clone(b.position)}
 }
 return best
}
function candidateNeighbors(bot){
 var a=bot.getWalkableNeighbors(bot.position,true)||[],h=recent(bot),prev=h.length>1?h[h.length-2]:null;
 a=a.filter(function(p){return!occupiedByBot(bot,p)&&!reservedBait(bot,p)});
 if(a.length>1&&prev){var fresh=a.filter(function(p){return key(p)!==prev});if(fresh.length)a=fresh}
 return a
}
function chooseLoopExit(bot){
 var p=bestPowerupPath(bot),h=recent(bot),prev=h.length>1?h[h.length-2]:null;
 if(p&&p.length>1&&!occupiedByBot(bot,p[1])&&!reservedBait(bot,p[1])&&key(p[1])!==prev)return p[1];
 var a=candidateNeighbors(bot);if(!a.length)return null;
 var bonuses=G()&&G().bonuses||[];
 function nearestBonus(q){var d=99;for(var i=0;i<bonuses.length;i++){var b=bonuses[i];if(!b||G().getTileMaterial(b.position)!=='grass'||reservedBait(bot,b.position))continue;d=Math.min(d,Math.abs(q.x-b.position.x)+Math.abs(q.y-b.position.y))}return d}
 a.sort(function(x,y){
  var sx=-visitPenalty(bot,x)*12-nearestBonus(x)*1.5,sy=-visitPenalty(bot,y)*12-nearestBonus(y)*1.5;
  if(typeof bot.distanceToNearestThreat==='function'){sx+=Math.min(12,Number(bot.distanceToNearestThreat(x))||0);sy+=Math.min(12,Number(bot.distanceToNearestThreat(y))||0)}
  var others=allOtherBots(bot);for(var j=0;j<others.length;j++){sx+=Math.abs(x.x-others[j].position.x)+Math.abs(x.y-others[j].position.y);sy+=Math.abs(y.x-others[j].position.x)+Math.abs(y.y-others[j].position.y)}
  return sy-sx
 });
 return a[0]||null
}
function breakLoop(bot){if(!bot||bot.alive===false||bot.escapeMode||!bot.isSafe(bot.position))return false;var p=chooseLoopExit(bot);if(!p||same(p,bot.position))return false;bot.__v135BreakingLoop=true;try{bot.setNextTile(p)}finally{bot.__v135BreakingLoop=false}bot.__v135ReverseStreak=0;bot.__v135LoopBreaks=(bot.__v135LoopBreaks||0)+1;return true}
function tryPowerup(bot){
 if(!bot||bot.alive===false||bot.escapeMode||!bot.isSafe(bot.position))return false;
 if(bot.__v134Bait&&!bot.__v134Bait.triggered)return false;
 var p=bestPowerupPath(bot);if(!p||p.length<2)return false;
 bot.__v135PowerupPursuits=(bot.__v135PowerupPursuits||0)+1;bot.setNextTile(p[1]);return true
}
function patchAI(){
 if(!window.Bot||Bot.prototype.__v135Polish)return false;Bot.prototype.__v135Polish=true;
 var oldSet=Bot.prototype.setNextTile,oldChoose=Bot.prototype.chooseNextAction;
 Bot.prototype.setNextTile=function(pos){
  if(!this.isBot)return oldSet.apply(this,arguments);
  var from=key(this.position),prev=this.__v135LastTransition,r=oldSet.apply(this,arguments),to=key(this.targetPosition);
  if(!from||!to||from===to)return r;
  var reverse=!!(prev&&prev.from===to&&prev.to===from);this.__v135ReverseStreak=reverse?(this.__v135ReverseStreak||0)+1:0;
  if(!this.__v135BreakingLoop&&!this.escapeMode&&this.isSafe(this.position)&&this.__v135ReverseStreak>=2){
   var alt=chooseLoopExit(this);if(alt&&!same(alt,this.targetPosition)){
    if(this.__v134OldSetNextTile)this.__v134OldSetNextTile(alt);else oldSet.call(this,alt);
    to=key(this.targetPosition);this.__v135ReverseStreak=0;this.__v135LoopBreaks=(this.__v135LoopBreaks||0)+1
   }
  }
  this.__v135LastTransition={from:from,to:to};return r
 };
 Bot.prototype.chooseNextAction=function(){
  rememberPosition(this);
  if(!this.escapeMode&&this.isSafe(this.position)&&isLooping(this)&&breakLoop(this))return;
  var before=this.activeBombCount?this.activeBombCount():0,hadBait=!!(this.__v134Bait&&!this.__v134Bait.triggered),r=oldChoose.apply(this,arguments);
  if(this.escapeMode||!this.isSafe(this.position)||hadBait||(this.__v134Bait&&!this.__v134Bait.triggered))return r;
  var after=this.activeBombCount?this.activeBombCount():before;if(after>before)return r;
  tryPowerup(this);return r
 };
 return true
}
function syncEntityName(e,name){if(!e)return;name=clean(name,'Player');if(e.displayName!==name)e.displayName=name;if(e.nameLabel&&e.nameLabel.text!==name)e.nameLabel.text=name}
function syncNames(){
 var g=G();if(!g||!S)return false;var local=clean(S.localName,'Player'),remote=clean(S.remoteName,'Player 2');
 if(S.role==='simulated'){
  if(g.players&&g.players[0])syncEntityName(g.players[0],local);if(g.simulatedOpponent)syncEntityName(g.simulatedOpponent,remote);
  if(!g.playerNames)g.playerNames=[];g.playerNames[0]=local;return true
 }
 if(S.role==='host'||S.role==='guest'){
  var names=S.role==='host'?[local,remote]:[remote,local];g.playerNames=names.slice();
  if(g.players){if(g.players[0])syncEntityName(g.players[0],names[0]);if(g.players[1])syncEntityName(g.players[1],names[1])}return true
 }
 if(S.role==='offline'&&g.playersCount===1&&g.players&&g.players[0])syncEntityName(g.players[0],local);return true
}
function legacyCharacterCard(menu){
 if(!menu||!menu.views)return null;for(var i=0;i<menu.views.length;i++){var v=menu.views[i];if(!v||!v.children)continue;for(var j=0;j<v.children.length;j++)if(v.children[j]&&String(v.children[j].text||'').toLowerCase()==='character')return v}return null
}
function normalizeMenu(){
 var g=G(),m=g&&g.menu;if(!g||!m||!m.views||!m.visible)return false;
 var card=legacyCharacterCard(m);if(card){try{g.stage.removeChild(card)}catch(e){}var ci=m.views.indexOf(card);if(ci>=0)m.views.splice(ci,1)}
 var modeSize=110,gap=20,singleX=g.size.w/2-modeSize-gap,multiX=g.size.w/2+gap;
 var single1=null,single2=null,online=null,multi=null,icons=[];
 for(var i=0;i<m.views.length;i++){
  var v=m.views[i];if(!v)continue;var text=String(v.text||'').toLowerCase();
  if(text==='single')single1=v;else if(text==='player')single2=v;else if(text==='online')online=v;else if(text==='multiplayer')multi=v;
  if(v.sourceRect&&Number(v.sourceRect.width)===48&&Number(v.sourceRect.height)===48&&typeof v.x==='number')icons.push(v)
 }
 if(single1&&single2){var sw=single1.getMeasuredWidth()+single2.getMeasuredWidth();single1.x=singleX+(modeSize-sw)/2;single2.x=single1.x+single1.getMeasuredWidth()}
 if(online)online.x=multiX+(modeSize-online.getMeasuredWidth())/2;if(multi)multi.x=multiX+(modeSize-multi.getMeasuredWidth())/2;
 icons.sort(function(a,b){return a.x-b.x});if(icons.length>=3){icons[0].x=singleX+(modeSize-48)/2;icons[1].x=multiX+(modeSize-48)/2-24+8;icons[2].x=multiX+(modeSize-48)/2+24-8}
 return true
}
function patchMenu(){if(!window.Menu||Menu.prototype.__v135Menu)return false;Menu.prototype.__v135Menu=true;var old=Menu.prototype.draw;Menu.prototype.draw=function(){var r=old.apply(this,arguments);normalizeMenu();return r};normalizeMenu();return true}
function badge(){
 var old=document.getElementById('buildVersion134');if(old)old.style.display='none';var b=document.getElementById('buildVersion135');if(!b){b=document.createElement('div');b.id='buildVersion135';b.setAttribute('aria-label','Game version');b.style.cssText='position:fixed;top:calc(env(safe-area-inset-top,0px) + 5px);left:calc(env(safe-area-inset-left,0px) + 6px);z-index:2147483647;padding:2px 5px;border-radius:4px;background:rgba(0,0,0,.68);color:#fff;font:700 9px/1.25 Arial,sans-serif;pointer-events:none';document.body.appendChild(b)}b.textContent=VERSION
}
function install(){
 if(installed)return true;if(!window.Bot||!window.Menu||!window.BomberGameplay134||!G())return false;
 patchAI();patchMenu();syncNames();normalizeMenu();badge();installed=true;
 window.BomberPolish135={version:VERSION,syncNames:syncNames,normalizeMenu:normalizeMenu};
 if(/[?&]netdebug=1(?:&|$)/.test(location.search))BomberPolish135.debug={rememberPosition:rememberPosition,isLooping:isLooping,breakLoop:breakLoop,bestPowerupPath:bestPowerupPath,tryPowerup:tryPowerup,chooseLoopExit:chooseLoopExit,syncNames:syncNames,normalizeMenu:normalizeMenu,setHistory:function(bot,a){bot.__v135RecentPositions=(a||[]).slice(-10);return bot.__v135RecentPositions}};
 return true
}
var tries=0,t=setInterval(function(){if(install()||++tries>800)clearInterval(t)},40);setInterval(function(){if(!installed)return;syncNames();normalizeMenu();badge()},120);window.addEventListener('resize',function(){setTimeout(normalizeMenu,0)},{passive:true});
})();
