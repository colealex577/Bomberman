(function(){
'use strict';
if(!window.Bot||!window.Player||!window.gGameEngine||!window.GameEngine||!window.Menu)return;

/* Human-looking simulated opponent that runs the REAL Bot update/AI stack. */
window.SimulatedHumanBot = Bot.extend({
  init:function(position){
    this.simulatedHuman=true;
    this.attackWeight=3.25;
    Player.prototype.init.call(this,position,null,1);
    this.velocity=gGameEngine.ultimateMode?4:2;
    this.targetPosition={x:position.x,y:position.y};
    this.targetBitmapPosition=Utils.convertToBitmapPosition(position);
    this.startTimerMax=Math.random()*40;
    this.startTimer=0;this.started=false;this.thinkCooldown=0;
    this.escapeMode=false;this.escapePath=null;this.escapePathIndex=0;this.escapeThreatBomb=null;this.escapeDestination=null;
    this.hyperAggressive=false;this.hyperAggroSpeedApplied=false;this.separationSeed=Math.random();this.combatTarget=null;this.combatRole='avoid';this.combatStateVersion=0;
    if(this.ensureAttackMarker)this.ensureAttackMarker();
    if(this.setAttackMarkerVisible)this.setAttackMarkerVisible(false);
  }
});

/* Simulated mode = one human + two normal bots + one human-looking real Bot. */
Menu.prototype.setMode=function(mode){
  this.hide();
  gGameEngine.simulatedOpponentMode=false;
  if(mode==='single'){gGameEngine.botsCount=3;gGameEngine.playersCount=1}
  else if(mode==='simulated'){gGameEngine.simulatedOpponentMode=true;gGameEngine.botsCount=2;gGameEngine.playersCount=1}
  else{gGameEngine.botsCount=2;gGameEngine.playersCount=2}
  gGameEngine.playing=true;gGameEngine.restart();
};
GameEngine.prototype.spawnBots=function(){
  this.bots=[];this.simulatedOpponent=null;
  if(this.botsCount>=1)this.bots.push(new Bot({x:1,y:this.tilesY-2}));
  if(this.botsCount>=2)this.bots.push(new Bot({x:this.tilesX-2,y:1}));
  if(this.botsCount>=3)this.bots.push(new Bot({x:this.tilesX-2,y:this.tilesY-2}));
  if(this.botsCount>=4)this.bots.push(new Bot({x:1,y:1}));
  if(this.simulatedOpponentMode){var sim=new SimulatedHumanBot({x:this.tilesX-2,y:this.tilesY-2});this.simulatedOpponent=sim;this.bots.push(sim)}
};

/* Keep the single global hunter, but weight the simulated opponent more heavily. */
Bot.prototype.getCombatCoordinator=function(){
  var now=Date.now(),state=gGameEngine.aiCombatState;
  if(!state)state=gGameEngine.aiCombatState={attacker:null,target:null,until:0,nextRollAt:now+7000+Math.random()*7000,serial:1};
  var attackerAlive=state.attacker&&state.attacker.alive,targetAlive=state.target&&state.target.alive;
  if(state.attacker&&(!attackerAlive||!targetAlive||now>=state.until)){state.attacker=null;state.target=null;state.until=0;state.nextRollAt=now+9000+Math.random()*11000;state.serial++}
  if(!state.attacker&&now>=state.nextRollAt){
    var ai=this.getAIControlledEntities(),humans=this.getHumanEntities();state.nextRollAt=now+3200+Math.random()*3200;
    if(ai.length&&Math.random()<0.16){
      var total=0,i;for(i=0;i<ai.length;i++)total+=Math.max(.25,Number(ai[i].attackWeight)||1);
      var r=Math.random()*total,attacker=ai[0];for(i=0;i<ai.length;i++){r-=Math.max(.25,Number(ai[i].attackWeight)||1);if(r<=0){attacker=ai[i];break}}
      var pool=[];if(humans.length&&Math.random()<.72)pool=humans.slice();
      if(!pool.length){for(i=0;i<ai.length;i++)if(ai[i]!==attacker)pool.push(ai[i]);if(!pool.length)pool=humans.slice()}
      if(pool.length){var ranked=[];for(i=0;i<pool.length;i++){var c=pool[i],path=this.findPath(attacker.position,c.position,true),dist=path?path.length:Math.abs(c.position.x-attacker.position.x)+Math.abs(c.position.y-attacker.position.y)+25;ranked.push({entity:c,score:dist+Math.random()*3})}ranked.sort(function(a,b){return a.score-b.score});state.attacker=attacker;state.target=ranked[0].entity;state.until=now+5000+Math.random()*3500;state.serial++}
    }
  }
  return state;
};

/* Attribution only for simulated-bot kill chat. */
var oldPlant=Bot.prototype.plantBomb;
Bot.prototype.plantBomb=function(){var b=oldPlant.apply(this,arguments);if(b)b.owner=this;return b};
Player.prototype.detectFireCollision=function(){
  var bombs=gGameEngine.bombs;
  for(var i=0;i<bombs.length;i++){var bomb=bombs[i];for(var j=0;j<bomb.fires.length;j++){var fire=bomb.fires[j];if(bomb.exploded&&fire.position.x===this.position.x&&fire.position.y===this.position.y){this.lastHitBy=bomb.owner||null;return true}}}
  return false;
};
var oldPlayerDie=Player.prototype.die;
Player.prototype.die=function(){if(!this.isBot&&window.BomberOnline&&BomberOnline.onHumanKilled)BomberOnline.onHumanKilled(this,this.lastHitBy||null);return oldPlayerDie.apply(this,arguments)};
var oldBotDie=Bot.prototype.die;
Bot.prototype.die=function(){var sim=!!this.simulatedHuman,r=oldBotDie.apply(this,arguments);if(sim&&window.BomberOnline&&BomberOnline.onSimulatedOpponentDeath)BomberOnline.onSimulatedOpponentDeath(this);return r};
})();
